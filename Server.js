// server.js

// Import the Express library to create and manage the server
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create an instance of an Express application
const app = express();

// --- Configuration ---
// In a production app, this secret should be a long, complex string stored in an environment variable.
const JWT_SECRET = 'your-super-secret-and-long-key-for-jwt';

// Get your secret key from the Stripe dashboard.
// In a real app, use an environment variable for this.
const stripe = require('stripe')('sk_test_...'); // <-- ADD YOUR STRIPE SECRET KEY HERE

// Define the port the server will run on. Use the environment's port if available, otherwise default to 3000.
const PORT = process.env.PORT || 3000;

// Middleware to parse incoming JSON requests.
// This allows us to read the body of POST/PUT requests.
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Middleware to serve static files (HTML, CSS, JS) from the current directory
// This allows the server to find and send index.html, style.css, script.js, etc.
app.use(express.static('.'));
// Serve uploaded images statically
app.use('/uploads', express.static('uploads'));

// --- Multer Configuration for File Uploads ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        // Create a unique filename to avoid overwrites
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// --- In-Memory Database ---
// For this example, we'll use a simple array to store our products.
// In a real application, you would use a database like PostgreSQL, MongoDB, or MySQL.
let products = [
    { id: 1, name: 'Laptop Pro', price: 1200, description: 'A high-performance laptop for professionals.', imageUrl: '/uploads/placeholder.png' },
    { id: 2, name: 'Wireless Mouse', price: 25, description: 'Ergonomic wireless mouse with long battery life.', imageUrl: '/uploads/placeholder.png' },
    { id: 3, name: 'Mechanical Keyboard', price: 75, description: 'A tactile and responsive keyboard for typing and gaming.', imageUrl: '/uploads/placeholder.png' }
];
let currentId = 4;

// In-memory store for users. In a real app, this would be a database table.
let users = [];
let currentUserId = 0;

// In-memory store for orders.
let orders = [];

// --- Product API Routes ---
// GET /api/products - Retrieve all products
app.get('/api/products', (req, res) => {
    res.json(products);
});

// GET /api/products/:id - Retrieve a single product by its ID
app.get('/api/products/:id', (req, res) => {
    const productId = parseInt(req.params.id, 10);
    const product = products.find(p => p.id === productId);

    if (product) {
        res.json(product);
    } else {
        // If the product isn't found, return a 404 Not Found error
        res.status(404).json({ message: 'Product not found' });
    }
});

// POST /api/products - Create a new product (Admin Only, handles image upload)
app.post('/api/products', [authenticateToken, adminOnly, upload.single('image')], (req, res) => {
    const { name, price, description } = req.body;

    // Basic validation
    if (!name || !price) {
        return res.status(400).json({ message: 'Product name and price are required.' });
    }

    // Get the path to the uploaded image, or a default if none is provided
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : '/uploads/placeholder.png';

    const newProduct = {
        id: currentId++,
        name: name,
        price: parseFloat(price),
        description: description || '', // Optional description
        imageUrl: imageUrl
    };

    products.push(newProduct);

    // Return a 201 Created status and the new product object
    res.status(201).json(newProduct);
});

// PUT /api/products/:id - Update a product (Admin Only, handles image upload)
app.put('/api/products/:id', [authenticateToken, adminOnly, upload.single('image')], (req, res) => {
    const productId = parseInt(req.params.id, 10);
    const productIndex = products.findIndex(p => p.id === productId);

    if (productIndex > -1) {
        const productToUpdate = products[productIndex];
        const { name, price, description } = req.body;
        const updatedProduct = { ...productToUpdate };

        if (name) updatedProduct.name = name;
        if (price) updatedProduct.price = parseFloat(price);
        if (description !== undefined) updatedProduct.description = description;

        // If a new image is uploaded, update the imageUrl and delete the old one
        if (req.file) {
            // Delete old image if it's not the placeholder
            if (productToUpdate.imageUrl && productToUpdate.imageUrl !== '/uploads/placeholder.png') {
                fs.unlink(path.join(__dirname, productToUpdate.imageUrl), err => {
                    if (err) console.error("Error deleting old image:", err);
                });
            }
            updatedProduct.imageUrl = `/uploads/${req.file.filename}`;
        }

        products[productIndex] = updatedProduct;
        res.json(updatedProduct);
    } else {
        res.status(404).json({ message: 'Product not found.' });
    }
});

// DELETE /api/products/:id - Delete a product (Admin Only)
app.delete('/api/products/:id', [authenticateToken, adminOnly], (req, res) => {
    const productId = parseInt(req.params.id, 10);
    const productIndex = products.findIndex(p => p.id === productId);

    if (productIndex > -1) {
        const productToDelete = products[productIndex];
        products.splice(productIndex, 1);

        // Delete the associated image file, but not the placeholder
        if (productToDelete.imageUrl && productToDelete.imageUrl !== '/uploads/placeholder.png') {
            fs.unlink(path.join(__dirname, productToDelete.imageUrl), (err) => {
                if (err) console.error("Error deleting product image:", err);
            });
        }
        res.status(204).send();
    } else {
        res.status(404).json({ message: 'Product not found.' });
    }
});

// --- User & Authentication API Routes ---

// POST /api/users/register - Register a new user
app.post('/api/users/register', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Basic validation
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        // Check if user already exists
        if (users.find(user => user.email === email)) {
            return res.status(400).json({ message: 'User with this email already exists.' });
        }

        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const newUser = {
            id: currentUserId++,
            email: email,
            password: hashedPassword,
            // For demonstration, the first user to register is an admin.
            isAdmin: users.length === 0
        };

        users.push(newUser);
        console.log('Users:', users); // For debugging, view users in the console

        // Don't send the password back, even the hashed one.
        res.status(201).json({ id: newUser.id, email: newUser.email });

    } catch (error) {
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

// POST /api/users/login - Log in a user
app.post('/api/users/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = users.find(u => u.email === email);

        // Check if user exists and if password is correct
        if (user && await bcrypt.compare(password, user.password)) {
            // User is authenticated. Create a JWT.
            const payload = {
                userId: user.id,
                email: user.email,
                isAdmin: user.isAdmin // Include admin status in the token
            };

            // Sign the token with the secret key, and set it to expire in 1 hour.
            const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
            res.json({ message: 'Login successful!', token: token });
        } else {
            res.status(401).json({ message: 'Invalid email or password.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error during login.' });
    }
});

// --- Authentication Middleware ---
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

    if (token == null) {
        return res.status(401).json({ message: 'Authentication token required.' });
    }

    jwt.verify(token, JWT_SECRET, (err, userPayload) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token.' });
        }
        // Add the user payload to the request object for use in other routes
        req.user = userPayload;
        next();
    });
}

// --- Admin Middleware ---
function adminOnly(req, res, next) {
    if (req.user && req.user.isAdmin) {
        next(); // User is an admin, proceed
    } else {
        res.status(403).json({ message: 'Forbidden: Admin access required.' });
    }
}

// GET /api/users/me - Get the current logged-in user's profile
// This is a protected route that uses our authentication middleware.
app.get('/api/users/me', authenticateToken, (req, res) => {
    // The user's info (from the JWT payload) is available on req.user
    res.json({
        id: req.user.userId,
        email: req.user.email
    });
});

// GET /api/admin/users - Get a list of all users (Admin Only)
app.get('/api/admin/users', [authenticateToken, adminOnly], (req, res) => {
    // Return a "sanitized" list of users (without passwords)
    const sanitizedUsers = users.map(u => ({
        id: u.id,
        email: u.email,
        isAdmin: u.isAdmin
    }));
    res.json(sanitizedUsers);
});

// DELETE /api/admin/users/:id - Delete a user (Admin Only)
app.delete('/api/admin/users/:id', [authenticateToken, adminOnly], (req, res) => {
    const userIdToDelete = parseInt(req.params.id, 10);

    // Prevent an admin from deleting themselves
    if (userIdToDelete === req.user.userId) {
        return res.status(400).json({ message: 'Admins cannot delete their own account.' });
    }

    const userIndex = users.findIndex(u => u.id === userIdToDelete);

    if (userIndex > -1) {
        users.splice(userIndex, 1);
        // Respond with 204 No Content, which is standard for a successful DELETE.
        res.status(204).send();
    } else {
        res.status(404).json({ message: 'User not found.' });
    }
});

// --- Order API Routes ---

// GET /api/orders - Get order history for the logged-in user (Protected)
app.get('/api/orders', authenticateToken, (req, res) => {
    const userOrders = orders.filter(order => order.userId === req.user.userId);
    res.json(userOrders.reverse()); // Return newest orders first
});

// POST /api/orders - Create a new order (Protected)
app.post('/api/orders', authenticateToken, (req, res) => {
    const { cart } = req.body;

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
        return res.status(400).json({ message: 'Cart is empty or invalid.' });
    }

    // In a real app, you would verify product IDs and recalculate the total on the server
    // to prevent price manipulation from the client.
    const total = cart.reduce((sum, item) => sum + item.price, 0);

    const newOrder = {
        orderId: orders.length + 1,
        userId: req.user.userId,
        products: cart,
        total: total,
        orderDate: new Date()
    };

    orders.push(newOrder);
    console.log('New Order:', newOrder); // For debugging

    res.status(201).json({ message: 'Order created successfully', order: newOrder });
});

// --- Payment API Route ---

// POST /api/create-payment-intent - Creates a payment intent for Stripe
app.post('/api/create-payment-intent', authenticateToken, (req, res) => {
    const { cart } = req.body;

    // --- Server-side total calculation for security ---
    // In a real app, you'd fetch product prices from your database.
    let total = 0;
    try {
        total = cart.reduce((sum, cartItem) => {
            const product = products.find(p => p.id === cartItem.id);
            if (!product) throw new Error(`Product with ID ${cartItem.id} not found.`);
            return sum + product.price;
        }, 0);
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }

    // Stripe requires the amount in the smallest currency unit (e.g., cents)
    const amountInCents = Math.round(total * 100);

    // Create a PaymentIntent with the order amount and currency
    stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'usd',
    }).then(paymentIntent => {
        res.send({ clientSecret: paymentIntent.client_secret });
    }).catch(e => {
        res.status(500).json({ message: e.message });
    });
});


// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
