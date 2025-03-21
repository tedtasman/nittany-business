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
The landing page displays a link to the login page
### Login
Signing in to the application:
1. Enter the username and password
2. Click the login button
3. If the username and password are correct, the user will be redirected to the dashboard
4. If the username and password are incorrect, an error message will be displayed
### User Dashboard
The user dashboard displays the user's email. If the user is not logged in, the user will be redirected to the login page.


## API
List of API endpoints:
- `/api/login` - POST request to login
- `/api/register` - POST request to register a new user
- `/api/protected` - GET request to check if the user is logged in