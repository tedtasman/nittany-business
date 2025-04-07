import "../App.css";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

export default function ProductListingsPage() {
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            console.error("No token found. Redirect to login or show error.");
            return;
        }

        fetch("http://127.0.0.1:5000/api/protected", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Token invalid or expired");
                }
                return response.json();
            })
            .then(data => {
                setUserData(data);
                console.log("User Data on ProductListingsPage:", data);
            })
            .catch(err => {
                console.error("Failed to fetch user data:", err);
            });
    }, []);

    return (
        <>
            {userData ? (
                <div className="wrapper">
                    <h1 className="header">Product Listings</h1>
                    <p className="centered">
                        Welcome, {userData.email}! Here are all the products available for buyers.
                    </p>
                    <div className="links">
                        <Link to="/user-page">User Dashboard</Link>
                    </div>
                </div>
            ) : (
                <div className="wrapper">
                    <h1 className="header">Access Denied</h1>
                    <p className="centered">Please log in to view this page.</p>
                    <div className="links">
                        <Link to="/user-sign-in">Log In</Link>
                    </div>
                </div>
            )}
        </>
    );
}
