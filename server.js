require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const { admin, db } = require('./firebase');  // Import Firebase Admin dan Firestore

const app = express();
app.use(bodyParser.json());

const SECRET_KEY = process.env.SECRET_KEY

// Register User
app.post('/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email,
      password: hashedPassword, // Simpan password hash ke Firebase Auth
    });

    // Optionally store user info in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      email,
      createdAt: new Date(),
    });

    res.status(201).json({ message: 'User registered successfully', userId: userRecord.uid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login User
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
  
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
  
    try {
      // Verifikasi login menggunakan Firebase Authentication
      const userRecord = await admin.auth().getUserByEmail(email);
  
      // Generate JWT untuk sesi aplikasi
      const token = jwt.sign({ uid: userRecord.uid }, SECRET_KEY, { expiresIn: '1h' });
  
      res.status(200).json({ token });
    } catch (error) {
      res.status(401).json({ message: 'Invalid credentials', error: error.message });
    }
  });
  

// JWT Middleware
function verifyToken(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ message: 'No token provided' });

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Failed to authenticate token' });

    req.userId = decoded.uid;
    next();
  });
}

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
