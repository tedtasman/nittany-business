-- Addresses:
CREATE TABLE Address (
    address_id TEXT,
    zipcode INTEGER,
    street_num INTEGER,
    street_name TEXT,
    PRIMARY KEY (address_id)
);

-- Admins:
CREATE TABLE Admins (
    email TEXT,
    position TEXT,
    PRIMARY KEY (email),
    FOREIGN KEY (email) REFERENCES Users(email)
);

-- Buyers:
CREATE TABLE Buyers (
    email TEXT,
    business_name TEXT,
    buyer_address_id TEXT,
    PRIMARY KEY (email),
    FOREIGN KEY (email) REFERENCES Users(email),
    FOREIGN KEY (buyer_address_id) REFERENCES Address(address_id)
);

-- Cart Items:
CREATE TABLE Cart_Item (
    email TEXT,
    product_id TEXT,
    quantity INTEGER,
    PRIMARY KEY (email, product_id),
    FOREIGN KEY (email) REFERENCES Users(email),
    FOREIGN KEY (product_id) REFERENCES Product_Listings(Listing_id)
);

-- Categories:
CREATE TABLE Categories (
    category_name TEXT,
    parent_category TEXT,
    PRIMARY KEY (category_name)
);

-- Orders:
CREATE TABLE Orders (
    order_id INTEGER AUTO_INCREMENT,
    user_email TEXT,
    order_date TEXT,
    product_id TEXT,
    quantity INTEGER,
    total_price REAL,
    status TEXT,
    PRIMARY KEY (order_id),
    FOREIGN KEY (user_email) REFERENCES Users(email),
    FOREIGN KEY (product_id) REFERENCES Product_Listings(Listing_id)
);

-- Product Listings:
CREATE TABLE Product_Listings (
    Seller_Email TEXT,
    Listing_id INTEGER,
    Category TEXT,
    Product_Title TEXT,
    Product_Description TEXT,
    Quantity INTEGER,
    Status INTEGER,
    Product_Price REAL,
    Is_Promoted INTEGER DEFAULT 0,
    Promotion_Fee REAL,
    Promotion_Date TEXT,
    Reviews TEXT,
    PRIMARY KEY (Listing_id),
    FOREIGN KEY (Seller_Email) REFERENCES Users(email),
    FOREIGN KEY (Category) REFERENCES Categories(category_name)
);

-- Requests:
CREATE TABLE Requests (
    id INTEGER AUTO_INCREMENT,
    user_email TEXT,
    request_date TEXT,
    status TEXT,
    primary_content TEXT,
    secondary_content TEXT,
    PRIMARY KEY (id),
    FOREIGN KEY (user_email) REFERENCES Users(email)
);

-- Reviews:
CREATE TABLE Reviews (
    Listing_ID INTEGER,
    review_msg TEXT,
    rating INTEGER,
    reviewer_email TEXT,
    date TEXT,
    PRIMARY KEY (Listing_ID, reviewer_email, date),
    FOREIGN KEY (Listing_ID) REFERENCES Product_Listings(Listing_id),
    FOREIGN KEY (reviewer_email) REFERENCES Users(email)
);

-- Sellers:
CREATE TABLE Sellers (
    email TEXT,
    business_name TEXT,
    seller_address_id TEXT,
    bank_routing_number TEXT,
    bank_account_number TEXT,
    balance INTEGER,
    PRIMARY KEY (email),
    FOREIGN KEY (email) REFERENCES Users(email),
    FOREIGN KEY (seller_address_id) REFERENCES Address(address_id)
);

-- Users:
CREATE TABLE Users (
    email TEXT,
    password TEXT,
    PRIMARY KEY (email)
);
