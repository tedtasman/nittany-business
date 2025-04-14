import React, { useEffect, useState } from "react";
import {Link, redirect} from "react-router-dom";
import "../App.css"
import NoTokenPage from "./NoTokenPage";

export default function UserPage() {

    // User States
    const [userData, setUserData] = useState(null);
    const [userType, setUserType] = useState(null);

    // UseEffect to get user data and verify token
    useEffect(() => {
        // get token from local storage
        const token = localStorage.getItem("token");

        // confirm token exists
        if (!token) {
            return;
        }

        // fetch user data
        fetch("http://127.0.0.1:5000/api/protected", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })

            // await response
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error("Invalid Token");
                }
            })

            // set user data
            .then(data => {
                setUserData(data);
                console.log("User Data: ", data);
                setUserType(data.user_type);
            })

            // catch error
            .catch(error => {
                console.error(error);
            });
    }, []);

    if (userType === "Buyer") {
        return (
            <>
                <div className="wrapper">
                    <h1 className="header">Buyer's Page</h1>
                    <h3 className={"header"}>{userData.business_name}</h3>
                    <p className={"centered"}>{userData.email} - {userData.address.street_number} {userData.address.street_name}, {userData.address.zipcode}</p>
                    <div className="links">
                        <Link to="/product-listings" className="btn">
                            Product Listings
                        </Link>
                        <RequestButton/>
                        <LogOutButton/>
                    </div>
                </div>
            </>
        )
    }
    else if (userType === "Seller") {
        return (
            <>
                <div className="wrapper">
                    <h1 className="header">Seller's Page</h1>
                    <h3 className={"header"}>{userData.business_name}</h3>
                    <h5 className={"centered"}>Balance: ${userData.balance}</h5>
                    <p className={"centered"}>{userData.email} - {userData.address.street_number} {userData.address.street_name}, {userData.address.zipcode}</p>
                    <p className="centered">{userData.bank_account_number} - {userData.bank_routing_number}</p>
                    <div className="links">
                        <Link to="/user-page" className="btn">
                            Placeholder
                        </Link>
                        <RequestButton/>
                        <LogOutButton/>
                    </div>
                </div>
            </>
        )
    }
    else if (userType === "HelpDesk") {
        return (
            <>
                <div className="wrapper">
                    <h1 className="header">Admin's Page</h1>
                    <h3 className={"header"}>{userData.position}</h3>
                    <p className={"centered"}>{userData.email}</p>
                    <div className="links">
                        <Link to="/requests" className="btn">
                            Browse Requests
                        </Link>
                        <LogOutButton/>
                    </div>
                </div>
            </>
        )
    }
    else {
        return (
            <>
                <NoTokenPage/>
            </>
        )
    }
}


const LogOutButton = () => {
    return (
        <Link to="/" className="btn-red" onClick={() => localStorage.removeItem("token")}>Logout</Link>
    )
}

const RequestButton = () => {
    return (
        <Link to="/request" className="btn">
            Request
        </Link>
    )
}

