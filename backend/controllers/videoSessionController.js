const VideoSessionService = require('../services/videoSessionService');

/**
 * Initialize a video session
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.initializeSession = async (req, res) => {
  const { bookingId } = req.params;
  const userId = req.user.id;

  const sessionData = await VideoSessionService.initializeSession({
    bookingId,
    userId
  });

  res.status(200).json({
    status: 'success',
    data: sessionData
  });
};

/**
 * End a video session
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.endSession = async (req, res) => {
  const { bookingId } = req.params;
  const { recordingUrl } = req.body;
  const userId = req.user.id;

  const booking = await VideoSessionService.endSession({
    bookingId,
    userId,
    recordingUrl
  });

  res.status(200).json({
    status: 'success',
    data: { booking }
  });
};

/**
 * Report technical issues
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.reportIssue = async (req, res) => {
  const { bookingId } = req.params;
  const { issue } = req.body;
  const userId = req.user.id;

  const booking = await VideoSessionService.reportTechnicalIssue({
    bookingId,
    userId,
    issue,
    timestamp: new Date()
  });

  res.status(200).json({
    status: 'success',
    data: { booking }
  });
};

/**
 * Get session recordings
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getRecordings = async (req, res) => {
  const { bookingId } = req.params;
  const userId = req.user.id;

  const recordings = await VideoSessionService.getSessionRecordings({
    bookingId,
    userId
  });

  res.status(200).json({
    status: 'success',
    data: { recordings }
  });
};
