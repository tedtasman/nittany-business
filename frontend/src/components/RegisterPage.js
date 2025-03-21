import { useState } from "react";

export default function LoginPage() {

    // Login States
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [password_confirmation, setPasswordConfirmation] = useState("");
    const [error, setError] = useState("");

    // Handler for submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        // check if password and confirmation match
        if (password !== password_confirmation) {
            setError("Passwords do not match");
            return;
        }

        try {
            // post email and password to login api
            const response = await fetch("http://127.0.0.1:5000/api/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({email, password})
            });

            // await response
            const data = await response.json();

            // on successful registration
            if (response.ok){
                // store token
                localStorage.setItem("token", data.token);

                // redirect to login page
                window.location.href = "/user-sign-in";

            // on unsuccessful registration
            } else if (response.status === 400) {
                setError(data.message || "User already exists");
            }
            else {
                setError(data.message || "Error occurred during registration");
            }

        // if post fails, catch error (network most likely)
        } catch (error) {
            setError(error);
        }
    }

    return (
        <>
            <h1>Registration Page</h1>
            <form onSubmit={handleSubmit}>
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
                <input name="password_confirmation"
                          type="password"
                          placeholder="Confirm Password"
                          value={password_confirmation}
                          onChange={(e) => setPasswordConfirmation(e.target.value)}
                />
                <button type="submit">Login</button>
            </form>
            {error && <p>{error}</p>}
        </>
    )
}