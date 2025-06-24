const bcrypt = require('bcrypt');
const pool = require('./db');
const tokens = new Map();
const clients = [
  {
    id: 'my-client-id',
    clientId: 'my-client-id',         // used in requests
    clientSecret: 'my-client-secret', // required for confidential flows
    grants: ['password'],             // allowed grant types for this client
    redirectUris: []                  // for 'authorization_code' flow (optional here)
  }
];
module.exports = {
  getAccessToken: async (accessToken) => {
    const token = tokens.get(accessToken);
    if (!token) return null;

    return {
      accessToken: token.accessToken,
      accessTokenExpiresAt: token.accessTokenExpiresAt,
      user: token.user,
      client: { id: 'my-client-id' }, // Dummy client
    };
  },

getClient : async  (clientId, clientSecret) => {
  const client = clients.find(c => c.clientId === clientId);
  if (!client) return null;
  if (clientSecret && client.clientSecret !== clientSecret) return null;
  return client;
},




  getUser: async (username, password) => {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [username]);
    if (rows.length === 0) return null;

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return null;

    return { id: user.id, email: user.email };
  },

  saveToken: async (token, client, user) => {
    const tokenData = {
      accessToken: token.accessToken,
      accessTokenExpiresAt: token.accessTokenExpiresAt,
      client: { id: client.id || 'my-client-id' }, 
      user: { id: user.id, email: user.email }
    };
    tokens.set(token.accessToken, tokenData);
    return tokenData;
  },

  verifyScope: () => true,
};
