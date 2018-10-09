//=============================
//------/REVIEW ROUTES
//=============================
var express = require('express');
var router = express.Router();
const moment = require('moment');

const Calender = require('../models/calender');
var Wordcard = require('../models/wordcards.js');
var User = require('../models/users.js');
const Card = require('../models/card.js');

router.get('/review', isLoggedIn, async (req, res) => {
  const todaysWordCardsDoc = await Card.findOne({ author: req.user._id });
  const user = await User.findOne(
    { username: req.user.username },
    'dailyReviewComplete'
  );
  let todaysCard = todaysWordCardsDoc.wordcards;
  // if card collection have the data send it
  if (todaysWordCardsDoc) {
    console.log('Sending data from Card collection!');
    return res.render('review', {
      user,
      todaysCard,
      wordcards: todaysWordCardsDoc.wordcards
    });
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
      // console.log(wordcardsWithRepetitioFactor);

      // get the maxReview of current user
      let maxReview = await User.findOne({ username: req.user.username }).then(
        user => user.maxReview
      );
      if (!maxReview) {
        return res.render('review', { user, wordcards, todaysCard });
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
      // console.log(wordcardsUnderPointFiveRepetitioFactor.length);
      // console.log(wordcardsOverPointFiveRepetitioFactor.length);
      // My Previous Solution
      // Here if there were no cards with a RepetitioFactor below 0.5,
      // it will take the cards which RepetitioFactor over 0.5 to fill the maxReview amount
      // Example: if there is 5 cards with a RepetitioFactor below 0.5
      // and  20 cards with a RepetitioFactor over 0.5 and user maxReview amount is 20 then
      // it will take those 5(that have below 0.5) + 15(that have over 0.5) = 20(user maxReview amount)

      // let finalCards = [];
      // if (wordcardsUnderPointFiveRepetitioFactor.length >= maxReview) {
      //   for (let index = 0; index < maxReview; index++) {
      //     finalCards.push(wordcardsUnderPointFiveRepetitioFactor[index]);
      //   }
      // } else {
      //   finalCards = [...wordcardsUnderPointFiveRepetitioFactor];
      // }
      // if (finalCards.length < maxReview) {
      //   let amountLeft = maxReview - finalCards.length;
      //   for (let index = 0; index < amountLeft; index++) {
      //     if (wordcardsOverPointFiveRepetitioFactor[index]) {
      //       finalCards.push(wordcardsOverPointFiveRepetitioFactor[index]);
      //     }
      //   }
      // }

      let finalCards = [];
      if (wordcardsUnderPointFiveRepetitioFactor.length >= maxReview) {
        for (let index = 0; index < maxReview; index++) {
          finalCards.push(wordcardsUnderPointFiveRepetitioFactor[index]);
        }
      } else {
        finalCards = [...wordcardsUnderPointFiveRepetitioFactor];
      }
      console.log('Final Cards', finalCards);

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
                        return res.render('review', {
                          todaysCard,
                          user,
                          wordcards: userCard.wordcards
                        });
                      })
                      .catch(err => res.status(404).json(err));
                  });
                });
            } else {
              Card.findOne({ author: req.user._id }).then(CardDoc => {
                CardDoc.wordcards = [...finalCards];
                CardDoc.save()
                  .then(userCard =>
                    res.render('review', {
                      todaysCard,
                      user,
                      wordcards: userCard.wordcards
                    })
                  )
                  .catch(err => res.status(404).json(err));
              });
            }
          }
        }
      );
    } else {
      return res.render('review', { user, wordcards, todaysCard });
    }
  }
});

//---PUT routes

router.put('/review/:id/easy', isLoggedIn, async (req, res) => {
  // mark this card as reviewed
  Card.findOne({ author: req.user._id }).then(userCardDoc => {
    let newUserWordscard = [];

    userCardDoc.wordcards.forEach(singleCard => {
      if (singleCard._id.toString() === req.params.id.toString()) {
        // do nothing to remove
      } else {
        newUserWordscard.push(singleCard);
      }
    });

    let updates = { wordcards: newUserWordscard };

    Card.findOneAndUpdate(
      { author: req.user._id },
      { $set: updates },
      { new: true }
    )
      .then(cardUpdated => console.log('Card Updated!'))
      .catch(err => console.log('Error: ', err));
  });

  var oldEF = await Wordcard.findById(req.params.id, 'easeFactor');
  var feedback = 5;
  var newEF =
    oldEF.easeFactor - 0.8 + 0.28 * feedback - 0.02 * feedback * feedback;
  if (newEF <= 1.3) {
    newEF = 1.3;
  }
  console.log(newEF);

  var oldNth = await Wordcard.findById(req.params.id, 'nthInterval');
  var newNth = oldNth.nthInterval + 1;
  var newDate = new Date();
  let point = 1; // add a word, point 1

  Wordcard.findByIdAndUpdate(
    req.params.id,
    { lastReview: newDate, easeFactor: newEF, nthInterval: newNth },
    function(err, feedback) {
      if (err) {
        res.send('error');
      } else {
        User.findOne({ username: req.user.username })
          .then(currentUserDoc => {
            if (!currentUserDoc) {
              return res.status(404).send('error');
            }
            let maxReview = currentUserDoc.maxReview;
            let reviewedAmount = currentUserDoc.reviewedAmount;
            let dailyReviewComplete = currentUserDoc.dailyReviewComplete;

            // increse reviewedAmount
            let amountLeft = maxReview - reviewedAmount;
            if (amountLeft === 1 && !dailyReviewComplete) {
              point = 6; // five for complete the all daily review & 1 for the current review
              dailyReviewComplete = true;
            }
            reviewedAmount = reviewedAmount + 1;
            let updateData = { reviewedAmount, dailyReviewComplete };
            User.findOneAndUpdate(
              { username: req.user.username },
              { $set: updateData },
              { new: true }
            ).then(profile => {
              // Now everything save, so add +1 point to show in calender
              // First check this user have an entry in Calender collection
              // (Note that this chunk of code is same in everywhere)
              Calender.findOne({ author: req.user._id }, function(err, user) {
                if (err) {
                  console.log(err);
                } else {
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
                      username: req.user.username
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
                              .then(userCalender => res.redirect('/review'))
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
                            .then(updatedCalenderData =>
                              res.redirect('/review')
                            );
                        })
                        .catch(err => res.status(404).json(err));
                    } else {
                      // you have to push new item[today]

                      // add data to users model (Calender) data array
                      Calender.findOne({ author: req.user._id }).then(
                        calenderDoc => {
                          calenderDoc.data.unshift(itemToSave);
                          calenderDoc
                            .save()
                            .then(userCalender => res.redirect('/review'))
                            .catch(err => res.status(404).json(err));
                        }
                      );
                    }
                  }
                }
              });
            });
          })
          .catch(err => res.status(404).json(err));
      }
    }
  );
});

router.put('/review/:id/ok', isLoggedIn, async (req, res) => {
  // mark this card as reviewed
  Card.findOne({ author: req.user._id }).then(userCardDoc => {
    let newUserWordscard = [];

    userCardDoc.wordcards.forEach(singleCard => {
      if (singleCard._id.toString() === req.params.id.toString()) {
        // do nothing to remove
      } else {
        newUserWordscard.push(singleCard);
      }
    });

    let updates = { wordcards: newUserWordscard };

    Card.findOneAndUpdate(
      { author: req.user._id },
      { $set: updates },
      { new: true }
    )
      .then(cardUpdated => console.log('Card Updated!'))
      .catch(err => console.log('Error: ', err));
  });

  var oldEF = await Wordcard.findById(req.params.id, 'easeFactor');
  var feedback = 4;
  var newEF =
    oldEF.easeFactor - 0.8 + 0.28 * feedback - 0.02 * feedback * feedback;
  if (newEF <= 1.3) {
    newEF = 1.3;
  }
  console.log(newEF);
  var oldNth = await Wordcard.findById(req.params.id, 'nthInterval');
  var newNth = oldNth.nthInterval + 1;
  var newDate = new Date();
  let point = 1; // add a word, point 1

  Wordcard.findByIdAndUpdate(
    req.params.id,
    { lastReview: newDate, easeFactor: newEF, nthInterval: newNth },
    function(err, feedback) {
      if (err) {
        res.send('error');
      } else {
        User.findOne({ username: req.user.username })
          .then(currentUserDoc => {
            if (!currentUserDoc) {
              return res.status(404).send('error');
            }
            let maxReview = currentUserDoc.maxReview;
            let reviewedAmount = currentUserDoc.reviewedAmount;
            let dailyReviewComplete = currentUserDoc.dailyReviewComplete;

            // increse reviewedAmount
            let amountLeft = maxReview - reviewedAmount;
            if (amountLeft === 1 && !dailyReviewComplete) {
              point = 6; // five for complete the all daily review & 1 for the current review
              dailyReviewComplete = true;
            }
            reviewedAmount = reviewedAmount + 1;
            let updateData = { reviewedAmount, dailyReviewComplete };
            User.findOneAndUpdate(
              { username: req.user.username },
              { $set: updateData },
              { new: true }
            ).then(profile => {
              // Now everything save, so add +1 point to show in calender
              Calender.findOne({ author: req.user._id }, function(err, user) {
                if (err) {
                  console.log(err);
                } else {
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
                      username: req.user.username
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
                              .then(userCalender => res.redirect('/review'))
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
                            .then(updatedCalenderData =>
                              res.redirect('/review')
                            );
                        })
                        .catch(err => res.status(404).json(err));
                    } else {
                      // you have to push new item[today]

                      // add data to users model (Calender) data array
                      Calender.findOne({ author: req.user._id }).then(
                        calenderDoc => {
                          calenderDoc.data.unshift(itemToSave);
                          calenderDoc
                            .save()
                            .then(userCalender => res.redirect('/review'))
                            .catch(err => res.status(404).json(err));
                        }
                      );
                    }
                  }
                }
              });
            });
          })
          .catch(err => res.status(404).json(err));
      }
    }
  );
});

router.put('/review/:id/hard', isLoggedIn, async (req, res) => {
  // mark this card as reviewed
  Card.findOne({ author: req.user._id }).then(userCardDoc => {
    let newUserWordscard = [];

    userCardDoc.wordcards.forEach(singleCard => {
      if (singleCard._id.toString() === req.params.id.toString()) {
        // do nothing to remove
      } else {
        newUserWordscard.push(singleCard);
      }
    });

    let updates = { wordcards: newUserWordscard };

    Card.findOneAndUpdate(
      { author: req.user._id },
      { $set: updates },
      { new: true }
    )
      .then(cardUpdated => console.log('Card Updated!'))
      .catch(err => console.log('Error: ', err));
  });

  var oldEF = await Wordcard.findById(req.params.id, 'easeFactor');
  var feedback = 2;
  var newEF =
    oldEF.easeFactor - 0.8 + 0.28 * feedback - 0.02 * feedback * feedback;
  if (newEF <= 1.3) {
    newEF = 1.3;
  }
  console.log(newEF);
  var oldNth = await Wordcard.findById(req.params.id, 'nthInterval');
  var newNth = oldNth.nthInterval + 1;
  var newDate = new Date();
  let point = 1; // add a word, point 1

  Wordcard.findByIdAndUpdate(
    req.params.id,
    { lastReview: newDate, easeFactor: newEF, nthInterval: newNth },
    function(err, feedback) {
      if (err) {
        res.send('error');
      } else {
        User.findOne({ username: req.user.username })
          .then(currentUserDoc => {
            if (!currentUserDoc) {
              return res.status(404).send('error');
            }
            let maxReview = currentUserDoc.maxReview;
            let reviewedAmount = currentUserDoc.reviewedAmount;
            let dailyReviewComplete = currentUserDoc.dailyReviewComplete;

            // increse reviewedAmount
            let amountLeft = maxReview - reviewedAmount;
            if (amountLeft === 1 && !dailyReviewComplete) {
              point = 6; // five for complete the all daily review & 1 for the current review
              dailyReviewComplete = true;
            }
            reviewedAmount = reviewedAmount + 1;
            let updateData = { reviewedAmount, dailyReviewComplete };
            User.findOneAndUpdate(
              { username: req.user.username },
              { $set: updateData },
              { new: true }
            ).then(profile => {
              // Now everything save, so add +1 point to show in calender
              Calender.findOne({ author: req.user._id }, function(err, user) {
                if (err) {
                  console.log(err);
                } else {
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
                      username: req.user.username
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
                              .then(userCalender => res.redirect('/review'))
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
                            .then(updatedCalenderData =>
                              res.redirect('/review')
                            );
                        })
                        .catch(err => res.status(404).json(err));
                    } else {
                      // you have to push new item[today]

                      // add data to users model (Calender) data array
                      Calender.findOne({ author: req.user._id }).then(
                        calenderDoc => {
                          calenderDoc.data.unshift(itemToSave);
                          calenderDoc
                            .save()
                            .then(userCalender => res.redirect('/review'))
                            .catch(err => res.status(404).json(err));
                        }
                      );
                    }
                  }
                }
              });
            });
          })
          .catch(err => res.status(404).json(err));
      }
    }
  );
});

router.put('/review/:id/addmemory', isLoggedIn, async (req, res) => {
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
                        .then(userCalender => res.redirect('/review'))
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
                      .then(updatedCalenderData => res.redirect('/review'));
                  })
                  .catch(err => res.status(404).json(err));
              } else {
                // you have to push new item[today]

                // add data to users model (Calender) data array
                Calender.findOne({ author: req.user._id }).then(calenderDoc => {
                  calenderDoc.data.unshift(itemToSave);
                  calenderDoc
                    .save()
                    .then(userCalender => res.redirect('/review'))
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
                        .then(userCalender => res.redirect('/review'))
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
                      .then(updatedCalenderData => res.redirect('/review'));
                  })
                  .catch(err => res.status(404).json(err));
              } else {
                // you have to push new item[today]

                // add data to users model (Calender) data array
                Calender.findOne({ author: req.user._id }).then(calenderDoc => {
                  calenderDoc.data.unshift(itemToSave);
                  calenderDoc
                    .save()
                    .then(userCalender => res.redirect('/review'))
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
                        .then(userCalender => res.redirect('/review'))
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
                      .then(updatedCalenderData => res.redirect('/review'));
                  })
                  .catch(err => res.status(404).json(err));
              } else {
                // you have to push new item[today]

                // add data to users model (Calender) data array
                Calender.findOne({ author: req.user._id }).then(calenderDoc => {
                  calenderDoc.data.unshift(itemToSave);
                  calenderDoc
                    .save()
                    .then(userCalender => res.redirect('/review'))
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
                        .then(userCalender => res.redirect('/review'))
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
                      .then(updatedCalenderData => res.redirect('/review'));
                  })
                  .catch(err => res.status(404).json(err));
              } else {
                // you have to push new item[today]

                // add data to users model (Calender) data array
                Calender.findOne({ author: req.user._id }).then(calenderDoc => {
                  calenderDoc.data.unshift(itemToSave);
                  calenderDoc
                    .save()
                    .then(userCalender => res.redirect('/review'))
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
                        .then(userCalender => res.redirect('/review'))
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
                      .then(updatedCalenderData => res.redirect('/review'));
                  })
                  .catch(err => res.status(404).json(err));
              } else {
                // you have to push new item[today]

                // add data to users model (Calender) data array
                Calender.findOne({ author: req.user._id }).then(calenderDoc => {
                  calenderDoc.data.unshift(itemToSave);
                  calenderDoc
                    .save()
                    .then(userCalender => res.redirect('/review'))
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
                        .then(userCalender => res.redirect('/review'))
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
                      .then(updatedCalenderData => res.redirect('/review'));
                  })
                  .catch(err => res.status(404).json(err));
              } else {
                // you have to push new item[today]

                // add data to users model (Calender) data array
                Calender.findOne({ author: req.user._id }).then(calenderDoc => {
                  calenderDoc.data.unshift(itemToSave);
                  calenderDoc
                    .save()
                    .then(userCalender => res.redirect('/review'))
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
                        .then(userCalender => res.redirect('/review'))
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
                      .then(updatedCalenderData => res.redirect('/review'));
                  })
                  .catch(err => res.status(404).json(err));
              } else {
                // you have to push new item[today]

                // add data to users model (Calender) data array
                Calender.findOne({ author: req.user._id }).then(calenderDoc => {
                  calenderDoc.data.unshift(itemToSave);
                  calenderDoc
                    .save()
                    .then(userCalender => res.redirect('/review'))
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
                        .then(userCalender => res.redirect('/review'))
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
                      .then(updatedCalenderData => res.redirect('/review'));
                  })
                  .catch(err => res.status(404).json(err));
              } else {
                // you have to push new item[today]

                // add data to users model (Calender) data array
                Calender.findOne({ author: req.user._id }).then(calenderDoc => {
                  calenderDoc.data.unshift(itemToSave);
                  calenderDoc
                    .save()
                    .then(userCalender => res.redirect('/review'))
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
                        .then(userCalender => res.redirect('/review'))
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
                      .then(updatedCalenderData => res.redirect('/review'));
                  })
                  .catch(err => res.status(404).json(err));
              } else {
                // you have to push new item[today]

                // add data to users model (Calender) data array
                Calender.findOne({ author: req.user._id }).then(calenderDoc => {
                  calenderDoc.data.unshift(itemToSave);
                  calenderDoc
                    .save()
                    .then(userCalender => res.redirect('/review'))
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
                        .then(userCalender => res.redirect('/review'))
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
                      .then(updatedCalenderData => res.redirect('/review'));
                  })
                  .catch(err => res.status(404).json(err));
              } else {
                // you have to push new item[today]

                // add data to users model (Calender) data array
                Calender.findOne({ author: req.user._id }).then(calenderDoc => {
                  calenderDoc.data.unshift(itemToSave);
                  calenderDoc
                    .save()
                    .then(userCalender => res.redirect('/review'))
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

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

module.exports = router;
