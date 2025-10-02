const { PollutionReading } = require('../models');

const getLatestByCity = async (city) => {
  return await PollutionReading.findOne({
    where: { city },
    order: [['recordedAt', 'DESC']]
  });
};

module.exports = {
  getLatestByCity
};
