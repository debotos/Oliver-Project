//=============================
// DEPENDENCIES
//=============================
var express = require('express'),
  app = express(),
  methodoverride = require('method-override'),
  mongoose = require('mongoose'),
  bodyParser = require('body-parser'),
  passport = require('passport'),
  LocalStrategy = require('passport-local');
(Wordcard = require('./models/wordcards.js')),
  (User = require('./models/users.js'));

//=============================
// CONFIGURATION
//=============================
//---Sessions
app.use(
  require('express-session')({
    secret: 'thisisarandomsecretbrah',
    resave: false,
    saveUninitialized: false
  })
);
//---Passport
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
//---Database connection
let MONGO_DB;
if (process.env.MONGO_URI) {
  MONGO_DB = process.env.MONGO_URI;
} else {
  MONGO_DB = 'mongodb://localhost/repetitiodesign';
}
console.log('MongoDB URI =>', MONGO_DB);
mongoose.connect(MONGO_DB, {
  useNewUrlParser: true
});
//======================
// Running cron job
//=====================
require('./utils/cronJob')(mongoose);
//---Directory
app.use('/public', express.static(__dirname + '/public'));
//---Method Override
app.use(methodoverride('_method'));
//---Body Parser
app.use(bodyParser.urlencoded({ extended: true }));
//---EJS view engine
app.set('view engine', 'ejs');
require('ejs');
//---Routing
var router = express.Router();
app.use(router);

//=============================
// ROUTES
//=============================
var authenticationRoutes = require('./routes/auth'),
  dashboardRoutes = require('./routes/dashboard'),
  settingsRoutes = require('./routes/settings'),
  libraryRoutes = require('./routes/library'),
  reviewRoutes = require('./routes/review'),
  addWordRoutes = require('./routes/add'),
  indexRoutes = require('./routes/index');
app.use(authenticationRoutes);
app.use(settingsRoutes);
app.use(dashboardRoutes);
app.use(libraryRoutes);
app.use(reviewRoutes);
app.use(addWordRoutes);
app.use(indexRoutes);

//setup the server
const port = process.env.PORT || 5001;
app.listen(port, function() {
  console.log('Server started at localhost:5001. Ctrl+C to exit.');
});
