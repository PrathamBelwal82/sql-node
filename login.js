require('dotenv').config();
const express = require('express');
const session = require('express-session');
const Redis = require('ioredis');
const RedisStore = require('connect-redis')(session);
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const cookieParser = require('cookie-parser');
const OAuth2Server = require('oauth2-server');
const pool = require('./db');
const app = express();
const { authenticateRequest } = require('./middleware/authenticateRequest');
app.use(cookieParser());
app.use(express.static('public'));

app.use(express.json()); // ✅ For parsing JSON request bodies
app.use(express.urlencoded({ extended: true })); 
// Redis client setup
const redisClient = new Redis(process.env.REDIS_URL);
const redisStore = new RedisStore({
  client: redisClient,
  prefix: 'sess:',
});
const Request = OAuth2Server.Request;
const Response = OAuth2Server.Response;
const oauthModel = require('./oAuthModel');
const oauth = new OAuth2Server({
  model: oauthModel,
  accessTokenLifetime: 60,
   requireClientAuthentication: {
    password: false
  }
});
// Session middleware
app.use(session({
  store: redisStore,
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60, // 1 hour
    httpOnly: true,
    secure: false, // set to true if using HTTPS
  }
}));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Passport config
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/auth/google/callback',
}, (accessToken, refreshToken, profile, done) => {
  // Save profile or user id here if using DB
  return done(null, profile);
}));

passport.serializeUser((user, done) => {
  done(null, user); // store whole user in session
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

app.post('/login/token', async (req, res) => {
  const request = new Request(req);
  const response = new Response(res);

  try {
    const token = await oauth.token(request, response);
    console.log(token.accessToken);

    // Set token in HTTP-only cookie
    res.cookie('access_token', token.accessToken, {
      httpOnly: true,
      secure: false,
      maxAge: 3600 * 1000,
      sameSite: 'lax',
    });
    res.json({ message: 'Login successful' });
    
  } catch (err) {
    console.error('Token error:', err);
    res.status(400).json({ error: err.message });
  }
});
app.get('/token/details', authenticateRequest, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, email, username, full_name FROM users WHERE email = ?', [req.email]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: rows[0] });
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/', (req, res) => {
    //Redis
    /*
  if (req.isAuthenticated()) {
    return res.redirect('/profile');
  }*/
  if (req.cookies['connect.sid']) {
  return res.redirect('/profile');
}

  res.sendFile(__dirname + '/public/login.html');
});



app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] ,
  prompt: 'select_account'}
));

app.get('/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/',
    successRedirect: '/profile',
  })
);
// Save timestamp in session when page is loaded
app.use(express.urlencoded({ extended: true }));
//OTP
app.post('/otp-login',async(req, res) => {
  const enteredOtp = req.body.otp;
  const OTP = '233333';

  if (!req.session.otpStart) {
    req.session.otpStart = Date.now();
  } 

  const now = Date.now();
  if (now - req.session.otpStart > 30000) {
    req.session.destroy(() => {
      res.send('<h3>OTP expired. <a href="/">Try again</a></h3>');
    });
    return;
  }
  if (enteredOtp !== OTP) {
    return req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.send('<h3>Invalid OTP. <a href="/">Try again</a></h3>');
    });}
  if (enteredOtp === OTP) {
    req.session.loggedIn = true;
    req.user = { displayName: 'OTP User' };
    return res.redirect('/profile');
  }
});

app.get('/me', authenticateRequest, (req, res) => {
  res.json({
    email: req.email
  });
});

app.post('/verify-email', async (req, res) => {
  const { email } = req.body;

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

    if (rows.length > 0) {
      return res.json({ exists: true });
    } else {
      return res.json({ exists: false });
    }
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ exists: false, error: 'Server error' });
  }
});

app.get('/profile', (req, res) => {
  /*if (!req.isAuthenticated()) {
    return res.redirect('/');
  }*/
  if (!req.cookies['connect.sid']) {
  return res.redirect('/');
}

  res.send(`<h2>Welcome</h2><a href="/logout">Logout</a>`);
});

// Deletes session from redis 
app.get('/logout', (req, res) => {
  req.logout(() => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destruction error:", err);
      }
      res.clearCookie('connect.sid'); //Cookie Clear
      res.redirect('/');
    });
  });
});


// Start server
app.listen(8000, () => {
  console.log('OAuth2.0 backend running on http://localhost:8000');
});
