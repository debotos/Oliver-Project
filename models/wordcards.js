const mongoose = require('mongoose');
// const RfactorSchema = require ('./rfactor')

const Schema = mongoose.Schema;
//create new schema
const WordcardSchema = new Schema({
  TargetWord: String,
  TranslationWord: String,
  TargetLanguage: String,
  TranslationLanguage: String,
  memory1: String, // confusion
  memory2: String,
  memory3: String,
  memory4: String,
  memory5: String,
  memory6: String,
  memory7: String,
  memory8: String,
  memory9: String,
  memory10: String,
  intervalDays: { type: Number, default: 1 },
  lastReview: { type: Date, required: true, default: new Date() },
  nthInterval: { type: Number, default: 1 }, // confusion
  easeFactor: { type: Number, default: 2.5 },
  dateAdded: { type: Date, required: true, default: new Date() },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

// convert lastReview into unix time
WordcardSchema.virtual('lastReviewUNIX').get(function() {
  return this.lastReview.getTime();
});

//calc daysSinceReview
WordcardSchema.virtual('daysSinceReview').get(function() {
  var daysSinceReview = (new Date() - this.lastReviewUNIX) / 86400000;
  return daysSinceReview.toFixed(4);
});

// calc Interval
WordcardSchema.virtual('interval').get(function() {
  if (this.nthInterval == 1) {
    var x = 1;
    return x.toFixed(0);
  }
  if (this.nthInterval == 2) {
    var x = 6;
    return x.toFixed(0);
  } else {
    var x = (this.nthInterval - 1) * this.easeFactor;
    return x.toFixed(0);
  }
});

//calculate Repetitio factor
WordcardSchema.virtual('RepetitioFactor').get(function() {
  if (this.daysSinceReview > this.interval) {
    var x = 1 / 2 * (this.interval / this.daysSinceReview);
  } else var x = 1 - 1 / 2 * this.daysSinceReview / this.interval;
  return x.toFixed(2);
});

WordcardSchema.virtual('formattedDate').get(function() {
  var formatted_date = moment(wordcard.dateAdded).format('YYYY-DD-MM');
});

// module.exports = mongoose.model('User', UserSchema);
module.exports = mongoose.model('Wordcard', WordcardSchema);
