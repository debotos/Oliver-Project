var mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose');
var WordcardSchema = require('./wordcards');

var Schema = mongoose.Schema;
var UserSchema = new Schema({
  username: {
    type: String,
    unique: true
  },
  password: String,
  maxReview: {
    type: Number,
    default: 1000
  },
  reviewedAmount: {
    type: Number,
    default: 0
  },
  dailyReviewComplete: {
    type: Boolean,
    default: false
  },
  nativeLanguage: {
    type: String,
    default: 'English'
  },
  activeLanguages: [
    {
      type: [String]
    }
  ],
  joinDate: Date,
  wordcards: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wordcard'
    }
  ]
});

UserSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model('User', UserSchema);
