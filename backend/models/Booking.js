const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  menteeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no-show'],
    default: 'pending'
  },
  scheduledAt: {
    type: Date,
    required: true
  },
  durationMinutes: {
    type: Number,
    required: true,
    min: [15, 'Session must be at least 15 minutes'],
    max: [180, 'Session cannot exceed 180 minutes']
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  meetingLink: String,
  creditsSpent: {
    type: Number,
    required: true
  },
  feedback: {
    fromMentee: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: String,
      givenAt: Date
    },
    fromMentor: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: String,
      givenAt: Date
    }
  },
  cancellation: {
    reason: String,
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    cancelledAt: Date
  },
  recordingUrl: String,
  meta: {
    platform: {
      type: String,
      enum: ['zoom', 'gmeet', 'teams', 'other'],
      default: 'zoom'
    },
    joinUrl: String,
    hostUrl: String,
    recordingEnabled: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Indexes
bookingSchema.index({ mentorId: 1, status: 1 });
bookingSchema.index({ menteeId: 1, status: 1 });
bookingSchema.index({ scheduledAt: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ 'feedback.fromMentee.rating': 1 });
bookingSchema.index({ 'feedback.fromMentor.rating': 1 });

// Virtual for calculating end time
bookingSchema.virtual('endTime').get(function() {
  return new Date(this.scheduledAt.getTime() + this.durationMinutes * 60000);
});

// Check for scheduling conflicts
bookingSchema.statics.hasConflict = async function(mentorId, scheduledAt, durationMinutes) {
  const startTime = new Date(scheduledAt);
  const endTime = new Date(startTime.getTime() + durationMinutes * 60000);
  
  const conflictingBooking = await this.findOne({
    mentorId,
    status: { $in: ['pending', 'confirmed'] },
    $or: [
      {
        scheduledAt: { 
          $lt: endTime,
          $gte: startTime
        }
      },
      {
        $expr: {
          $and: [
            { $lt: ['$scheduledAt', endTime] },
            { 
              $gte: [
                { $add: ['$scheduledAt', { $multiply: ['$durationMinutes', 60000] }] },
                startTime
              ]
            }
          ]
        }
      }
    ]
  });
  
  return !!conflictingBooking;
};

// Method to confirm booking
bookingSchema.methods.confirm = async function(meetingDetails) {
  this.status = 'confirmed';
  this.meetingLink = meetingDetails.joinUrl;
  this.meta = {
    platform: meetingDetails.platform,
    joinUrl: meetingDetails.joinUrl,
    hostUrl: meetingDetails.hostUrl,
    recordingEnabled: meetingDetails.recordingEnabled
  };
  await this.save();
};

// Method to cancel booking
bookingSchema.methods.cancel = async function(userId, reason) {
  this.status = 'cancelled';
  this.cancellation = {
    reason,
    cancelledBy: userId,
    cancelledAt: new Date()
  };
  await this.save();
};

// Method to complete booking
bookingSchema.methods.complete = async function(recordingUrl = null) {
  this.status = 'completed';
  if (recordingUrl) {
    this.recordingUrl = recordingUrl;
  }
  await this.save();
};

// Method to add feedback
bookingSchema.methods.addFeedback = async function(userType, rating, comment) {
  const feedbackField = userType === 'mentee' ? 'fromMentee' : 'fromMentor';
  
  this.feedback[feedbackField] = {
    rating,
    comment,
    givenAt: new Date()
  };
  
  await this.save();
  return this.feedback[feedbackField];
};

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
