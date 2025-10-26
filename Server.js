// server.js

// Import the Express library to create and manage the server
const express = require('express');
const bcrypt = require('bcrypt');
const path = require('path');

// Create an instance of an Express application
const app = express();

// Define the port the server will run on. Use the environment's port if available, otherwise default to 3000.
const PORT = process.env.PORT || 3000;

// Middleware to parse incoming JSON requests.
// This allows us to read the body of POST/PUT requests.
app.use(express.json());

// Serve static files (index.html, script.js, style.css, etc.) from the project root
// so that visiting / returns index.html instead of "Cannot GET /".
app.use(express.static(path.join(__dirname)));

// Ensure the root route explicitly serves index.html (helpful if index fallback is needed)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Middleware to serve static files (HTML, CSS, JS) from the current directory
app.use(express.static('.'));

// --- In-Memory Database ---
// For this example, we'll use a simple array to store our products.
// In a real application, you would use a database like PostgreSQL, MongoDB, or MySQL.
let products = [
    { id: 1, name: 'Laptop Pro', price: 1200, description: 'A high-performance laptop for professionals.' },
    { id: 2, name: 'Wireless Mouse', price: 25, description: 'Ergonomic wireless mouse with long battery life.' },
    { id: 3, name: 'Mechanical Keyboard', price: 75, description: 'A tactile and responsive keyboard for typing and gaming.' }
];
let currentId = 4;

// In-memory store for users. In a real app, this would be a database table.
let users = [];
let currentUserId = 1;

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

// POST /api/products - Create a new product
app.post('/api/products', (req, res) => {
    const { name, price, description } = req.body;

    // Basic validation
    if (!name || !price) {
        return res.status(400).json({ message: 'Product name and price are required.' });
    }

    const newProduct = {
        id: currentId++,
        name: name,
        price: parseFloat(price),
        description: description || '' // Optional description
    };

    products.push(newProduct);

    // Return a 201 Created status and the new product object
    res.status(201).json(newProduct);
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
            password: hashedPassword
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
            // In a real app, you would generate a JWT (JSON Web Token) here
            res.json({ message: 'Login successful!' });
        } else {
            res.status(401).json({ message: 'Invalid email or password.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error during login.' });
    }
});

// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
