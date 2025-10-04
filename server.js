const { Sequelize, DataTypes } = require('sequelize');
const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');
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

// Middleware
app.use(express.json());

// Debug route to check file existence
app.get('/debug-files', (req, res) => {
    const files = [
        'public/landing.html',
        'public/index.html',
        'public/styles/common.css',
        'public/styles/landing.css'
    ];
    
    const results = files.map(file => {
        const filePath = path.join(__dirname, file);
        const exists = fs.existsSync(filePath);
        return { file, exists, fullPath: filePath };
    });
    
    res.json(results);
});

// Test route for CSS
app.get('/test-css', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>CSS Test</title>
        <link rel="stylesheet" href="/styles/landing.css">
      </head>
      <body>
        <h1>If this page has a gradient background, CSS is working!</h1>
      </body>
    </html>
  `);
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Service is healthy' });
});

// API Routes - MUST come before static middleware
app.get('/api/cities/count', async (req, res) => {
  try {
    const count = await City.count();
    res.json({ count });
  } catch (error) {
    console.error('Error getting city count:', error);
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/cities', async (req, res) => {
  try {
    const cities = await City.findAll();
    res.json(cities);
  } catch (error) {
    console.error('Error getting cities:', error);
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/refresh-data', async (req, res) => {
  try {
    const cities = await City.findAll();
    
    for (const city of cities) {
      await city.update({
        aqi: Math.floor(Math.random() * 300) + 50,
        pm25: Math.floor(Math.random() * 100) + 20,
        pm10: Math.floor(Math.random() * 150) + 30,
        no2: Math.floor(Math.random() * 80) + 10,
        so2: Math.floor(Math.random() * 60) + 5,
        co: Math.floor(Math.random() * 10) + 1,
        o3: Math.floor(Math.random() * 120) + 20
      });
    }
    
    res.json({ message: 'Data refreshed successfully' });
  } catch (error) {
    console.error('Error refreshing data:', error);
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    const user = await User.create({
      name,
      email,
      password: hashedPassword
    });
    
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Handle CSS files with enhanced logging
app.get('/styles/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'public', 'styles', filename);
    
    console.log(`CSS file requested: ${filename}`);
    console.log(`Full path: ${filePath}`);
    console.log(`File exists: ${fs.existsSync(filePath)}`);
    
    // Set proper headers
    res.setHeader('Content-Type', 'text/css');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error(`Error serving CSS file ${filename}:`, err);
            res.status(404).send(`CSS file not found: ${filename}`);
        } else {
            console.log(`Successfully served CSS file: ${filename}`);
        }
    });
});

// Serve landing.html for root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'landing.html'), (err) => {
        if (err) {
            console.error('Error serving landing.html:', err);
            res.status(500).send('Landing page not found');
        }
    });
});

// Static file middleware - MUST come after API routes
app.use(express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, filePath) => {
        // Set proper MIME types
        if (filePath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        } else if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
    },
    fallthrough: false // Don't continue to next middleware if file not found
}));

// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'), (err) => {
        if (err) {
            console.error('Error serving index.html:', err);
            res.status(500).send('Main page not found');
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).send('Something broke!');
});

// Models
const User = sequelize.define('User', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

const City = sequelize.define('City', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lat: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  lon: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  aqi: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  pm25: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  pm10: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  no2: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  so2: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  co: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  o3: {
    type: DataTypes.FLOAT,
    allowNull: false
  }
});

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Start server
async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Sync database
    await sequelize.sync({ force: false });
    console.log('✅ Database synchronized.');
    
    // Start server
    const PORT = process.env.PORT || 10000;
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
    
    // Set timeouts to prevent 502 errors
    server.keepAliveTimeout = 120000; // 120 seconds
    server.headersTimeout = 120000; // 120 seconds
    
    // Handle graceful shutdown
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
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.log('🔄 Retrying in 5 seconds...');
    setTimeout(startServer, 5000);
  }
}

// Start the server
startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
