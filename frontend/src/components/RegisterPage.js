import { useState } from "react";
import "../App.css"

export default function LoginPage() {

    // Login States
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [password_confirmation, setPasswordConfirmation] = useState("");
    const [error, setError] = useState("");
    const [userType, setUserType] = useState("buyer");

    // Handler for submission
    const handleSubmit = async (e) => {
        e.preventDefault(); // stop page from refreshing

        // check if password and confirmation match
        if (password !== password_confirmation) {
            setError("Passwords do not match");
            return;
        }

        // Collect form data based on user type
        let formData = { email, password, userType };

        if (userType === "buyer" || userType === "seller") {
            formData.business_name = e.target.business_name.value;
            formData.zip_code = e.target.zip_code.value;
            formData.street_number = e.target.street_number.value;
            formData.street_name = e.target.street_name.value;
        }

        if (userType === "seller") {
            formData.bank_routing_number = e.target.bank_routing_number.value;
            formData.bank_account_number = e.target.bank_account_number.value;
        }

        if (userType === "admin") {
            formData.position = e.target.position.value;
        }

        try {
            // post email and password to login api
            const response = await fetch("http://127.0.0.1:5000/api/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData)
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
                setError(data.msg);
            }
            else {
                setError(data.msg || "Error occurred during registration");
            }

        // if post fails, catch error (network most likely)
        } catch (error) {
            setError(error);
        }
    }

    const renderForm = () => {
        switch (userType) {
            case "seller":
                return <SellerForm />;
            case "admin":
                return <AdminForm />;
            default:
                return <BuyerForm />;
        }
    }

    return (
        <>
            <div className="wrapper">

                <h1 className={"header"}>Registration Page</h1>
                <div className={"dropdown-container"}>
                    <h4>Select User Type:</h4>
                    <select id={"user-type"}  className={"dropdown"} value={userType} onChange={(e) => setUserType(e.target.value)}>
                        <option value="buyer">Buyer</option>
                        <option value="seller">Seller</option>
                        <option value="admin">HelpDesk Admin</option>
                    </select>
                </div>


                <form onSubmit={handleSubmit} className={"form"}>
                    <h4>Enter User Information:</h4>
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
                    {renderForm()}
                    <button type="submit">Login</button>
                    {error && <p className={"error"}>{error}</p>}
                </form>
            </div>
        </>
    )
}

const BuyerForm = () => {
    return (
        <>
            <input name={"business_name"} type={"text"} placeholder={"Business Name"}/>
            <input name={"zip_code"} type={"text"} placeholder={"Zip Code"}/>
            <input name={"street_number"} type={"text"} placeholder={"Street Number"}/>
            <input name={"street_name"} type={"text"} placeholder={"Street Name"}/>
        </>
    )
}

const SellerForm = () => {
    return (
        <>
            <input name={"business_name"} type={"text"} placeholder={"Business Name"}/>
            <input name={"zip_code"} type={"text"} placeholder={"Zip Code"}/>
            <input name={"street_number"} type={"text"} placeholder={"Street Number"}/>
            <input name={"street_name"} type={"text"} placeholder={"Street Name"}/>
            <input name={"bank_routing_number"} type={"text"} placeholder={"Bank Routing Number"}/>
            <input name={"bank_account_number"} type={"text"} placeholder={"Bank Account Number"}/>
        </>
    )
}

const AdminForm = () => {
    return (
        <>
            <input name={"position"} type={"text"} placeholder={"Position"}/>
        </>
    )
}