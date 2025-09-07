const AnalyticsService = require('../services/analyticsService');

/**
 * Get user growth analytics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getUserAnalytics = async (req, res) => {
  const { startDate, endDate, role } = req.query;
  
  const metrics = await AnalyticsService.getUserGrowthMetrics({
    startDate,
    endDate,
    role
  });

  res.status(200).json({
    status: 'success',
    data: metrics
  });
};

/**
 * Get booking analytics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getBookingAnalytics = async (req, res) => {
  const { startDate, endDate } = req.query;
  
  const metrics = await AnalyticsService.getBookingMetrics({
    startDate,
    endDate
  });

  res.status(200).json({
    status: 'success',
    data: metrics
  });
};

/**
 * Get engagement analytics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getEngagementAnalytics = async (req, res) => {
  const { startDate, endDate } = req.query;
  
  const metrics = await AnalyticsService.getEngagementMetrics({
    startDate,
    endDate
  });

  res.status(200).json({
    status: 'success',
    data: metrics
  });
};

/**
 * Get financial analytics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getFinancialAnalytics = async (req, res) => {
  const { startDate, endDate } = req.query;
  
  const metrics = await AnalyticsService.getFinancialMetrics({
    startDate,
    endDate
  });

  res.status(200).json({
    status: 'success',
    data: metrics
  });
};

/**
 * Get mentor performance analytics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getMentorAnalytics = async (req, res) => {
  const { startDate, endDate, limit } = req.query;
  
  const metrics = await AnalyticsService.getMentorPerformanceMetrics({
    startDate,
    endDate,
    limit: parseInt(limit, 10)
  });

  res.status(200).json({
    status: 'success',
    data: metrics
  });
};

/**
 * Get platform health dashboard
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getPlatformHealth = async (req, res) => {
  const metrics = await AnalyticsService.getPlatformHealthMetrics();

  res.status(200).json({
    status: 'success',
    data: metrics
  });
};

/**
 * Export analytics data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.exportAnalytics = async (req, res) => {
  const { startDate, endDate, metrics } = req.query;
  
  const data = {};
  
  // Collect requested metrics
  const promises = metrics.map(async (metric) => {
    switch (metric) {
      case 'users':
        data.users = await AnalyticsService.getUserGrowthMetrics({ startDate, endDate });
        break;
      case 'bookings':
        data.bookings = await AnalyticsService.getBookingMetrics({ startDate, endDate });
        break;
      case 'engagement':
        data.engagement = await AnalyticsService.getEngagementMetrics({ startDate, endDate });
        break;
      case 'financial':
        data.financial = await AnalyticsService.getFinancialMetrics({ startDate, endDate });
        break;
      case 'mentors':
        data.mentors = await AnalyticsService.getMentorPerformanceMetrics({ startDate, endDate });
        break;
    }
  });

  await Promise.all(promises);

  // Generate CSV or JSON export
  const format = req.query.format || 'json';
  
  if (format === 'csv') {
    // Convert data to CSV format
    const csv = convertToCSV(data);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=analytics-${startDate}-${endDate}.csv`);
    return res.send(csv);
  }

  res.status(200).json({
    status: 'success',
    data
  });
};
