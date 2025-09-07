const mongoose = require('mongoose');

const mentorProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  headline: {
    type: String,
    required: [true, 'Headline is required'],
    trim: true,
    maxlength: [100, 'Headline cannot exceed 100 characters']
  },
  bio: {
    type: String,
    required: [true, 'Bio is required'],
    trim: true,
    maxlength: [1000, 'Bio cannot exceed 1000 characters']
  },
  expertise: [{
    type: String,
    trim: true
  }],
  skills: [{
    type: String,
    trim: true
  }],
  experienceYears: {
    type: Number,
    required: [true, 'Experience years is required'],
    min: [0, 'Experience years cannot be negative']
  },
  hourlyRate: {
    type: Number,
    required: [true, 'Hourly rate is required'],
    min: [0, 'Hourly rate cannot be negative']
  },
  availability: [{
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      required: true
    },
    slots: [{
      from: {
        type: String,
        required: true,
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter valid time in HH:mm format']
      },
      to: {
        type: String,
        required: true,
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter valid time in HH:mm format']
      }
    }]
  }],
  languages: [{
    type: String,
    trim: true
  }],
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    total: {
      type: Number,
      default: 0
    }
  },
  certificates: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    url: {
      type: String,
      required: true
    },
    issuedBy: {
      type: String,
      required: true,
      trim: true
    },
    issuedDate: {
      type: Date,
      required: true
    },
    expiryDate: Date
  }],
  featured: {
    type: Boolean,
    default: false
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  socialLinks: {
    linkedin: String,
    github: String,
    website: String
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
mentorProfileSchema.index({ userId: 1 });
mentorProfileSchema.index({ 'ratings.average': -1 });
mentorProfileSchema.index({ expertise: 1 });
mentorProfileSchema.index({ skills: 1 });
mentorProfileSchema.index({ hourlyRate: 1 });
mentorProfileSchema.index({ featured: 1 });
mentorProfileSchema.index({ 
  headline: 'text', 
  bio: 'text', 
  expertise: 'text', 
  skills: 'text' 
});

// Virtual populate for user info
mentorProfileSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Method to check slot availability
mentorProfileSchema.methods.isSlotAvailable = async function(date, startTime, endTime) {
  const day = date.toLowerCase();
  const daySchedule = this.availability.find(a => a.day === day);
  
  if (!daySchedule) return false;
  
  return daySchedule.slots.some(slot => {
    const slotStart = new Date(`1970-01-01T${slot.from}`);
    const slotEnd = new Date(`1970-01-01T${slot.to}`);
    const requestStart = new Date(`1970-01-01T${startTime}`);
    const requestEnd = new Date(`1970-01-01T${endTime}`);
    
    return requestStart >= slotStart && requestEnd <= slotEnd;
  });
};

// Method to update ratings
mentorProfileSchema.methods.updateRating = async function(newRating) {
  this.ratings.average = (this.ratings.average * this.ratings.total + newRating) / (this.ratings.total + 1);
  this.ratings.total += 1;
  await this.save();
};

const MentorProfile = mongoose.model('MentorProfile', mentorProfileSchema);

module.exports = MentorProfile;
