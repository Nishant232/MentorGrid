const User = require('../models/User');
const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Credit = require('../models/Credit');

class SearchService {
  /**
   * Search mentors with advanced filtering
   * @param {Object} params Search parameters
   * @returns {Object} Search results with pagination
   */
  static async searchMentors({
    query = '',
    expertise = [],
    languages = [],
    availability = [],
    minRating = 0,
    priceRange = {},
    timezone,
    page = 1,
    limit = 20,
    sortBy = 'rating',
    sortOrder = 'desc'
  }) {
    // Base query for active mentors
    const baseQuery = {
      role: 'mentor',
      'mentorProfile.isActive': true,
      'mentorProfile.isVerified': true
    };

    // Text search in name, bio, and expertise
    if (query) {
      baseQuery.$or = [
        { name: { $regex: query, $options: 'i' } },
        { 'mentorProfile.bio': { $regex: query, $options: 'i' } },
        { 'mentorProfile.expertise': { $regex: query, $options: 'i' } }
      ];
    }

    // Expertise filter
    if (expertise.length > 0) {
      baseQuery['mentorProfile.expertise'] = { $in: expertise };
    }

    // Languages filter
    if (languages.length > 0) {
      baseQuery['mentorProfile.languages'] = { $all: languages };
    }

    // Price range filter
    if (priceRange.min !== undefined || priceRange.max !== undefined) {
      baseQuery['mentorProfile.ratePerHour'] = {
        ...(priceRange.min !== undefined && { $gte: priceRange.min }),
        ...(priceRange.max !== undefined && { $lte: priceRange.max })
      };
    }

    // Rating filter
    if (minRating > 0) {
      baseQuery['mentorProfile.rating'] = { $gte: minRating };
    }

    // Availability filter based on timezone
    if (availability.length > 0 && timezone) {
      baseQuery['mentorProfile.availability'] = {
        $elemMatch: {
          day: { $in: availability },
          slots: { $exists: true, $ne: [] }
        }
      };
    }

    // Sorting configuration
    const sortConfig = {};
    switch (sortBy) {
      case 'rating':
        sortConfig['mentorProfile.rating'] = sortOrder === 'desc' ? -1 : 1;
        break;
      case 'price':
        sortConfig['mentorProfile.ratePerHour'] = sortOrder === 'desc' ? -1 : 1;
        break;
      case 'experience':
        sortConfig['mentorProfile.yearsOfExperience'] = sortOrder === 'desc' ? -1 : 1;
        break;
      case 'sessions':
        sortConfig['mentorProfile.sessionCount'] = sortOrder === 'desc' ? -1 : 1;
        break;
      default:
        sortConfig['mentorProfile.rating'] = -1;
    }

    // Execute search query with pagination
    const [mentors, total] = await Promise.all([
      User.find(baseQuery)
        .select(
          'name email avatar mentorProfile.bio mentorProfile.expertise ' +
          'mentorProfile.languages mentorProfile.rating mentorProfile.ratePerHour ' +
          'mentorProfile.availability mentorProfile.yearsOfExperience ' +
          'mentorProfile.sessionCount mentorProfile.reviewCount'
        )
        .sort(sortConfig)
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(baseQuery)
    ]);

    // Enhance search results with additional data
    const enhancedMentors = await Promise.all(
      mentors.map(async (mentor) => {
        const [recentReviews, upcomingSessions, instantAvailability] = await Promise.all([
          // Get recent reviews
          Review.find({
            reviewee: mentor._id,
            status: 'approved'
          })
            .sort({ createdAt: -1 })
            .limit(3)
            .populate('reviewer', 'name avatar'),

          // Get upcoming session count
          Booking.countDocuments({
            mentor: mentor._id,
            status: 'confirmed',
            scheduledAt: { $gt: new Date() }
          }),

          // Check instant booking availability
          Booking.findOne({
            mentor: mentor._id,
            status: 'available',
            scheduledAt: {
              $gt: new Date(),
              $lt: new Date(Date.now() + 24 * 60 * 60 * 1000) // Next 24 hours
            }
          })
        ]);

        return {
          ...mentor.toObject(),
          recentReviews,
          upcomingSessions,
          instantAvailability: !!instantAvailability
        };
      })
    );

    return {
      mentors: enhancedMentors,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      filters: {
        expertise: await this.getUniqueExpertise(),
        languages: await this.getUniqueLanguages(),
        priceRange: await this.getPriceRange()
      }
    };
  }

  /**
   * Get trending mentors
   * @param {Object} params Query parameters
   * @returns {Array} Trending mentors
   */
  static async getTrendingMentors({ limit = 10 }) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const trendingMentors = await Booking.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: '$mentor',
          sessionCount: { $sum: 1 },
          averageRating: { $avg: '$rating' }
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
          _id: 1,
          name: '$mentorInfo.name',
          avatar: '$mentorInfo.avatar',
          expertise: '$mentorInfo.mentorProfile.expertise',
          rating: '$mentorInfo.mentorProfile.rating',
          sessionCount: 1,
          averageRating: 1
        }
      },
      { $sort: { sessionCount: -1, averageRating: -1 } },
      { $limit: limit }
    ]);

    return trendingMentors;
  }

  /**
   * Get similar mentors
   * @param {Object} params Query parameters
   * @returns {Array} Similar mentors
   */
  static async getSimilarMentors({
    mentorId,
    expertise,
    limit = 5
  }) {
    return User.find({
      _id: { $ne: mentorId },
      role: 'mentor',
      'mentorProfile.isActive': true,
      'mentorProfile.isVerified': true,
      'mentorProfile.expertise': { $in: expertise }
    })
      .select('name avatar mentorProfile.expertise mentorProfile.rating')
      .sort({ 'mentorProfile.rating': -1 })
      .limit(limit);
  }

  /**
   * Get unique expertise areas
   * @returns {Array} Unique expertise areas
   */
  static async getUniqueExpertise() {
    return User.distinct('mentorProfile.expertise', {
      role: 'mentor',
      'mentorProfile.isActive': true
    });
  }

  /**
   * Get unique languages
   * @returns {Array} Unique languages
   */
  static async getUniqueLanguages() {
    return User.distinct('mentorProfile.languages', {
      role: 'mentor',
      'mentorProfile.isActive': true
    });
  }

  /**
   * Get price range
   * @returns {Object} Min and max price
   */
  static async getPriceRange() {
    const [min, max] = await Promise.all([
      User.findOne({
        role: 'mentor',
        'mentorProfile.isActive': true
      })
        .sort({ 'mentorProfile.ratePerHour': 1 })
        .select('mentorProfile.ratePerHour'),
      User.findOne({
        role: 'mentor',
        'mentorProfile.isActive': true
      })
        .sort({ 'mentorProfile.ratePerHour': -1 })
        .select('mentorProfile.ratePerHour')
    ]);

    return {
      min: min?.mentorProfile?.ratePerHour || 0,
      max: max?.mentorProfile?.ratePerHour || 0
    };
  }

  /**
   * Get search suggestions
   * @param {string} query Search query
   * @returns {Array} Search suggestions
   */
  static async getSearchSuggestions(query) {
    if (!query || query.length < 2) return [];

    const suggestions = await User.aggregate([
      {
        $match: {
          role: 'mentor',
          'mentorProfile.isActive': true,
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { 'mentorProfile.expertise': { $regex: query, $options: 'i' } }
          ]
        }
      },
      {
        $project: {
          _id: 1,
          text: {
            $cond: {
              if: { $regexMatch: { input: '$name', regex: new RegExp(query, 'i') } },
              then: '$name',
              else: { $arrayElemAt: ['$mentorProfile.expertise', 0] }
            }
          },
          type: {
            $cond: {
              if: { $regexMatch: { input: '$name', regex: new RegExp(query, 'i') } },
              then: 'mentor',
              else: 'expertise'
            }
          }
        }
      },
      { $limit: 10 }
    ]);

    return suggestions;
  }
}

module.exports = SearchService;
