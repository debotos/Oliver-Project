const CronJob = require('cron').CronJob;
const Review = require('../models/review');
const User = require('../models/users');

module.exports = function(mongoose) {
  new CronJob(
    '00 00 00 * * *',
    function() {
      /*
      * Runs everyday midnight(12:00 AM)
      * at 00:00:00 AM. 
      */
      console.log('Dropping the Review Collection from DB.');
      // Remove all doc from 'Review' collection from the database
      Review.remove({}, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log('Successfully removed all document from collection.');
        }
      });
      // set dailyReviewComplete:false & reviewedAmount:0
      User.update(
        {},
        { dailyReviewComplete: false, reviewedAmount: 0 },
        { multi: true },
        function(err) {
          if (err) {
            console.log(err);
          } else {
            console.log('Reset Complete!');
          }
        }
      );
    },
    function() {
      /* This function is executed when the job stops */
    },
    true /* Start the job right now */
  );
};

// Example:
// cronTime: '* * * * * *' => Executes every seconds

// cronTime: '00 00 00 * * *' => Executes eveyday midnight

// cronTime: '00 */3 * * * * ' => Executes in every 3 seconds.

// cronTime: '* */1 * * * * ' => MEANING LESS.Executes every one second.

// cronTime: '00 */1 * * * * ' => Executes every 1 minute.

// cronTime: '00 30 11 * * 0-5 ' => Runs every weekday(Monday to Friday) @11.30 AM

// cronTime: '00 56 17 * * * ' => Will execute on every 5: 56 PM
