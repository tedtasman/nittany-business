from urllib import request
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity, create_access_token
import sqlite3

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
    if not user or user['password'] != password:
        return jsonify({"msg": "Bad email or password"}), 401

    # create access token
    token = create_access_token(identity=email)

    return jsonify(token=token), 200






if __name__ == '__main__':
    app.run(debug=True, port=5000, host="0.0.0.0")

