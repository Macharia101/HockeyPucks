// script.js
document.addEventListener('DOMContentLoaded', () => {
    const productList = document.getElementById('product-list');
    const cartIndicator = document.getElementById('cart-indicator');

    // Load cart from localStorage or initialize an empty array
    let cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];

    // Function to save the cart to localStorage
    function saveCart() {
        localStorage.setItem('shoppingCart', JSON.stringify(cart));
    }

    // Function to update the cart count in the header
    function updateCartIndicator() {
        cartIndicator.textContent = `Cart (${cart.length})`;
    }
    // Function to fetch products from our API
    async function fetchProducts() {
        try {
            // The fetch function makes a GET request to the specified URL
            const response = await fetch('/api/products');
            
            // Check if the request was successful
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Parse the JSON response from the server
            const products = await response.json();
            
            // Display the products on the page
            displayProducts(products);

        } catch (error) {
            console.error("Could not fetch products:", error);
            productList.innerHTML = '<p>Failed to load products. Please try again later.</p>';
        }
    }

    // Function to display products in the DOM
    function displayProducts(products) {
        // Clear the "Loading..." message
        productList.innerHTML = '';

        if (products.length === 0) {
            productList.innerHTML = '<p>No products available at the moment.</p>';
            return;
        }

        // Loop through each product and create a card for it
        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';

            productCard.innerHTML = `
                <img src="${product.imageUrl}" alt="${product.name}" class="product-image">
                <h3>${product.name}</h3>
                <p class="price">$${product.price.toFixed(2)}</p>
                <p>${product.description}</p>
                <button class="add-to-cart-btn" data-product-id="${product.id}">
                    Add to Cart
                </button>
            `;
            
            productList.appendChild(productCard);

            // --- Add to Cart Logic ---
            const addToCartButton = productCard.querySelector('.add-to-cart-btn');
            
            // Check if the product is already in the cart and disable the button
            if (cart.find(item => item.id === product.id)) {
                addToCartButton.textContent = 'Added to Cart';
                addToCartButton.disabled = true;
            }

            addToCartButton.addEventListener('click', () => {
                // Add the product to the cart array
                cart.push(product);
                saveCart();
                updateCartIndicator();

                // Update button state
                addToCartButton.textContent = 'Added to Cart';
                addToCartButton.disabled = true;
            });
        });
    }

    // Initial call to fetch and display products when the page loads
    fetchProducts();
    // Update cart indicator on page load
    updateCartIndicator();
});
