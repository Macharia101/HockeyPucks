// checkout.js
document.addEventListener('DOMContentLoaded', () => {
    // --- Get your Stripe publishable key ---
    // In a real app, you might fetch this from a config endpoint.
    const stripe = Stripe('pk_test_...'); // <-- ADD YOUR STRIPE PUBLISHABLE KEY HERE

    const summaryItems = document.getElementById('summary-items');
    const summaryTotal = document.getElementById('summary-total');
    const paymentForm = document.getElementById('payment-form');
    const placeOrderBtn = document.getElementById('place-order-btn');
    const formMessage = document.getElementById('form-message');

    const token = localStorage.getItem('authToken');
    const cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];

    if (!token) {
        window.location.href = '/login.html';
        return;
    }
    if (cart.length === 0) {
        window.location.href = '/cart.html';
        return;
    }

    let elements;
    let clientSecret;

    // --- Step 1: Create Payment Intent and Mount Card Element ---
    initialize();

    async function initialize() {
        // 1a: Create a Payment Intent on the server
        const response = await fetch("/api/create-payment-intent", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ cart }),
        });
        const { clientSecret: secret } = await response.json();
        clientSecret = secret;

        // 1b: Create and mount the Stripe Card Element
        elements = stripe.elements({ clientSecret });
        const cardElement = elements.create("card");
        cardElement.mount("#card-element");

        // 1c: Display the order summary
        displayOrderSummary();
    }

    // --- Step 2: Handle Form Submission ---
    paymentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        setLoading(true);

        // 2a: Confirm the card payment with Stripe
        const { error } = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: elements.getElement('card'),
            },
        });

        if (error) {
            showMessage(error.message);
            setLoading(false);
            return;
        }

        // 2b: Payment succeeded. Now, create the order in our own system.
        const orderResponse = await fetch('/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ cart })
        });

        if (orderResponse.ok) {
            localStorage.removeItem('shoppingCart'); // Clear cart
            showMessage('Payment successful! Redirecting to your profile...');
            setTimeout(() => { window.location.href = '/profile.html'; }, 2000);
        } else {
            showMessage('Payment succeeded, but failed to save the order. Please contact support.');
            setLoading(false);
        }
    });

    // --- UI Helper Functions ---
    function displayOrderSummary() {
        const total = cart.reduce((sum, item) => sum + item.price, 0);
        summaryItems.innerHTML = cart.map(item => `<p>${item.name} - $${item.price.toFixed(2)}</p>`).join('');
        summaryTotal.textContent = total.toFixed(2);
    }

    function showMessage(message) {
        formMessage.textContent = message;
        formMessage.className = message.includes('successful') ? 'form-message success' : 'form-message error';
    }

    function setLoading(isLoading) {
        placeOrderBtn.disabled = true;
        placeOrderBtn.textContent = isLoading ? 'Processing...' : 'Pay Now';
    }
});