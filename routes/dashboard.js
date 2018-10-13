//=============================
//------/DASHBOARD ROUTES
//=============================
var express = require('express');
var router = express.Router();

var Wordcard = require('../models/wordcards.js');
var User = require('../models/users.js');
const Calendar = require('../models/calendar');
const Review = require('../models/review.js');

router.get('/dashboard', isLoggedIn, async (req, res) => {
  const wordcards = await Wordcard.find({ author: req.user._id });
  const user = await User.findOne(
    { username: req.user.username },
    'dailyReviewComplete'
  );
  let todaysCard = [];
  const todaysWordCardsDoc = await Review.findOne({ author: req.user._id });
  // if card collection have the data send it
  if (todaysWordCardsDoc) {
    todaysCard = todaysWordCardsDoc.wordcards;
  } else {
    console.log(
      'Recalculating everything & saving to Review collection for today future use!'
    );
    // calculate the RepetitioFactor and save it to Review collection for today future use
    const wordcards = await Wordcard.find({ author: req.user._id });
    if (wordcards.length > 0) {
      // pull out the RepetitioFactor value
      let wordcardsWithRepetitioFactor = wordcards.map(x => {
        return {
          ...x._doc,
          repetitioFactor: x.get('RepetitioFactor'),
          reviewed: false
        };
      });
      // get the maxReview of current user
      let maxReview = await User.findOne({ username: req.user.username }).then(
        userDocument => userDocument.maxReview
      );
      if (!maxReview) {
        return res.render('dashboard', {
          wordcards,
          user,
          todaysCard
        });
      }
      // get the RepetitioFactor under 0.5 and over 0.5
      let wordcardsUnderPointFiveRepetitioFactor = [];
      let wordcardsOverPointFiveRepetitioFactor = [];
      wordcardsWithRepetitioFactor.forEach(singleCard => {
        if (parseFloat(singleCard.repetitioFactor) < 0.5) {
          wordcardsUnderPointFiveRepetitioFactor.push(singleCard);
        } else {
          wordcardsOverPointFiveRepetitioFactor.push(singleCard);
        }
      });

      let finalCards = [];
      if (wordcardsUnderPointFiveRepetitioFactor.length >= maxReview) {
        for (let index = 0; index < maxReview; index++) {
          finalCards.push(wordcardsUnderPointFiveRepetitioFactor[index]);
        }
      } else {
        finalCards = [...wordcardsUnderPointFiveRepetitioFactor];
      }
      // Now calculation is complete
      // save the data to Review collection for today future use
      Review.findOne(
        {
          author: req.user._id
        },
        function(err, dbuser) {
          if (err) {
            console.log(err);
          } else {
            if (!dbuser) {
              // This user yet don't have any activity in Review
              // first create an entry for this user
              new Review({
                author: req.user._id,
                username: req.user.username
              })
                .save()
                .then(newCardDoc => {
                  // save the data to Review collection for today future use
                  Review.findOne({ author: req.user._id }).then(CardDoc => {
                    CardDoc.wordcards = [...finalCards];
                    CardDoc.save()
                      .then(userCard => {
                        // console.log(userCard.wordcards);
                        todaysCard = userCard.wordcards;
                        return res.render('dashboard', {
                          wordcards,
                          user,
                          todaysCard
                        });
                      })
                      .catch(err => res.status(404).json(err));
                  });
                });
            } else {
              Review.findOne({ author: req.user._id }).then(CardDoc => {
                CardDoc.wordcards = [...finalCards];
                CardDoc.save()
                  .then(userCard => {
                    todaysCard = userCard.wordcards;
                    return res.render('dashboard', {
                      wordcards,
                      user,
                      todaysCard
                    });
                  })
                  .catch(err => res.status(404).json(err));
              });
            }
          }
        }
      );
    } else {
      return res.render('dashboard', {
        wordcards,
        user,
        todaysCard
      });
    }
  }
  // console.log({ wordcards, user, todaysCard });
  res.render('dashboard', { wordcards, user, todaysCard });
});

// For calendar

router.get('/calendar/data', async (req, res) => {
  // console.log('Asking for calendar data => ', req.user);

  let response = [];
  Calendar.findOne({ author: req.user._id })
    .then(userCalendarDoc => {
      userCalendarDoc.data.forEach(singleItem => {
        // previous library want
        // let timestamp = singleItem.timestamp;
        // response[timestamp] = singleItem.point;
        let dataObj = {};
        dataObj['date'] = new Date(singleItem.datetime);
        dataObj['count'] = singleItem.point;
        response.push(dataObj);
      });
      // console.log(response);
      // check this response, this is the format that the calendar need to be feed
      return res.json(response);
    })
    .catch(err => res.status(404).json(err));
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

module.exports = router;

// res.json({
//   '1514780712': 50,
//   '1519878312': 9,
//   '1525148712': 5,
//   '1530419112': 24,
//   '1509510312': 25,
//   '1512102312': 35,
//   '1513311912': 49
// });
