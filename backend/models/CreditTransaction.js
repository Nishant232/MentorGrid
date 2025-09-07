const mongoose = require('mongoose');

const creditTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['credit', 'debit'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    enum: [
      'signup_bonus',
      'session_payment',
      'session_refund',
      'admin_adjustment',
      'referral_bonus',
      'milestone_reward',
      'purchase'
    ],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'reversed'],
    default: 'completed'
  },
  metadata: {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking'
    },
    paymentId: String,
    note: String,
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  balance: {
    before: {
      type: Number,
      required: true
    },
    after: {
      type: Number,
      required: true
    }
  }
}, {
  timestamps: true
});

// Indexes
creditTransactionSchema.index({ userId: 1, createdAt: -1 });
creditTransactionSchema.index({ userId: 1, type: 1 });
creditTransactionSchema.index({ 'metadata.bookingId': 1 });
creditTransactionSchema.index({ status: 1 });

// Static method to create a transaction
creditTransactionSchema.statics.createTransaction = async function(
  userId,
  type,
  amount,
  reason,
  metadata = {}
) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Get user's current balance
    const user = await mongoose.model('User').findById(userId);
    if (!user) throw new Error('User not found');
    
    const currentBalance = user.credits;
    let newBalance;
    
    if (type === 'debit') {
      if (currentBalance < amount) {
        throw new Error('Insufficient credits');
      }
      newBalance = currentBalance - amount;
    } else {
      newBalance = currentBalance + amount;
    }
    
    // Create transaction
    const transaction = await this.create([{
      userId,
      type,
      amount,
      reason,
      metadata,
      balance: {
        before: currentBalance,
        after: newBalance
      }
    }], { session });
    
    // Update user balance
    await mongoose.model('User').findByIdAndUpdate(
      userId,
      { credits: newBalance },
      { session }
    );
    
    await session.commitTransaction();
    return transaction[0];
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// Get user balance at a specific date
creditTransactionSchema.statics.getBalanceAtDate = async function(userId, date) {
  const transaction = await this.findOne({
    userId,
    createdAt: { $lte: date }
  })
  .sort({ createdAt: -1 });
  
  return transaction ? transaction.balance.after : 0;
};

// Get transaction summary
creditTransactionSchema.statics.getTransactionSummary = async function(userId, startDate, endDate) {
  const summary = await this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);
  
  return {
    credits: summary.find(s => s._id === 'credit')?.total || 0,
    debits: summary.find(s => s._id === 'debit')?.total || 0,
    transactions: summary.reduce((acc, s) => acc + s.count, 0)
  };
};

const CreditTransaction = mongoose.model('CreditTransaction', creditTransactionSchema);

module.exports = CreditTransaction;
