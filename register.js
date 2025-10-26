// register.js
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registration-form');
    const messageDiv = document.getElementById('form-message');

    form.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent the default form submission

        // Clear previous messages
        messageDiv.textContent = '';
        messageDiv.className = 'form-message';

        const email = form.email.value;
        const password = form.password.value;

        try {
            const response = await fetch('/api/users/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const result = await response.json();

            if (response.ok) {
                // Registration successful
                messageDiv.textContent = 'Registration successful! Redirecting to homepage...';
                messageDiv.classList.add('success');
                setTimeout(() => {
                    window.location.href = '/'; // Redirect to home page
                }, 2000);
            } else {
                // Registration failed
                messageDiv.textContent = result.message || 'An error occurred.';
                messageDiv.classList.add('error');
            }
        } catch (error) {
            messageDiv.textContent = 'Could not connect to the server. Please try again later.';
            messageDiv.classList.add('error');
        }
    });
});