// auth.js

/**
 * Decodes a JWT token to extract its payload without verifying the signature.
 * @param {string} token The JWT token.
 * @returns {object | null} The decoded payload object, or null if decoding fails.
 */
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error("Failed to parse JWT:", e);
        return null;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const navLinksContainer = document.querySelector('.nav-links');
    const token = localStorage.getItem('authToken');

    if (token && navLinksContainer) {
        const decodedToken = parseJwt(token);

        if (decodedToken && decodedToken.email) {
            // User is logged in, update the header
            const cartLink = navLinksContainer.querySelector('#cart-indicator').outerHTML;
            const adminLink = decodedToken.isAdmin ? '<a href="/admin.html" class="cart-link">Admin</a>' : '';

            navLinksContainer.innerHTML = `
                ${adminLink}<a href="/profile.html" class="cart-link">My Profile</a>
                <a href="#" id="logout-btn" class="cart-link">Logout</a>
                ${cartLink}
            `;

            // Add event listener for the logout button
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (event) => {
                    event.preventDefault();
                    localStorage.removeItem('authToken');
                    window.location.href = '/login.html'; // Redirect to login page
                });
            }
        }
    }
});