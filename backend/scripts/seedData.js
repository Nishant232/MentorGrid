/**
 * Seed data script for Growth Mentor Grid
 * 
 * This script populates the database with sample data for testing and development.
 * 
 * Usage: 
 * - Run with Node.js: node seedData.js
 * - Optional environment flag: NODE_ENV=production node seedData.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const MentorProfile = require('../models/MentorProfile');
const Booking = require('../models/Booking');
const Message = require('../models/Message');
const Credit = require('../models/Credit');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const logger = require('../utils/logger');

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.NODE_ENV === 'production'
      ? process.env.MONGODB_URI_PROD
      : process.env.MONGODB_URI;

    await mongoose.connect(mongoURI);
    logger.info('MongoDB connected for seeding data');
  } catch (error) {
    logger.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Sample data
const users = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin'
  },
  {
    name: 'John Mentor',
    email: 'john@example.com',
    password: 'password123',
    role: 'mentor',
    bio: 'Experienced software engineer with 10+ years in the industry',
    avatarUrl: 'https://randomuser.me/api/portraits/men/1.jpg'
  },
  {
    name: 'Sarah Mentor',
    email: 'sarah@example.com',
    password: 'password123',
    role: 'mentor',
    bio: 'Product manager with expertise in agile methodologies',
    avatarUrl: 'https://randomuser.me/api/portraits/women/1.jpg'
  },
  {
    name: 'Michael Mentor',
    email: 'michael@example.com',
    password: 'password123',
    role: 'mentor',
    bio: 'UX/UI designer with a passion for user-centered design',
    avatarUrl: 'https://randomuser.me/api/portraits/men/2.jpg'
  },
  {
    name: 'Alice Mentee',
    email: 'alice@example.com',
    password: 'password123',
    role: 'mentee',
    bio: 'Junior developer looking to improve my skills',
    avatarUrl: 'https://randomuser.me/api/portraits/women/2.jpg'
  },
  {
    name: 'Bob Mentee',
    email: 'bob@example.com',
    password: 'password123',
    role: 'mentee',
    bio: 'Career changer transitioning into tech',
    avatarUrl: 'https://randomuser.me/api/portraits/men/3.jpg'
  },
  {
    name: 'Emma Mentee',
    email: 'emma@example.com',
    password: 'password123',
    role: 'mentee',
    bio: 'Product manager seeking guidance on leadership',
    avatarUrl: 'https://randomuser.me/api/portraits/women/3.jpg'
  }
];

const mentorProfiles = [
  {
    title: 'Senior Software Engineer',
    expertise: ['JavaScript', 'React', 'Node.js', 'System Design'],
    hourlyRate: 50,
    availability: {
      monday: [{start: '09:00', end: '12:00'}, {start: '14:00', end: '17:00'}],
      tuesday: [{start: '09:00', end: '12:00'}],
      wednesday: [],
      thursday: [{start: '14:00', end: '17:00'}],
      friday: [{start: '09:00', end: '12:00'}],
      saturday: [],
      sunday: []
    },
    isAvailable: true,
    rating: 4.8,
    reviewCount: 25
  },
  {
    title: 'Product Manager',
    expertise: ['Product Strategy', 'Agile', 'User Research', 'Roadmapping'],
    hourlyRate: 60,
    availability: {
      monday: [{start: '10:00', end: '14:00'}],
      tuesday: [{start: '10:00', end: '14:00'}],
      wednesday: [{start: '10:00', end: '14:00'}],
      thursday: [],
      friday: [],
      saturday: [{start: '10:00', end: '12:00'}],
      sunday: []
    },
    isAvailable: true,
    rating: 4.5,
    reviewCount: 15
  },
  {
    title: 'UX/UI Designer',
    expertise: ['UI Design', 'UX Research', 'Figma', 'Design Systems'],
    hourlyRate: 45,
    availability: {
      monday: [],
      tuesday: [{start: '14:00', end: '18:00'}],
      wednesday: [{start: '14:00', end: '18:00'}],
      thursday: [{start: '14:00', end: '18:00'}],
      friday: [{start: '14:00', end: '18:00'}],
      saturday: [],
      sunday: []
    },
    isAvailable: true,
    rating: 4.7,
    reviewCount: 20
  }
];

// Seed data function
const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await MentorProfile.deleteMany({});
    await Booking.deleteMany({});
    await Message.deleteMany({});
    await Credit.deleteMany({});
    await Transaction.deleteMany({});
    await Notification.deleteMany({});

    logger.info('Cleared existing data');

    // Create users
    const createdUsers = [];
    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      const newUser = await User.create({
        ...user,
        password: hashedPassword
      });
      createdUsers.push(newUser);
    }

    logger.info(`Created ${createdUsers.length} users`);

    // Create mentor profiles
    const mentors = createdUsers.filter(user => user.role === 'mentor');
    const createdProfiles = [];

    for (let i = 0; i < mentors.length; i++) {
      const profile = await MentorProfile.create({
        userId: mentors[i]._id,
        ...mentorProfiles[i]
      });
      createdProfiles.push(profile);
    }

    logger.info(`Created ${createdProfiles.length} mentor profiles`);

    // Add credits to mentees
    const mentees = createdUsers.filter(user => user.role === 'mentee');
    for (const mentee of mentees) {
      // Create credit purchase transaction
      const transaction = await Transaction.create({
        user: mentee._id,
        type: 'credit_purchase',
        amount: 50,
        paymentMethod: 'stripe',
        paymentId: `seed_payment_${mentee._id}`,
        details: {
          creditQuantity: 10,
          pricePerCredit: 5
        },
        status: 'completed'
      });

      // Add credits to user
      await Credit.create({
        user: mentee._id,
        balance: 10,
        history: [
          {
            type: 'purchase',
            amount: 10,
            transactionId: transaction._id,
            createdAt: new Date()
          }
        ]
      });
    }

    logger.info(`Added credits to ${mentees.length} mentees`);

    // Create bookings
    const bookingStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    const bookings = [];

    for (let i = 0; i < 10; i++) {
      const mentor = mentors[Math.floor(Math.random() * mentors.length)];
      const mentee = mentees[Math.floor(Math.random() * mentees.length)];
      const status = bookingStatuses[Math.floor(Math.random() * bookingStatuses.length)];
      
      // Create a date between now and 30 days in the future
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + Math.floor(Math.random() * 30));
      
      // Round to nearest hour
      futureDate.setMinutes(0, 0, 0);
      futureDate.setHours(9 + Math.floor(Math.random() * 8)); // Between 9 AM and 5 PM
      
      const durationMinutes = [30, 60, 90][Math.floor(Math.random() * 3)];
      const creditsSpent = Math.ceil(durationMinutes / 30);
      
      const booking = await Booking.create({
        mentorId: mentor._id,
        menteeId: mentee._id,
        scheduledAt: futureDate,
        durationMinutes,
        notes: `Sample booking ${i + 1} for testing`,
        status,
        creditsSpent,
        meetingLink: status === 'confirmed' || status === 'completed' ? 'https://zoom.us/j/123456789' : undefined,
        completedAt: status === 'completed' ? new Date() : undefined,
        cancelledAt: status === 'cancelled' ? new Date() : undefined,
        cancelledBy: status === 'cancelled' ? (Math.random() > 0.5 ? mentor._id : mentee._id) : undefined,
        cancellationReason: status === 'cancelled' ? 'Schedule conflict' : undefined
      });
      
      // Add feedback for completed bookings
      if (status === 'completed' && Math.random() > 0.3) {
        booking.feedback = {
          mentee: {
            rating: Math.floor(Math.random() * 2) + 4, // 4 or 5 stars
            comment: 'Great session, very helpful!',
            createdAt: new Date()
          }
        };
        
        if (Math.random() > 0.5) {
          booking.feedback.mentor = {
            rating: Math.floor(Math.random() * 2) + 4, // 4 or 5 stars
            comment: 'Excellent mentee, came prepared with questions',
            createdAt: new Date()
          };
        }
        
        await booking.save();
      }
      
      bookings.push(booking);
    }

    logger.info(`Created ${bookings.length} bookings`);

    // Create messages
    const messages = [];
    for (let i = 0; i < 50; i++) {
      const mentor = mentors[Math.floor(Math.random() * mentors.length)];
      const mentee = mentees[Math.floor(Math.random() * mentees.length)];
      const sender = Math.random() > 0.5 ? mentor : mentee;
      const receiver = sender === mentor ? mentee : mentor;
      
      // Associate some messages with bookings
      const associatedBooking = Math.random() > 0.7 
        ? bookings.find(b => 
            (b.mentorId.toString() === mentor._id.toString() && 
             b.menteeId.toString() === mentee._id.toString()))
        : null;
      
      const message = await Message.create({
        sender: sender._id,
        receiver: receiver._id,
        content: `Sample message ${i + 1} for testing`,
        bookingId: associatedBooking ? associatedBooking._id : undefined,
        read: Math.random() > 0.3 // 70% chance of being read
      });
      
      messages.push(message);
    }

    logger.info(`Created ${messages.length} messages`);

    // Create notifications
    const notificationTypes = [
      'booking_request', 'booking_confirmed', 'booking_cancelled', 
      'session_reminder', 'session_completed', 'feedback_received',
      'credit_added', 'credit_deducted'
    ];
    
    for (let i = 0; i < 30; i++) {
      const user = createdUsers[Math.floor(Math.random() * createdUsers.length)];
      const type = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
      const title = `${type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}`;
      
      await Notification.create({
        recipient: user._id,
        type,
        title,
        message: `Sample notification ${i + 1} for testing`,
        read: Math.random() > 0.5, // 50% chance of being read
        data: {}
      });
    }

    logger.info('Created 30 notifications');

    logger.info('Database seeded successfully');
  } catch (error) {
    logger.error('Error seeding database:', error);
  } finally {
    mongoose.disconnect();
    logger.info('MongoDB disconnected');
  }
};

// Run the seed function
connectDB().then(() => {
  seedData();
});