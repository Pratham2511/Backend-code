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
    
    // For guest users, limit the data access
    if (req.user.isGuest) {
      limit = Math.min(limit, 5); // Restrict to max 5 items per page for guests
    }
    
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
    
    // For guest users, limit the response data
    let responseData = {
      pollutionReadings: rows,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalItems: count
    };

    if (req.user.isGuest) {
      // Simplify data for guest users
      responseData.pollutionReadings = rows.map(reading => ({
        id: reading.id,
        city: reading.city,
        aqi: reading.aqi,
        recordedAt: reading.recordedAt,
        pollutants: {
          pm25: reading.pm25,
          pm10: reading.pm10
        }
      }));
    }
    
    res.json(responseData);
  } catch (error) {
    console.error('Error fetching pollution readings:', error);
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
    
    let latestReading = await pollutionService.getLatestByCity(city);
    
    if (!latestReading) {
      return res.status(404).json({ message: 'No pollution data found for this city' });
    }
    
    // For guest users, limit the response data
    if (req.user.isGuest) {
      latestReading = {
        id: latestReading.id,
        city: latestReading.city,
        aqi: latestReading.aqi,
        recordedAt: latestReading.recordedAt,
        pollutants: {
          pm25: latestReading.pm25,
          pm10: latestReading.pm10
        }
      };
    }
    
    res.json({ latestReading });
  } catch (error) {
    console.error('Error fetching latest pollution data:', error);
    res.status(500).json({ message: 'Server error fetching latest pollution data' });
  }
};
