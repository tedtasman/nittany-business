import pandas as pd
import sqlite3
from werkzeug.security import generate_password_hash


def get_db_connection():
    conn = sqlite3.connect('nittanybusiness.sqlite')
    conn.row_factory = sqlite3.Row
    return conn

# load the CSV file
users = pd.read_csv('NittanyBusinessDataset_v3/Users.csv')

# iterate over each row in the DataFrame
for _, user in users.iterrows():
    email = user['email']
    password = user['password']

    # connect to db
    conn = get_db_connection()
    # check if user already exists
    existing_user = conn.execute('SELECT * FROM users WHERE email = ?', (email, )).fetchone()
    if existing_user:
        print(f"User {email} already exists")
        continue

    # hash the password
    hashed_password = generate_password_hash(password)

    # insert the new user into the database
    conn.execute('INSERT INTO users (email, password) VALUES (?, ?)', (email, hashed_password))
    conn.commit()
    conn.close()
