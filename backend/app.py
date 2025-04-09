from urllib import request
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity, create_access_token
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash
import uuid

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
    # get current user
    current_user = get_jwt_identity()
    # return email
    return jsonify(email=current_user), 200

@app.route('/api/products', methods=['GET'])
def get_products():
    try:
        conn = get_db_connection()
        products = conn.execute('SELECT * FROM Product_Listings').fetchall()
        conn.close()

        # Convert result to a list of dictionaries
        product_list = [
            {
                'Seller_Email':  product['Seller_Email'],
                'Listing_ID': product['Listing_ID'],
                'Product_Title': product['Product_Title'],
                'Product_Name': product['Product_Name'],
                'Category': product['Category'],
                'Product_Description': product['Product_Description'],
                'Quantity': product['Quantity'],
                'Product_Price': product['Product_Price'],
                'Status': product['Status']
            }
            for product in products
        ]

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
        parent_category = conn.execute('SELECT parent_category FROM Categories WHERE category_name = ?', (child,)).fetchone()[0]
        conn.close()

        if not parent_category:
            return jsonify('None'), 200

        return jsonify(parent_category), 200
    except Exception as e:
        print("Error fetching parent category:", e)
        return jsonify({'error': 'Database query failed'}), 500


@app.route('/api/subcategories', methods=['POST'])
def get_subcategories():
    """
    Get categories based on parent category
    """
    data = request.get_json()
    parent_category = data['parent_category']

    try:
        conn = get_db_connection()
        categories = conn.execute('SELECT category_name FROM Categories WHERE parent_category = ?', (parent_category,)).fetchall()
        conn.close()

        # Convert result to a list of dictionaries
        category_list = [category['category_name'] for category in categories]

        return jsonify(category_list), 200

    except Exception as e:

        print("Error fetching categories:", e)
        return jsonify({'error': 'Database query failed'}), 500


@app.route("/api/place-order", methods=["POST"])
def place_order():
    data = request.get_json()
    cart = data.get("cart", [])

    if not cart:
        return jsonify({"error": "Cart is empty"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        for item in cart:
            listing_id = item["Listing_ID"]
            ordered_qty = item["quantity"]

            cursor.execute("SELECT Quantity FROM Product_Listings WHERE Listing_ID = ?", (listing_id,))
            row = cursor.fetchone()

            if not row:
                return jsonify({"error": f"Product with ID {listing_id} not found"}), 404

            current_qty = row[0]

            if ordered_qty > current_qty:
                return jsonify({"error": f"Not enough stock for Listing ID {listing_id}"}), 400

            new_qty = current_qty - ordered_qty
            new_status = 0 if new_qty == 0 else 1

            cursor.execute(
                "UPDATE Product_Listings SET Quantity = ?, Status = ? WHERE Listing_ID = ?",
                (new_qty, new_status, listing_id)
            )

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
    user = conn.execute('SELECT * FROM users WHERE email = ?', (email, )).fetchone()

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
    existing_user = conn.execute('SELECT * FROM users WHERE email = ?', (email, )).fetchone()
    if existing_user:
        return jsonify({"msg": "User already exists"}), 400

    # check if user_type is valid
    if user_type not in ['buyer', 'seller', 'admin']:
        return jsonify({"msg": f"nvalid user type: {user_type}, {email}, {password}"}), 400

    # check address
    if user_type == 'buyer' or user_type == 'seller':
        zip_code, street_number, street_name = int(data.get('zip_code')), int(data.get('street_number')), data.get('street_name')
        address_row = conn.execute('SELECT address_id FROM Address WHERE zipcode = ? AND street_num = ? AND street_name = ?',
                                   (zip_code, street_number, street_name)).fetchone()
        if not address_row:
            # insert new address into db
            new_address_id = str(uuid.uuid4()).replace('-', '')
            conn.execute('INSERT INTO Address (address_id, zipcode, street_num, street_name) VALUES (?, ?, ?, ?)',
                         (new_address_id, zip_code, street_number, street_name))
            conn.commit()
            address_row = conn.execute('SELECT address_id FROM Address WHERE zipcode = ? AND street_num = ? AND street_name = ?',
                                       (zip_code, street_number, street_name)).fetchone()

        address_id = address_row[0]

    # for buyers:
    if user_type == 'buyer':
        # insert new buyer into db
        conn.execute('INSERT INTO Buyers (email, business_name, buyer_address_id) VALUES (?, ?, ?)', (email, data.get('business_name'), address_id))
        conn.commit()

    # for sellers:
    if user_type == 'seller':
        # get bank info
        bank_account_number, bank_routing_number = data.get('bank_account_number'), data.get('bank_routing_number')
        # insert new seller into db
        conn.execute('INSERT INTO Sellers (email, business_name, business_address_id, bank_routing_number, bank_account_number, balance) VALUES (?, ?, ?, ?, ?, ?)',
                     (email, data.get('business_name'), address_id, bank_routing_number, bank_account_number, 0))
        conn.commit()

    # for admins:
    if user_type == 'admin':
        # insert new admin into db
        conn.execute('INSERT INTO Admins (email, role) VALUES (?, ?)', (email, data.get('role')))
        conn.commit()

    # hash the password
    hashed_password = generate_password_hash(password)

    # insert new user into db
    conn.execute('INSERT INTO users (email, password) VALUES (?, ?)', (email, hashed_password))
    conn.commit()
    conn.close()

    return jsonify({"msg": "User created successfully"}), 201





if __name__ == '__main__':
    app.run(debug=True, port=5000, host="0.0.0.0")

