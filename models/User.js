const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    isAdmin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'users',
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const rounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;
          const salt = await bcrypt.genSalt(rounds);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed && user.changed('password')) {
          const rounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;
          const salt = await bcrypt.genSalt(rounds);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  });

  User.prototype.validatePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
  };

  User.associate = (models) => {
    if (models.PollutionReading) {
      User.hasMany(models.PollutionReading, { foreignKey: 'userId', as: 'pollutionReadings' });
    }
  };

  return User;
};
