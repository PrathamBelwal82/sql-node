require('dotenv').config();
const express = require('express');
const session = require('express-session');
const Redis = require('ioredis');
const RedisStore = require('connect-redis')(session);
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const cookieParser = require('cookie-parser');


const app = express();
app.use(cookieParser());
app.use(express.static('public'));

// Redis client setup
const redisClient = new Redis(process.env.REDIS_URL);
const redisStore = new RedisStore({
  client: redisClient,
  prefix: 'sess:',
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

app.get('/profile', (req, res) => {
  /*if (!req.isAuthenticated()) {
    return res.redirect('/');
  }*/
  if (!req.cookies[connect.sid]) {
  return res.redirect('/');
}

  res.send(`<h2>Welcome ${req.user.displayName}</h2><pre>${JSON.stringify(req.user, null, 2)}</pre><a href="/logout">Logout</a>`);
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
app.listen(3000, () => {
  console.log('OAuth2.0 backend running on http://localhost:3000');
});
