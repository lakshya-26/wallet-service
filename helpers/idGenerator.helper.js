const crypto = require('crypto');

/**
 * Generate a nanoid-compatible short unique ID
 * Uses crypto.randomBytes which is CommonJS compatible
 * @param {number} size - Length of the ID (default: 12)
 * @returns {string} - A URL-safe unique ID
 */
const generateId = (size = 12) => {
  const alphabet =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
  const bytes = crypto.randomBytes(size);
  let id = '';
  for (let i = 0; i < size; i++) {
    id += alphabet[bytes[i] % alphabet.length];
  }
  return id;
};

module.exports = {
  generateId,
};
