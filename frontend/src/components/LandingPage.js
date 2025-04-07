import "../App.css"
import { Link } from "react-router-dom"


export default function LandingPage() {
    return (
        <>
            <div className="wrapper">
                <h1 className="header">
                    Welcome to Nittany Business
                </h1>
                <div className="links">
                    <Link to="/user-sign-in">Log In</Link>
                    <Link to="/user-registration">Register</Link>
                </div>
            </div>
        </>
    )
}