# Nittany Business App
An application built in React and Flask for managing business and supplier transactions.

## Installation
1. Clone the repository
2. Open the repository as a project in PyCharm
3. Install the required packages by running `npm install` in the frontend directory
4. Run the application by running `npm start` in the frontend directory
5. Open the application in a web browser by navigating to `http://localhost:3000/`
6.  Create a virtual environment for the backend by running `python -m venv venv` in the backend directory
7. Activate the virtual environment by running `source venv/bin/activate` (Linux/Mac) or `venv\Scripts\activate` (Windows)
8. Switch to the backend directory by running `cd ../backend`
9. Install the required packages by running `pip install -r requirements.txt`
10. Select the venv as the interpreter in PyCharm
    - Bottom right corner of PyCharm, click on the Python interpreter and select the venv you created
11. Set up the Flask server in PyCharm
    - In the top right corner of PyCharm, next to the filename, select the dropdown and choose "Edit Configurations"
    - Select the "+" icon and choose "Flask Server"
    - Set the script path to `app.py` in the backend directory
    - Set the interpreter to the venv you created
    - Press "OK" to save the configuration
12. Run the Flask server by clicking the green play button in the top right corner of PyCharm
13. The backend will be running on `http://127.0.0.1:5000/`
14. The frontend will be able to communicate with the backend through the API

## Functionality

### Landing Page
The landing page displays a link to the login or register page.
### Login
Signing in to the application:
1. Enter the username and password
2. Click the login button
3. If the username and password are correct, the user will be redirected to the dashboard
4. If the username and password are incorrect, an error message will be displayed
### Register
Registration steps:
1. Select the type of user (Buyer, Seller, Admin)
2. Fill out the registration form corresponding to the selected user type
   - Buyer: Business name, email, password, address
   - Seller: Business name, email, password, address, bank info
   - Admin: Role, email, password
3. Click the register button
4. If the registration is successful, the user will be redirected to the login page
5. Login with the newly created account
### User Dashboard
Displays user's information depending on the type of user:
- Buyer: Displays buyer's business name, email, and address. Includes links to the product listings page, edit profile page, and create helpdesk request page.
- Seller: Displays seller's business name, email, address, and bank info. Includes links to view their product listings and create a helpdesk request.
- Admin: Displays admin's email and role. Includes link to view all helpdesk requests.
### Product Listings
Displays the list of products with sorting functionality.

**Sorting Options:**
- Users can filter products by category and subcategory
- Users can search for products by name, title, or listing ID
- Users can sort products by price (low to high or high to low)
- Users can filter products by price range

**Product Details**
- Clicking "View" on a product will display the product details, and the user can add the product to their cart

**Reviews**
- Users can view reviews for each product by clicking on the "Reviews" button
- Users can add a review for a product (if they've purchased it)

**Cart**
- Users can view their cart by clicking on the cart button
- The cart displays the list of products added to the cart, along with the total price
- Users can remove products from the cart
- Users can place an order for the products in the cart
- The cart is saved in the database, so users can access it later
### Edit Profile
Users can edit their profile information by clicking on the "Edit Profile" button. The following information can be updated:
- Business name
- Email
- Password
- Address
### Helpdesk Requests Submission
Users can create a helpdesk request by clicking on the "Request" button. The following request types are available:
- Email change
- Order issue
- Category suggestion
Each request type has a different form to fill out with relevant fields.
### View Listings
Sellers can view their product listings by clicking on the "View Listings" button. From there, they can:

**View Product Details**
- Clicking "View" on a product will display the product details.
- From there, clicking "Edit" will allow the seller to edit the product details.

**Promote Product**
- Sellers can promote their product by clicking on the "Promote" button.
- This will place the product at the top of the product listings page, for a fee.

**Create New Listing**
- Sellers can fill out the form to create a new product listing.
### View Helpdesk Requests
Admins can view all helpdesk requests by clicking on the "View Requests" button. From there, they can:
- View the details of each request by clicking on the "View" button.
- Mark the request as "Completed" by clicking on the "Complete" button.


## API
List of API endpoints:
- `/api/login` - POST request to login
- `/api/register` - POST request to register a new user
- `/api/protected` - GET request to check if the user is logged in
- `/api/update-user` - PUT request to update the user's information
- `/api/products` - GET request to get the list of products in a category
- `/api/parent_categories/<child>` - GET request to get the parent category of `<child>`
- `/api/subcategories` - POST request to get the list of subcategories of a parent category
- `/api/place-order` - POST request to place an order
- `/api/is_buyer` - GET request to check if the user is a buyer
- `/api/post-requests` - POST request to create a new helpdesk request
- `/api/get-requests` - GET request to get the list of helpdesk requests
- `/api/get-request/<id>` - GET request to get the details of a helpdesk request
- `/api/update-request/<id>` - PUT request to update the status of a helpdesk request
- `/api/add-to-cart` - PUT request to add a product to the cart
- `/api/remove-from-cart` - PUT request to remove a product from the cart
- `/api/get-cart` - GET request to get the list of products in the cart
- `/api/seller-listings` - GET request to get the list of products for a seller
- `/api/update-listing` - PUT request to update a product listing
- `/promote-product` - POST request to promote a product
- `/api/create-listing` - POST request to create a new product listing
- `/api/get-address-from-id` - GET request to get the address an address by address id
- `/api/add-review` - POST request to add a review for a product
- `/api/get-best-products` - GET request to get the list of best products