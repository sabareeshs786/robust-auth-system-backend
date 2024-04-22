const crypto = require('crypto');

const encrypt = (text, key, iv, algorithm='aes-256-cbc') => {
  if (!key || !iv) {
    throw new Error('Encryption key and IV must be defined in .env file');
  }

  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

const decrypt = (encryptedText, key, iv, algorithm='aes-256-cbc') => {
  if (!key || !iv) {
    throw new Error('Encryption key and IV must be defined in .env file');
  }

  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

module.exports = {encrypt, decrypt};