const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PollutionReading = sequelize.define('PollutionReading', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false
    },
    aqi: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    pm25: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    pm10: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    no2: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    so2: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    o3: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    co: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    temperature: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    humidity: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    windSpeed: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'pollution_readings',
    timestamps: true
  });

  PollutionReading.associate = (models) => {
    if (models.User) {
      PollutionReading.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    }
  };

  return PollutionReading;
};
