//=============================
//------/ADD ROUTES
//=============================
var express = require('express');
var router = express.Router();
const moment = require('moment');

var Wordcard = require('../models/wordcards.js');
var User = require('../models/users.js');
const Calendar = require('../models/calendar');
const Review = require('../models/review.js');

router.get('/add', isLoggedIn, async (req, res) => {
  const todaysWordCardsDoc = await Review.findOne({ author: req.user._id });
  let todaysCard = todaysWordCardsDoc ? todaysWordCardsDoc.wordcards : [];
  User.findById(req.user._id, (err, result) => {
    res.render('add', { user: result, todaysCard });
  });
});

//---POST routes

router.post('/add/new', isLoggedIn, function(req, res) {
  var TargetWord = req.body.TargetWord;
  var TargetLanguage = req.body.TargetLanguage;
  var TranslationWord = req.body.TranslationWord;
  var TranslationLanguage = req.body.TranslationLanguage;
  var lastReview = Date.now();
  var author = req.user._id;
  var newWordcard = {
    TargetWord,
    TargetLanguage,
    TranslationWord,
    TranslationLanguage,
    lastReview,
    author
  };
  Wordcard.create(newWordcard, function(err, newlyCreated) {
    if (err) {
      console.log(err);
    } else {
      var id = req.user._id;
      User.findById(id, function(err, foundUser) {
        if (err) {
          console.log(err);
        } else {
          foundUser.wordcards.push(newlyCreated);
          foundUser.save(function(err, data) {
            if (err) {
              console.log(err);
            } else {
              // console.log(data);
              // Now everything save, so add +1 point to show in calendar
              Calendar.findOne({ author: req.user._id }, function(
                err,
                userCalendarDoc
              ) {
                if (err) {
                  console.log(err);
                } else {
                  let point = 1; // add a word, point 1
                  let today = moment().format('DD-MM-YYYY');
                  let timestamp = moment().unix();

                  let itemToSave = {
                    date: today,
                    timestamp,
                    point,
                    isTodayAlreadyLoggedIn: true
                  };

                  if (!userCalendarDoc) {
                    // This user yet don't have any activity in calendar
                    // first create an entry for this user
                    new Calendar({
                      author: req.user._id,
                      username: foundUser.username
                    })
                      .save()
                      .then(newCalendarDoc => {
                        console.log(newCalendarDoc);

                        // you have to push new item[today]

                        // add data to users model (Calendar) data array
                        Calendar.findOne({ author: req.user._id }).then(
                          calendarDoc => {
                            calendarDoc.data.unshift(itemToSave);
                            calendarDoc
                              .save()
                              .then(userCalendar => res.redirect('/add'))
                              .catch(err => res.status(404).json(err));
                          }
                        );
                      });
                  } else {
                    // user already have an entry in calendar db
                    let calendarDoc = userCalendarDoc;
                    // add data to users model (Calendar) data array
                    let daysArray = calendarDoc.data.map(
                      singleItem => singleItem.date
                    );

                    if (daysArray.includes(today)) {
                      // today's entry already have
                      // now you have to just update

                      Calendar.findOne({ author: req.user._id })
                        .then(calendarData => {
                          // Get Update index
                          const updateIndex = calendarData.data
                            .map(item => {
                              // console.log('Item ID => ', item.id);
                              return item.date;
                            })
                            .indexOf(today);

                          let currentCalendarDataArray =
                            calendarData.data[updateIndex];

                          currentCalendarDataArray.point =
                            currentCalendarDataArray.point + point; // updating the point(adding 1)

                          currentCalendarDataArray.isTodayAlreadyLoggedIn = true;

                          calendarData
                            .save()
                            .then(updatedCalendarData => res.redirect('/add'));
                        })
                        .catch(err => res.status(404).json(err));
                    } else {
                      // you have to push new item[today]
                      // add data to users model (Calendar) data array
                      Calendar.findOne({ author: req.user._id }).then(
                        calendarDoc => {
                          calendarDoc.data.unshift(itemToSave);
                          calendarDoc
                            .save()
                            .then(userCalendar => res.redirect('/add'))
                            .catch(err => res.status(404).json(err));
                        }
                      );
                    }
                  }
                }
              });
            }
          });
        }
      });
    }
  });
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

module.exports = router;
