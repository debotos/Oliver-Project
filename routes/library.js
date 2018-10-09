//=============================
//------/LIBRARY ROUTES
//=============================
var express = require('express');
var router = express.Router();
const moment = require('moment');

var Wordcard = require('../models/wordcards.js');
var User = require('../models/users.js');
const Card = require('../models/card');
const Calender = require('../models/calender');

router.get('/library', isLoggedIn, async (req, res) => {
  const todaysWordCardsDoc = await Card.findOne({ author: req.user._id });
  let wordcards = await Wordcard.find({ author: req.user._id });
  const user = await User.findOne(
    { username: req.user.username },
    'dailyReviewComplete'
  );
  let todaysCard = todaysWordCardsDoc ? todaysWordCardsDoc.wordcards : [];

  wordcards = wordcards
    .map(wc => {
      let temp = wc.toObject();
      // console.log(temp);

      temp['ranked'] = wc.RepetitioFactor;
      // console.log(temp);
      return temp;
    })
    .sort((a, b) => b.ranked - a.ranked);
  res.render('library', { wordcards, todaysCard, user });
});

router.get('/library/:id', isLoggedIn, async (req, res) => {
  const todaysWordCardsDoc = await Card.findOne({ author: req.user._id });
  let todaysCard = todaysWordCardsDoc ? todaysWordCardsDoc.wordcards : [];
  let wordcards = await Wordcard.find({ author: req.user._id });
  const user = await User.findOne(
    { username: req.user.username },
    'dailyReviewComplete'
  );
  Wordcard.findById(req.params.id, function(err, foundWordcard) {
    if (err) {
      res.redirect('/library');
    } else {
      res.render('editwordcard', {
        wordcards,
        user,
        todaysCard,
        wordcard: foundWordcard
      });
    }
  });
});

router.put('/library/:id', isLoggedIn, function(req, res) {
  const TargetWord = req.body.TargetWord;
  const TargetLanguage = req.body.TargetLanguage;
  const TranslationWord = req.body.TranslationWord;
  const TranslationLanguage = req.body.TranslationLanguage;
  Wordcard.findByIdAndUpdate(
    req.params.id,
    { TargetWord, TargetLanguage, TranslationWord, TranslationLanguage },
    function(err, updatedWordcard) {
      if (err) {
        res.send('error');
      } else {
        res.redirect('/library');
      }
    }
  );
});

router.put('/library/:id/addmemory', isLoggedIn, async (req, res) => {
  //get the new memory from the field
  var NewMemory = req.body.Memory;
  //get all memories associated with the wordcard
  var MemoryCheck1 = await Wordcard.findById(req.params.id, 'memory1');
  var MemoryCheck2 = await Wordcard.findById(req.params.id, 'memory2');
  var MemoryCheck3 = await Wordcard.findById(req.params.id, 'memory3');
  var MemoryCheck4 = await Wordcard.findById(req.params.id, 'memory4');
  var MemoryCheck5 = await Wordcard.findById(req.params.id, 'memory5');
  var MemoryCheck6 = await Wordcard.findById(req.params.id, 'memory6');
  var MemoryCheck7 = await Wordcard.findById(req.params.id, 'memory7');
  var MemoryCheck8 = await Wordcard.findById(req.params.id, 'memory8');
  var MemoryCheck9 = await Wordcard.findById(req.params.id, 'memory9');
  var MemoryCheck10 = await Wordcard.findById(req.params.id, 'memory10');

  //get the new memory from the field
  var NewMemory = req.body.Memory;
  //get all memories associated with the wordcard
  var MemoryCheck1 = await Wordcard.findById(req.params.id, 'memory1');
  var MemoryCheck2 = await Wordcard.findById(req.params.id, 'memory2');
  var MemoryCheck3 = await Wordcard.findById(req.params.id, 'memory3');
  var MemoryCheck4 = await Wordcard.findById(req.params.id, 'memory4');
  var MemoryCheck5 = await Wordcard.findById(req.params.id, 'memory5');
  var MemoryCheck6 = await Wordcard.findById(req.params.id, 'memory6');
  var MemoryCheck7 = await Wordcard.findById(req.params.id, 'memory7');
  var MemoryCheck8 = await Wordcard.findById(req.params.id, 'memory8');
  var MemoryCheck9 = await Wordcard.findById(req.params.id, 'memory9');
  var MemoryCheck10 = await Wordcard.findById(req.params.id, 'memory10');

  let dataArray = [
    MemoryCheck1,
    MemoryCheck2,
    MemoryCheck3,
    MemoryCheck4,
    MemoryCheck5,
    MemoryCheck6,
    MemoryCheck7,
    MemoryCheck8,
    MemoryCheck9,
    MemoryCheck10
  ];

  let valueArray = [
    'memory1',
    'memory2',
    'memory3',
    'memory4',
    'memory5',
    'memory6',
    'memory7',
    'memory8',
    'memory9',
    'memory10'
  ];

  Card.findOne({ author: req.user._id }).then(userCardDoc => {
    let fieldName = 'memory1'; // default

    for (let index = 0; index < dataArray.length; index++) {
      // console.log(fieldName);
      // console.log('Looping...', dataArray[index]);
      let singleItem = dataArray[index];

      if (singleItem[fieldName] == undefined || null) {
        // console.log('Found update memory,', valueArray[index]);
        fieldName = valueArray[index];
        break;
      } else {
        if (index + 1 > 9) {
          fieldName = null;
        }
        fieldName = valueArray[index + 1];
      }
    }

    console.log('Field Name: ', fieldName);

    if (fieldName) {
      newUserWordscard = userCardDoc.wordcards.map(singleCard => {
        if (singleCard._id.toString() === req.params.id.toString()) {
          singleCard[fieldName] = NewMemory;
        }
        return singleCard;
      });

      let updates = { wordcards: newUserWordscard };

      Card.findOneAndUpdate(
        { author: req.user._id },
        { $set: updates },
        { new: true }
      )
        .then(cardUpdated => console.log('Card Updated with memory'))
        .catch(err => console.log('Error: ', err));
    } else {
      console.log('Already have 10 Memory');
    }
  });

  //see which memories have already been filled and fill the first one that hasn't been
  if (MemoryCheck1.memory1 == undefined || null) {
    Wordcard.findByIdAndUpdate(req.params.id, { memory1: NewMemory }, function(
      err,
      updatedWordcard
    ) {
      if (err) {
        res.send('error');
      } else {
        // Now everything save, so add +1 point to show in calender
        Calender.findOne({ author: req.user._id }, function(err, user) {
          if (err) {
            console.log(err);
          } else {
            let point = 1; // add a word, point 1
            let today = moment().format('DD-MM-YYYY');
            let timestamp = moment().unix();

            let itemToSave = {
              date: today,
              timestamp,
              point,
              isTodayAlreadyLoggedIn: true
            };

            if (!user) {
              // This user yet don't have any activity in calender
              // first create an entry for this user
              new Calender({
                author: req.user._id,
                username: foundUser.username
              })
                .save()
                .then(newCalenderDoc => {
                  // you have to push new item[today]

                  // add data to users model (Calender) data array
                  Calender.findOne({ author: req.user._id }).then(
                    calenderDoc => {
                      calenderDoc.data.unshift(itemToSave);
                      calenderDoc
                        .save()
                        .then(userCalender => res.redirect('back'))
                        .catch(err => res.status(404).json(err));
                    }
                  );
                });
            } else {
              // user already have an entry in calender db
              // console.log(user);
              let calenderDoc = user;
              // add data to users model (Calender) data array
              let daysArray = calenderDoc.data.map(
                singleItem => singleItem.date
              );

              if (daysArray.includes(today)) {
                // today's entry already have
                // now you have to just update

                Calender.findOne({ author: req.user._id })
                  .then(calenderData => {
                    // Get Update index
                    const updateIndex = calenderData.data
                      .map(item => {
                        // console.log('Item ID => ', item.id);
                        return item.date;
                      })
                      .indexOf(today);

                    let currentCalenderDataArray =
                      calenderData.data[updateIndex];

                    currentCalenderDataArray.point =
                      currentCalenderDataArray.point + point; // updating the point(adding 1)

                    currentCalenderDataArray.isTodayAlreadyLoggedIn = true;

                    calenderData
                      .save()
                      .then(updatedCalenderData => res.redirect('back'));
                  })
                  .catch(err => res.status(404).json(err));
              } else {
                // you have to push new item[today]

                // add data to users model (Calender) data array
                Calender.findOne({ author: req.user._id }).then(calenderDoc => {
                  calenderDoc.data.unshift(itemToSave);
                  calenderDoc
                    .save()
                    .then(userCalender => res.redirect('back'))
                    .catch(err => res.status(404).json(err));
                });
              }
            }
          }
        });
      }
    });
  } else if (MemoryCheck2.memory2 == undefined || null) {
    Wordcard.findByIdAndUpdate(req.params.id, { memory2: NewMemory }, function(
      err,
      updatedWordcard
    ) {
      if (err) {
        res.send('error');
      } else {
        // Now everything save, so add +1 point to show in calender
        Calender.findOne({ author: req.user._id }, function(err, user) {
          if (err) {
            console.log(err);
          } else {
            let point = 1; // add a word, point 1
            let today = moment().format('DD-MM-YYYY');
            let timestamp = moment().unix();

            let itemToSave = {
              date: today,
              timestamp,
              point,
              isTodayAlreadyLoggedIn: true
            };

            if (!user) {
              // This user yet don't have any activity in calender
              // first create an entry for this user
              new Calender({
                author: req.user._id,
                username: foundUser.username
              })
                .save()
                .then(newCalenderDoc => {
                  // you have to push new item[today]

                  // add data to users model (Calender) data array
                  Calender.findOne({ author: req.user._id }).then(
                    calenderDoc => {
                      calenderDoc.data.unshift(itemToSave);
                      calenderDoc
                        .save()
                        .then(userCalender => res.redirect('back'))
                        .catch(err => res.status(404).json(err));
                    }
                  );
                });
            } else {
              // user already have an entry in calender db
              // console.log(user);
              let calenderDoc = user;
              // add data to users model (Calender) data array
              let daysArray = calenderDoc.data.map(
                singleItem => singleItem.date
              );

              if (daysArray.includes(today)) {
                // today's entry already have
                // now you have to just update

                Calender.findOne({ author: req.user._id })
                  .then(calenderData => {
                    // Get Update index
                    const updateIndex = calenderData.data
                      .map(item => {
                        // console.log('Item ID => ', item.id);
                        return item.date;
                      })
                      .indexOf(today);

                    let currentCalenderDataArray =
                      calenderData.data[updateIndex];

                    currentCalenderDataArray.point =
                      currentCalenderDataArray.point + point; // updating the point(adding 1)

                    currentCalenderDataArray.isTodayAlreadyLoggedIn = true;

                    calenderData
                      .save()
                      .then(updatedCalenderData => res.redirect('back'));
                  })
                  .catch(err => res.status(404).json(err));
              } else {
                // you have to push new item[today]

                // add data to users model (Calender) data array
                Calender.findOne({ author: req.user._id }).then(calenderDoc => {
                  calenderDoc.data.unshift(itemToSave);
                  calenderDoc
                    .save()
                    .then(userCalender => res.redirect('back'))
                    .catch(err => res.status(404).json(err));
                });
              }
            }
          }
        });
      }
    });
  } else if (MemoryCheck3.memory3 == undefined || null) {
    Wordcard.findByIdAndUpdate(req.params.id, { memory3: NewMemory }, function(
      err,
      updatedWordcard
    ) {
      if (err) {
        res.send('error');
      } else {
        // Now everything save, so add +1 point to show in calender
        Calender.findOne({ author: req.user._id }, function(err, user) {
          if (err) {
            console.log(err);
          } else {
            let point = 1; // add a word, point 1
            let today = moment().format('DD-MM-YYYY');
            let timestamp = moment().unix();

            let itemToSave = {
              date: today,
              timestamp,
              point,
              isTodayAlreadyLoggedIn: true
            };

            if (!user) {
              // This user yet don't have any activity in calender
              // first create an entry for this user
              new Calender({
                author: req.user._id,
                username: foundUser.username
              })
                .save()
                .then(newCalenderDoc => {
                  // you have to push new item[today]

                  // add data to users model (Calender) data array
                  Calender.findOne({ author: req.user._id }).then(
                    calenderDoc => {
                      calenderDoc.data.unshift(itemToSave);
                      calenderDoc
                        .save()
                        .then(userCalender => res.redirect('back'))
                        .catch(err => res.status(404).json(err));
                    }
                  );
                });
            } else {
              // user already have an entry in calender db
              // console.log(user);
              let calenderDoc = user;
              // add data to users model (Calender) data array
              let daysArray = calenderDoc.data.map(
                singleItem => singleItem.date
              );

              if (daysArray.includes(today)) {
                // today's entry already have
                // now you have to just update

                Calender.findOne({ author: req.user._id })
                  .then(calenderData => {
                    // Get Update index
                    const updateIndex = calenderData.data
                      .map(item => {
                        // console.log('Item ID => ', item.id);
                        return item.date;
                      })
                      .indexOf(today);

                    let currentCalenderDataArray =
                      calenderData.data[updateIndex];

                    currentCalenderDataArray.point =
                      currentCalenderDataArray.point + point; // updating the point(adding 1)

                    currentCalenderDataArray.isTodayAlreadyLoggedIn = true;

                    calenderData
                      .save()
                      .then(updatedCalenderData => res.redirect('back'));
                  })
                  .catch(err => res.status(404).json(err));
              } else {
                // you have to push new item[today]

                // add data to users model (Calender) data array
                Calender.findOne({ author: req.user._id }).then(calenderDoc => {
                  calenderDoc.data.unshift(itemToSave);
                  calenderDoc
                    .save()
                    .then(userCalender => res.redirect('back'))
                    .catch(err => res.status(404).json(err));
                });
              }
            }
          }
        });
      }
    });
  } else if (MemoryCheck4.memory4 == undefined || null) {
    Wordcard.findByIdAndUpdate(req.params.id, { memory4: NewMemory }, function(
      err,
      updatedWordcard
    ) {
      if (err) {
        res.send('error');
      } else {
        // Now everything save, so add +1 point to show in calender
        Calender.findOne({ author: req.user._id }, function(err, user) {
          if (err) {
            console.log(err);
          } else {
            let point = 1; // add a word, point 1
            let today = moment().format('DD-MM-YYYY');
            let timestamp = moment().unix();

            let itemToSave = {
              date: today,
              timestamp,
              point,
              isTodayAlreadyLoggedIn: true
            };

            if (!user) {
              // This user yet don't have any activity in calender
              // first create an entry for this user
              new Calender({
                author: req.user._id,
                username: foundUser.username
              })
                .save()
                .then(newCalenderDoc => {
                  // you have to push new item[today]

                  // add data to users model (Calender) data array
                  Calender.findOne({ author: req.user._id }).then(
                    calenderDoc => {
                      calenderDoc.data.unshift(itemToSave);
                      calenderDoc
                        .save()
                        .then(userCalender => res.redirect('back'))
                        .catch(err => res.status(404).json(err));
                    }
                  );
                });
            } else {
              // user already have an entry in calender db
              // console.log(user);
              let calenderDoc = user;
              // add data to users model (Calender) data array
              let daysArray = calenderDoc.data.map(
                singleItem => singleItem.date
              );

              if (daysArray.includes(today)) {
                // today's entry already have
                // now you have to just update

                Calender.findOne({ author: req.user._id })
                  .then(calenderData => {
                    // Get Update index
                    const updateIndex = calenderData.data
                      .map(item => {
                        // console.log('Item ID => ', item.id);
                        return item.date;
                      })
                      .indexOf(today);

                    let currentCalenderDataArray =
                      calenderData.data[updateIndex];

                    currentCalenderDataArray.point =
                      currentCalenderDataArray.point + point; // updating the point(adding 1)

                    currentCalenderDataArray.isTodayAlreadyLoggedIn = true;

                    calenderData
                      .save()
                      .then(updatedCalenderData => res.redirect('back'));
                  })
                  .catch(err => res.status(404).json(err));
              } else {
                // you have to push new item[today]

                // add data to users model (Calender) data array
                Calender.findOne({ author: req.user._id }).then(calenderDoc => {
                  calenderDoc.data.unshift(itemToSave);
                  calenderDoc
                    .save()
                    .then(userCalender => res.redirect('back'))
                    .catch(err => res.status(404).json(err));
                });
              }
            }
          }
        });
      }
    });
  } else if (MemoryCheck5.memory5 == undefined || null) {
    Wordcard.findByIdAndUpdate(req.params.id, { memory5: NewMemory }, function(
      err,
      updatedWordcard
    ) {
      if (err) {
        res.send('error');
      } else {
        // Now everything save, so add +1 point to show in calender
        Calender.findOne({ author: req.user._id }, function(err, user) {
          if (err) {
            console.log(err);
          } else {
            let point = 1; // add a word, point 1
            let today = moment().format('DD-MM-YYYY');
            let timestamp = moment().unix();

            let itemToSave = {
              date: today,
              timestamp,
              point,
              isTodayAlreadyLoggedIn: true
            };

            if (!user) {
              // This user yet don't have any activity in calender
              // first create an entry for this user
              new Calender({
                author: req.user._id,
                username: foundUser.username
              })
                .save()
                .then(newCalenderDoc => {
                  // you have to push new item[today]

                  // add data to users model (Calender) data array
                  Calender.findOne({ author: req.user._id }).then(
                    calenderDoc => {
                      calenderDoc.data.unshift(itemToSave);
                      calenderDoc
                        .save()
                        .then(userCalender => res.redirect('back'))
                        .catch(err => res.status(404).json(err));
                    }
                  );
                });
            } else {
              // user already have an entry in calender db
              // console.log(user);
              let calenderDoc = user;
              // add data to users model (Calender) data array
              let daysArray = calenderDoc.data.map(
                singleItem => singleItem.date
              );

              if (daysArray.includes(today)) {
                // today's entry already have
                // now you have to just update

                Calender.findOne({ author: req.user._id })
                  .then(calenderData => {
                    // Get Update index
                    const updateIndex = calenderData.data
                      .map(item => {
                        // console.log('Item ID => ', item.id);
                        return item.date;
                      })
                      .indexOf(today);

                    let currentCalenderDataArray =
                      calenderData.data[updateIndex];

                    currentCalenderDataArray.point =
                      currentCalenderDataArray.point + point; // updating the point(adding 1)

                    currentCalenderDataArray.isTodayAlreadyLoggedIn = true;

                    calenderData
                      .save()
                      .then(updatedCalenderData => res.redirect('back'));
                  })
                  .catch(err => res.status(404).json(err));
              } else {
                // you have to push new item[today]

                // add data to users model (Calender) data array
                Calender.findOne({ author: req.user._id }).then(calenderDoc => {
                  calenderDoc.data.unshift(itemToSave);
                  calenderDoc
                    .save()
                    .then(userCalender => res.redirect('back'))
                    .catch(err => res.status(404).json(err));
                });
              }
            }
          }
        });
      }
    });
  } else if (MemoryCheck6.memory6 == undefined || null) {
    Wordcard.findByIdAndUpdate(req.params.id, { memory6: NewMemory }, function(
      err,
      updatedWordcard
    ) {
      if (err) {
        res.send('error');
      } else {
        // Now everything save, so add +1 point to show in calender
        Calender.findOne({ author: req.user._id }, function(err, user) {
          if (err) {
            console.log(err);
          } else {
            let point = 1; // add a word, point 1
            let today = moment().format('DD-MM-YYYY');
            let timestamp = moment().unix();

            let itemToSave = {
              date: today,
              timestamp,
              point,
              isTodayAlreadyLoggedIn: true
            };

            if (!user) {
              // This user yet don't have any activity in calender
              // first create an entry for this user
              new Calender({
                author: req.user._id,
                username: foundUser.username
              })
                .save()
                .then(newCalenderDoc => {
                  // you have to push new item[today]

                  // add data to users model (Calender) data array
                  Calender.findOne({ author: req.user._id }).then(
                    calenderDoc => {
                      calenderDoc.data.unshift(itemToSave);
                      calenderDoc
                        .save()
                        .then(userCalender => res.redirect('back'))
                        .catch(err => res.status(404).json(err));
                    }
                  );
                });
            } else {
              // user already have an entry in calender db
              // console.log(user);
              let calenderDoc = user;
              // add data to users model (Calender) data array
              let daysArray = calenderDoc.data.map(
                singleItem => singleItem.date
              );

              if (daysArray.includes(today)) {
                // today's entry already have
                // now you have to just update

                Calender.findOne({ author: req.user._id })
                  .then(calenderData => {
                    // Get Update index
                    const updateIndex = calenderData.data
                      .map(item => {
                        // console.log('Item ID => ', item.id);
                        return item.date;
                      })
                      .indexOf(today);

                    let currentCalenderDataArray =
                      calenderData.data[updateIndex];

                    currentCalenderDataArray.point =
                      currentCalenderDataArray.point + point; // updating the point(adding 1)

                    currentCalenderDataArray.isTodayAlreadyLoggedIn = true;

                    calenderData
                      .save()
                      .then(updatedCalenderData => res.redirect('back'));
                  })
                  .catch(err => res.status(404).json(err));
              } else {
                // you have to push new item[today]

                // add data to users model (Calender) data array
                Calender.findOne({ author: req.user._id }).then(calenderDoc => {
                  calenderDoc.data.unshift(itemToSave);
                  calenderDoc
                    .save()
                    .then(userCalender => res.redirect('back'))
                    .catch(err => res.status(404).json(err));
                });
              }
            }
          }
        });
      }
    });
  } else if (MemoryCheck7.memory7 == undefined || null) {
    Wordcard.findByIdAndUpdate(req.params.id, { memory7: NewMemory }, function(
      err,
      updatedWordcard
    ) {
      if (err) {
        res.send('error');
      } else {
        // Now everything save, so add +1 point to show in calender
        Calender.findOne({ author: req.user._id }, function(err, user) {
          if (err) {
            console.log(err);
          } else {
            let point = 1; // add a word, point 1
            let today = moment().format('DD-MM-YYYY');
            let timestamp = moment().unix();

            let itemToSave = {
              date: today,
              timestamp,
              point,
              isTodayAlreadyLoggedIn: true
            };

            if (!user) {
              // This user yet don't have any activity in calender
              // first create an entry for this user
              new Calender({
                author: req.user._id,
                username: foundUser.username
              })
                .save()
                .then(newCalenderDoc => {
                  // you have to push new item[today]

                  // add data to users model (Calender) data array
                  Calender.findOne({ author: req.user._id }).then(
                    calenderDoc => {
                      calenderDoc.data.unshift(itemToSave);
                      calenderDoc
                        .save()
                        .then(userCalender => res.redirect('back'))
                        .catch(err => res.status(404).json(err));
                    }
                  );
                });
            } else {
              // user already have an entry in calender db
              // console.log(user);
              let calenderDoc = user;
              // add data to users model (Calender) data array
              let daysArray = calenderDoc.data.map(
                singleItem => singleItem.date
              );

              if (daysArray.includes(today)) {
                // today's entry already have
                // now you have to just update

                Calender.findOne({ author: req.user._id })
                  .then(calenderData => {
                    // Get Update index
                    const updateIndex = calenderData.data
                      .map(item => {
                        // console.log('Item ID => ', item.id);
                        return item.date;
                      })
                      .indexOf(today);

                    let currentCalenderDataArray =
                      calenderData.data[updateIndex];

                    currentCalenderDataArray.point =
                      currentCalenderDataArray.point + point; // updating the point(adding 1)

                    currentCalenderDataArray.isTodayAlreadyLoggedIn = true;

                    calenderData
                      .save()
                      .then(updatedCalenderData => res.redirect('back'));
                  })
                  .catch(err => res.status(404).json(err));
              } else {
                // you have to push new item[today]

                // add data to users model (Calender) data array
                Calender.findOne({ author: req.user._id }).then(calenderDoc => {
                  calenderDoc.data.unshift(itemToSave);
                  calenderDoc
                    .save()
                    .then(userCalender => res.redirect('back'))
                    .catch(err => res.status(404).json(err));
                });
              }
            }
          }
        });
      }
    });
  } else if (MemoryCheck8.memory8 == undefined || null) {
    Wordcard.findByIdAndUpdate(req.params.id, { memory8: NewMemory }, function(
      err,
      updatedWordcard
    ) {
      if (err) {
        res.send('error');
      } else {
        // Now everything save, so add +1 point to show in calender
        Calender.findOne({ author: req.user._id }, function(err, user) {
          if (err) {
            console.log(err);
          } else {
            let point = 1; // add a word, point 1
            let today = moment().format('DD-MM-YYYY');
            let timestamp = moment().unix();

            let itemToSave = {
              date: today,
              timestamp,
              point,
              isTodayAlreadyLoggedIn: true
            };

            if (!user) {
              // This user yet don't have any activity in calender
              // first create an entry for this user
              new Calender({
                author: req.user._id,
                username: foundUser.username
              })
                .save()
                .then(newCalenderDoc => {
                  // you have to push new item[today]

                  // add data to users model (Calender) data array
                  Calender.findOne({ author: req.user._id }).then(
                    calenderDoc => {
                      calenderDoc.data.unshift(itemToSave);
                      calenderDoc
                        .save()
                        .then(userCalender => res.redirect('back'))
                        .catch(err => res.status(404).json(err));
                    }
                  );
                });
            } else {
              // user already have an entry in calender db
              // console.log(user);
              let calenderDoc = user;
              // add data to users model (Calender) data array
              let daysArray = calenderDoc.data.map(
                singleItem => singleItem.date
              );

              if (daysArray.includes(today)) {
                // today's entry already have
                // now you have to just update

                Calender.findOne({ author: req.user._id })
                  .then(calenderData => {
                    // Get Update index
                    const updateIndex = calenderData.data
                      .map(item => {
                        // console.log('Item ID => ', item.id);
                        return item.date;
                      })
                      .indexOf(today);

                    let currentCalenderDataArray =
                      calenderData.data[updateIndex];

                    currentCalenderDataArray.point =
                      currentCalenderDataArray.point + point; // updating the point(adding 1)

                    currentCalenderDataArray.isTodayAlreadyLoggedIn = true;

                    calenderData
                      .save()
                      .then(updatedCalenderData => res.redirect('back'));
                  })
                  .catch(err => res.status(404).json(err));
              } else {
                // you have to push new item[today]

                // add data to users model (Calender) data array
                Calender.findOne({ author: req.user._id }).then(calenderDoc => {
                  calenderDoc.data.unshift(itemToSave);
                  calenderDoc
                    .save()
                    .then(userCalender => res.redirect('back'))
                    .catch(err => res.status(404).json(err));
                });
              }
            }
          }
        });
      }
    });
  } else if (MemoryCheck9.memory9 == undefined || null) {
    Wordcard.findByIdAndUpdate(req.params.id, { memory9: NewMemory }, function(
      err,
      updatedWordcard
    ) {
      if (err) {
        res.send('error');
      } else {
        // Now everything save, so add +1 point to show in calender
        Calender.findOne({ author: req.user._id }, function(err, user) {
          if (err) {
            console.log(err);
          } else {
            let point = 1; // add a word, point 1
            let today = moment().format('DD-MM-YYYY');
            let timestamp = moment().unix();

            let itemToSave = {
              date: today,
              timestamp,
              point,
              isTodayAlreadyLoggedIn: true
            };

            if (!user) {
              // This user yet don't have any activity in calender
              // first create an entry for this user
              new Calender({
                author: req.user._id,
                username: foundUser.username
              })
                .save()
                .then(newCalenderDoc => {
                  // you have to push new item[today]

                  // add data to users model (Calender) data array
                  Calender.findOne({ author: req.user._id }).then(
                    calenderDoc => {
                      calenderDoc.data.unshift(itemToSave);
                      calenderDoc
                        .save()
                        .then(userCalender => res.redirect('back'))
                        .catch(err => res.status(404).json(err));
                    }
                  );
                });
            } else {
              // user already have an entry in calender db
              // console.log(user);
              let calenderDoc = user;
              // add data to users model (Calender) data array
              let daysArray = calenderDoc.data.map(
                singleItem => singleItem.date
              );

              if (daysArray.includes(today)) {
                // today's entry already have
                // now you have to just update

                Calender.findOne({ author: req.user._id })
                  .then(calenderData => {
                    // Get Update index
                    const updateIndex = calenderData.data
                      .map(item => {
                        // console.log('Item ID => ', item.id);
                        return item.date;
                      })
                      .indexOf(today);

                    let currentCalenderDataArray =
                      calenderData.data[updateIndex];

                    currentCalenderDataArray.point =
                      currentCalenderDataArray.point + point; // updating the point(adding 1)

                    currentCalenderDataArray.isTodayAlreadyLoggedIn = true;

                    calenderData
                      .save()
                      .then(updatedCalenderData => res.redirect('back'));
                  })
                  .catch(err => res.status(404).json(err));
              } else {
                // you have to push new item[today]

                // add data to users model (Calender) data array
                Calender.findOne({ author: req.user._id }).then(calenderDoc => {
                  calenderDoc.data.unshift(itemToSave);
                  calenderDoc
                    .save()
                    .then(userCalender => res.redirect('back'))
                    .catch(err => res.status(404).json(err));
                });
              }
            }
          }
        });
      }
    });
  } else if (MemoryCheck10.memory10 == undefined || null) {
    Wordcard.findByIdAndUpdate(req.params.id, { memory10: NewMemory }, function(
      err,
      updatedWordcard
    ) {
      if (err) {
        res.send('error');
      } else {
        // Now everything save, so add +1 point to show in calender
        Calender.findOne({ author: req.user._id }, function(err, user) {
          if (err) {
            console.log(err);
          } else {
            let point = 1; // add a word, point 1
            let today = moment().format('DD-MM-YYYY');
            let timestamp = moment().unix();

            let itemToSave = {
              date: today,
              timestamp,
              point,
              isTodayAlreadyLoggedIn: true
            };

            if (!user) {
              // This user yet don't have any activity in calender
              // first create an entry for this user
              new Calender({
                author: req.user._id,
                username: foundUser.username
              })
                .save()
                .then(newCalenderDoc => {
                  // you have to push new item[today]

                  // add data to users model (Calender) data array
                  Calender.findOne({ author: req.user._id }).then(
                    calenderDoc => {
                      calenderDoc.data.unshift(itemToSave);
                      calenderDoc
                        .save()
                        .then(userCalender => res.redirect('back'))
                        .catch(err => res.status(404).json(err));
                    }
                  );
                });
            } else {
              // user already have an entry in calender db
              // console.log(user);
              let calenderDoc = user;
              // add data to users model (Calender) data array
              let daysArray = calenderDoc.data.map(
                singleItem => singleItem.date
              );

              if (daysArray.includes(today)) {
                // today's entry already have
                // now you have to just update

                Calender.findOne({ author: req.user._id })
                  .then(calenderData => {
                    // Get Update index
                    const updateIndex = calenderData.data
                      .map(item => {
                        // console.log('Item ID => ', item.id);
                        return item.date;
                      })
                      .indexOf(today);

                    let currentCalenderDataArray =
                      calenderData.data[updateIndex];

                    currentCalenderDataArray.point =
                      currentCalenderDataArray.point + point; // updating the point(adding 1)

                    currentCalenderDataArray.isTodayAlreadyLoggedIn = true;

                    calenderData
                      .save()
                      .then(updatedCalenderData => res.redirect('back'));
                  })
                  .catch(err => res.status(404).json(err));
              } else {
                // you have to push new item[today]

                // add data to users model (Calender) data array
                Calender.findOne({ author: req.user._id }).then(calenderDoc => {
                  calenderDoc.data.unshift(itemToSave);
                  calenderDoc
                    .save()
                    .then(userCalender => res.redirect('back'))
                    .catch(err => res.status(404).json(err));
                });
              }
            }
          }
        });
      }
    });
  } else
    res.send(
      "no more memories can be associated with this word, you've aleady done 10!"
    );
});

//UPDATE MEMORIES IN LIBRARY
router.put('/library/:id/updatemem1', isLoggedIn, async (req, res) => {
  //get the new memory from the field
  var NewMemory = req.body.Memory1;
  //write it in
  Wordcard.findByIdAndUpdate(req.params.id, { memory1: NewMemory }, function(
    err,
    updatedMemory
  ) {
    if (err) {
      res.send('error');
    } else {
      res.redirect('back');
    }
  });
});
router.put('/library/:id/updatemem2', isLoggedIn, async (req, res) => {
  //get the new memory from the field
  var NewMemory = req.body.Memory2;
  //write it in
  Wordcard.findByIdAndUpdate(req.params.id, { memory2: NewMemory }, function(
    err,
    updatedMemory
  ) {
    if (err) {
      res.send('error');
    } else {
      res.redirect('back');
    }
  });
});
router.put('/library/:id/updatemem3', isLoggedIn, async (req, res) => {
  //get the new memory from the field
  var NewMemory = req.body.Memory3;
  //write it in
  Wordcard.findByIdAndUpdate(req.params.id, { memory3: NewMemory }, function(
    err,
    updatedMemory
  ) {
    if (err) {
      res.send('error');
    } else {
      res.redirect('back');
    }
  });
});
router.put('/library/:id/updatemem4', isLoggedIn, async (req, res) => {
  //get the new memory from the field
  var NewMemory = req.body.Memory4;
  //write it in
  Wordcard.findByIdAndUpdate(req.params.id, { memory4: NewMemory }, function(
    err,
    updatedMemory
  ) {
    if (err) {
      res.send('error');
    } else {
      res.redirect('back');
    }
  });
});
router.put('/library/:id/updatemem5', isLoggedIn, async (req, res) => {
  //get the new memory from the field
  var NewMemory = req.body.Memory5;
  //write it in
  Wordcard.findByIdAndUpdate(req.params.id, { memory5: NewMemory }, function(
    err,
    updatedMemory
  ) {
    if (err) {
      res.send('error');
    } else {
      res.redirect('back');
    }
  });
});
router.put('/library/:id/updatemem6', isLoggedIn, async (req, res) => {
  //get the new memory from the field
  var NewMemory = req.body.Memory6;
  //write it in
  Wordcard.findByIdAndUpdate(req.params.id, { memory6: NewMemory }, function(
    err,
    updatedMemory
  ) {
    if (err) {
      res.send('error');
    } else {
      res.redirect('back');
    }
  });
});
router.put('/library/:id/updatemem7', isLoggedIn, async (req, res) => {
  //get the new memory from the field
  var NewMemory = req.body.Memory7;
  //write it in
  Wordcard.findByIdAndUpdate(req.params.id, { memory7: NewMemory }, function(
    err,
    updatedMemory
  ) {
    if (err) {
      res.send('error');
    } else {
      res.redirect('back');
    }
  });
});
router.put('/library/:id/updatemem8', isLoggedIn, async (req, res) => {
  //get the new memory from the field
  var NewMemory = req.body.Memory8;
  //write it in
  Wordcard.findByIdAndUpdate(req.params.id, { memory8: NewMemory }, function(
    err,
    updatedMemory
  ) {
    if (err) {
      res.send('error');
    } else {
      res.redirect('back');
    }
  });
});
router.put('/library/:id/updatemem9', isLoggedIn, async (req, res) => {
  //get the new memory from the field
  var NewMemory = req.body.Memory9;
  //write it in
  Wordcard.findByIdAndUpdate(req.params.id, { memory9: NewMemory }, function(
    err,
    updatedMemory
  ) {
    if (err) {
      res.send('error');
    } else {
      res.redirect('back');
    }
  });
});
router.put('/library/:id/updatemem10', isLoggedIn, async (req, res) => {
  //get the new memory from the field
  var NewMemory = req.body.Memory10;
  //write it in
  Wordcard.findByIdAndUpdate(req.params.id, { memory10: NewMemory }, function(
    err,
    updatedMemory
  ) {
    if (err) {
      res.send('error');
    } else {
      res.redirect('back');
    }
  });
});
//__________________________________________________________
//DELETE REQUESTS
//__________________________________________________________

router.delete('/library/:id', isLoggedIn, function(req, res) {
  Wordcard.findByIdAndRemove(req.params.id, function(err) {
    if (err) {
      res.send('error');
    } else {
      res.redirect('/library');
    }
  });
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

// repetitio.co/library/search

module.exports = router;
