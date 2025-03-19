# Nittany Business App
An application built in React and Flask for managing business and supplier transactions.

## Installation
1. Clone the repository
2. Open the repository as a project in PyCharm
3. Install the required packages by running `npm install` in the frontend directory
4. Run the application by running `npm start` in the frontend directory
5. Open the application in a web browser by navigating to `http://localhost:3000/`
6. To run the backend, open the backend directory in PyCharm and run the `app.py` file
7. The backend will be running on `http://127.0.0.1:5000/`
8. The frontend will be able to communicate with the backend through the API

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
- `/api/protected` - GET request to check if the user is logged in