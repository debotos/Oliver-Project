//=============================
//------/ADD ROUTES
//=============================
var express = require('express');
var router = express.Router();
const moment = require('moment');

var Wordcard = require('../models/wordcards.js');
var User = require('../models/users.js');
const Calender = require('../models/calender');
const Card = require('../models/card.js');

router.get('/add', isLoggedIn, async (req, res) => {
  const todaysWordCardsDoc = await Card.findOne({ author: req.user._id });
  let todaysCard = todaysWordCardsDoc.wordcards;
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
              // Now everything save, so add +1 point to show in calender
              Calender.findOne({ author: req.user._id }, function(
                err,
                userCalenderDoc
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

                  if (!userCalenderDoc) {
                    // This user yet don't have any activity in calender
                    // first create an entry for this user
                    new Calender({
                      author: req.user._id,
                      username: foundUser.username
                    })
                      .save()
                      .then(newCalenderDoc => {
                        console.log(newCalenderDoc);

                        // you have to push new item[today]

                        // add data to users model (Calender) data array
                        Calender.findOne({ author: req.user._id }).then(
                          calenderDoc => {
                            calenderDoc.data.unshift(itemToSave);
                            calenderDoc
                              .save()
                              .then(userCalender => res.redirect('/add'))
                              .catch(err => res.status(404).json(err));
                          }
                        );
                      });
                  } else {
                    // user already have an entry in calender db
                    let calenderDoc = userCalenderDoc;
                    // add data to users model (Calender) data array
                    let daysArray = calenderDoc.data.map(
                      singleItem => singleItem.date
                    );

                    if (daysArray.includes(today)) {
                      // today's entry already have
                      // now you have to just update

                      Calender.findOne({ author: req.user._id })
                        .then(calenderData => {
                          // Get Update index
                          const updateIndex = calenderData.data
                            .map(item => {
                              // console.log('Item ID => ', item.id);
                              return item.date;
                            })
                            .indexOf(today);

                          let currentCalenderDataArray =
                            calenderData.data[updateIndex];

                          currentCalenderDataArray.point =
                            currentCalenderDataArray.point + point; // updating the point(adding 1)

                          currentCalenderDataArray.isTodayAlreadyLoggedIn = true;

                          calenderData
                            .save()
                            .then(updatedCalenderData => res.redirect('/add'));
                        })
                        .catch(err => res.status(404).json(err));
                    } else {
                      // you have to push new item[today]
                      // add data to users model (Calender) data array
                      Calender.findOne({ author: req.user._id }).then(
                        calenderDoc => {
                          calenderDoc.data.unshift(itemToSave);
                          calenderDoc
                            .save()
                            .then(userCalender => res.redirect('/add'))
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
