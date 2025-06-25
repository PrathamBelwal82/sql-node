const bcrypt = require('bcrypt');
const pool = require('./db');
const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL); // Use Redis for token storage

const clients = [
  {
    id: 'my-client-id',
    clientId: 'my-client-id',
    clientSecret: 'my-client-secret',
    grants: ['password'],
    redirectUris: []
  }
];

module.exports = {
  // Fetch token info from Redis
  getAccessToken: async (accessToken) => {
    const tokenStr = await redis.get(`accessToken:${accessToken}`);
    if (!tokenStr) return null;

    const token = JSON.parse(tokenStr);

    return {
      accessToken: token.accessToken,
      accessTokenExpiresAt: new Date(token.accessTokenExpiresAt),
      user: token.user,
      client: { id: token.client.id || 'my-client-id' }
    };
  },

  // Validate client credentials
  getClient: async (clientId, clientSecret) => {
    const client = clients.find(c => c.clientId === clientId);
    if (!client) return null;
    if (clientSecret && client.clientSecret !== clientSecret) return null;
    return client;
  },

  // Authenticate user from DB
  getUser: async (username, password) => {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [username]);
    if (rows.length === 0) return null;

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return null;

    return { id: user.id, email: user.email };
  },

  // Save token to Redis
  saveToken: async (token, client, user) => {

    const redisKey = `accessTokenByEmail:${user.email}`;
  const existingToken = await redis.get(redisKey);

  if (existingToken) {
    const tokenData = {
      accessToken: existingToken,
      accessTokenExpiresAt: new Date(Date.now() + 60*1000), // Took 20 sec for testing
      client: { id: client.id || 'my-client-id' },
      user: { id: user.id, email: user.email }
    };
    return tokenData;
  }

  // No token stored, save new token
  const tokenData = {
    accessToken: token.accessToken,
    accessTokenExpiresAt: token.accessTokenExpiresAt,
    client: { id: client.id || 'my-client-id' },
    user: { id: user.id, email: user.email }
  };

  // store 2 mappings in Redis:
  await redis.set(`accessToken:${token.accessToken}`, user.email,'EX', 60);
  await redis.set(`accessTokenByEmail:${user.email}`, token.accessToken,'EX', 60);

  return tokenData;
},
  verifyScope: () => true
};
