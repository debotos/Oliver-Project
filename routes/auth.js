//=============================
//AUTHENTICATION routes
//=============================
var express = require('express');
var router = express.Router();
var passport = require('passport');
const moment = require('moment');

const Calendar = require('../models/calendar');

var Wordcard = require('../models/wordcards.js');
var User = require('../models/users.js');

router.post('/join', function(req, res) {
  var newUser = new User({ username: req.body.username });
  User.register(newUser, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      return res.render('join');
    }
    passport.authenticate('local')(req, res, function() {
      res.redirect('/settings');
    });
  });
});

router.post(
  '/login',
  passport.authenticate('local', {
    successRedirect: '/home',
    failureRedirect: '/login'
  }),
  function(req, res) {}
);

router.get('/home', isLoggedIn, (req, res) => {
  // just another redirect so that it can be saved on calendar DB
  // Now everything save, so add +1 point to show in calendar

  Calendar.findOne({ author: req.user._id })
    .then(userCalendarData => {
      let point = 1; // add a word, point 1
      let today = moment().format('DD-MM-YYYY');
      let timestamp = moment().unix();
      let itemToSave = {
        date: today,
        timestamp,
        point,
        isTodayAlreadyLoggedIn: true
      };

      if (!userCalendarData) {
        // This user yet don't have any activity in calendar
        // first create an entry for this user
        new Calendar({
          author: req.user._id,
          username: req.user.username
        })
          .save()
          .then(newCalendarDoc => {
            // add data to users model (Calendar) data array
            Calendar.findOne({ author: req.user._id }).then(calendarDoc => {
              calendarDoc.data.unshift(itemToSave);
              calendarDoc
                .save()
                .then(userCalendar => res.redirect('/dashboard'))
                .catch(err => res.status(404).json(err));
            });
          });
      } else {
        // user already have an entry in calendar db
        let calendarDoc = userCalendarData;
        // add data to users model (Calendar) data array
        let daysArray = calendarDoc.data.map(singleItem => singleItem.date);

        if (!daysArray.includes(today)) {
          // you have to push new item[today]

          // add data to users model (Calendar) data array
          Calendar.findOne({ author: req.user._id }).then(calendarDoc => {
            calendarDoc.data.unshift(itemToSave);
            calendarDoc
              .save()
              .then(userCalendar => res.redirect('/dashboard'))
              .catch(err => res.status(404).json(err));
          });
        } else {
          return res.redirect('/dashboard');
        }
      }
    })
    .catch(err => {
      console.log(err);
    });
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

router.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/landing');
});

module.exports = router;
