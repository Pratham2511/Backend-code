const bcrypt = require('bcrypt');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    await queryInterface.bulkInsert('users', [{
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Demo User',
      email: 'demo@example.com',
      password: hashedPassword,
      isAdmin: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', {
      email: 'demo@example.com'
    }, {});
  }
};
