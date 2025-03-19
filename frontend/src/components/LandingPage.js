import { Link } from "react-router-dom"

export default function LandingPage() {
    return (
        <>
            <h1>
                Welcome to Nittany Business
            </h1>
            <Link to="/user-sign-in">Log In</Link>
        </>
    )
}