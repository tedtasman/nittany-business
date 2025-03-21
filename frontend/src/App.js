import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import axios from "axios";
import LandingPage from "./components/LandingPage";
import LoginPage from "./components/LoginPage";
import UserPage from "./components/UserPage";
import RegisterPage from "./components/RegisterPage";

function App() {
    const [message, setMessage] = useState("");

    useEffect(() => {
        axios.get("http://127.0.0.1:5000/api/hello")
            .then(response => setMessage(response.data.message))
            .catch(error => console.error(error));
    }, []);

    return (
        <Router>
            <Routes>
                <Route exact path="/" element={<LandingPage />} />
                <Route path="/user-sign-in" element={<LoginPage />} />
                <Route path="/user-page" element={<UserPage />} />
                <Route path="/user-registration" element={<RegisterPage />} />
            </Routes>
        </Router>
    );
}

export default App;
