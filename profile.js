// profile.js
document.addEventListener('DOMContentLoaded', () => {
    const profileContent = document.getElementById('profile-content');
    const token = localStorage.getItem('authToken');

    // If no token is found, redirect to login page
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    async function fetchProfile() {
        try {
            const response = await fetch('/api/users/me', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    // Include the JWT in the Authorization header
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                // If token is invalid or expired, clear it and redirect to login
                localStorage.removeItem('authToken');
                window.location.href = '/login.html';
                return;
            }

            const user = await response.json();
            profileContent.innerHTML = `
                <div class="form-group"><p><strong>Email:</strong> ${user.email}</p></div>
                <div class="form-group"><p><strong>User ID:</strong> ${user.id}</p></div>
            `;
        } catch (error) {
            profileContent.innerHTML = '<p>Could not load your profile. Please try again later.</p>';
        }
    }

    fetchProfile();

    // --- Order History Logic ---
    async function fetchOrderHistory() {
        const orderHistoryContainer = document.getElementById('order-history-container');
        try {
            const response = await fetch('/api/orders', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                throw new Error('Could not fetch order history.');
            }
            const orders = await response.json();
            displayOrderHistory(orders);
        } catch (error) {
            orderHistoryContainer.innerHTML = `<p class="form-message error" style="display: block;">${error.message}</p>`;
        }
    }

    function displayOrderHistory(orders) {
        const container = document.getElementById('order-history-container');
        container.innerHTML = ''; // Clear loading message

        if (orders.length === 0) {
            container.innerHTML = '<p>You have not placed any orders yet.</p>';
            return;
        }

        orders.forEach(order => {
            const orderCard = document.createElement('div');
            orderCard.className = 'order-card';

            const productsHtml = order.products.map(p => `
                <li class="order-product-item">
                    <img src="${p.imageUrl}" alt="${p.name}" class="order-product-image">
                    <span>${p.name} - $${p.price.toFixed(2)}</span>
                </li>
            `).join('');

            orderCard.innerHTML = `
                <div class="order-card-header">
                    <h4>Order #${order.orderId} - ${new Date(order.orderDate).toLocaleDateString()}</h4>
                    <strong>Total: $${order.total.toFixed(2)}</strong>
                </div>
                <ul class="order-product-list">${productsHtml}</ul>
            `;
            container.appendChild(orderCard);
        });
    }

    fetchOrderHistory();
});