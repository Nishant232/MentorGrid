const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Credit = require('../models/Credit');
const User = require('../models/User');
const NotificationService = require('./notificationService');
const { TransactionError } = require('../utils/errors');

class CreditService {
  /**
   * Purchase credits
   * @param {Object} params Purchase parameters
   * @returns {Object} Transaction and updated credit balance
   */
  static async purchaseCredits({
    userId,
    amount,
    paymentMethod,
    paymentId,
    quantity
  }) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Create transaction record
      const transaction = await Transaction.create([{
        user: userId,
        type: 'credit_purchase',
        amount,
        paymentMethod,
        paymentId,
        details: {
          creditQuantity: quantity,
          pricePerCredit: amount / quantity
        },
        status: 'completed'
      }], { session });

      // Update user's credit balance
      const credit = await Credit.findOneAndUpdate(
        { user: userId },
        {
          $inc: { balance: quantity },
          $push: {
            history: {
              type: 'purchase',
              amount: quantity,
              transactionId: transaction[0]._id
            }
          }
        },
        { 
          new: true,
          upsert: true,
          session
        }
      );

      await session.commitTransaction();

      // Send notification
      await NotificationService.send({
        recipient: userId,
        type: 'CREDIT_ADDED',
        title: 'Credits Purchased Successfully',
        message: `${quantity} credits have been added to your account.`,
        data: {
          creditBalance: credit.balance,
          transactionId: transaction[0]._id
        }
      });

      return {
        transaction: transaction[0],
        creditBalance: credit.balance
      };
    } catch (error) {
      await session.abortTransaction();
      throw new TransactionError('Failed to process credit purchase');
    } finally {
      session.endSession();
    }
  }

  /**
   * Use credits for booking
   * @param {Object} params Booking parameters
   * @returns {Object} Transaction and updated credit balance
   */
  static async useCreditsForBooking({
    userId,
    bookingId,
    mentorId,
    creditsRequired
  }) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Check credit balance
      const credit = await Credit.findOne({ user: userId });
      if (!credit || credit.balance < creditsRequired) {
        throw new TransactionError('Insufficient credits');
      }

      // Create transaction record
      const transaction = await Transaction.create([{
        user: userId,
        type: 'credit_use',
        amount: creditsRequired,
        details: {
          bookingId,
          mentorId
        },
        status: 'completed'
      }], { session });

      // Update user's credit balance
      const updatedCredit = await Credit.findOneAndUpdate(
        { user: userId },
        {
          $inc: { balance: -creditsRequired },
          $push: {
            history: {
              type: 'use',
              amount: -creditsRequired,
              transactionId: transaction[0]._id,
              bookingId
            }
          }
        },
        { new: true, session }
      );

      await session.commitTransaction();

      // Send notification
      await NotificationService.send({
        recipient: userId,
        type: 'CREDIT_DEDUCTED',
        title: 'Credits Used for Booking',
        message: `${creditsRequired} credits have been deducted for your booking.`,
        data: {
          creditBalance: updatedCredit.balance,
          bookingId,
          transactionId: transaction[0]._id
        }
      });

      return {
        transaction: transaction[0],
        creditBalance: updatedCredit.balance
      };
    } catch (error) {
      await session.abortTransaction();
      throw new TransactionError(error.message || 'Failed to process credit usage');
    } finally {
      session.endSession();
    }
  }

  /**
   * Refund credits
   * @param {Object} params Refund parameters
   * @returns {Object} Transaction and updated credit balance
   */
  static async refundCredits({
    userId,
    bookingId,
    amount,
    reason
  }) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Create refund transaction
      const transaction = await Transaction.create([{
        user: userId,
        type: 'credit_refund',
        amount,
        details: {
          bookingId,
          reason
        },
        status: 'completed'
      }], { session });

      // Update user's credit balance
      const credit = await Credit.findOneAndUpdate(
        { user: userId },
        {
          $inc: { balance: amount },
          $push: {
            history: {
              type: 'refund',
              amount,
              transactionId: transaction[0]._id,
              bookingId
            }
          }
        },
        { new: true, session }
      );

      await session.commitTransaction();

      // Send notification
      await NotificationService.send({
        recipient: userId,
        type: 'CREDIT_ADDED',
        title: 'Credits Refunded',
        message: `${amount} credits have been refunded to your account.`,
        data: {
          creditBalance: credit.balance,
          bookingId,
          transactionId: transaction[0]._id
        }
      });

      return {
        transaction: transaction[0],
        creditBalance: credit.balance
      };
    } catch (error) {
      await session.abortTransaction();
      throw new TransactionError('Failed to process credit refund');
    } finally {
      session.endSession();
    }
  }

  /**
   * Calculate mentor payout
   * @param {Object} params Payout parameters
   * @returns {Object} Payout amount and updated balances
   */
  static async calculateMentorPayout({
    mentorId,
    startDate,
    endDate
  }) {
    const completedBookings = await Transaction.aggregate([
      {
        $match: {
          'details.mentorId': mentorId,
          type: 'credit_use',
          status: 'completed',
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        }
      },
      {
        $group: {
          _id: null,
          totalCredits: { $sum: '$amount' },
          bookings: { $push: '$details.bookingId' }
        }
      }
    ]);

    if (!completedBookings.length) {
      return { totalCredits: 0, estimatedPayout: 0, bookings: [] };
    }

    const { totalCredits, bookings } = completedBookings[0];
    // Calculate payout amount (e.g., 80% of credit value)
    const estimatedPayout = totalCredits * 0.8;

    return {
      totalCredits,
      estimatedPayout,
      bookings
    };
  }

  /**
   * Process mentor payout
   * @param {Object} params Payout parameters
   * @returns {Object} Payout transaction
   */
  static async processMentorPayout({
    mentorId,
    amount,
    paymentMethod,
    payoutId,
    bookings
  }) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Create payout transaction
      const transaction = await Transaction.create([{
        user: mentorId,
        type: 'payout',
        amount,
        paymentMethod,
        payoutId,
        details: {
          bookings
        },
        status: 'completed'
      }], { session });

      // Update mentor's earnings record
      await User.findByIdAndUpdate(
        mentorId,
        {
          $inc: { 'mentorProfile.totalEarnings': amount },
          $set: { 'mentorProfile.lastPayout': new Date() }
        },
        { session }
      );

      await session.commitTransaction();

      // Send notification
      await NotificationService.send({
        recipient: mentorId,
        type: 'PAYOUT_PROCESSED',
        title: 'Payout Processed Successfully',
        message: `Your payout of ${amount} credits has been processed.`,
        data: {
          amount,
          transactionId: transaction[0]._id
        }
      });

      return transaction[0];
    } catch (error) {
      await session.abortTransaction();
      throw new TransactionError('Failed to process mentor payout');
    } finally {
      session.endSession();
    }
  }

  /**
   * Get credit history
   * @param {Object} params Query parameters
   * @returns {Object} Credit history with pagination
   */
  static async getCreditHistory({
    userId,
    page = 1,
    limit = 20,
    type = null
  }) {
    const query = { user: userId };
    if (type) {
      query['history.type'] = type;
    }

    const credit = await Credit.findOne(query)
      .populate({
        path: 'history.transactionId',
        select: 'type amount paymentMethod status createdAt'
      })
      .lean();

    if (!credit) {
      return {
        balance: 0,
        history: [],
        totalPages: 0,
        currentPage: page
      };
    }

    const history = credit.history
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice((page - 1) * limit, page * limit);

    return {
      balance: credit.balance,
      history,
      totalPages: Math.ceil(credit.history.length / limit),
      currentPage: page
    };
  }
}

module.exports = CreditService;
