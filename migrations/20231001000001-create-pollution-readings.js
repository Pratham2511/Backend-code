module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('pollution_readings', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      city: {
        type: Sequelize.STRING,
        allowNull: false
      },
      country: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'India'
      },
      lat: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: false
      },
      lng: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: false
      },
      aqi: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      pm25: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      pm10: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      no2: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      o3: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      so2: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      co: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      recordedAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Add indexes
    await queryInterface.addIndex('pollution_readings', ['city', 'recordedAt'], {
      unique: true,
      name: 'pollution_readings_city_recorded_at_unique'
    });
    await queryInterface.addIndex('pollution_readings', ['city'], {
      name: 'pollution_readings_city_idx'
    });
    await queryInterface.addIndex('pollution_readings', ['recordedAt'], {
      name: 'pollution_readings_recorded_at_idx'
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('pollution_readings');
  }
};
