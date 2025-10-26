// cart.js
document.addEventListener('DOMContentLoaded', () => {
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartSummary = document.getElementById('cart-summary');
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

    // Function to remove an item from the cart
    function removeFromCart(productId) {
        // Find the index of the first item with the given product ID
        const itemIndex = cart.findIndex(item => item.id === productId);
        
        if (itemIndex > -1) {
            // Remove the item from the cart array
            cart.splice(itemIndex, 1);
            saveCart();
            displayCartItems(); // Re-render the cart
            updateCartIndicator();
        }
    }

    // Function to display cart items
    function displayCartItems() {
        // Clear previous content
        cartItemsContainer.innerHTML = '';
        cartSummary.innerHTML = '';

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p>Your cart is empty. <a href="/">Continue shopping!</a></p>';
            return;
        }

        let total = 0;

        cart.forEach(item => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <img src="${item.imageUrl}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-details">
                    <h3>${item.name}</h3>
                    <p class="price">$${item.price.toFixed(2)}</p>
                </div>
                <button class="remove-from-cart-btn" data-product-id="${item.id}">Remove</button>
            `;
            cartItemsContainer.appendChild(cartItem);
            total += item.price;
        });

        // Add event listeners to the new "Remove" buttons
        document.querySelectorAll('.remove-from-cart-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const productId = parseInt(event.target.getAttribute('data-product-id'), 10);
                removeFromCart(productId);
            });
        });

        // Display the summary
        cartSummary.innerHTML = `
            <h3>Total: $<span id="cart-total">${total.toFixed(2)}</span></h3>
            <button id="checkout-btn" class="add-to-cart-btn">Proceed to Checkout</button>
        `;

        // Add event listener for the checkout button
        const checkoutBtn = document.getElementById('checkout-btn');
        checkoutBtn.addEventListener('click', () => {
            const token = localStorage.getItem('authToken');
            if (token) {
                window.location.href = '/checkout.html';
            } else {
                // Redirect to login, but also save the intended destination
                alert('Please log in to proceed to checkout.');
                window.location.href = '/login.html';
            }
        });
    }

    // Initial setup on page load
    displayCartItems();
    updateCartIndicator();
});