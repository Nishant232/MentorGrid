const express = require('express');
const { body, query } = require('express-validator');
const mentorController = require('../controllers/mentorController');
const auth = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');
const { validate } = require('../middleware/validate');

const router = express.Router();

/**
 * @route POST /api/v1/mentors/setup
 * @desc Setup or update mentor profile
 * @access Private (Mentors only)
 */
router.post(
  '/setup',
  auth,
  roleCheck('mentor'),
  validate([
    body('headline')
      .trim()
      .isLength({ min: 10, max: 100 })
      .withMessage('Headline must be between 10 and 100 characters'),
    body('bio')
      .trim()
      .isLength({ min: 50, max: 1000 })
      .withMessage('Bio must be between 50 and 1000 characters'),
    body('expertise')
      .isArray()
      .withMessage('Expertise must be an array')
      .custom(value => value.length > 0)
      .withMessage('At least one expertise is required'),
    body('skills')
      .isArray()
      .withMessage('Skills must be an array')
      .custom(value => value.length > 0)
      .withMessage('At least one skill is required'),
    body('experienceYears')
      .isInt({ min: 0 })
      .withMessage('Experience years must be a positive number'),
    body('hourlyRate')
      .isNumeric()
      .withMessage('Hourly rate must be a number'),
    body('languages')
      .optional()
      .isArray()
      .withMessage('Languages must be an array'),
    body('socialLinks')
      .optional()
      .isObject()
      .withMessage('Social links must be an object')
  ]),
  mentorController.setupProfile
);

/**
 * @route GET /api/v1/mentors
 * @desc Search and filter mentors
 * @access Public
 */
router.get(
  '/',
  validate([
    query('q').optional().isString(),
    query('expertise').optional().isString(),
    query('skills').optional().isString(),
    query('minRate').optional().isInt({ min: 0 }),
    query('maxRate').optional().isInt({ min: 0 }),
    query('languages').optional().isString(),
    query('rating').optional().isFloat({ min: 0, max: 5 }),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('sortBy').optional().isIn(['ratings.average', 'hourlyRate', 'experienceYears']),
    query('sortOrder').optional().isIn(['asc', 'desc'])
  ]),
  mentorController.searchMentors
);

/**
 * @route GET /api/v1/mentors/:id
 * @desc Get mentor profile by ID
 * @access Public
 */
router.get(
  '/:id',
  validate([
    query('id').isMongoId().withMessage('Invalid mentor ID')
  ]),
  mentorController.getMentorProfile
);

/**
 * @route PUT /api/v1/mentors/:id/availability
 * @desc Update mentor availability
 * @access Private (Mentor only)
 */
router.put(
  '/:id/availability',
  auth,
  roleCheck('mentor'),
  validate([
    body('availability')
      .isArray()
      .withMessage('Availability must be an array')
      .custom(availability => {
        const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        return availability.every(slot => 
          validDays.includes(slot.day.toLowerCase()) &&
          Array.isArray(slot.slots) &&
          slot.slots.every(time => 
            time.from && time.to &&
            /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time.from) &&
            /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time.to)
          )
        );
      })
      .withMessage('Invalid availability format')
  ]),
  mentorController.updateAvailability
);

/**
 * @route POST /api/v1/mentors/:id/certificates
 * @desc Upload mentor certificate
 * @access Private (Mentor only)
 */
router.post(
  '/:id/certificates',
  auth,
  roleCheck('mentor'),
  validate([
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Certificate title is required'),
    body('issuedBy')
      .trim()
      .notEmpty()
      .withMessage('Issuing organization is required'),
    body('issuedDate')
      .isISO8601()
      .withMessage('Invalid issue date format'),
    body('expiryDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid expiry date format')
  ]),
  mentorController.uploadCertificate
);

module.exports = router;
