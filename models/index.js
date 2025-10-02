const { Sequelize } = require('sequelize');
const config = require('../config/database');
const User = require('./User');
const PollutionReading = require('./PollutionReading');

const models = {
  User: User(config),
  PollutionReading: PollutionReading(config)
};

// Associate models
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

module.exports = {
  ...models,
  sequelize
};
