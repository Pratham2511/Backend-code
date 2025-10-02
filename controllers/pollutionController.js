const { PollutionReading, User } = require('../models');
const pollutionService = require('../services/pollutionService');

exports.createPollutionReading = async (req, res) => {
  try {
    const readingData = {
      ...req.body,
      userId: req.user.id
    };
    
    const reading = await PollutionReading.create(readingData);
    
    res.status(201).json({
      message: 'Pollution reading created successfully',
      reading
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error creating pollution reading' });
  }
};

exports.getPollutionReadings = async (req, res) => {
  try {
    const { page = 1, limit = 10, city, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;
    
    const where = {};
    if (city) where.city = city;
    if (startDate && endDate) {
      where.recordedAt = {
        [Sequelize.Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    
    const { count, rows } = await PollutionReading.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['recordedAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ]
    });
    
    res.json({
      pollutionReadings: rows,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalItems: count
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching pollution readings' });
  }
};

exports.getPollutionReadingById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const reading = await PollutionReading.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ]
    });
    
    if (!reading) {
      return res.status(404).json({ message: 'Pollution reading not found' });
    }
    
    res.json({ reading });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching pollution reading' });
  }
};

exports.updatePollutionReading = async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;
    
    // Check if reading exists
    const reading = await PollutionReading.findByPk(id);
    if (!reading) {
      return res.status(404).json({ message: 'Pollution reading not found' });
    }
    
    // Check if user is admin or the owner of the reading
    if (!user.isAdmin && reading.userId !== user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Update reading
    await reading.update(req.body);
    
    res.json({
      message: 'Pollution reading updated successfully',
      reading
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error updating pollution reading' });
  }
};

exports.deletePollutionReading = async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;
    
    // Check if reading exists
    const reading = await PollutionReading.findByPk(id);
    if (!reading) {
      return res.status(404).json({ message: 'Pollution reading not found' });
    }
    
    // Check if user is admin or the owner of the reading
    if (!user.isAdmin && reading.userId !== user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Delete reading
    await reading.destroy();
    
    res.json({ message: 'Pollution reading deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting pollution reading' });
  }
};

exports.getLatestPollutionByCity = async (req, res) => {
  try {
    const { city } = req.query;
    
    if (!city) {
      return res.status(400).json({ message: 'City parameter is required' });
    }
    
    const latestReading = await pollutionService.getLatestByCity(city);
    
    if (!latestReading) {
      return res.status(404).json({ message: 'No pollution data found for this city' });
    }
    
    res.json({ latestReading });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching latest pollution data' });
  }
};
