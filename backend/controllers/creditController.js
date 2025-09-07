const CreditService = require('../services/creditService');
const { TransactionError } = require('../utils/errors');

/**
 * Purchase credits
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.purchaseCredits = async (req, res) => {
  const { amount, paymentMethod, paymentId, quantity } = req.body;
  const userId = req.user.id;

  const result = await CreditService.purchaseCredits({
    userId,
    amount,
    paymentMethod,
    paymentId,
    quantity
  });

  res.status(200).json({
    status: 'success',
    data: result
  });
};

/**
 * Use credits for booking
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.useCredits = async (req, res) => {
  const { bookingId, mentorId, creditsRequired } = req.body;
  const userId = req.user.id;

  const result = await CreditService.useCreditsForBooking({
    userId,
    bookingId,
    mentorId,
    creditsRequired
  });

  res.status(200).json({
    status: 'success',
    data: result
  });
};

/**
 * Refund credits
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.refundCredits = async (req, res) => {
  const { bookingId, amount, reason } = req.body;
  const userId = req.user.id;

  const result = await CreditService.refundCredits({
    userId,
    bookingId,
    amount,
    reason
  });

  res.status(200).json({
    status: 'success',
    data: result
  });
};

/**
 * Get credit balance and history
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getCreditHistory = async (req, res) => {
  const { page, limit, type } = req.query;
  const userId = req.user.id;

  const result = await CreditService.getCreditHistory({
    userId,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    type
  });

  res.status(200).json({
    status: 'success',
    data: result
  });
};

/**
 * Calculate mentor payout
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.calculatePayout = async (req, res) => {
  const { startDate, endDate } = req.query;
  const mentorId = req.user.id;

  const result = await CreditService.calculateMentorPayout({
    mentorId,
    startDate,
    endDate
  });

  res.status(200).json({
    status: 'success',
    data: result
  });
};

/**
 * Process mentor payout
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.processPayout = async (req, res) => {
  const { amount, paymentMethod, bookings } = req.body;
  const mentorId = req.user.id;

  // Generate a unique payout ID
  const payoutId = `PO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const result = await CreditService.processMentorPayout({
    mentorId,
    amount,
    paymentMethod,
    payoutId,
    bookings
  });

  res.status(200).json({
    status: 'success',
    data: result
  });
};
