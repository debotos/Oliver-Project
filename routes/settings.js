//=============================
//------/SETTINGS ROUTES
//=============================
var express = require('express');
var router = express.Router();

var Wordcard = require('../models/wordcards.js');
var User = require('../models/users.js');
const Card = require('../models/card.js');

router.get('/settings', isLoggedIn, async (req, res) => {
  const todaysWordCardsDoc = await Card.findOne({ author: req.user._id });
  const user = await User.findOne(
    { username: req.user.username },
    'dailyReviewComplete'
  );
  let todaysCard = todaysWordCardsDoc.wordcards || [];

  res.render('settings', { todaysCard, user });
});

router.post('/user/nativelanguage', isLoggedIn, async (req, res) => {
  let obj = {
    activeLanguages: req.body.language,
    nativeLanguage: req.body.nativelanguage,
    dailyMaxReview: req.body.maxReview
  };
  console.log(obj);

  User.findByIdAndUpdate(
    req.user._id,
    { $set: obj },
    { new: true },
    (err, result) => {
      if (err) {
        console.log(err);
        res.render('error');
      } else res.redirect('/dashboard');
    }
  );
});

// router.delete("/settings/:id", isLoggedIn, function (req, res){
// 	User.findByIdAndRemove(req.user._id, function(err){
// 		if (err){
// 		res.send("error");
// 		} else {
// 		res.redirect("/landing");
// 		}
// 	 		});
// });

// router.delete("/user/:id", isLoggedIn, function (req, res){
// 	User.findByIdAndRemove(req.params.id, function(err){
// 		if (err){
// 		res.send("error");
// 		} else {
// 		res.redirect("/landing");
// 		}
// 	 		});
// });

//push a new active language to the array

// repetitio.co/settings/deleteuser

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

module.exports = router;
