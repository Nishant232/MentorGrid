const mongoose = require('mongoose');

const menteeProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  interests: [{
    type: String,
    trim: true
  }],
  goals: {
    type: String,
    trim: true,
    maxlength: [500, 'Goals description cannot exceed 500 characters']
  },
  progress: {
    completedSessions: {
      type: Number,
      default: 0
    },
    totalMinutes: {
      type: Number,
      default: 0
    },
    milestones: [{
      title: {
        type: String,
        required: true
      },
      achievedAt: {
        type: Date,
        default: Date.now
      }
    }],
    skills: [{
      name: String,
      level: {
        type: Number,
        min: 1,
        max: 5
      },
      endorsements: [{
        mentorId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        note: String,
        date: {
          type: Date,
          default: Date.now
        }
      }]
    }]
  },
  bookmarks: [{
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  preferences: {
    timezone: {
      type: String,
      default: 'UTC'
    },
    preferredLanguages: [String],
    maxRate: Number,
    notificationPreferences: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      }
    }
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
menteeProfileSchema.index({ userId: 1 });
menteeProfileSchema.index({ interests: 1 });
menteeProfileSchema.index({ 'bookmarks.mentorId': 1 });
menteeProfileSchema.index({ 'progress.completedSessions': -1 });

// Virtual populate for user info
menteeProfileSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Method to add a milestone
menteeProfileSchema.methods.addMilestone = async function(title) {
  this.progress.milestones.push({ title });
  await this.save();
  return this.progress.milestones;
};

// Method to update session stats
menteeProfileSchema.methods.updateSessionStats = async function(sessionDuration) {
  this.progress.completedSessions += 1;
  this.progress.totalMinutes += sessionDuration;
  await this.save();
};

// Method to toggle mentor bookmark
menteeProfileSchema.methods.toggleBookmark = async function(mentorId) {
  const bookmarkIndex = this.bookmarks.findIndex(
    b => b.mentorId.toString() === mentorId.toString()
  );
  
  if (bookmarkIndex === -1) {
    this.bookmarks.push({ mentorId });
  } else {
    this.bookmarks.splice(bookmarkIndex, 1);
  }
  
  await this.save();
  return this.bookmarks;
};

const MenteeProfile = mongoose.model('MenteeProfile', menteeProfileSchema);

module.exports = MenteeProfile;
