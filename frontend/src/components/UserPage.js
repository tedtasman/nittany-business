import React, { useEffect, useState } from "react";
import "../App.css"

export default function UserPage() {

    // User States
    const [userData, setUserData] = useState(null);

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
                    </div>
                </>
            ) :
            (
                <div className="wrapper">
                    <h1 className="header">You are not logged in.</h1>
                    <p className={"centered"}>Please log in to view your user page.</p>
                    <div className={"links"}>
                        <a href="/user-sign-in">Log In</a>
                        <a href="/user-registration">Register</a>
                    </div>
                </div>
            )}
        </>
    );
}