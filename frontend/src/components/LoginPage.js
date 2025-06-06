import { useState } from "react";
import "../App.css"


export default function LoginPage() {

    // Login States
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    // Handler for submission
    const handleSubmit = async (e) => {
        e.preventDefault(); // stop page from refreshing

        try {
            // post email and password to login api
            const response = await fetch("http://127.0.0.1:5000/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({email, password})
            });

            // await response
            const data = await response.json();

            // on successful login
            if (response.ok){
                // store token
                localStorage.setItem("token", data.token);

                // redirect to user page
                window.location.href = "/user-page";

            // on unsuccessful login
            } else {
                setError(data.message || "Incorrect Username or Password");
            }

        // if post fails, catch error (network most likely)
        } catch (error) {
            setError(error);
        }
    }

    return (
        <>
            <div className="wrapper">
                <h1 className="header">Log In Page</h1>
                <form onSubmit={handleSubmit} className="form">
                    <input name="email"
                           type="email"
                           placeholder="Email"
                           value={email}
                           onChange={(e) => setEmail(e.target.value)}
                    />
                    <input name="password"
                           type="password"
                           placeholder="Password"
                           value={password}
                           onChange={(e) => setPassword(e.target.value)}
                    />
                    <button type="submit">Login</button>
                    {error && <p className={"error"}>{error}</p>}
                </form>

            </div>
        </>
    )
}