const { Sequelize, DataTypes } = require('sequelize');
const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
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

// Routes
app.get('/api/cities/count', async (req, res) => {
  try {
    const count = await City.count();
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/cities', async (req, res) => {
  try {
    const cities = await City.findAll();
    res.json(cities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/refresh-data', async (req, res) => {
  try {
    // Get all cities
    const cities = await City.findAll();
    
    // Update pollution data with random values for demo
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
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword
    });
    
    // Generate JWT token
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
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT token
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
    res.status(500).json({ message: error.message });
  }
});

// Serve landing.html for root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'landing.html'));
});

// Static file middleware
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start server
async function startServer() {
  try {
    // Sync database
    await sequelize.sync({ force: false });
    console.log('✅ Database synchronized.');
    
    // Start server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.log('🔄 Retrying in 5 seconds...');
    setTimeout(startServer, 5000);
  }
}

startServer();
