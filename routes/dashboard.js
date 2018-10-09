//=============================
//------/DASHBOARD ROUTES
//=============================
var express = require('express');
var router = express.Router();

var Wordcard = require('../models/wordcards.js');
var User = require('../models/users.js');
const Calender = require('../models/calender');
const Card = require('../models/card');

router.get('/dashboard', isLoggedIn, async (req, res) => {
  const wordcards = await Wordcard.find({ author: req.user._id });
  const user = await User.findOne(
    { username: req.user.username },
    'dailyReviewComplete'
  );
  let todaysCard = [];
  const todaysWordCardsDoc = await Card.findOne({ author: req.user._id });
  // if card collection have the data send it
  if (todaysWordCardsDoc) {
    todaysCard = todaysWordCardsDoc.wordcards;
  } else {
    console.log(
      'Recalculating everything & saving to Card collection for today future use!'
    );
    // calculate the RepetitioFactor and save it to Card collection for today future use
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
        user => user.maxReview
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
      // save the data to Card collection for today future use
      Card.findOne(
        {
          author: req.user._id
        },
        function(err, user) {
          if (err) {
            console.log(err);
          } else {
            if (!user) {
              // This user yet don't have any activity in Card
              // first create an entry for this user
              new Card({
                author: req.user._id,
                username: req.user.username
              })
                .save()
                .then(newCardDoc => {
                  // save the data to Card collection for today future use
                  Card.findOne({ author: req.user._id }).then(CardDoc => {
                    CardDoc.wordcards = [...finalCards];
                    CardDoc.save()
                      .then(userCard => {
                        // console.log(userCard.wordcards);
                        todaysCard = userCard.wordcards;
                      })
                      .catch(err => res.status(404).json(err));
                  });
                });
            } else {
              Card.findOne({ author: req.user._id }).then(CardDoc => {
                CardDoc.wordcards = [...finalCards];
                CardDoc.save()
                  .then(userCard => (todaysCard = userCard.wordcards))
                  .catch(err => res.status(404).json(err));
              });
            }
          }
        }
      );
    }
  }
  // console.log({ wordcards, user, todaysCard });
  res.render('dashboard', { wordcards, user, todaysCard });
});

// For calender

router.get('/calender/data', async (req, res) => {
  console.log('Asking for calendar data => ', req.user);

  let response = [];
  Calender.findOne({ author: req.user._id })
    .then(userCalenderDoc => {
      userCalenderDoc.data.forEach(singleItem => {
        // previous library want
        // let timestamp = singleItem.timestamp;
        // response[timestamp] = singleItem.point;
        let dataObj = {};
        dataObj['date'] = new Date(singleItem.datetime);
        dataObj['count'] = singleItem.point;
        response.push(dataObj);
      });
      // console.log(response);
      // check this response, this is the format that the calender need to be feed
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
