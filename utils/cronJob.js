const CronJob = require('cron').CronJob;
const Card = require('../models/review');

module.exports = function(mongoose) {
  new CronJob(
    '0 0 0 * * *',
    function() {
      /*
      * Runs everyday midnight(12:00 AM)
      * at 00:00:00 AM. 
      */
      console.log('Dropping the Card Collection from DB.');
      // Drop the 'Card' collection from the database
      mongoose.connection.db.dropCollection('cards', function(err, result) {
        if (err) {
          console.log('Cron Job Error! Card Collection Already Empty! ');
        } else {
          console.log('Cron Job Success:', result);
        }
      });
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
