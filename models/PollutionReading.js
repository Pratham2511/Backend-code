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
    country: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'India'
    },
    lat: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false
    },
    lng: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false
    },
    aqi: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
        max: 500
      }
    },
    pm25: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    pm10: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    no2: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    o3: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    so2: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    co: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    recordedAt: {
      type: DataTypes.DATE,
      allowNull: false,
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
    indexes: [
      {
        unique: true,
        fields: ['city', 'recordedAt']
      },
      {
        fields: ['city']
      },
      {
        fields: ['recordedAt']
      }
    ]
  });

  PollutionReading.associate = (models) => {
    PollutionReading.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return PollutionReading;
};
