//=============================
//EXTERNAL/NON-USER routes
//=============================
var express = require('express');
var router = express.Router();

var Wordcard = require('../models/wordcards.js');
var User = require('../models/users.js');

router.get('/', function(req, res) {
  res.render('landing');
});

router.get('/landing', function(req, res) {
  res.render('landing');
});

router.get('/contact', function(req, res) {
  res.render('contact');
});

router.get('/login', function(req, res) {
  res.render('login');
});

router.get('/join', function(req, res) {
  res.render('join');
});

router.get('/reset', function(req, res) {
  res.render('reset');
});

router.get('/terms', function(req, res) {
  res.render('terms');
});

router.get('/privacy', function(req, res) {
  res.render('privacy');
});

//LANGUAGE RESOURCES PAGES

router.get('/english', function(req, res) {
  res.render('english');
});
router.get('/dutch', function(req, res) {
  res.render('dutch');
});
router.get('/french', function(req, res) {
  res.render('french');
});
router.get('/german', function(req, res) {
  res.render('german');
});
router.get('/italian', function(req, res) {
  res.render('italian');
});
router.get('/polish', function(req, res) {
  res.render('polish');
});
router.get('/spanish', function(req, res) {
  res.render('spanish');
});

//ALL OTHER REQUESTS
router.get('*', function(req, res) {
  //res.render an error page here
  res.render('error');
});

module.exports = router;
