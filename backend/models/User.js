const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[\w-]{2,}$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false // Don't include password in queries by default
  },
  role: {
    type: String,
    enum: ['mentor', 'mentee', 'admin'],
    required: [true, 'Role is required']
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  avatarUrl: {
    type: String,
    default: null
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  credits: {
    type: Number,
    default: 10
  },
  meta: {
    provider: String,
    providerId: String
  },
  otp: {
    code: {
      type: String,
      select: false
    },
    expiresAt: {
      type: Date,
      select: false
    }
  },
  refreshToken: {
    type: String,
    select: false
  }
}, {
  timestamps: true
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ "meta.providerId": 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Generate JWT access token
userSchema.methods.generateAccessToken = function() {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRY }
  );
};

// Generate refresh token
userSchema.methods.generateRefreshToken = function() {
  const refreshToken = jwt.sign(
    { id: this._id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRY }
  );
  
  this.refreshToken = refreshToken;
  return refreshToken;
};

// Compare password
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate OTP
userSchema.methods.generateOTP = async function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const salt = await bcrypt.genSalt(10);
  this.otp = {
    code: await bcrypt.hash(otp, salt),
    expiresAt: new Date(Date.now() + parseInt(process.env.OTP_EXPIRY) * 60 * 1000)
  };
  await this.save();
  return otp;
};

// Verify OTP
userSchema.methods.verifyOTP = async function(enteredOTP) {
  if (!this.otp.code || !this.otp.expiresAt || new Date() > this.otp.expiresAt) {
    return false;
  }
  return await bcrypt.compare(enteredOTP, this.otp.code);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
