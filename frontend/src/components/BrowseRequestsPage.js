import {useState, useEffect} from 'react'
import "../App.css"
import NoTokenPage from "./NoTokenPage";
import {Link} from "react-router-dom";

export default function BrowseRequestsPage() {

    const [userData, setUserData] = useState(null);
    const [requests, setRequests] = useState([]);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [complete, setComplete] = useState(false);

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

        fetch("http://127.0.0.1:5000/api/get-requests", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            }
        })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error("Failed to fetch requests");
                }
            })
            .then(data => {
                console.log("Requests: ", data);
                setRequests(data);
            })
            .catch(error => {
                console.error(error);
            });

    }, []);

    const handleViewRequest = (requestId) => {

        // Logic to view request details
        fetch(`http://127.0.0.1:5000/api/get-request/${requestId}`, {
            method: "GET",
            headers: {
                'Content-Type': "application/json",
                'Authorization': `Bearer ${localStorage.getItem("token")}`
            }
        })
            .then(response => response.json())
            .then(data => {
                setSelectedRequest(data)
                // update request as viewed
                if (data.status === "New") {
                    fetch(`http://127.0.0.1:5000/api/update-request/${requestId}`, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            'Authorization': `Bearer ${localStorage.getItem("token")}`
                        },
                        body: JSON.stringify({status: "Viewed"})
                    })
                        .then(response => response.json())
                        .then(data => {
                            console.log("Request updated: ", data);
                        })
                        .catch(error => {
                            console.error(error);
                        })
                }
            })
            .catch(error => {
                console.error(error);
            })

    }

    const closeModal = () => {
        // reload requests
        fetch("http://127.0.0.1:5000/api/get-requests", {
            method: "GET",
            headers: {
                'Content-Type': "application/json",
                'Authorization': `Bearer ${localStorage.getItem("token")}`
            }
        })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error("Failed to fetch requests");
                }
            })
            .then(data => {
                console.log("Requests: ", data);
                setRequests(data);
            })
            .catch(error => {
                console.error(error);
            });

        setSelectedRequest(null);

    };

    const RenderRequestInfo = () => {
        switch (selectedRequest.request_type) {
            case "Email Change":
                return <EmailChangeInfo request={selectedRequest} />;
            case "Order Issue":
                return <OrderIssueInfo request={selectedRequest} />;
            case "Category Suggestion":
                return <CategorySuggestionInfo request={selectedRequest} />;
            default:
                return null;
        }
    }

    const completeRequest = () => {
        // update request as completed
        fetch(`http://127.0.0.1:5000/api/update-request/${selectedRequest.request_id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                'Authorization': `Bearer ${localStorage.getItem("token")}`
            },
            body: JSON.stringify({status: "Completed"})
        })
            .then(response => response.json())
            .then(data => {
                console.log("Request updated: ", data);
            })

        setComplete(true);
        alert(`Request ${selectedRequest.request_id} completed!`);
        closeModal();
    }

    if (!userData) {
        return (
            <NoTokenPage/>
        );
    }

    return (
        <>
            <div className="wrapper">
                <div className="product-listings">
                    <h5>Requests:</h5>
                    <table className="product-table">
                        <thead>
                            <tr>
                                <th>Request ID</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Email</th>
                                <th>Type</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map((request) => (
                                <tr key={request.request_id}>
                                    <td>{request.request_id}</td>
                                    <td>{request.request_date}</td>
                                    <td>{request.status}</td>
                                    <td>{request.user_email}</td>
                                    <td>{request.request_type}</td>
                                    <td>
                                        <button className="btn" onClick={() => handleViewRequest(request.request_id)}>
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {selectedRequest && (
                        <div className="modal-overlay">
                            <div className="modal">
                                <h2>{selectedRequest.request_type}</h2>
                                <p><strong>Request ID: </strong>{selectedRequest.request_id}</p>
                                <p><strong>Date: </strong>{selectedRequest.request_date}</p>
                                <p><strong>Status: </strong>{selectedRequest.status}</p>
                                <p><strong>Email: </strong>{selectedRequest.email}</p>
                                <RenderRequestInfo />
                                <div className="pagination-controls">
                                    {selectedRequest.status !== "Completed" &&
                                        <button onClick={completeRequest} className={"btn-secondary"}>
                                            Complete Request
                                        </button>
                                    }
                                    <button onClick={closeModal} className="btn">Close</button>
                                </div>
                            </div>
                        </div>
                    )}
                <div className="links" style={{ margin: 20 }}>
                    <Link to="/user-page">User Dashboard</Link>
                </div>
            </div>
        </>
    );
}


const EmailChangeInfo = ({request}) => {
    return (
        <>
            <p><strong>New Email: </strong>{request.new_email}</p>
        </>
    )
}

const OrderIssueInfo = ({request}) => {
    return (
        <>
            <p><strong>Order ID: </strong>{request.order_id}</p>
            <p><strong>Issue: </strong>{request.issue}</p>
        </>
    )
}

const CategorySuggestionInfo = ({request}) => {
    return (
        <>
            <p><strong>New Category Name: </strong>{request.category_name}</p>
            <p><strong>Parent Category: </strong>{request.parent_category}</p>
            <p><strong>Description: </strong>{request.description}</p>
            <p><strong>Reason: </strong>{request.reason}</p>
        </>
    )
}