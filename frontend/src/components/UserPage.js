import React, { useEffect, useState } from "react";

export default function UserPage() {

    // User States
    const [userData, setUserData] = useState(null);

    // UseEffect to get user data and verify token
    useEffect(() => {
        // get token from local storage
        const token = localStorage.getItem("token");

        // confirm token exists
        if (!token) {
            window.location.href = "/user-sign-in";
            return;
        }

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
                window.location.href = "/user-sign-in"; // redirect to login page
            });
    }, []);

    return(
        <>
            {userData ? (
                <>
                    <h1>Welcome {userData.name}</h1>
                    <p>Email: {userData.email}</p>
                </>
            ) : null}
        </>
    );
}