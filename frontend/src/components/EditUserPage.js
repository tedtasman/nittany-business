import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../App.css";

export default function EditUserPage() {
    const [userData, setUserData] = useState(null);
    const [userType, setUserType] = useState(null);
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        business_name: "",
        zip_code: "",
        street_number: "",
        street_name: "",
        bank_routing_number: "",
        bank_account_number: "",
        position: "",
    });
    const [showConfirm, setShowConfirm] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/user-page");
            return;
        }

        fetch("http://127.0.0.1:5000/api/protected", {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then((response) => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error("Invalid Token");
                }
            })
            .then((data) => {
                setUserData(data);
                setUserType(data.user_type);
                setFormData({
                    email: data.email || "",
                    password: "",
                    business_name: data.business_name || "",
                    zip_code: data.address?.zipcode || "",
                    street_number: data.address?.street_number || "",
                    street_name: data.address?.street_name || "",
                    bank_routing_number: data.bank_routing_number || "",
                    bank_account_number: data.bank_account_number || "",
                    position: data.position || "",
                });
            })
            .catch((error) => {
                console.error(error);
                navigate("/user-page");
            });
    }, [navigate]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === "zip_code" || name === "street_number") {
            if (!/^\d*$/.test(value)) return; // Only allow digits
        }
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const update_buyer = async (token, originalEmail) => {
        const updateData = {
            original_email: originalEmail,
            email: formData.email,
            password: formData.password || undefined,
            business_name: formData.business_name,
            zip_code: formData.zip_code,
            street_number: formData.street_number,
            street_name: formData.street_name,
        };

        try {
            const response = await fetch("http://127.0.0.1:5000/api/update-user", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ user_type: "Buyer", ...updateData }),
            });

            if (!response.ok) {
                throw new Error("Failed to update buyer");
            }
            const data = await response.json();
            if (data.new_token) {
                localStorage.setItem("token", data.new_token);
            }
            return true;
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    const update_seller = async (token, originalEmail) => {
        const updateData = {
            original_email: originalEmail,
            email: formData.email,
            password: formData.password || undefined,
            business_name: formData.business_name,
            zip_code: formData.zip_code,
            street_number: formData.street_number,
            street_name: formData.street_name,
            bank_routing_number: formData.bank_routing_number,
            bank_account_number: formData.bank_account_number,
        };

        try {
            const response = await fetch("http://127.0.0.1:5000/api/update-user", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ user_type: "Seller", ...updateData }),
            });

            if (!response.ok) {
                throw new Error("Failed to update seller");
            }
            const data = await response.json();
            if (data.new_token) {
                localStorage.setItem("token", data.new_token);
            }
            return true;
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    const update_admin = async (token, originalEmail) => {
        const updateData = {
            original_email: originalEmail,
            email: formData.email,
            password: formData.password || undefined,
            position: formData.position,
        };

        try {
            const response = await fetch("http://127.0.0.1:5000/api/update-user", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ user_type: "HelpDesk", ...updateData }),
            });

            if (!response.ok) {
                throw new Error("Failed to update admin");
            }
            const data = await response.json();
            if (data.new_token) {
                localStorage.setItem("token", data.new_token);
            }
            return true;
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    const handleSave = () => {
        setShowConfirm(true);
    };

    const confirmSave = async () => {
        const token = localStorage.getItem("token");
        const originalEmail = userData.email;

        try {
            let success = false;
            if (userType === "Buyer") {
                success = await update_buyer(token, originalEmail);
            } else if (userType === "Seller") {
                success = await update_seller(token, originalEmail);
            } else if (userType === "HelpDesk") {
                success = await update_admin(token, originalEmail);
            }

            if (success) {
                alert("User information updated successfully!");
                navigate("/user-page");
            }
        } catch (error) {
            alert("Error updating user information.");
        }
        setShowConfirm(false);
    };

    if (!userData) {
        return <div className="wrapper centered">Loading...</div>;
    }

    return (
        <div className="wrapper">
            <h1 className="header">Edit User Profile</h1>
            <form className="form">
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Email"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Password (leave blank to keep unchanged)</label>
                    <input
                        id="password"
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Password"
                    />
                </div>
                {userType === "Buyer" && (
                    <>
                        <div className="form-group">
                            <label htmlFor="business_name">Business Name</label>
                            <input
                                id="business_name"
                                type="text"
                                name="business_name"
                                value={formData.business_name}
                                onChange={handleInputChange}
                                placeholder="Business Name"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="zip_code">Zip Code</label>
                            <input
                                id="zip_code"
                                type="text"
                                name="zip_code"
                                value={formData.zip_code}
                                onChange={handleInputChange}
                                placeholder="Zip Code"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="street_number">Street Number</label>
                            <input
                                id="street_number"
                                type="text"
                                name="street_number"
                                value={formData.street_number}
                                onChange={handleInputChange}
                                placeholder="Street Number"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="street_name">Street Name</label>
                            <input
                                id="street_name"
                                type="text"
                                name="street_name"
                                value={formData.street_name}
                                onChange={handleInputChange}
                                placeholder="Street Name"
                            />
                        </div>
                    </>
                )}
                {userType === "Seller" && (
                    <>
                        <div className="form-group">
                            <label htmlFor="business_name">Business Name</label>
                            <input
                                id="business_name"
                                type="text"
                                name="business_name"
                                value={formData.business_name}
                                onChange={handleInputChange}
                                placeholder="Business Name"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="zip_code">Zip Code</label>
                            <input
                                id="zip_code"
                                type="text"
                                name="zip_code"
                                value={formData.zip_code}
                                onChange={handleInputChange}
                                placeholder="Zip Code"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="street_number">Street Number</label>
                            <input
                                id="street_number"
                                type="text"
                                name="street_number"
                                value={formData.street_number}
                                onChange={handleInputChange}
                                placeholder="Street Number"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="street_name">Street Name</label>
                            <input
                                id="street_name"
                                type="text"
                                name="street_name"
                                value={formData.street_name}
                                onChange={handleInputChange}
                                placeholder="Street Name"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="bank_routing_number">Bank Routing Number</label>
                            <input
                                id="bank_routing_number"
                                type="text"
                                name="bank_routing_number"
                                value={formData.bank_routing_number}
                                onChange={handleInputChange}
                                placeholder="Bank Routing Number"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="bank_account_number">Bank Account Number</label>
                            <input
                                id="bank_account_number"
                                type="text"
                                name="bank_account_number"
                                value={formData.bank_account_number}
                                onChange={handleInputChange}
                                placeholder="Bank Account Number"
                            />
                        </div>
                    </>
                )}
                {userType === "HelpDesk" && (
                    <div className="form-group">
                        <label htmlFor="position">Position</label>
                        <input
                            id="position"
                            type="text"
                            name="position"
                            value={formData.position}
                            onChange={handleInputChange}
                            placeholder="Position"
                        />
                    </div>
                )}
                <div className="links">
                    <button type="button" onClick={handleSave} className="btn">
                        Save
                    </button>
                    <Link to="/user-page" className="btn-red">
                        Back
                    </Link>
                </div>
            </form>
            {showConfirm && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-content">
                            <h3>Confirm Changes</h3>
                            <p>Are you sure you want to save these changes?</p>
                            <div className="links">
                                <button type="button" onClick={confirmSave} className="btn">
                                    Yes
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(false)}
                                    className="btn-red"
                                >
                                    No
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}