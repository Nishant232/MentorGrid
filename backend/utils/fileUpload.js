const multer = require('multer');
const path = require('path');
const { createError } = require('./error');

// Allowed file types and their mime types
const ALLOWED_FILE_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/webp'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  avatar: ['image/jpeg', 'image/png', 'image/webp']
};

// Maximum file sizes (in bytes)
const MAX_FILE_SIZES = {
  image: 5 * 1024 * 1024, // 5MB
  document: 10 * 1024 * 1024, // 10MB
  avatar: 2 * 1024 * 1024 // 2MB
};

/**
 * Configure local storage
 */
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/';
    
    // Determine subfolder based on file type
    if (ALLOWED_FILE_TYPES.image.includes(file.mimetype)) {
      uploadPath += 'images/';
    } else if (ALLOWED_FILE_TYPES.document.includes(file.mimetype)) {
      uploadPath += 'documents/';
    } else if (file.fieldname === 'avatar') {
      uploadPath += 'avatars/';
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

/**
 * File filter function
 * @param {Object} fileTypes - Allowed mime types
 * @returns {Function} File filter function for multer
 */
const fileFilter = (fileTypes) => (req, file, cb) => {
  if (!fileTypes.includes(file.mimetype)) {
    cb(createError(400, 'Invalid file type'), false);
    return;
  }
  cb(null, true);
};

/**
 * Create multer upload instance
 * @param {string} type - File type (image, document, avatar)
 * @param {number} maxCount - Maximum number of files
 * @returns {Object} Multer upload instance
 */
const upload = (type, maxCount = 1) => {
  return multer({
    storage: localStorage,
    fileFilter: fileFilter(ALLOWED_FILE_TYPES[type]),
    limits: {
      fileSize: MAX_FILE_SIZES[type]
    }
  }).array('files', maxCount);
};

/**
 * Single file upload middleware
 * @param {string} type - File type (image, document, avatar)
 * @param {string} fieldName - Form field name
 * @returns {Function} Multer middleware
 */
const uploadSingle = (type, fieldName) => {
  return multer({
    storage: localStorage,
    fileFilter: fileFilter(ALLOWED_FILE_TYPES[type]),
    limits: {
      fileSize: MAX_FILE_SIZES[type]
    }
  }).single(fieldName);
};

// TODO: Add S3 storage configuration
// const s3Storage = multerS3({...})

module.exports = {
  upload,
  uploadSingle,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZES
};
