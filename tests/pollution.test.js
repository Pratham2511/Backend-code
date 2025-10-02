const request = require('supertest');
const app = require('../server');
const { User, PollutionReading } = require('../models');
const jwt = require('jsonwebtoken');

describe('Pollution Endpoints', () => {
  let token;
  let userId;
  let adminToken;
  let adminUserId;

  beforeAll(async () => {
    // Create test users
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });

    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      isAdmin: true
    });

    userId = user.id;
    adminUserId = adminUser.id;

    // Get tokens
    token = jwt.sign({ id: userId }, process.env.JWT_SECRET);
    adminToken = jwt.sign({ id: adminUserId }, process.env.JWT_SECRET);

    // Create test pollution readings
    await PollutionReading.bulkCreate([
      {
        city: 'Delhi',
        country: 'India',
        lat: 28.7041,
        lng: 77.1025,
        aqi: 156,
        pm25: 65.4,
        pm10: 110.2,
        no2: 42.1,
        o3: 78.3,
        so2: 18.7,
        co: 1.2,
        userId: userId
      },
      {
        city: 'Mumbai',
        country: 'India',
        lat: 19.0760,
        lng: 72.8777,
        aqi: 89,
        pm25: 35.2,
        pm10: 65.8,
        no2: 28.5,
        o3: 45.2,
        so2: 12.4,
        co: 0.8,
        userId: adminUserId
      }
    ]);
  });

  afterAll(async () => {
    // Clean up test data
    await User.destroy({ where: { id: [userId, adminUserId] } });
    await PollutionReading.destroy({ where: { userId: [userId, adminUserId] } });
  });

  describe('GET /api/pollution/latest', () => {
    it('should return latest pollution reading for a city', async () => {
      const res = await request(app)
        .get('/api/pollution/latest?city=Delhi');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('latestReading');
      expect(res.body.latestReading.city).toEqual('Delhi');
    });

    it('should return 404 for city with no data', async () => {
      const res = await request(app)
        .get('/api/pollution/latest?city=NonExistentCity');
      
      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('message', 'No pollution data found for this city');
    });

    it('should return 400 for missing city parameter', async () => {
      const res = await request(app)
        .get('/api/pollution/latest');
      
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message', 'City parameter is required');
    });
  });

  describe('GET /api/pollution', () => {
    it('should return paginated pollution readings', async () => {
      const res = await request(app)
        .get('/api/pollution');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('pollutionReadings');
      expect(res.body).toHaveProperty('totalPages');
      expect(res.body).toHaveProperty('currentPage');
      expect(res.body).toHaveProperty('totalItems');
      expect(Array.isArray(res.body.pollutionReadings)).toBe(true);
    });

    it('should filter by city', async () => {
      const res = await request(app)
        .get('/api/pollution?city=Delhi');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.pollutionReadings.every(reading => reading.city === 'Delhi')).toBe(true);
    });

    it('should filter by date range', async () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const res = await request(app)
        .get(`/api/pollution?startDate=${yesterday.toISOString()}&endDate=${today.toISOString()}`);
      
      expect(res.statusCode).toEqual(200);
    });
  });

  describe('POST /api/pollution', () => {
    it('should create a new pollution reading', async () => {
      const newReading = {
        city: 'Kolkata',
        country: 'India',
        lat: 22.5726,
        lng: 88.3639,
        aqi: 142,
        pm25: 58.7,
        pm10: 95.3,
        no2: 38.9,
        o3: 67.4,
        so2: 15.6,
        co: 1.0
      };

      const res = await request(app)
        .post('/api/pollution')
        .set('Authorization', `Bearer ${token}`)
        .send(newReading);
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('reading');
      expect(res.body.reading.city).toEqual('Kolkata');
      
      // Clean up
      await PollutionReading.destroy({ where: { id: res.body.reading.id } });
    });

    it('should return 401 without token', async () => {
      const newReading = {
        city: 'Kolkata',
        country: 'India',
        lat: 22.5726,
        lng: 88.3639,
        aqi: 142,
        pm25: 58.7,
        pm10: 95.3,
        no2: 38.9,
        o3: 67.4,
        so2: 15.6,
        co: 1.0
      };

      const res = await request(app)
        .post('/api/pollution')
        .send(newReading);
      
      expect(res.statusCode).toEqual(401);
    });

    it('should return validation error for invalid input', async () => {
      const invalidReading = {
        city: '',
        lat: 'invalid',
        aqi: -1
      };

      const res = await request(app)
        .post('/api/pollution')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidReading);
      
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('errors');
    });
  });

  describe('GET /api/pollution/:id', () => {
    it('should return pollution reading by ID', async () => {
      // First, get all readings to find an ID
      const listRes = await request(app)
        .get('/api/pollution');
      
      const readingId = listRes.body.pollutionReadings[0].id;
      
      const res = await request(app)
        .get(`/api/pollution/${readingId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('reading');
      expect(res.body.reading.id).toEqual(readingId);
    });

    it('should return 404 for non-existent ID', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174999';
      
      const res = await request(app)
        .get(`/api/pollution/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('message', 'Pollution reading not found');
    });
  });

  describe('PUT /api/pollution/:id', () => {
    it('should update pollution reading as owner', async () => {
      // First, get all readings to find an ID owned by the user
      const listRes = await request(app)
        .get('/api/pollution');
      
      const reading = listRes.body.pollutionReadings.find(r => r.userId === userId);
      const readingId = reading.id;
      
      const updateData = {
        aqi: 200,
        pm25: 80.5
      };

      const res = await request(app)
        .put(`/api/pollution/${readingId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('reading');
      expect(res.body.reading.aqi).toEqual(200);
      expect(res.body.reading.pm25).toEqual(80.5);
    });

    it('should update pollution reading as admin', async () => {
      // First, get all readings to find an ID not owned by the user
      const listRes = await request(app)
        .get('/api/pollution');
      
      const reading = listRes.body.pollutionReadings.find(r => r.userId !== userId);
      const readingId = reading.id;
      
      const updateData = {
        aqi: 180,
        pm25: 70.5
      };

      const res = await request(app)
        .put(`/api/pollution/${readingId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('reading');
      expect(res.body.reading.aqi).toEqual(180);
      expect(res.body.reading.pm25).toEqual(70.5);
    });

    it('should return 403 when updating reading not owned by user', async () => {
      // First, get all readings to find an ID not owned by the user
      const listRes = await request(app)
        .get('/api/pollution');
      
      const reading = listRes.body.pollutionReadings.find(r => r.userId !== userId);
      const readingId = reading.id;
      
      const updateData = {
        aqi: 180,
        pm25: 70.5
      };

      const res = await request(app)
        .put(`/api/pollution/${readingId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);
      
      expect(res.statusCode).toEqual(403);
      expect(res.body).toHaveProperty('message', 'Access denied');
    });
  });

  describe('DELETE /api/pollution/:id', () => {
    it('should delete pollution reading as owner', async () => {
      // Create a new reading to delete
      const newReading = {
        city: 'Chennai',
        country: 'India',
        lat: 13.0827,
        lng: 80.2707,
        aqi: 76,
        pm25: 32.1,
        pm10: 58.4,
        no2: 24.7,
        o3: 42.3,
        so2: 10.8,
        co: 0.7
      };

      const createRes = await request(app)
        .post('/api/pollution')
        .set('Authorization', `Bearer ${token}`)
        .send(newReading);
      
      const readingId = createRes.body.reading.id;

      const res = await request(app)
        .delete(`/api/pollution/${readingId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message', 'Pollution reading deleted successfully');
    });

    it('should delete pollution reading as admin', async () => {
      // Create a new reading to delete
      const newReading = {
        city: 'Bangalore',
        country: 'India',
        lat: 12.9716,
        lng: 77.5946,
        aqi: 92,
        pm25: 38.9,
        pm10: 72.6,
        no2: 31.2,
        o3: 56.8,
        so2: 13.5,
        co: 0.9
      };

      const createRes = await request(app)
        .post('/api/pollution')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newReading);
      
      const readingId = createRes.body.reading.id;

      const res = await request(app)
        .delete(`/api/pollution/${readingId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message', 'Pollution reading deleted successfully');
    });

    it('should return 403 when deleting reading not owned by user', async () => {
      // First, get all readings to find an ID not owned by the user
      const listRes = await request(app)
        .get('/api/pollution');
      
      const reading = listRes.body.pollutionReadings.find(r => r.userId !== userId);
      const readingId = reading.id;

      const res = await request(app)
        .delete(`/api/pollution/${readingId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(403);
      expect(res.body).toHaveProperty('message', 'Access denied');
    });

    it('should return 404 for non-existent ID', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174999';
      
      const res = await request(app)
        .delete(`/api/pollution/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('message', 'Pollution reading not found');
    });
  });
});
