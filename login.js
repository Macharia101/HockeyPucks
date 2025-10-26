// login.js
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const messageDiv = document.getElementById('form-message');

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        messageDiv.textContent = '';
        messageDiv.className = 'form-message';

        const email = form.email.value;
        const password = form.password.value;

        try {
            const response = await fetch('/api/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const result = await response.json();

            if (response.ok) {
                messageDiv.textContent = 'Login successful! Redirecting to homepage...';
                messageDiv.classList.add('success');
                // Save the JWT to localStorage for future authenticated requests.
                localStorage.setItem('authToken', result.token);
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);
            } else {
                messageDiv.textContent = result.message || 'An error occurred.';
                messageDiv.classList.add('error');
            }
        } catch (error) {
            messageDiv.textContent = 'Could not connect to the server. Please try again later.';
            messageDiv.classList.add('error');
        }
    });
});