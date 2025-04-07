import "../App.css";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

export default function ProductListingsPage() {
    const [userData, setUserData] = useState(null);
    const [products, setProducts] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [searchProductName, setSearchProductName] = useState("");  // Now search by Product Name
    const [searchListingID, setSearchListingID] = useState("");
    const [sortOption, setSortOption] = useState("none");
    const [quantity, setQuantity] = useState(1);
    const productsPerPage = 5;
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);



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

        fetch("http://127.0.0.1:5000/api/products")
            .then((res) => res.json())
            .then((data) => setProducts(data))
            .catch((err) => console.error("Product fetch error:", err));
    }, []);

    const parsePrice = (price) => parseFloat(price.replace(/[^0-9.-]+/g, ""));

    const sortProducts = (products) => {
        if (sortOption === "priceAsc") {
            return products.sort((a, b) => parsePrice(a.Product_Price) - parsePrice(b.Product_Price));
        } else if (sortOption === "priceDesc") {
            return products.sort((a, b) => parsePrice(b.Product_Price) - parsePrice(a.Product_Price));
        }
        return products;
    };
    const removeFromCart = (indexToRemove) => {
        setCart(cart.filter((_, index) => index !== indexToRemove));
    };
    const placeOrder = async () => {
    try {
        const response = await fetch("http://127.0.0.1:5000/api/place-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cart })
        });

        if (response.ok) {
            alert("Order placed successfully!");
            setCart([]);
            setIsCartOpen(false);
            // Refresh product listings
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


    const filteredProducts = products.filter((product) => {
    const matchesName = product.Product_Name.toLowerCase().includes(searchProductName.toLowerCase());
    const matchesID = product.Listing_ID.toString().includes(searchListingID);

    const price = parsePrice(product.Product_Price);
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
    };

    const closeModal = () => {
        setSelectedProduct(null);
    };
    const handleAddToCart = () => {
        alert(`Added ${quantity} ${selectedProduct.Product_Name} with id of ${selectedProduct.Listing_ID} to cart!`);
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

        setCart(updatedCart);
        closeModal();
    };


    return (
        <>
            {userData ? (
                <div className="wrapper">
                    <div style={{ position: 'absolute', top: 10, right: 10 }}>
                        <button onClick={() => setIsCartOpen(true)} className="btn">
                            Shopping Cart ({cart.length})
                        </button>
                    </div>

                    <p className="centered">
                        Welcome, {userData.email}! Here are all the products available for purchase.
                    </p>

                    <div className="search-bar-container">
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
                                        <td>{product.Product_Name}</td>
                                        <td>{product.Product_Price}</td>
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
                                <p><strong>Price:</strong> {selectedProduct.Product_Price}</p>
                                <p><strong>Status:</strong> {selectedProduct.Status ? "Available" : "Out of Stock"}</p>

                                <div>
                                    <label htmlFor="quantity" >Select Quantity:</label>
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

                                <button onClick={handleAddToCart} className="btn">Send to Cart</button>
                                <button onClick={closeModal} className="btn">Close</button>
                            </div>
                        </div>
                    )}
                    {isCartOpen && (
                        <div className="modal-overlay">
                            <div className="modal">
                                <h2>Your Shopping Cart</h2>
                                {cart.length === 0 ? (
                                    <p>Your cart is empty.</p>
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
                                                        <td>{item.Product_Name}</td>
                                                        <td>{item.quantity}</td>
                                                        <td>{item.Product_Price}</td>
                                                        <td>${(parsePrice(item.Product_Price) * item.quantity).toFixed(2)}</td>
                                                        <td>
                                                            <button onClick={() => removeFromCart(index)} className="btn">
                                                                Remove
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        <p><strong>Total Cost:</strong> ${cart.reduce((acc, item) => acc + (parsePrice(item.Product_Price) * item.quantity), 0).toFixed(2)}</p>
                                        <button className="btn" onClick={placeOrder}>Place Order</button>
                                    </>
                                )}
                                <button className="btn" onClick={() => setIsCartOpen(false)}>Close</button>
                            </div>
                        </div>
                    )}


                    <div className="links" style={{ marginBottom: 20 }}>
                        <Link to="/user-page">User Dashboard</Link>
                    </div>
                </div>
            ) : (
                <div className="wrapper">
                    <h1 className="header">Access Denied</h1>
                    <p className="centered">Please log in to view this page.</p>
                    <div className="links">
                        <Link to="/user-sign-in">Log In</Link>
                    </div>
                </div>
            )}
        </>
    );
}
