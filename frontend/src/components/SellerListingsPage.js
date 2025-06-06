import '../App.css'
import { useEffect, useState } from "react";
import NoTokenPage from "./NoTokenPage";
import {Link} from "react-router-dom";

export default function SellerListingsPage() {

    const [userData, setUserData] = useState(null);
    const [listings, setListings] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [newProductTitle, setNewProductTitle] = useState("");
    const [newProductName, setNewProductName] = useState("");
    const [newProductDescription, setNewProductDescription] = useState("");
    const [newProductPrice, setNewProductPrice] = useState("");
    const [newProductQuantity, setNewProductQuantity] = useState("");
    const [newProductCategory, setNewProductCategory] = useState("");

    useEffect(() => {
        // get token from local storage
        const token = localStorage.getItem("token");

        // confirm token exists
        if (!token) {
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
            })

            // catch error
            .catch(error => {
                console.error(error);
            });

        fetch("http://127.0.0.1:5000/api/seller-listings", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        })
            .then(response => response.json())
            .then(data => {
                setListings(data);
            })
            .catch(error => {
                console.error("Error fetching listings:", error);
            });

    }, []);

    const openModal = (product) => {
        console.log("Opening modal for product:", product);
        setSelectedProduct(product);
    };

    const closeModal = () => {
        setEditMode(false);
        setSelectedProduct(null);
    };

    const handleEdit = (e) => {
        e.preventDefault();
        const listingId = selectedProduct.Listing_ID;
        const title = newProductTitle.trim() !== "" ? newProductTitle : selectedProduct.Product_Title;
        const name = newProductName.trim() !== "" ? newProductName : selectedProduct.Product_Name;
        const description = newProductDescription.trim() !== "" ? newProductDescription : selectedProduct.Product_Description;
        const price = newProductPrice !== "" ? newProductPrice : selectedProduct.Product_Price;
        const quantity = newProductQuantity !== "" ? newProductQuantity : selectedProduct.Quantity;
        const category = selectedProduct.Category;

        fetch("http://127.0.0.1:5000/api/update-listing", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            },
            body: JSON.stringify({
                listing_id: listingId,
                product_title: title,
                product_name: name,
                product_description: description,
                product_price: price,
                quantity: quantity,
                category: category
            })
        })
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error("Failed to update listing");
                }
            })
            .then(data => {
                console.log("Listing updated successfully:", data);
                closeModal();
            })
            .catch(error => {
                console.error("Error updating listing:", error);
            });

        // reload the listings
        fetch("http://127.0.0.1:5000/api/seller-listings", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            }
        })
            .then(response => response.json())
            .then(data => {
                setListings(data);
            })
            .catch(error => {
                console.error("Error fetching listings:", error);
            });

        closeModal();
    }
    const promoteProduct = async (listingId) => {
        const token = localStorage.getItem("token");
    
        const res = await fetch("http://127.0.0.1:5000/api/promote-product", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ listing_id: listingId })
        });
    
        const data = await res.json();
        if (res.ok) {
            alert(`🎉 ${data.msg} Promotion fee: $${data.fee}`);
    
            // Refresh listings
            const updated = await fetch("http://127.0.0.1:5000/api/seller-listings", {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            const refreshedListings = await updated.json();
            setListings(refreshedListings);
        } else {
            alert(`❌ Promotion failed: ${data.msg || "Unknown error"}`);
        }
    };

    const createListing = async () => {
        const token = localStorage.getItem("token");
      
        const response = await fetch("http://127.0.0.1:5000/api/create-listing", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            product_title: newProductTitle,
            product_name: newProductName,
            product_description: newProductDescription,
            quantity: newProductQuantity,
            product_price: newProductPrice,
            category: newProductCategory,
          })
        });
      
        const data = await response.json();
        if (response.ok) {
          alert("Listing created!");
      
          // Clear form fields
          setNewProductTitle("");
          setNewProductName("");
          setNewProductDescription("");
          setNewProductQuantity("");
          setNewProductPrice("");
      
          // Refresh listings
          fetch("http://127.0.0.1:5000/api/seller-listings", {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${token}`
            }
          })
            .then(response => response.json())
            .then(data => setListings(data));
        } else {
          alert("Error creating listing: " + data.msg);
        }
      };
      
    

    if (!userData) {
        return <NoTokenPage />;
    }
    return (
        <>
            <div className="wrapper">
                {selectedProduct && (
                        <div className="modal-overlay">
                            <div className="modal">
                                {editMode ? (
                                    <>
                                        <h2>Edit Product</h2>
                                        <form className="edit-listing-form" onSubmit={handleEdit}>
                                                <label>Product Title:</label>
                                                <input name="product_title"
                                                       type="text"
                                                       placeholder={selectedProduct.Product_Title}
                                                       value={newProductTitle}
                                                       onChange={(e) => setNewProductTitle(e.target.value)}
                                                />
                                                <label>Product Name:</label>
                                                <input name="product_name"
                                                       type="text"
                                                       placeholder={selectedProduct.Product_Name}
                                                       value={newProductName}
                                                       onChange={(e) => setNewProductName(e.target.value)}
                                                />
                                                <label>Description:</label>
                                                <textarea name="product_description"
                                                          placeholder={selectedProduct.Product_Description}
                                                          value={newProductDescription}
                                                          onChange={(e) => setNewProductDescription(e.target.value)}
                                                />
                                                <label>Available Quantity:</label>
                                                <input name="quantity"
                                                       type="number"
                                                       placeholder={selectedProduct.Quantity}
                                                       value={newProductQuantity}
                                                       onChange={(e) => setNewProductQuantity(e.target.value)}
                                                />
                                                <label>Price:</label>
                                                <input name="product_price"
                                                       type="number"
                                                       placeholder={selectedProduct.Product_Price}
                                                       value={newProductPrice}
                                                       onChange={(e) => setNewProductPrice(e.target.value)}
                                                />
                                                <div className="pagination-controls">
                                                <button className={"btn-secondary"} type="submit">Save Changes</button>
                                                <button onClick={closeModal} className="btn">Close</button>
                                                </div>
                                        </form>

                                    </>
                                    ) : (
                                    <>
                                        <h2>Product Details</h2>
                                        <p><strong>Listing ID:</strong> {selectedProduct.Listing_ID}</p>
                                        <p><strong>Category:</strong> {selectedProduct.Category}</p>
                                        <p><strong>Product Title:</strong> {selectedProduct.Product_Title}</p>
                                        <p><strong>Product Name:</strong> {selectedProduct.Product_Name}</p>
                                        <p><strong>Description:</strong> {selectedProduct.Product_Description}</p>
                                        <p><strong>Available Quantity:</strong> {selectedProduct.Quantity}</p>
                                        <p><strong>Price:</strong> {selectedProduct.Product_Price}</p>
                                        <p><strong>Status:</strong> {selectedProduct.Status ? "Available" : "Out of Stock"}</p>
                                        <div className="pagination-controls">
                                            <button className={"btn-secondary"} onClick={() => setEditMode(true)}>Edit Details</button>
                                            <button onClick={closeModal} className="btn">Close</button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                <h1 className="header">Seller's Listings</h1>
                <h2>Create New Listing</h2>
                <form
                className="create-listing-form"
                onSubmit={(e) => {
                    e.preventDefault();
                    createListing();
                }}
                style={{ marginBottom: "30px" }}
                >
                <input
                    type="text"
                    placeholder="Product Title"
                    value={newProductTitle}
                    onChange={(e) => setNewProductTitle(e.target.value)}
                    required
                />
                <input
                    type="text"
                    placeholder="Product Name"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    required
                />
                <input
                    type="text"
                    placeholder="Product Description"
                    value={newProductDescription}
                    onChange={(e) => setNewProductDescription(e.target.value)}
                    required
                />
                <input
                    type="text"
                    placeholder="Category"
                    value={newProductCategory}
                    onChange={(e) => setNewProductCategory(e.target.value)}
                    required
                />
                <input
                    type="number"
                    placeholder="Quantity"
                    value={newProductQuantity}
                    onChange={(e) => setNewProductQuantity(e.target.value)}
                    required
                />
                <input
                    type="number"
                    placeholder="Price"
                    value={newProductPrice}
                    onChange={(e) => setNewProductPrice(e.target.value)}
                    required
                />
                <button className="btn" type="submit">Create Listing</button>
                </form>

                <div className="product-listings">
                    <table className="product-table">
                        <thead>
                            <tr>
                                <th>Listing ID</th>
                                <th>Product Name</th>
                                <th>Price</th>
                                <th>Stock</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {listings && listings.map((listing) => (
                                <tr key={listing.Listing_ID}>
                                    <td>{listing.Listing_ID}</td>
                                    <td>{listing.Product_Name} {listing.Product_Title}</td>
                                    <td>${listing.Product_Price}</td>
                                    <td>{listing.Quantity}</td>
                                    <td>
                                    <button className="btn" onClick={() => openModal(listing)}>View</button>
                                    {listing.Is_Promoted ? (
                                        <span className="badge" style={{ marginLeft: "8px", color: "gold", fontWeight: "bold" }}>🌟 Promoted</span>
                                    ) : (
                                        <button className="btn-secondary" style={{ marginLeft: "8px" }} onClick={() => promoteProduct(listing.Listing_ID)}>Promote</button>
                                    )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="links" style={{ margin: 20 }}>
                    <Link to="/user-page">User Dashboard</Link>
                </div>
            </div>
        </>
    )
}