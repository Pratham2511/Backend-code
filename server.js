// server.js
const { Sequelize } = require('sequelize');
const express = require('express');
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Database configuration
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Test route
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Server is working!', 
    port: process.env.PORT,
    database: process.env.DB_NAME,
    environment: process.env.NODE_ENV
  });
});

// Root route
app.get('/', (req, res) => {
  res.send('Air Pollution Tracker is running!');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    await sequelize.sync({ force: false });
    console.log('✅ Database synchronized.');
    
    const PORT = process.env.PORT || 3000; // Use Render's PORT or default to 3000
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('Process terminated');
        sequelize.close().then(() => {
          console.log('Database connection closed');
          process.exit(0);
        });
      });
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.log('🔄 Retrying in 5 seconds...');
    setTimeout(startServer, 5000);
  }
}

startServer();
