const MentorProfile = require('../models/MentorProfile');
const User = require('../models/User');
const Booking = require('../models/Booking');
const { createError } = require('../utils/error');
const { uploadSingle } = require('../utils/fileUpload');
const logger = require('../utils/logger');

/**
 * Setup or update mentor profile
 * @route POST /api/v1/mentors/setup
 */
const setupProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      headline,
      bio,
      expertise,
      skills,
      experienceYears,
      hourlyRate,
      availability,
      languages,
      socialLinks
    } = req.body;

    let profile = await MentorProfile.findOne({ userId });
    
    if (!profile) {
      profile = new MentorProfile({ userId });
    }

    // Update all provided fields
    profile.headline = headline;
    profile.bio = bio;
    profile.expertise = expertise;
    profile.skills = skills;
    profile.experienceYears = experienceYears;
    profile.hourlyRate = hourlyRate;
    if (availability) profile.availability = availability;
    if (languages) profile.languages = languages;
    if (socialLinks) profile.socialLinks = socialLinks;

    await profile.save();

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Search and filter mentors
 * @route GET /api/v1/mentors
 */
const searchMentors = async (req, res, next) => {
  try {
    const {
      q,
      expertise,
      skills,
      minRate,
      maxRate,
      availability,
      languages,
      rating,
      page = 1,
      limit = 10,
      sortBy = 'ratings.average',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {
      'isAvailable': true
    };

    // Text search
    if (q) {
      query.$or = [
        { headline: { $regex: q, $options: 'i' } },
        { bio: { $regex: q, $options: 'i' } },
        { expertise: { $regex: q, $options: 'i' } },
        { skills: { $regex: q, $options: 'i' } }
      ];
    }

    // Filters
    if (expertise) {
      query.expertise = { $in: expertise.split(',') };
    }

    if (skills) {
      query.skills = { $in: skills.split(',') };
    }

    if (minRate || maxRate) {
      query.hourlyRate = {};
      if (minRate) query.hourlyRate.$gte = parseInt(minRate);
      if (maxRate) query.hourlyRate.$lte = parseInt(maxRate);
    }

    if (languages) {
      query.languages = { $in: languages.split(',') };
    }

    if (rating) {
      query['ratings.average'] = { $gte: parseFloat(rating) };
    }

    if (availability) {
      const [day, timeSlot] = availability.split(':');
      query['availability.day'] = day.toLowerCase();
      if (timeSlot) {
        query['availability.slots'] = {
          $elemMatch: {
            from: { $lte: timeSlot },
            to: { $gte: timeSlot }
          }
        };
      }
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const mentors = await MentorProfile.find(query)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'name avatarUrl lastSeen');

    // Get total count
    const total = await MentorProfile.countDocuments(query);

    res.json({
      success: true,
      data: {
        mentors,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get mentor profile by ID
 * @route GET /api/v1/mentors/:id
 */
const getMentorProfile = async (req, res, next) => {
  try {
    const { id } = req.params;

    const mentor = await MentorProfile.findOne({ userId: id })
      .populate('userId', 'name email avatarUrl lastSeen');

    if (!mentor) {
      throw createError(404, 'Mentor not found');
    }

    // Get booking statistics
    const stats = await Booking.aggregate([
      { $match: { mentorId: id, status: 'completed' } },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          totalMinutes: { $sum: '$durationMinutes' },
          avgRating: { $avg: '$feedback.fromMentee.rating' }
        }
      }
    ]);

    // Get recent feedback
    const recentFeedback = await Booking.find(
      { mentorId: id, status: 'completed', 'feedback.fromMentee': { $exists: true } },
      { 'feedback.fromMentee': 1, scheduledAt: 1 }
    )
    .sort({ scheduledAt: -1 })
    .limit(5)
    .populate('menteeId', 'name avatarUrl');

    res.json({
      success: true,
      data: {
        mentor,
        stats: stats[0] || {
          totalSessions: 0,
          totalMinutes: 0,
          avgRating: 0
        },
        recentFeedback
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update mentor availability
 * @route PUT /api/v1/mentors/:id/availability
 */
const updateAvailability = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { availability } = req.body;

    // Validate availability format
    availability.forEach(slot => {
      if (!slot.day || !slot.slots || !Array.isArray(slot.slots)) {
        throw createError(400, 'Invalid availability format');
      }
      slot.slots.forEach(timeSlot => {
        if (!timeSlot.from || !timeSlot.to) {
          throw createError(400, 'Invalid time slot format');
        }
        // Validate time format (HH:mm)
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(timeSlot.from) || !timeRegex.test(timeSlot.to)) {
          throw createError(400, 'Invalid time format. Use HH:mm');
        }
      });
    });

    const profile = await MentorProfile.findOne({ userId });
    if (!profile) {
      throw createError(404, 'Mentor profile not found');
    }

    profile.availability = availability;
    await profile.save();

    res.json({
      success: true,
      data: {
        availability: profile.availability
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload mentor certificate
 * @route POST /api/v1/mentors/:id/certificates
 */
const uploadCertificate = async (req, res, next) => {
  try {
    const upload = uploadSingle('document', 'certificate');

    upload(req, res, async (err) => {
      if (err) {
        return next(createError(400, 'Error uploading file', { error: err.message }));
      }

      if (!req.file) {
        return next(createError(400, 'No file uploaded'));
      }

      const { title, issuedBy, issuedDate, expiryDate } = req.body;
      const profile = await MentorProfile.findOne({ userId: req.user.id });

      profile.certificates.push({
        title,
        url: req.file.path, // or S3 URL in production
        issuedBy,
        issuedDate: new Date(issuedDate),
        expiryDate: expiryDate ? new Date(expiryDate) : undefined
      });

      await profile.save();

      res.json({
        success: true,
        data: {
          certificate: profile.certificates[profile.certificates.length - 1]
        }
      });
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  setupProfile,
  searchMentors,
  getMentorProfile,
  updateAvailability,
  uploadCertificate
};
