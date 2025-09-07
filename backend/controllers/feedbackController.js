const FeedbackService = require('../services/feedbackService');

/**
 * Submit session feedback
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.submitFeedback = async (req, res) => {
  const {
    bookingId,
    rating,
    comment,
    mentorId,
    feedbackType,
    tags
  } = req.body;

  const review = await FeedbackService.submitSessionFeedback({
    bookingId,
    userId: req.user.id,
    rating,
    comment,
    mentorId,
    feedbackType,
    tags
  });

  res.status(201).json({
    status: 'success',
    data: { review }
  });
};

/**
 * Moderate a review
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.moderateReview = async (req, res) => {
  const { reviewId } = req.params;
  const { status, moderationNotes } = req.body;

  const review = await FeedbackService.moderateReview({
    reviewId,
    status,
    moderationNotes
  });

  res.status(200).json({
    status: 'success',
    data: { review }
  });
};

/**
 * Get mentor reviews
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getMentorReviews = async (req, res) => {
  const { mentorId } = req.params;
  const {
    status,
    page,
    limit,
    sortBy,
    order
  } = req.query;

  const result = await FeedbackService.getMentorReviews({
    mentorId,
    status,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sortBy,
    order
  });

  res.status(200).json({
    status: 'success',
    data: result
  });
};

/**
 * Get user's submitted reviews
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getUserReviews = async (req, res) => {
  const { type, page, limit } = req.query;
  const userId = req.user.id;

  const result = await FeedbackService.getUserReviews({
    userId,
    type,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10)
  });

  res.status(200).json({
    status: 'success',
    data: result
  });
};

/**
 * Get mentor's review statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getMentorStatistics = async (req, res) => {
  const { mentorId } = req.params;

  const stats = await FeedbackService.getReviewStatistics(mentorId);

  res.status(200).json({
    status: 'success',
    data: stats
  });
};
