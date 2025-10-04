const { Sequelize } = require('sequelize');
const express = require('express');
const path = require('path');
const fs = require('fs'); // Add this for file system operations
const app = express();

// Database configuration
const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
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
    })
  : new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
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
      }
    );

// Middleware to parse JSON bodies
app.use(express.json());

// Debug route to check file structure
app.get('/debug', (req, res) => {
  const publicPath = path.join(__dirname, 'public');
  const indexPath = path.join(publicPath, 'index.html');
  
  try {
    const files = fs.readdirSync(publicPath, { recursive: true });
    res.json({
      publicPath: publicPath,
      indexPath: indexPath,
      indexExists: fs.existsSync(indexPath),
      files: files
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      publicPath: publicPath
    });
  }
});

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Server is working!', 
    port: process.env.PORT,
    database: process.env.DB_NAME,
    environment: process.env.NODE_ENV
  });
});

// Auth routes (placeholders for now)
app.post('/api/auth/login', (req, res) => {
  res.json({ token: 'dummy-token', user: { name: 'Test User' } });
});

app.post('/api/auth/register', (req, res) => {
  res.json({ token: 'dummy-token', user: { name: 'New User' } });
});

// For any other route, serve the index.html
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  
  // Check if index.html exists
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('index.html not found');
  }
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
    
    const PORT = process.env.PORT || 3000;
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📁 Serving static files from: ${path.join(__dirname, 'public')}`);
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
