import React, { useEffect, useState } from "react";
import {Link} from "react-router-dom";
import "../App.css"
import NoTokenPage from "./NoTokenPage";

export default function UserPage() {

    // User States
    const [userData, setUserData] = useState(null);
    const [isBuyer, setIsBuyer] = useState(false);

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

                //set isBuyer
                fetch(`http://127.0.0.1:5000/api/is_buyer?email=${encodeURIComponent(data.email)}`)
                  .then(res => {
                    if (!res.ok) {
                        throw new Error("Failed to fetch buyer status");
                    }
                    return res.json();
                  })
                  .then(resData => {
                      console.log("Buyer status:", resData); // 👀 Console log result
                    if (resData.is_buyer) {
                        setIsBuyer(true);
                    }
                  })
                  .catch(err => {
                    console.error("Error checking buyer status:", err);
                  });

            })

            // catch error
            .catch(error => {
                console.error(error);
            });
    }, []);

    return(
        <>
            {userData ? (
                <>
                    <div className="wrapper">
                        <h1 className="header">User Page</h1>
                        <p className={"centered"}>Email: {userData.email}</p>
                        {isBuyer && (
                            <Link to="/product-listings" className="btn">
                                Product Listings
                            </Link>
    )}
                    </div>
                </>
            ) :
            (
                <NoTokenPage />
            )}
        </>
    );
}