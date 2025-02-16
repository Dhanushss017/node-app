const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(
  "mongodb+srv://dhanushss017:3hsMmlrZOil82RNd@cluster0.uqey1.mongodb.net/sample_mflix?retryWrites=true&w=majority&appName=Cluster0",
  { useNewUrlParser: true, useUnifiedTopology: true }
);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// User schema and model
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  profession: { type: String, required: true },
  password: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);
// Signup route
app.post('/signup', async (req, res) => {
  const { username, email, phone, profession, password } = req.body;

  // Check if all fields are provided
  if (!username || !email || !phone || !profession || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Check if email, username, or phone already exist in the database
    const existingUserByEmail = await User.findOne({ email });
    const existingUserByUsername = await User.findOne({ username });
    const existingUserByPhone = await User.findOne({ phone });

    if (existingUserByEmail) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    if (existingUserByUsername) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    if (existingUserByPhone) {
      return res.status(400).json({ error: 'Phone number already exists' });
    }

    // Hash the password and create a new user
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      email,
      phone,
      profession,
      password: hashedPassword
    });
    
    await newUser.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Error creating user' });
  }
});


// Login route
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  if (!user) {
    return res.status(400).json({ error: 'Invalid credentials' });
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    return res.status(400).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user._id }, 'your_secret_key', { expiresIn: '1h' });
  
  res.status(200).json({ message: 'Login successful', token });
});


app.get('/users', async (req, res) => {
  const { page = 1, limit = 15 } = req.query;

  try {
    const users = await User.find()
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await User.countDocuments();

    res.json({
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      users,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
const movieSchema = new mongoose.Schema({}, { collection: 'movies' });
const Movie = mongoose.model('Movie', movieSchema);


app.get('/movies', async (req, res) => {
  try {
    const movies = await Movie.find().limit(10);
    res.json(movies);
  } catch (err) {
    res.status(500).send(err);
  }
});
app.get('/movies/:id', async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    res.json(movie);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.patch('/users/:id', async (req, res) => {
  const { username, password } = req.body;
  const { id } = req.params;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (username) {
      user.username = username;
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
    }

    await user.save();
    res.json({ message: 'User updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start the server
app.listen(3001, () => {
  console.log('Server is running on http://localhost:3001');
});
