// redis.js
const Redis = require('ioredis');

// If you're using REDIS_URL from .env, use:
// const redis = new Redis(process.env.REDIS_URL);

const redis = new Redis(); // Connects to localhost:6379 by default

module.exports = redis;
