const express = require('express');
const cors = require('cors');
const path = require('path');
const { Sequelize } = require('sequelize');
const authRoutes = require('./routes/authRoutes');
const pollutionRoutes = require('./routes/pollutionRoutes');

const app = express();

// Trust proxy settings for Render
app.set('trust proxy', true);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Special route for root - serve landing page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'landing.html'));
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/pollution', pollutionRoutes);

// Add keep-alive endpoint after API routes but before health check
app.get('/keep-alive', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Service is awake' });
});

// Updated health check with database connection
app.get('/health', async (req, res) => {
  try {
    const db = require('./models');
    await db.sequelize.authenticate();
    res.status(200).json({ 
      status: 'OK', 
      message: 'Air Pollution Tracker API is running',
      database: 'Connected'
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'ERROR', 
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// Catch-all handler
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    res.status(404).json({ message: 'API endpoint not found' });
  } else {
    // For non-API routes, check if the user is logged in
    const authHeader = req.headers.authorization;
    if (!authHeader && !req.path.includes('landing.html')) {
      res.redirect('/');
    } else {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Function to create database if it doesn't exist
const createDatabaseIfNotExists = async () => {
  try {
    // Connect to PostgreSQL default database
    const sequelize = new Sequelize(
      'postgres',
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST,
        dialect: 'postgres',
        logging: false,
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: false
          }
        }
      }
    );

    await sequelize.authenticate();
    console.log('Connected to PostgreSQL server');

    // Check if database exists
    const [results] = await sequelize.query(
      `SELECT 1 FROM pg_database WHERE datname = '${process.env.DB_NAME}'`
    );

    if (results.length === 0) {
      // Create database if it doesn't exist
      await sequelize.query(`CREATE DATABASE "${process.env.DB_NAME}"`);
      console.log(`Database "${process.env.DB_NAME}" created successfully`);
    } else {
      console.log(`Database "${process.env.DB_NAME}" already exists`);
    }

    await sequelize.close();
    return true;
  } catch (error) {
    console.error('Error creating database:', error);
    return false;
  }
};

// Function to initialize database connection
const initializeDatabase = async () => {
  try {
    // First create the database if it doesn't exist
    await createDatabaseIfNotExists();

    // Now connect to the specific database
    const db = require('./models');
    await db.sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Run migrations
    const { execSync } = require('child_process');
    try {
      execSync('npx sequelize-cli db:migrate', { stdio: 'inherit' });
      console.log('Database migrations completed successfully.');
    } catch (error) {
      console.log('Migration failed or no migrations needed:', error.message);
    }
    
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
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
    
    // Add process monitoring at the end
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      process.exit(1);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.info('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        console.log('HTTP server closed');
      });
    });
  } else {
    console.log('Failed to initialize database. Server not started.');
    process.exit(1);
  }
});
