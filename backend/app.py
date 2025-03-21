from urllib import request
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity, create_access_token
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash

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
    email, password = data.get('email'), data.get('password')

    # connect to db
    conn = get_db_connection()

    # check if user already exists
    existing_user = conn.execute('SELECT * FROM users WHERE email = ?', (email, )).fetchone()
    if existing_user:
        return jsonify({"msg": "User already exists"}), 400

    # hash the password
    hashed_password = generate_password_hash(password)

    # insert new user into db
    conn.execute('INSERT INTO users (email, password) VALUES (?, ?)', (email, hashed_password))
    conn.commit()
    conn.close()

    return jsonify({"msg": "User created successfully"}), 201





if __name__ == '__main__':
    app.run(debug=True, port=5000, host="0.0.0.0")

