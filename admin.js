// admin.js
document.addEventListener('DOMContentLoaded', () => {
    const userTableBody = document.querySelector('#users-table tbody');
    const adminContent = document.getElementById('admin-content');
    const productTableBody = document.querySelector('#products-table tbody');
    const productForm = document.getElementById('product-form');
    const productFormTitle = document.getElementById('product-form-title');
    const productFormMessage = document.getElementById('product-form-message');
    const productIdInput = document.getElementById('product-id');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');

    const token = localStorage.getItem('authToken');

    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    // --- User Management ---
    async function fetchUsers() {
        try {
            const response = await fetch('/api/admin/users', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                // Handle non-admin users or other errors
                const errorResult = await response.json();
                throw new Error(errorResult.message || 'You do not have permission to view this page.');
            }

            const users = await response.json();
            displayUsers(users);

        } catch (error) {
            adminContent.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        }
    }

    function displayUsers(users) {
        userTableBody.innerHTML = ''; // Clear loading state
        users.forEach(user => {
            const row = userTableBody.insertRow();
            const actionsCell = row.insertCell();

            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.email}</td>
                <td>${user.isAdmin ? 'Admin' : 'Customer'}</td>
            `;

            // Create and add the delete button if the user is not the currently logged-in admin
            const decodedToken = parseJwt(token);
            if (decodedToken && user.id !== decodedToken.userId) {
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.className = 'remove-from-cart-btn'; // Re-using a nice red button style
                deleteButton.dataset.userId = user.id;
                actionsCell.appendChild(deleteButton);
            } else {
                actionsCell.textContent = 'N/A';
            }
        });
    }

    // Event delegation for delete buttons
    userTableBody.addEventListener('click', async (event) => {
        if (event.target.classList.contains('remove-from-cart-btn')) {
            const button = event.target;
            const userId = button.dataset.userId;

            if (confirm(`Are you sure you want to delete user ${userId}? This action cannot be undone.`)) {
                const response = await fetch(`/api/admin/users/${userId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    button.closest('tr').remove(); // Remove the row from the table on success
                } else {
                    const error = await response.json();
                    alert(`Error: ${error.message}`);
                }
            }
        }
    });

    // --- Product Management ---
    async function fetchProducts() {
        try {
            const response = await fetch('/api/products');
            if (!response.ok) throw new Error('Could not fetch products.');
            const products = await response.json();
            displayProducts(products);
        } catch (error) {
            productTableBody.innerHTML = `<tr><td colspan="4" style="color: red;">${error.message}</td></tr>`;
        }
    }

    function displayProducts(products) {
        productTableBody.innerHTML = '';
        products.forEach(product => {
            const row = productTableBody.insertRow();
            row.dataset.productId = product.id;
            row.innerHTML = `
                <td>${product.id}</td>
                <td>${product.name}</td>
                <td>$${product.price.toFixed(2)}</td>
                <td>
                    <button class="edit-product-btn">Edit</button>
                    <button class="delete-product-btn remove-from-cart-btn">Delete</button>
                </td>
            `;
        });
    }

    // Event delegation for product actions
    productTableBody.addEventListener('click', async (event) => {
        const target = event.target;
        const row = target.closest('tr');
        const productId = row.dataset.productId;

        // Handle Edit
        if (target.classList.contains('edit-product-btn')) {
            const name = row.cells[1].textContent;
            const price = parseFloat(row.cells[2].textContent.replace('$', ''));
            
            // Fetch full description as it's not in the table
            const res = await fetch(`/api/products/${productId}`);
            const product = await res.json();

            productFormTitle.textContent = `Edit Product (ID: ${productId})`;
            productIdInput.value = productId;
            document.getElementById('product-name').value = name;
            document.getElementById('product-price').value = price;
            document.getElementById('product-description').value = product.description;
            cancelEditBtn.style.display = 'inline-block';
            window.scrollTo(0, productForm.offsetTop);
        }

        // Handle Delete
        if (target.classList.contains('delete-product-btn')) {
            if (confirm(`Are you sure you want to delete product ${productId}?`)) {
                const response = await fetch(`/api/products/${productId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    row.remove();
                } else {
                    alert('Failed to delete product.');
                }
            }
        }
    });

    // Handle Product Form Submission (Add & Edit)
    productForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const id = productIdInput.value;
        const isEditing = !!id;

        // Use FormData to handle file uploads
        const formData = new FormData();
        formData.append('name', document.getElementById('product-name').value);
        formData.append('price', document.getElementById('product-price').value);
        formData.append('description', document.getElementById('product-description').value);
        
        const imageFile = document.getElementById('product-image').files[0];
        if (imageFile) {
            formData.append('image', imageFile);
        }

        const url = isEditing ? `/api/products/${id}` : '/api/products';
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData // Send FormData instead of JSON
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message);
            }

            // Success
            resetProductForm();
            await fetchProducts(); // Refresh the product list

        } catch (error) {
            productFormMessage.textContent = error.message;
            productFormMessage.className = 'form-message error';
        }
    });

    // Handle Cancel Edit Button
    cancelEditBtn.addEventListener('click', () => {
        resetProductForm();
    });

    function resetProductForm() {
        productForm.reset();
        productIdInput.value = '';
        productFormTitle.textContent = 'Add New Product';
        cancelEditBtn.style.display = 'none';
        productFormMessage.textContent = '';
        productFormMessage.className = 'form-message';
    }

    // --- Initial Fetches ---
    fetchUsers();
    fetchProducts();
});