const nodemailer = require('nodemailer');
const logger = require('./logger');

/**
 * Email templates for different types of emails
 */
const templates = {
  verifyEmail: (name, otp) => ({
    subject: 'Verify your email - Growth Mentor Grid',
    html: `
      <h2>Welcome to Growth Mentor Grid, ${name}!</h2>
      <p>Your verification code is: <strong>${otp}</strong></p>
      <p>This code will expire in ${process.env.OTP_EXPIRY} minutes.</p>
    `
  }),
  
  bookingConfirmation: (booking, mentor, mentee) => ({
    subject: 'Booking Confirmed - Growth Mentor Grid',
    html: `
      <h2>Your mentoring session is confirmed!</h2>
      <p>Session Details:</p>
      <ul>
        <li>Date: ${new Date(booking.scheduledAt).toLocaleString()}</li>
        <li>Duration: ${booking.durationMinutes} minutes</li>
        <li>Mentor: ${mentor.name}</li>
        <li>Meeting Link: ${booking.meetingLink}</li>
      </ul>
      <p>Add this to your calendar and be ready 5 minutes before the session.</p>
    `
  }),

  bookingCancellation: (booking, canceller) => ({
    subject: 'Booking Cancelled - Growth Mentor Grid',
    html: `
      <h2>Booking Cancelled</h2>
      <p>The session scheduled for ${new Date(booking.scheduledAt).toLocaleString()} 
         has been cancelled by ${canceller.name}.</p>
      <p>Reason: ${booking.cancellation.reason}</p>
    `
  }),

  resetPassword: (name, resetLink) => ({
    subject: 'Reset Your Password - Growth Mentor Grid',
    html: `
      <h2>Password Reset Request</h2>
      <p>Hi ${name},</p>
      <p>Click the link below to reset your password:</p>
      <a href="${resetLink}">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `
  })
};

/**
 * Email service configuration
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

/**
 * Send email using configured transporter
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - Email content in HTML
 * @returns {Promise<boolean>} Success status
 */
const sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Email sent successfully to ${to}`);
    return true;
  } catch (error) {
    logger.error('Email send error:', error);
    return false;
  }
};

module.exports = {
  sendEmail,
  templates
};
