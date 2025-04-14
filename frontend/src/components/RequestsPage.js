import "../App.css"
import {useEffect, useState} from "react";
import NoTokenPage from "./NoTokenPage";
import {Link} from "react-router-dom";

export default function RequestsPage() {

    const [userData, setUserData] = useState(null);
    const [requestType, setRequestType] = useState("Email Change");

    const renderForm = () => {
        switch (requestType) {
            case "Email Change":
                return (
                    <EmailChangeForm/>
                );
            case "Order Issue":
                return (
                    <OrderIssueForm/>
                );
            case "Category Suggestion":
                return (
                    <CategorySuggestionForm/>
                );
            default:
                return null;
        }
    }

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            return;
        }
        fetch("http://127.0.0.1:5000/api/protected", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error("Invalid Token");
                }
            })
            .then(data => {
                console.log("User Data: ", data);
                setUserData(data);
            })
            .catch(error => {
                console.error(error);
            });
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        let formData = {'email': userData.email, 'request_type': requestType};

        // Collect form data based on request type
        if (requestType === "Email Change") {
            formData.new_email = e.target.email.value;
        } else if (requestType === "Order Issue") {
            formData.order_id = e.target.order_id.value;
            formData.issue = e.target.issue.value;
        } else if (requestType === "Category Suggestion") {
            formData.category_name = e.target.category.value;
            formData.parent_category = e.target.parent_category.value;
            formData.description = e.target.description.value;
            formData.reason = e.target.reason.value;
        }

        try {
            const response = await fetch("http://127.0.0.1:5000/api/post-requests", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });
            const data = await response.json();
            if (response.ok) {
                alert("Request submitted successfully!");
                window.location.href = "/user-page";
            } else {
                alert("Error submitting request: " + data.msg);
            }
        }
        catch (error) {
            console.error("Error:", error);
            alert("Network error: " + error.message);
        }
    }



    if (userData) {
        return (
            <>
                <div className="wrapper">
                    <h1 className="header">Requests Page</h1>
                    <p className={"centered"}>
                        Here you can create a HelpDesk request.
                    </p>
                    <div className={"dropdown-container"}>
                        <h4>Select Request Type:</h4>
                        <select id={"request-type"}  className={"dropdown"} value={requestType} onChange={(e) => setRequestType(e.target.value)} >
                            <option value="Email Change">Email Change</option>
                            <option value="Order Issue">Order Issue</option>
                            <option value="Category Suggestion">Category Suggestion</option>
                        </select>
                    </div>
                    <form className={"form"} onSubmit={handleSubmit}>
                        <h4>Request Details:</h4>
                        {renderForm()}
                        <button type="submit">Submit</button>
                    </form>
                </div>
            </>
        );
    }
    return (
        <NoTokenPage/>
    );

}

const EmailChangeForm = () => {
    return(
        <>
            <input name={"email"} type={"text"} placeholder={"New Email"}/>
        </>
    )
}

const OrderIssueForm = () => {
    return(
        <>
            <input name={"order_id"} type={"text"} placeholder={"Order ID"}/>
            <textarea name={"issue"} placeholder={"Issue"}/>
        </>
    )
}

const CategorySuggestionForm = () => {
    return(
        <>
            <input name={"category"} type={"text"} placeholder={"Category Name"}/>
            <input name={"parent_category"} type={"text"} placeholder={"Parent Category"}/>
            <textarea name={"description"} placeholder={"Description"} className={"small-textarea"}/>
            <textarea name={"reason"} placeholder={"Reason"}/>
        </>
    )
}