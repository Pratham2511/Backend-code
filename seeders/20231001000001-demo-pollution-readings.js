module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('pollution_readings', [
      {
        id: '223e4567-e89b-12d3-a456-426614174001',
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
        recordedAt: new Date(),
        userId: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '223e4567-e89b-12d3-a456-426614174002',
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
        recordedAt: new Date(),
        userId: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '223e4567-e89b-12d3-a456-426614174003',
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
        co: 1.0,
        recordedAt: new Date(),
        userId: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '223e4567-e89b-12d3-a456-426614174004',
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
        co: 0.7,
        recordedAt: new Date(),
        userId: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '223e4567-e89b-12d3-a456-426614174005',
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
        co: 0.9,
        recordedAt: new Date(),
        userId: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('pollution_readings', {
      city: ['Delhi', 'Mumbai', 'Kolkata', 'Chennai', 'Bangalore']
    }, {});
  }
};
