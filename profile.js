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
});