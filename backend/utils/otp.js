const bcrypt = require('bcryptjs');
const { createError } = require('./error');

/**
 * OTP utilities for generating and verifying OTPs
 */
const otp = {
  /**
   * Generate a random OTP of specified length
   * @param {number} length - Length of OTP (default: 6)
   * @returns {string} Generated OTP
   */
  generate: (length = 6) => {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(Math.random() * (max - min + 1) + min).toString();
  },

  /**
   * Hash an OTP for storage
   * @param {string} otp - Plain OTP
   * @returns {Promise<string>} Hashed OTP
   */
  hash: async (otp) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(otp, salt);
  },

  /**
   * Generate OTP with expiry for a user
   * @param {Object} user - User document
   * @returns {Promise<string>} Plain OTP
   */
  generateForUser: async (user) => {
    const plainOtp = otp.generate(6);
    const hashedOtp = await otp.hash(plainOtp);
    
    user.otp = {
      code: hashedOtp,
      expiresAt: new Date(Date.now() + parseInt(process.env.OTP_EXPIRY) * 60 * 1000)
    };
    
    await user.save();
    return plainOtp;
  },

  /**
   * Verify OTP for a user
   * @param {Object} user - User document
   * @param {string} enteredOtp - OTP entered by user
   * @returns {Promise<boolean>} Verification result
   */
  verify: async (user, enteredOtp) => {
    // Check if OTP exists and is not expired
    if (!user.otp?.code || !user.otp?.expiresAt) {
      throw createError(400, 'No OTP found. Request a new one.');
    }

    if (new Date() > user.otp.expiresAt) {
      throw createError(400, 'OTP has expired. Request a new one.');
    }

    // Verify OTP
    const isValid = await bcrypt.compare(enteredOtp, user.otp.code);
    if (!isValid) {
      throw createError(400, 'Invalid OTP');
    }

    // Clear OTP after successful verification
    user.otp = undefined;
    user.isVerified = true;
    await user.save();

    return true;
  },

  /**
   * Clear OTP for a user
   * @param {Object} user - User document
   * @returns {Promise<void>}
   */
  clear: async (user) => {
    user.otp = undefined;
    await user.save();
  }
};

module.exports = otp;
