from urllib import request
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity, create_access_token

app = Flask(__name__)
CORS(app)
app.config["JWT_SECRET_KEY"] = "secret_key"
jwt = JWTManager(app)

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

    # TODO implement user validation
    if email == 'valid@valid.com' and password == 'valid':
        # create JWT token
        access_token = create_access_token(identity=email)

        # return token
        return jsonify({"message": "Login successful", "token": access_token}), 200

    else:
        # return error message
        return jsonify({"message": "Incorrect username or password"}), 401



if __name__ == '__main__':
    app.run(debug=True, port=5000, host="0.0.0.0")

