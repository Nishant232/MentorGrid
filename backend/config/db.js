const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    const mongoURI = process.env.NODE_ENV === 'production' 
      ? process.env.MONGODB_URI_PROD 
      : process.env.MONGODB_URI;

    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    logger.info(`MongoDB Connected: ${conn.connection.host}`);

    // Create indexes for frequently queried fields
    await Promise.all([
      require('../models/User').createIndexes(),
      require('../models/MentorProfile').createIndexes(),
      require('../models/Booking').createIndexes(),
      require('../models/Message').createIndexes()
    ]);

    logger.info('Database indexes created successfully');
  } catch (error) {
    logger.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
