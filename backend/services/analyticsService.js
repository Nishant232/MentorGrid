const User = require('../models/User');
const Booking = require('../models/Booking');
const Message = require('../models/Message');
const Transaction = require('../models/Transaction');

class AnalyticsService {
  /**
   * Get user growth metrics
   * @param {Object} params Query parameters
   * @returns {Object} User growth metrics
   */
  static async getUserGrowthMetrics({ startDate, endDate, role = null }) {
    const query = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    if (role) {
      query.role = role;
    }

    const [totalUsers, newUsers, activeUsers] = await Promise.all([
      User.countDocuments({ ...query, createdAt: { $lte: new Date(endDate) } }),
      User.countDocuments(query),
      User.countDocuments({
        lastActivityAt: {
          $gte: new Date(new Date(endDate).getTime() - 30 * 24 * 60 * 60 * 1000),
          $lte: new Date(endDate)
        },
        ...(role && { role })
      })
    ]);

    return {
      totalUsers,
      newUsers,
      activeUsers,
      userGrowthRate: totalUsers ? ((newUsers / totalUsers) * 100).toFixed(2) : 0,
      activeUserRate: totalUsers ? ((activeUsers / totalUsers) * 100).toFixed(2) : 0
    };
  }

  /**
   * Get booking metrics
   * @param {Object} params Query parameters
   * @returns {Object} Booking metrics
   */
  static async getBookingMetrics({ startDate, endDate }) {
    const query = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    const [
      totalBookings,
      completedBookings,
      cancelledBookings,
      totalDuration,
      averageRating
    ] = await Promise.all([
      Booking.countDocuments(query),
      Booking.countDocuments({ ...query, status: 'completed' }),
      Booking.countDocuments({ ...query, status: 'cancelled' }),
      Booking.aggregate([
        { $match: { ...query, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$durationMinutes' } } }
      ]),
      Booking.aggregate([
        { $match: { ...query, status: 'completed', rating: { $exists: true } } },
        { $group: { _id: null, avg: { $avg: '$rating' } } }
      ])
    ]);

    return {
      totalBookings,
      completedBookings,
      cancelledBookings,
      completionRate: totalBookings ? ((completedBookings / totalBookings) * 100).toFixed(2) : 0,
      cancellationRate: totalBookings ? ((cancelledBookings / totalBookings) * 100).toFixed(2) : 0,
      totalSessionHours: totalDuration[0]?.total ? (totalDuration[0].total / 60).toFixed(1) : 0,
      averageRating: averageRating[0]?.avg ? averageRating[0].avg.toFixed(1) : 0
    };
  }

  /**
   * Get engagement metrics
   * @param {Object} params Query parameters
   * @returns {Object} Engagement metrics
   */
  static async getEngagementMetrics({ startDate, endDate }) {
    const query = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    const [
      totalMessages,
      activeChats,
      averageResponseTime
    ] = await Promise.all([
      Message.countDocuments(query),
      Message.aggregate([
        { $match: query },
        { $group: { _id: { sender: '$sender', receiver: '$receiver' } } },
        { $group: { _id: null, count: { $sum: 1 } } }
      ]),
      Message.aggregate([
        {
          $match: {
            ...query,
            bookingId: { $exists: true }
          }
        },
        {
          $group: {
            _id: '$bookingId',
            firstMessage: { $min: '$createdAt' },
            responseTime: { $avg: { $subtract: ['$createdAt', '$bookingId.createdAt'] } }
          }
        },
        {
          $group: {
            _id: null,
            avgResponseTime: { $avg: '$responseTime' }
          }
        }
      ])
    ]);

    return {
      totalMessages,
      activeChats: activeChats[0]?.count || 0,
      averageResponseTimeMinutes: averageResponseTime[0]?.avgResponseTime 
        ? (averageResponseTime[0].avgResponseTime / (1000 * 60)).toFixed(1) 
        : 0,
      messagesPerDay: ((totalMessages || 0) / ((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))).toFixed(1)
    };
  }

  /**
   * Get financial metrics
   * @param {Object} params Query parameters
   * @returns {Object} Financial metrics
   */
  static async getFinancialMetrics({ startDate, endDate }) {
    const query = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    const [
      revenue,
      payouts,
      transactions
    ] = await Promise.all([
      Transaction.aggregate([
        { $match: { ...query, type: 'payment' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Transaction.aggregate([
        { $match: { ...query, type: 'payout' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Transaction.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            total: { $sum: '$amount' }
          }
        }
      ])
    ]);

    const transactionsByType = transactions.reduce((acc, curr) => {
      acc[curr._id] = {
        count: curr.count,
        total: curr.total
      };
      return acc;
    }, {});

    return {
      totalRevenue: revenue[0]?.total || 0,
      totalPayouts: payouts[0]?.total || 0,
      netRevenue: (revenue[0]?.total || 0) - (payouts[0]?.total || 0),
      transactionsByType,
      averageTransactionValue: revenue[0]?.total && transactionsByType.payment 
        ? (revenue[0].total / transactionsByType.payment.count).toFixed(2)
        : 0
    };
  }

  /**
   * Get mentor performance metrics
   * @param {Object} params Query parameters
   * @returns {Array} Mentor performance metrics
   */
  static async getMentorPerformanceMetrics({ startDate, endDate, limit = 10 }) {
    const query = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      },
      status: 'completed'
    };

    return Booking.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$mentor',
          totalSessions: { $sum: 1 },
          totalDuration: { $sum: '$durationMinutes' },
          averageRating: { $avg: '$rating' },
          totalEarnings: { $sum: '$amount' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'mentorInfo'
        }
      },
      { $unwind: '$mentorInfo' },
      {
        $project: {
          mentor: {
            id: '$_id',
            name: '$mentorInfo.name',
            expertise: '$mentorInfo.expertise'
          },
          metrics: {
            totalSessions: 1,
            totalHours: { $divide: ['$totalDuration', 60] },
            averageRating: 1,
            totalEarnings: 1
          }
        }
      },
      { $sort: { 'metrics.totalSessions': -1 } },
      { $limit: limit }
    ]);
  }

  /**
   * Get platform health metrics
   * @returns {Object} Platform health metrics
   */
  static async getPlatformHealthMetrics() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      userMetrics,
      bookingMetrics,
      engagementMetrics,
      financialMetrics
    ] = await Promise.all([
      this.getUserGrowthMetrics({ startDate: thirtyDaysAgo, endDate: now }),
      this.getBookingMetrics({ startDate: thirtyDaysAgo, endDate: now }),
      this.getEngagementMetrics({ startDate: thirtyDaysAgo, endDate: now }),
      this.getFinancialMetrics({ startDate: thirtyDaysAgo, endDate: now })
    ]);

    return {
      userMetrics,
      bookingMetrics,
      engagementMetrics,
      financialMetrics,
      timestamp: now
    };
  }
}

module.exports = AnalyticsService;
