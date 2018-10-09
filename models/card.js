const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// Users Daily review card
const DailyReviewDataSchema = new Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  username: {
    type: String,
    required: true,
    unique: true
  },
  wordcards: [
    {
      type: Schema.Types.Mixed
    }
  ]
});

module.exports = mongoose.model('Card', DailyReviewDataSchema);
