const redis = require('../redis'); // same Redis client

const authenticateRequest = async (req, res, next) => {
  // Try Bearer token first
  let token;

  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  // Fallback to cookie
  if (!token && req.cookies?.['access_token']) {
    token = req.cookies['access_token'];
  }

  // No token found
  if (!token) {
    return res.status(401).json({ error: 'Missing access token in header or cookie' });
  }

  // Try to get associated email from Redis
  const email = await redis.get(`accessToken:${token}`);

  if (!email) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  console.log('Authenticated email:', email);
  req.email = email;
  next();
};

module.exports = { authenticateRequest };
