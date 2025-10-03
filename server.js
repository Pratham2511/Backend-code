const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./models'); // This will now work correctly
const authRoutes = require('./routes/authRoutes');
const pollutionRoutes = require('./routes/pollutionRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/pollution', pollutionRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Air Pollution Tracker API is running' });
});

// Catch-all handler to serve the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Function to initialize database
const initializeDatabase = async () => {
  try {
    await db.sequelize.authenticate();
    console.log('Database connection established successfully.');
    return true;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    return false;
  }
};

// Start server
const PORT = process.env.PORT || 10000;

// Initialize database and start server
initializeDatabase().then(success => {
  if (success) {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } else {
    console.log('Failed to initialize database. Server not started.');
    process.exit(1);
  }
});