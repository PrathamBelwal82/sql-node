const redis = require('../redis'); // same Redis client


const authenticateRequest = async (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];
  const email = await redis.get(`accessToken:${token}`);

  if (!email) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.email = email; // pass email to next handler
  next();
};

module.exports = { authenticateRequest };
