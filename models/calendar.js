const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const CalendarDataSchema = new Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  username: {
    type: String,
    required: true,
    unique: true
  },
  data: [
    {
      date: String,
      timestamp: String,
      datetime: { type: Date, default: Date.now },
      point: Number,
      isTodayAlreadyLoggedIn: {
        type: Boolean,
        default: false
      }
    }
  ]
});

module.exports = mongoose.model('Calendar', CalendarDataSchema);
