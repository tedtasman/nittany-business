from urllib import request
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity, create_access_token
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash
import uuid
import datetime

app = Flask(__name__)
CORS(app)
app.config["JWT_SECRET_KEY"] = "secret_key"
jwt = JWTManager(app)


def get_db_connection():
    conn = sqlite3.connect('nittanybusiness.sqlite')
    conn.row_factory = sqlite3.Row
    return conn


@app.route('/api/hello', methods=['GET'])
def hello():
    return jsonify({"message": "Hello from Flask!"})


@app.route('/api/protected', methods=['GET'])
@jwt_required()
def protected():
    user_email = get_jwt_identity()
    conn = get_db_connection()
    buyer = conn.execute('SELECT * FROM Buyers WHERE email = ?', (user_email,)).fetchone()
    seller = conn.execute('SELECT * FROM Sellers WHERE email = ?', (user_email,)).fetchone()
    admin = conn.execute('SELECT * FROM Admins WHERE email = ?', (user_email,)).fetchone()

    if buyer:
        address = get_address_from_id(buyer['buyer_address_id'])
        user_data = {
            'email': buyer['email'],
            'user_type': 'Buyer',
            'business_name': buyer['business_name'],
            'address': {
                'street_number': address['street_num'],
                'street_name': address['street_name'],
                'zipcode': address['zipcode']
            }
        }
        return jsonify(user_data), 200

    elif seller:
        address = get_address_from_id(seller['business_address_id'])
        user_data = {
            'email': seller['email'],
            'user_type': 'Seller',
            'business_name': seller['business_name'],
            'bank_routing_number': seller['bank_routing_number'],
            'bank_account_number': seller['bank_account_number'],
            'balance': seller['balance'],
            'address': {
                'street_number': address['street_num'],
                'street_name': address['street_name'],
                'zipcode': address['zipcode']
            }
        }
        return jsonify(user_data), 200

    elif admin:
        user_data = {
            'email': admin['email'],
            'user_type': 'HelpDesk',
            'position': admin['position']
        }
        return jsonify(user_data), 200

    else:
        return jsonify({"msg": "User type not defined"}), 401


@app.route('/api/update-user', methods=['PUT'])
def update_user():
    try:
        data = request.get_json()
        user_type = data.get('user_type')
        original_email = data.get('original_email')
        email = data.get('email')
        password = data.get('password')

        conn = get_db_connection()
        cursor = conn.cursor()

        # Update Users table (email and password if provided)
        update_users_query = 'UPDATE Users SET email = ?'
        update_users_params = [email]
        if password:
            update_users_query += ', password = ?'
            update_users_params.append(generate_password_hash(password))
        update_users_query += ' WHERE email = ?'
        update_users_params.append(original_email)
        cursor.execute(update_users_query, update_users_params)

        # Handle address for Buyer or Seller
        address_id = None
        if user_type in ['Buyer', 'Seller']:
            zip_code = int(data.get('zip_code'))
            street_number = int(data.get('street_number'))
            street_name = data.get('street_name')

            # Check if address exists
            address_row = cursor.execute(
                'SELECT address_id FROM Address WHERE zipcode = ? AND street_num = ? AND street_name = ?',
                (zip_code, street_number, street_name)
            ).fetchone()

            if not address_row:
                # Insert new address
                new_address_id = str(uuid.uuid4()).replace('-', '')
                cursor.execute(
                    'INSERT INTO Address (address_id, zipcode, street_num, street_name) VALUES (?, ?, ?, ?)',
                    (new_address_id, zip_code, street_number, street_name)
                )
                address_id = new_address_id
            else:
                address_id = address_row['address_id']

        # Update specific table based on user_type
        if user_type == 'Buyer':
            cursor.execute(
                'UPDATE Buyers SET email = ?, business_name = ?, buyer_address_id = ? WHERE email = ?',
                (email, data.get('business_name'), address_id, original_email)
            )

        elif user_type == 'Seller':
            cursor.execute(
                'UPDATE Sellers SET email = ?, business_name = ?, business_address_id = ?, bank_routing_number = ?, bank_account_number = ? WHERE email = ?',
                (email, data.get('business_name'), address_id, data.get('bank_routing_number'),
                 data.get('bank_account_number'), original_email)
            )

        elif user_type == 'HelpDesk':
            cursor.execute(
                'UPDATE Admins SET email = ?, position = ? WHERE email = ?',
                (email, data.get('position'), original_email)
            )

        # Generate a new JWT with the updated email
        new_token = create_access_token(identity=email)

        conn.commit()
        conn.close()
        return jsonify({'message': 'User updated successfully', 'new_token': new_token}), 200

    except Exception as e:
        print("Error updating user:", e)
        return jsonify({'error': 'Database update failed'}), 500


@app.route('/api/products', methods=['GET'])
def get_products():
    category = request.args.get('category', None)

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        if category and category != "Root":
            categories_to_filter = get_subcategories_recursively(category)
            categories_to_filter.append(category)
            placeholders = ','.join('?' for _ in categories_to_filter)
            query = f'SELECT * FROM Product_Listings WHERE Category IN ({placeholders})'
            products = cursor.execute(query, categories_to_filter).fetchall()
        else:
            products = cursor.execute('''
                SELECT * FROM Product_Listings
                ORDER BY Is_Promoted DESC, datetime(Promotion_Date) DESC
            ''').fetchall()

        product_list = []
        for product in products:
            # Fetch reviews for this product
            reviews = cursor.execute(
                'SELECT * FROM Reviews WHERE Listing_ID = ?',
                (product['Listing_ID'],)
            ).fetchall()

            # Calculate average rating
            avg_rating_result = cursor.execute(
                'SELECT AVG(rating) as avg_rating FROM Reviews WHERE Listing_ID = ?',
                (product['Listing_ID'],)
            ).fetchone()
            avg_rating = round(avg_rating_result['avg_rating']) if avg_rating_result['avg_rating'] is not None else 0

            # Build review list
            review_list = [
                {
                    'review_msg': review['review_msg'],
                    'rating': review['rating'],
                    'reviewer_email': review['reviewer_email'],
                    'date': review['date']
                } for review in reviews
            ]

            product_list.append({
                'Seller_Email': product['Seller_Email'],
                'Listing_ID': product['Listing_ID'],
                'Product_Title': product['Product_Title'],
                'Product_Name': product['Product_Name'],
                'Category': product['Category'],
                'Product_Description': product['Product_Description'],
                'Quantity': product['Quantity'],
                'Product_Price': product['Product_Price'],
                'Status': product['Status'],
                'Is_Promoted': product['Is_Promoted'],
                'reviews': review_list,
                'average_rating': avg_rating
            })

        conn.close()
        return jsonify(product_list), 200

    except Exception as e:
        print("Error fetching products:", e)
        return jsonify({'error': 'Database query failed'}), 500

@app.route('/api/parent_category/<child>', methods=['GET'])
def get_parent_categories(child):
    try:
        if child == 'Root':
            return jsonify('None'), 200

        conn = get_db_connection()
        parent_category = \
        conn.execute('SELECT parent_category FROM Categories WHERE category_name = ?', (child,)).fetchone()[0]
        conn.close()

        if not parent_category:
            return jsonify('None'), 200

        return jsonify(parent_category), 200
    except Exception as e:
        print("Error fetching parent category:", e)
        return jsonify({'error': 'Database query failed'}), 500


def get_subcategories_recursively(parent):
    """
    Recursively get all subcategories of a given parent category. and subcategories of those categories.
    """
    print(parent)
    subcategories = []
    queue = [parent]
    try:
        conn = get_db_connection()
        while queue:
            current = queue.pop()
            rows = conn.execute('SELECT category_name FROM Categories WHERE parent_category = ?', (current,)).fetchall()
            for row in rows:
                subcat = row['category_name']
                subcategories.append(subcat)
                queue.append(subcat)
        conn.close()
        return subcategories
    except Exception as e:
        print("Error fetching subcategories:", e)
        return []


@app.route('/api/subcategories', methods=['POST'])
def get_subcategories():
    """
    Get categories based on parent category, only one level
    """
    data = request.get_json()
    parent_category = data['parent_category']

    try:
        conn = get_db_connection()
        categories = conn.execute('SELECT category_name FROM Categories WHERE parent_category = ?',
                                  (parent_category,)).fetchall()
        conn.close()

        # Convert result to a list of dictionaries
        category_list = [category['category_name'] for category in categories]

        return jsonify(category_list), 200

    except Exception as e:

        print("Error fetching categories:", e)
        return jsonify({'error': 'Database query failed'}), 500


@app.route("/api/place-order", methods=["POST"])
@jwt_required()
def place_order():
    data = request.get_json()
    cart = data.get("cart", [])
    email = get_jwt_identity()

    if not cart:
        return jsonify({"error": "Cart is empty"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        for item in cart:
            listing_id = item["Listing_ID"]
            ordered_qty = item["quantity"]

            # Check if the product exists
            cursor.execute("SELECT Quantity FROM Product_Listings WHERE Listing_ID = ?", (listing_id,))
            row = cursor.fetchone()
            if not row:
                return jsonify({"error": f"Product with ID {listing_id} not found"}), 404

            # Check if the quantity is valid
            current_qty = row[0]
            if ordered_qty > current_qty:
                return jsonify({"error": f"Not enough stock for Listing ID {listing_id}"}), 400

            # Insert order into Orders table
            total_price = ordered_qty * item["Product_Price"]
            date = datetime.datetime.now()
            cursor.execute(
                'INSERT INTO Orders (user_email, product_id, order_date, Quantity, total_price, status) VALUES (?, ?, ?, ?, ?, ?)',
                (email, listing_id, date, ordered_qty, total_price, "Pending"))

            # Update the product quantity and status
            new_qty = current_qty - ordered_qty
            new_status = 0 if new_qty == 0 else 1
            cursor.execute(
                "UPDATE Product_Listings SET Quantity = ?, Status = ? WHERE Listing_ID = ?",
                (new_qty, new_status, listing_id)
            )

            # Remove the item from the cart
            cursor.execute("DELETE FROM Cart_Item WHERE Email = ? AND product_id = ?", (email, listing_id))

        conn.commit()
        return jsonify({"message": "Order placed successfully"}), 200

    except Exception as e:
        conn.rollback()
        print("Error placing order:", e)
        return jsonify({"error": "Failed to place order"}), 500

    finally:
        conn.close()


@app.route('/api/is_buyer', methods=['GET'])
def is_buyer():
    # Get email from query params
    email = request.args.get('email')
    if not email:
        return jsonify({'error': 'Email is required'}), 400

    # Connect to the database
    conn = get_db_connection()
    try:
        buyer = conn.execute('SELECT 1 FROM Buyers WHERE email = ?', (email,)).fetchone()
    except Exception as e:
        conn.close()
        print("DB error:", e)
        return jsonify({'error': 'Database query failed'}), 500

    conn.close()

    if buyer:
        print(f"[SUCCESS] Email '{email}' found in Buyers table.")
    else:
        print(f"[INFO] Email '{email}' NOT found in Buyers table.")

    return jsonify({'is_buyer': bool(buyer)}), 200


@app.route('/api/login', methods=['POST'])
def login():
    # receive request, get email and password
    data = request.get_json()
    email, password = data.get('email'), data.get('password')

    # connect to db
    conn = get_db_connection()

    # get user from db
    user = conn.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()

    conn.close()

    # check if password is correct and user exists
    if not user or not check_password_hash(user['password'], password):
        return jsonify({"msg": "Incorrect email or password"}), 401

    # create access token
    token = create_access_token(identity=email)

    return jsonify(token=token), 200


@app.route('/api/register', methods=['POST'])
def register():
    # receive request, get email and password
    data = request.get_json()
    email, password, user_type = data.get('email'), data.get('password'), data.get('userType')

    # connect to db
    conn = get_db_connection()

    # check if user already exists
    existing_user = conn.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
    if existing_user:
        return jsonify({"msg": "User already exists"}), 400

    # check if user_type is valid
    if user_type not in ['buyer', 'seller', 'admin']:
        return jsonify({"msg": f"invalid user type: {user_type}, {email}, {password}"}), 400

    # check address
    if user_type == 'buyer' or user_type == 'seller':
        zip_code, street_number, street_name = int(data.get('zip_code')), int(data.get('street_number')), data.get(
            'street_name')
        address_row = conn.execute(
            'SELECT address_id FROM Address WHERE zipcode = ? AND street_num = ? AND street_name = ?',
            (zip_code, street_number, street_name)).fetchone()
        if not address_row:
            # insert new address into db
            new_address_id = str(uuid.uuid4()).replace('-', '')
            conn.execute('INSERT INTO Address (address_id, zipcode, street_num, street_name) VALUES (?, ?, ?, ?)',
                         (new_address_id, zip_code, street_number, street_name))
            conn.commit()
            address_row = conn.execute(
                'SELECT address_id FROM Address WHERE zipcode = ? AND street_num = ? AND street_name = ?',
                (zip_code, street_number, street_name)).fetchone()

        address_id = address_row[0]

    # for buyers:
    if user_type == 'buyer':
        # insert new buyer into db
        conn.execute('INSERT INTO Buyers (email, business_name, buyer_address_id) VALUES (?, ?, ?)',
                     (email, data.get('business_name'), address_id))
        conn.commit()

    # for sellers:
    if user_type == 'seller':
        # get bank info
        bank_account_number, bank_routing_number = data.get('bank_account_number'), data.get('bank_routing_number')
        # insert new seller into db
        conn.execute(
            'INSERT INTO Sellers (email, business_name, business_address_id, bank_routing_number, bank_account_number, balance) VALUES (?, ?, ?, ?, ?, ?)',
            (email, data.get('business_name'), address_id, bank_routing_number, bank_account_number, 0))
        conn.commit()

    # for admins:
    if user_type == 'admin':
        # insert new admin into db
        conn.execute('INSERT INTO Admins (email, position) VALUES (?, ?)', (email, data.get('position')))
        conn.commit()

    # hash the password
    hashed_password = generate_password_hash(password)

    # insert new user into db
    conn.execute('INSERT INTO users (email, password) VALUES (?, ?)', (email, hashed_password))
    conn.commit()
    conn.close()

    return jsonify({"msg": "User created successfully"}), 201


@app.route('/api/post-requests', methods=['POST'])
@jwt_required()
def post_request():
    # receive request type and email
    data = request.get_json()
    request_type = data.get('request_type')
    email = data.get('email')

    # parse request data
    if request_type == 'Email Change':
        primary_content = data.get('new_email')
        secondary_content = None
    elif request_type == 'Order Issue':
        primary_content = data.get('order_id')
        secondary_content = data.get('issue')
    elif request_type == 'Category Suggestion':
        primary_content = data.get('category_name')
        parent_category = data.get('parent_category')
        description = data.get('description')
        reason = data.get('reason')
        secondary_content = f'Parent Category: {parent_category}\nDescription: {description}\nReason: {reason}'
    else:
        return jsonify({"msg": "Invalid request type"}), 400

    date = datetime.datetime.now()
    status = "New"

    # connect to db
    conn = get_db_connection()
    # insert request into db
    conn.execute(
        'INSERT INTO Requests (user_email, request_type, request_date, status, primary_content, secondary_content) VALUES (?, ?, ?, ?, ?, ?)',
        (email, request_type, date, status, primary_content, secondary_content))
    conn.commit()
    conn.close()
    return jsonify({"msg": "Request received successfully"}), 200


@app.route('/api/get-requests', methods=['GET'])
@jwt_required()
def get_requests():
    # connect to db
    conn = get_db_connection()
    # get requests from db
    requests = conn.execute('SELECT * FROM Requests WHERE Status <> "Completed"').fetchall()
    conn.close()

    request_list = []

    for req in requests:
        request_data = {
            'request_id': req['id'],
            'user_email': req['user_email'],
            'request_type': req['request_type'],
            'request_date': req['request_date'],
            'status': req['status'],
        }
        request_list.append(request_data)

    return jsonify(request_list), 200


@app.route('/api/get-request/<request_id>', methods=['GET'])
@jwt_required()
def get_request(request_id):
    conn = get_db_connection()
    req = conn.execute('SELECT * FROM Requests WHERE id = ?', (request_id,)).fetchone()
    conn.close()

    response = {'request_id': req['id'],
                'request_type': req['request_type'],
                'request_date': req['request_date'],
                'status': req['status'],
                'email': req["user_email"]
                }

    if req['request_type'] == "Email Change":
        response["new_email"] = req["primary_content"]

    elif req['request_type'] == "Order Issue":
        response["order_id"] = req["primary_content"]
        response['issue'] = req["secondary_content"]

    elif req['request_type'] == "Category Suggestion":
        response["category_name"] = req["primary_content"]
        secondary_content = req["secondary_content"].split("\n")
        response['parent_category'] = secondary_content[0].split(": ")[1]
        response['description'] = secondary_content[1].split(": ")[1]
        response['reason'] = secondary_content[2].split(": ")[1]
    else:
        return jsonify({"msg": "Invalid request type"}), 400

    return jsonify(response), 200


@app.route('/api/update-request/<request_id>', methods=['PUT'])
@jwt_required()
def update_request(request_id):
    data = request.get_json()
    status = data.get('status')

    # connect to db
    conn = get_db_connection()

    req = conn.execute('SELECT * FROM Requests WHERE id = ?', (request_id,)).fetchone()
    if not req:
        return jsonify({"msg": "Request not found"}), 404

    # update request in db
    conn.execute('UPDATE Requests SET status = ? WHERE id = ?', (status, request_id))
    conn.commit()
    conn.close()

    return jsonify({"msg": "Request updated successfully"}), 200


@app.route('/api/add-to-cart/', methods=['PUT'])
@jwt_required()
def add_to_cart():
    data = request.get_json()
    email = data.get('email')
    listing_id = data.get('listing_id')
    quantity = data.get('quantity')

    # connect to db
    conn = get_db_connection()
    # check if user exists
    user = conn.execute('SELECT * FROM Buyers WHERE email = ?', (email,)).fetchone()
    if not user:
        return jsonify({"msg": "User not found"}), 404

    # check if product exists
    product = conn.execute('SELECT * FROM Product_Listings WHERE Listing_ID = ?', (listing_id,)).fetchone()
    if not product:
        return jsonify({"msg": "Product not found"}), 404

    # check if quantity is valid
    stock = product['Quantity']
    if quantity > stock or quantity <= 0:
        return jsonify({"msg": "Not enough stock"}), 400

    # check if product is already in cart
    existing_cart_item = conn.execute('SELECT * FROM Cart_Item WHERE Email = ? AND product_id = ?',
                                      (email, listing_id)).fetchone()

    if existing_cart_item:
        # update quantity if already in cart
        new_quantity = existing_cart_item['Quantity'] + quantity
        conn.execute('UPDATE Cart_Item SET Quantity = ? WHERE Email = ? AND product_id = ?',
                     (new_quantity, email, listing_id))

    else:
        # insert new cart item
        conn.execute('INSERT INTO Cart_Item (Email, product_id, Quantity) VALUES (?, ?, ?)',
                     (email, listing_id, quantity))

    conn.commit()
    conn.close()

    return jsonify({"msg": "Product added to cart successfully"}), 200


@app.route('/api/remove-from-cart/', methods=['PUT'])
@jwt_required()
def remove_from_cart():
    data = request.get_json()
    email = data.get('email')
    listing_id = data.get('listing_id')
    # connect to db
    conn = get_db_connection()
    # get cart item from db
    cart_item = conn.execute('SELECT * FROM Cart_Item WHERE Email = ? AND product_id = ?',
                             (email, listing_id)).fetchone()
    if not cart_item:
        return jsonify({"msg": "Cart item not found"}), 404
    # remove cart item from db
    conn.execute('DELETE FROM Cart_Item WHERE Email = ? AND product_id = ?', (email, listing_id))
    conn.commit()
    conn.close()
    return jsonify({"msg": "Product removed from cart successfully"}), 200


@app.route('/api/get-cart', methods=['GET'])
@jwt_required()
def get_cart():
    # get email from jwt
    email = get_jwt_identity()
    # connect to db
    conn = get_db_connection()
    # get cart items from db
    cart_items = conn.execute('SELECT * FROM Cart_Item WHERE Email = ?', (email,)).fetchall()
    conn.close()
    cart_list = []
    for item in cart_items:
        conn = get_db_connection()
        product = conn.execute('SELECT * FROM Product_Listings WHERE Listing_ID = ?', (item['product_id'],)).fetchone()
        conn.close()
        if product:
            cart_list.append({
                'Listing_ID': product['Listing_ID'],
                'Product_Title': product['Product_Title'],
                'Product_Name': product['Product_Name'],
                'quantity': item['Quantity'],
                'Product_Price': product['Product_Price'],
                'Category': product['Category'],
                'Product_Description': product['Product_Description'],
                'Status': product['Status'],
                'Seller_Email': product['Seller_Email'],
            })

    return jsonify(cart_list), 200

@app.route('/api/seller-listings', methods=['GET'])
@jwt_required()
def get_seller_listings():
    # get email from jwt
    email = get_jwt_identity()
    # connect to db
    conn = get_db_connection()
    # check if user is a seller
    seller = conn.execute('SELECT * FROM Sellers WHERE email = ?', (email,)).fetchone()
    if not seller:
        return jsonify({"msg": "User is not a seller"}), 401
    # get seller listings from db
    listings = conn.execute('SELECT * FROM Product_Listings WHERE Seller_Email = ?', (email,)).fetchall()
    conn.close()
    listing_list = []
    for listing in listings:
        listing_list.append({
            'Listing_ID': listing['Listing_ID'],
            'Product_Title': listing['Product_Title'],
            'Product_Name': listing['Product_Name'],
            'Category': listing['Category'],
            'Product_Description': listing['Product_Description'],
            'Quantity': listing['Quantity'],
            'Product_Price': listing['Product_Price'],
            'Status': listing['Status'],
            'Is_Promoted': listing['Is_Promoted']
        })

    return jsonify(listing_list), 200

@app.route('/api/update-listing', methods=['PUT'])
@jwt_required()
def update_listing():
    data = request.get_json()
    listing_id = data.get('listing_id')
    product_title = data.get('product_title')
    product_name = data.get('product_name')
    product_description = data.get('product_description')
    quantity = data.get('quantity')
    product_price = data.get('product_price')

    if int(quantity) > 0:
        status = 1
    else:
        status = 0

    # connect to db
    conn = get_db_connection()
    # update listing in db
    conn.execute(
        'UPDATE Product_Listings SET Product_Title = ?, Product_Name = ?, Product_Description = ?, Quantity = ?, Product_Price = ?, Status = ? WHERE Listing_ID = ?',
        (product_title, product_name, product_description, quantity, product_price, status, listing_id))
    conn.commit()
    conn.close()

    return jsonify({"msg": "Listing updated successfully"}), 200


@app.route('/api/promote-product', methods=['POST'])
@jwt_required()
def promote_product():
    data = request.get_json()
    listing_id = data.get('listing_id')
    email = get_jwt_identity()

    conn = get_db_connection()
    cursor = conn.cursor()

    # Verify product exists and is owned by the user
    product = cursor.execute(
        'SELECT * FROM Product_Listings WHERE Listing_ID = ? AND Seller_Email = ?',
        (listing_id, email)
    ).fetchone()

    if not product:
        return jsonify({"msg": "Product not found or unauthorized"}), 404

    price = product['Product_Price']
    fee = round(price * 0.05, 2)
    now = datetime.datetime.now().isoformat()

    cursor.execute('''
        UPDATE Product_Listings
        SET Is_Promoted = 1, Promotion_Fee = ?, Promotion_Date = ?
        WHERE Listing_ID = ?
    ''', (fee, now, listing_id))

    conn.commit()
    conn.close()

    return jsonify({"msg": "Product promoted successfully", "fee": fee}), 200


@app.route('/api/create-listing', methods=['POST'])
@jwt_required()
def create_listing():
    data = request.get_json()
    email = get_jwt_identity()

    title = data.get('product_title')
    name = data.get('product_name')
    description = data.get('product_description')
    quantity = int(data.get('quantity'))
    price = float(data.get('product_price'))
    status = 1 if quantity > 0 else 0

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute('''
            INSERT INTO Product_Listings (Seller_Email, Product_Title, Product_Name, Product_Description, Quantity, Product_Price, Category, Status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (email, title, name, description, quantity, price, 'Uncategorized', status))

        conn.commit()
        return jsonify({"msg": "Listing created"}), 201

    except Exception as e:
        print("Error creating listing:", e)
        conn.rollback()
        return jsonify({"msg": "Failed to create listing"}), 500

    finally:
        conn.close()


@app.route('/api/get-address-from-id', methods=['GET'])
def get_address_from_id(address_id):
    conn = get_db_connection()
    address = conn.execute('SELECT * FROM Address WHERE address_id = ?', (address_id,)).fetchone()
    conn.close()
    return {
        'street_num': address['street_num'],
        'street_name': address['street_name'],
        'zipcode': address['zipcode']
    }


def add_promotion_columns():
    conn = get_db_connection()
    try:
        conn.execute('ALTER TABLE Product_Listings ADD COLUMN Is_Promoted INTEGER DEFAULT 0')
    except:
        pass
    try:
        conn.execute('ALTER TABLE Product_Listings ADD COLUMN Promotion_Fee REAL')
    except:
        pass
    try:
        conn.execute('ALTER TABLE Product_Listings ADD COLUMN Promotion_Date TEXT')
    except:
        pass
    conn.commit()
    conn.close()


# Uncomment this for one-time schema change

add_promotion_columns()



@app.route('/api/add-review', methods=['POST'])
@jwt_required()
def add_review():
    data = request.get_json()
    listing_id = data.get('listing_id')
    email = get_jwt_identity()
    review_msg = data.get('review')
    rating = data.get('rating')

    # Validate inputs
    if not (isinstance(rating, int) and 0 <= rating <= 5):
        return jsonify({"msg": "Rating must be an integer between 0 and 5"}), 400

    if not review_msg:
        return jsonify({"msg": "Review text is required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    # Verify that the user has purchased the product
    purchase = cursor.execute(
        '''
        SELECT * FROM Orders 
        WHERE product_id = ? AND user_email = ?
        ''',
        (listing_id, email)
    ).fetchone()

    if not purchase:
        conn.close()
        return jsonify({"msg": "You must purchase this product to leave a review"}), 403

    # Verify product exists
    product = cursor.execute(
        'SELECT * FROM Product_Listings WHERE Listing_ID = ?',
        (listing_id,)
    ).fetchone()

    if not product:
        conn.close()
        return jsonify({"msg": "Product not found"}), 404

    # Insert new review into Reviews table
    review_date = datetime.datetime.now().isoformat()
    cursor.execute(
        '''
        INSERT INTO Reviews (Listing_ID, review_msg, rating, reviewer_email, date)
        VALUES (?, ?, ?, ?, ?)
        ''',
        (listing_id, review_msg, rating, email, review_date)
    )

    # Calculate average rating for the product
    avg_rating_result = cursor.execute(
        '''
        SELECT AVG(rating) as avg_rating
        FROM Reviews
        WHERE Listing_ID = ?
        ''',
        (listing_id,)
    ).fetchone()

    avg_rating = round(avg_rating_result['avg_rating']) if avg_rating_result['avg_rating'] is not None else 0

    conn.commit()
    conn.close()

    return jsonify({
        "msg": "Review added successfully",
        "review": {
            "listing_id": listing_id,
            "review_msg": review_msg,
            "rating": rating,
            "reviewer_email": email,
            "date": review_date
        },
        "average_rating": avg_rating
    }), 200

def add_review_columns():
    conn = get_db_connection()
    try:
        conn.execute('ALTER TABLE Product_Listings ADD COLUMN Reviews TEXT')
    except:
        pass
    conn.commit()
    conn.close()


add_review_columns()


# market analysis get best product by rating
@app.route('/api/get-best-products', methods=['GET'])
def get_best_products():
    conn = get_db_connection()
    conn.execute('''
        SELECT * 
        FROM Product_Listings 
        GROUP BY listing_id 
        ORDER BY AVG(Rating) DESC
    ''')
    listings = conn.fetchall()
    conn.close()
    listing_list = []
    for listing in listings:
        listing_list.append({
            'Listing_ID': listing['Listing_ID'],
            'Product_Title': listing['Product_Title'],
            'Product_Name': listing['Product_Name'],
            'Category': listing['Category'],
            'Product_Description': listing['Product_Description'],
            'Quantity': listing['Quantity'],
            'Product_Price': listing['Product_Price'],
            'Status': listing['Status'],
            'Is_Promoted': listing['Is_Promoted'],
            'Rating': listing['Rating'],
            'Reviews': listing['Reviews']
        })

    return jsonify(listing_list), 200


if __name__ == '__main__':
    app.run(debug=True, port=5000, host="0.0.0.0")



