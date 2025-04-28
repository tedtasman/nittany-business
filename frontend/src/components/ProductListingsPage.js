import "../App.css";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import NoTokenPage from "./NoTokenPage";

export default function ProductListingsPage() {
    const [userData, setUserData] = useState(null);
    const [products, setProducts] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [searchProductName, setSearchProductName] = useState("");
    const [searchListingID, setSearchListingID] = useState("");
    const [sortOption, setSortOption] = useState("none");
    const [quantity, setQuantity] = useState(1);
    const productsPerPage = 5;
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("Root");
    const [showCategories, setShowCategories] = useState(false);
    const [parentCategory, setParentCategory] = useState(null);
    const [newReview, setNewReview] = useState("");
    const [newRating, setNewRating] = useState(0);

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            console.error("No token found.");
            return;
        }

        fetch("http://127.0.0.1:5000/api/protected", {
            headers: {
                "Authorization": `Bearer ${token}`,
            },
        })
            .then((res) => res.json())
            .then((data) => setUserData(data))
            .catch((err) => console.error("User fetch error:", err));

        fetch(`http://127.0.0.1:5000/api/products?category=${selectedCategory}`)
            .then((res) => res.json())
            .then((data) => setProducts(data))
            .catch((err) => console.error("Product fetch error:", err));

        fetch("http://127.0.0.1:5000/api/subcategories", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ parent_category: "Root" })
        })
            .then((res) => res.json())
            .then((data) => setCategories(data))
            .catch((err) => console.error("Categories fetch error:", err));

        fetch('http://127.0.0.1:5000/api/get-cart', {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            }
        })
            .then((res) => {
                if (!res.ok) {
                    throw new Error("Network response was not ok");
                }
                return res.json();
            })
            .then((data) => {
                setCart(data);
            })
            .catch((error) => {
                console.error("Error fetching cart:", error);
            });
    }, []);

    useEffect(() => {
        fetch(`http://127.0.0.1:5000/api/products?category=${encodeURIComponent(selectedCategory)}`)
            .then((res) => res.json())
            .then((data) => setProducts(data))
            .catch((err) => console.error("Product fetch error:", err));
    }, [selectedCategory]);

    const sortProducts = (products) => {
        const promoted = products.filter(p => p.Is_Promoted === 1);
        const nonPromoted = products.filter(p => p.Is_Promoted !== 1);

        const sortGroup = (group) => {
            if (sortOption === "priceAsc") {
                return group.sort((a, b) => a.Product_Price - b.Product_Price);
            } else if (sortOption === "priceDesc") {
                return group.sort((a, b) => b.Product_Price - a.Product_Price);
            }
            return group;
        };

        return [...sortGroup(promoted), ...sortGroup(nonPromoted)];
    };

    const removeFromCart = (indexToRemove) => {
        setCart(cart.filter((_, index) => index !== indexToRemove));
        fetch('http://127.0.0.1:5000/api/remove-from-cart/', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({ email: userData.email, listing_id: cart[indexToRemove].Listing_ID })
        })
            .then((res) => {
                if (!res.ok) {
                    throw new Error("Network response was not ok");
                }
                return res.json();
            })
            .then((data) => {
                console.log("Product removed from cart:", data);
            })
            .catch((error) => {
                console.error("Error removing product from cart:", error);
            });
    };

    const placeOrder = async () => {
        try {
            const response = await fetch("http://127.0.0.1:5000/api/place-order", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ cart })
            });

            if (response.ok) {
                alert("Order placed successfully!");
                setCart([]);
                setIsCartOpen(false);
                const res = await fetch("http://127.0.0.1:5000/api/products");
                const data = await res.json();
                setProducts(data);
            } else {
                alert("Error placing order.");
            }
        } catch (err) {
            console.error("Place order error:", err);
            alert("Something went wrong.");
        }
    };

    const handleAddReview = async () => {
        if (!newReview || newRating < 0 || newRating > 5) {
            alert("Please provide a valid review and a rating between 0 and 5.");
            return;
        }

        try {
            const response = await fetch("http://127.0.0.1:5000/api/add-review", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({
                    listing_id: selectedProduct.Listing_ID,
                    review: newReview,
                    rating: newRating
                })
            });

            if (response.ok) {
                alert("Review added successfully!");
                setNewReview("");
                setNewRating(0);
                // Refresh product data to show updated reviews
                const res = await fetch(`http://127.0.0.1:5000/api/products?category=${encodeURIComponent(selectedCategory)}`);
                const data = await res.json();
                setProducts(data);
                // Update selected product to reflect new reviews
                const updatedProduct = data.find(p => p.Listing_ID === selectedProduct.Listing_ID);
                setSelectedProduct(updatedProduct);
            } else {
                const errorData = await response.json();
                alert(errorData.msg || "Error adding review.");
            }
        } catch (err) {
            console.error("Add review error:", err);
            alert("Something went wrong.");
        }
    };

    const filteredProducts = products.filter((product) => {
        const matchesName = product.Product_Name.toLowerCase().includes(searchProductName.toLowerCase());
        const matchesID = product.Listing_ID.toString().includes(searchListingID);
        const price = product.Product_Price;
        const meetsMin = minPrice === "" || price >= parseFloat(minPrice);
        const meetsMax = maxPrice === "" || price <= parseFloat(maxPrice);

        return matchesName && matchesID && meetsMin && meetsMax;
    });

    const sortedProducts = sortProducts(filteredProducts);

    const indexOfLastProduct = currentPage * productsPerPage;
    const currentProducts = sortedProducts.slice(indexOfLastProduct - productsPerPage, indexOfLastProduct);

    const openModal = (product) => {
        console.log("Opening modal for product:", product);
        setSelectedProduct(product);
        setQuantity(1);
        setNewReview("");
        setNewRating(0);
    };

    const closeModal = () => {
        setSelectedProduct(null);
    };

    const handleAddToCart = () => {
        const existing = cart.find(item => item.Listing_ID === selectedProduct.Listing_ID);
        let updatedCart;

        if (existing) {
            updatedCart = cart.map(item =>
                item.Listing_ID === selectedProduct.Listing_ID
                    ? { ...item, quantity: item.quantity + quantity }
                    : item
            );
        } else {
            updatedCart = [...cart, { ...selectedProduct, quantity }];
        }

        fetch('http://127.0.0.1:5000/api/add-to-cart/', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({ email: userData.email, listing_id: selectedProduct.Listing_ID, quantity: quantity })
        })
            .then((res) => {
                if (!res.ok) {
                    throw new Error("Network response was not ok");
                }
                return res.json();
            })
            .then((data) => {
                console.log("Product added to cart:", data);
            })
            .catch((error) => {
                console.error("Error adding product to cart:", error);
            });

        setCart(updatedCart);
        alert(`Added ${quantity} ${selectedProduct.Product_Name} with id of ${selectedProduct.Listing_ID} to cart!`);
        closeModal();
    };

    const getSubcategories = (category) => {
        return fetch("http://127.0.0.1:5000/api/subcategories", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ parent_category: category })
        })
            .then((res) => res.json())
            .then((data) => data)
            .catch((err) => console.error("Subcategories fetch error:", err));
    };

    const getParentCategory = (category) => {
        return fetch(`http://127.0.0.1:5000/api/parent_category/${category}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        })
            .then((res) => res.json())
            .then((data) => data)
            .catch((err) => console.error("Parent category fetch error:", err));
    };

    const handleCategoryChange = async (category) => {
        try {
            const subcategories = await getSubcategories(category);
            setCategories(subcategories);
            const parentCategory = await getParentCategory(category);

            if (parentCategory === "None") {
                setParentCategory(null);
            } else {
                setParentCategory(parentCategory);
            }

            setSelectedCategory(category);

            if (subcategories.length > 0) {
                setShowCategories(true);
            } else {
                setShowCategories(false);
            }
        } catch (error) {
            console.error("Error fetching subcategories:", error);
        }
    };

    return (
        <>
            {userData ? (
                <div className="wrapper">
                    <div style={{ position: 'absolute', top: 10, right: 10 }}>
                        <button onClick={() => setIsCartOpen(true)} className="btn-secondary">
                            Shopping Cart ({cart.length})
                        </button>
                    </div>

                    <p className="centered">
                        Welcome, {userData.email}! Here are all the products available for purchase.
                    </p>

                    <div className="search-bar-container">
                        <div className={"search-bar"}>
                            <button className={'btn-secondary'} onClick={() => setShowCategories(true)}>
                                {parentCategory ? `Showing ${selectedCategory}` : "Select a Category"}
                            </button>
                        </div>
                        <div className="search-bar">
                            <label htmlFor="productName">Search by Product Name:</label>
                            <input
                                id="productName"
                                type="text"
                                placeholder="Enter Product Name"
                                value={searchProductName}
                                onChange={(e) => setSearchProductName(e.target.value)}
                            />
                        </div>
                        <div className="search-bar">
                            <label htmlFor="listingID">Search by Listing ID:</label>
                            <input
                                id="listingID"
                                type="text"
                                placeholder="Enter Listing ID"
                                value={searchListingID}
                                onChange={(e) => setSearchListingID(e.target.value)}
                            />
                        </div>
                        <div className="search-bar">
                            <label htmlFor="sortOption">Sort by Price:</label>
                            <select
                                id="sortOption"
                                className="dropdown-dark"
                                value={sortOption}
                                onChange={(e) => setSortOption(e.target.value)}
                            >
                                <option value="none">None</option>
                                <option value="priceAsc">Price: Low to High</option>
                                <option value="priceDesc">Price: High to Low</option>
                            </select>
                        </div>
                        <div className="search-bar">
                            <label htmlFor="minPrice">Min Price:</label>
                            <input
                                id="minPrice"
                                type="number"
                                placeholder="Min"
                                value={minPrice}
                                onChange={(e) => setMinPrice(e.target.value)}
                            />
                        </div>
                        <div className="search-bar">
                            <label htmlFor="maxPrice">Max Price:</label>
                            <input
                                id="maxPrice"
                                type="number"
                                placeholder="Max"
                                value={maxPrice}
                                onChange={(e) => setMaxPrice(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="product-listings">
                        <table className="product-table">
                            <thead>
                                <tr>
                                    <th>Listing ID</th>
                                    <th>Product Name</th>
                                    <th>Product Price</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentProducts.map((product) => (
                                    <tr key={product.Listing_ID}>
                                        <td>{product.Listing_ID}</td>
                                        <td>{product.Product_Title} {product.Product_Name} {product.Is_Promoted ? "(Promoted)" : ""}</td>
                                        <td>${product.Product_Price.toFixed(2)}</td>
                                        <td>{product.Status ? "Available" : "Out of Stock"}</td>
                                        <td>
                                            <button onClick={() => openModal(product)} className="btn">
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="pagination-controls">
                        <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} className="btn">Previous</button>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(p + 1, Math.ceil(sortedProducts.length / productsPerPage)))}
                            className="btn"
                        >
                            Next
                        </button>
                    </div>

                    {selectedProduct && (
                        <div className="modal-overlay">
                            <div className="modal">
                                <h2>Product Details</h2>
                                <p><strong>Seller Email:</strong> {selectedProduct.Seller_Email || "Not Available"}</p>
                                <p><strong>Listing ID:</strong> {selectedProduct.Listing_ID}</p>
                                <p><strong>Category:</strong> {selectedProduct.Category}</p>
                                <p><strong>Product Title:</strong> {selectedProduct.Product_Title}</p>
                                <p><strong>Product Name:</strong> {selectedProduct.Product_Name}</p>
                                <p><strong>Description:</strong> {selectedProduct.Product_Description}</p>
                                <p><strong>Available Quantity:</strong> {selectedProduct.Quantity}</p>
                                <p><strong>Price:</strong> ${selectedProduct.Product_Price.toFixed(2)}</p>
                                <p><strong>Status:</strong> {selectedProduct.Status ? "Available" : "Out of Stock"}</p>
                                <p><strong>Average Rating:</strong> {selectedProduct.average_rating ? selectedProduct.average_rating : "No ratings yet"}</p>
                                <div>
                                    <h3>Reviews</h3>
                                    {selectedProduct.reviews && selectedProduct.reviews.length > 0 ? (
                                        selectedProduct.reviews.map((review, index) => (
                                            <div key={index} style={{ marginBottom: '10px', borderBottom: '1px solid #ccc' }}>
                                                <p><strong>{review.reviewer_email}</strong> ({review.rating}/5)</p>
                                                <p>{review.review_msg}</p>
                                                <p><small>{new Date(review.date).toLocaleString()}</small></p>
                                            </div>
                                        ))
                                    ) : (
                                        <p>No reviews yet</p>
                                    )}
                                </div>

                                <div>
                                    <h3>Add a Review</h3>
                                    <div className="search-bar" >
                                        <label htmlFor="newRating">Rating (0-5):</label>
                                        <input
                                            style={{maxWidth: 30}}
                                            id="newRating"
                                            type="number"
                                            min="0"
                                            max="5"
                                            value={newRating}
                                            onChange={(e) => setNewRating(Number(e.target.value))}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="newReview">Review:</label>

                                    </div>
                                    <div>
                                    <textarea
                                            id="newReview"
                                            value={newReview}
                                            onChange={(e) => setNewReview(e.target.value)}
                                            placeholder="Write your review here"
                                        />
                                        </div>
                                    <button onClick={handleAddReview} className="btn">Submit Review</button>
                                </div>

                                <div>
                                    <label htmlFor="quantity">Select Quantity:</label>
                                    <select
                                        className="dropdown-dark"
                                        id="quantity"
                                        value={quantity}
                                        onChange={(e) => setQuantity(Number(e.target.value))}
                                    >
                                        {[...Array(selectedProduct.Quantity).keys()].map((q) => (
                                            <option key={q + 1} value={q + 1}>{q + 1}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="pagination-controls">
                                    <button onClick={handleAddToCart} className="btn">Send to Cart</button>
                                    <button onClick={closeModal} className="btn">Close</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {isCartOpen && (
                        <div className="modal-overlay">
                            <div className="modal">
                                <h2>Your Shopping Cart</h2>
                                {cart.length === 0 ? (
                                    <>
                                        <p>Your cart is empty.</p>
                                        <div className={'pagination-controls'}>
                                            <button className="btn-secondary" onClick={() => setIsCartOpen(false)}>Back to Browse</button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <table className="cart-table">
                                            <thead>
                                                <tr>
                                                    <th>Product</th>
                                                    <th>Quantity</th>
                                                    <th>Price</th>
                                                    <th>Total</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {cart.map((item, index) => (
                                                    <tr key={index}>
                                                        <td>{item.Product_Title} {item.Product_Name}</td>
                                                        <td>{item.quantity}</td>
                                                        <td>${item.Product_Price.toFixed(2)}</td>
                                                        <td>${(item.Product_Price * item.quantity).toFixed(2)}</td>
                                                        <td>
                                                            <button onClick={() => removeFromCart(index)} className="btn-red">
                                                                Remove
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        <p><strong>Total Cost:</strong> ${cart.reduce((acc, item) => acc + (item.Product_Price * item.quantity), 0).toFixed(2)}</p>
                                        <div className={'cart-controls'}>
                                            <button className="btn-secondary" onClick={placeOrder}>Place Order</button>
                                            <button className="btn" onClick={() => setIsCartOpen(false)}>Close</button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {showCategories && (
                        <div className="modal-overlay">
                            <div className="modal">
                                <h2>{parentCategory ? selectedCategory : "Select a Category:"}</h2>
                                <ul className={"categories-ul"}>
                                    {parentCategory &&
                                        <li>
                                            <button
                                                className="btn-red"
                                                onClick={() => handleCategoryChange(parentCategory)}>Back</button>
                                        </li>
                                    }
                                    {categories.map((category) => (
                                        <li key={category}>
                                            <button className="btn" onClick={() => handleCategoryChange(category)}>{category}</button>
                                        </li>
                                    ))}
                                </ul>
                                <button
                                    onClick={() => setShowCategories(false)}
                                    className="btn"
                                    style={{marginTop: 20}}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="links" style={{ marginBottom: 20 }}>
                        <Link to="/user-page">User Dashboard</Link>
                    </div>
                </div>
            ) : (
                <NoTokenPage />
            )}
        </>
    );
}
