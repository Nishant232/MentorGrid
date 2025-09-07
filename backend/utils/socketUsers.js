// Store connected users in memory
const connectedUsers = new Map();

/**
 * Add a user to connected users
 * @param {string} userId - The user's ID
 * @param {string} socketId - The socket connection ID
 */
const addUser = (userId, socketId) => {
  connectedUsers.set(userId, socketId);
};

/**
 * Remove a user from connected users
 * @param {string} userId - The user's ID
 */
const removeUser = (userId) => {
  connectedUsers.delete(userId);
};

/**
 * Get a user's socket ID
 * @param {string} userId - The user's ID
 * @returns {string|null} The socket ID if found, null otherwise
 */
const getSocketId = (userId) => {
  return connectedUsers.get(userId) || null;
};

/**
 * Check if a user is online
 * @param {string} userId - The user's ID
 * @returns {boolean} True if user is connected, false otherwise
 */
const isUserOnline = (userId) => {
  return connectedUsers.has(userId);
};

module.exports = {
  addUser,
  removeUser,
  getSocketId,
  isUserOnline
};
