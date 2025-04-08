import React, {Component} from "react";

export default function NoTokenPage(){
    return (
        <div className="wrapper">
            <h1 className="header">You are not logged in.</h1>
            <p className={"centered"}>Please log in to view your user page.</p>
            <div className={"links"}>
                <a href="/user-sign-in">Log In</a>
                <a href="/user-registration">Register</a>
            </div>
        </div>
    )
}