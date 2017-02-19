var mongoose  = require('mongoose');
var validator = require('validator');
var _         = require('lodash');
var Event     = require('./event');
var Employee  = require('./employee');
var Schema    = mongoose.Schema;

// set up a mongoose model
var eventCollectionSchema = new Schema({ 
  amount: { type: Number, required: true },
  contribution_date: { type: Date, default: Date.now },
  mode_of_payment: { type: String, enum: ['Cash', 'NetBanking', 'PayTm', 'Other'] },
  event_id: { 
              type: Schema.Types.ObjectId,
              validate: {
                validator: function(v, cb){
                  Event.findById(v, function(err, ev) {
                    if (err){
                      cb(false, 'Error with query');
                    } 
                    if(ev) {
                      cb(true);
                    } else {
                      cb(false, 'Not an event id');
                    }
                  });
                }
              },
              required: true
            },
  contributor: { 
              type: Schema.Types.ObjectId,
              validate: {
                validator: function(v, cb){
                  Employee.findById(v, function(err, emp) {
                    if (err){
                      cb(false, 'Error with query');
                    } 
                    if(emp) {
                      cb(true);
                    } else {
                      cb(false, 'Not an employee id');
                    }
                  });
                }
              },
              required: [true, 'Provide an employee id']
            },
  misc_details: { type: String }
});

eventCollectionSchema.post('save', function(collection, next) {
  let updationPromises = [];
  updationPromises.push(new Promise(function(resolve, reject){
    Event.findById(collection.event_id, function(err, ev){
      if (err) reject(`Problem while trying to find Event :: ${collection.event_id}`);
      ev['total_collection'] = ev['total_collection'] + collection.amount;
      delete ev._id;
      Event.findOneAndUpdate( { _id: collection.event_id }, { $set:ev }, 
        function(err, newEventObj){ 
          if(err) {
            reject(`Unable to update event ${collection.event_id}`);
          } else if(newEventObj) {
            resolve(newEventObj);
          }
        }
      );
    });  
  }));

  updationPromises.push(new Promise(function(resolve, reject){
    Employee.findOne({ _id: collection.contributor }, function(err, empObj) {
      if (err) reject(`Problem when trying to find Employee :: ${collection.contributor}`);
      empObj['due'] = empObj['due'] - collection.amount;
      delete empObj._id;
      Employee.findOneAndUpdate( { _id: collection.contributor }, { $set: empObj },
        function(err, newEmpObj){
          if(err) {
            reject(`Unable to update employee ${collection.contributor}`);
          } else if(newEmpObj) {
            resolve(newEmpObj);
          }
        }
      );
    });
  }));
  
  Promise.all(updationPromises).then(function(results) {
    next();
  }, function(errors) {
    throw (new Error(errors));
  });

});

eventCollectionSchema.post('findOneAndRemove', function(collection, next) {
  let reductionPromises = [];
  reductionPromises.push(new Promise(function(resolve, reject){
    Event.findById(collection.event_id, function(err, ev){
      if (err) reject(`Error while finding event ${collection.event_id}`);
      ev['total_collection'] = ev['total_collection'] - collection.amount;
      delete ev._id;
      Event.findOneAndUpdate({ _id: collection.event_id }, { $set:ev }, (err, evnt) => {
        if(err) {
          reject(`Unable to update event ${collection.event_id}`);
        } else if(evnt) {
          resolve(evnt);
        }
      });
    });  
  }));

  reductionPromises.push(new Promise(function(resolve, reject){
    Employee.findById(collection.contributor, function(err, empObj){
      if (err) reject(`Error while finding employee ${collection.contributor}`);
      empObj['due'] = empObj['due'] + collection.amount;
      delete empObj._id;
      Employee.findOneAndUpdate({ _id: collection.contributor }, { $set:empObj }, 
        (err, newEmp) => {
          if(err) {
            reject(`Unable to update employee ${collection.contributor}`);
          } else if(newEmp) {
            resolve(newEmp);
          }
        }
      );
    });
  }));

  Promise.all(reductionPromises).then(function(results){
    next();
  }, function(errors) {
    throw (new Error(errors));
  });
  
});

eventCollectionSchema.post('findOneAndUpdate', function(collection, next) {
  let oldCollection = collection;
  let newCollection = null;
  this.findOne({ _id: collection._id }, function(err, data) {
    newCollection = data;
    let updationPromises = [];
    // first Section
    updationPromises.push(new Promise(function(resolve, reject){
      Event.findOne({ _id: oldCollection.event_id }, function(err, evObj){
        if (err) reject(`Unable to update event ${oldCollection.event_id}`);
        if (evObj){
          evObj['total_collection'] = evObj['total_collection'] - oldCollection.amount;
          delete evObj._id;
          Event.findOneAndUpdate({ _id: oldCollection.event_id }, { $set: evObj }, 
            function(err, updatedEvent){
              if (err) reject(`Unable to update event with changed total_collection ${oldCollection.event_id}`);
              if (updatedEvent) {
                resolve(updatedEvent);
              }
            }
          );
        }
      });
    }));

    updationPromises.push(new Promise(function(resolve, reject) {
      Employee.findOne({ _id: oldCollection.contributor }, function(err, empObj){
        if (err) reject(`Unable to update employee ${oldCollection.contributor}`);
        if (empObj){
          empObj['due'] = empObj['due'] + oldCollection.amount;
          delete empObj._id;
          Employee.findOneAndUpdate({ _id: oldCollection.contributor }, { $set: empObj }, 
            function(err, updatedEmp){
              if (err) reject(`Unable to update employee with new due ${oldCollection.contributor}`);
              if(updatedEmp) {
                resolve(updatedEmp);
              }
            }
          );
        }
      });
    }));

    Promise.all(updationPromises).then(function(results){
      // second Section 
      let newUpdationPromises = [];
      newUpdationPromises.push(new Promise(function(resolve, reject){
        Event.findOne({ _id: newCollection.event_id }, function(err, evObj){
          if (err) reject(`Unable to update event ${newCollection.event_id}`);
          if (evObj){
            evObj['total_collection'] = evObj['total_collection'] + newCollection.amount;
            delete evObj._id;
            Event.findOneAndUpdate({ _id: newCollection.event_id }, { $set: evObj }, 
              function(err, updatedEvent){
                if (err) reject(`Unable to update event with changed total_collection ${newCollection.event_id}`);
                if (updatedEvent) {
                  resolve(updatedEvent);
                }
              }
            );
          }
        });
      }));

      newUpdationPromises.push(new Promise(function(resolve, reject) {
        Employee.findOne({ _id: newCollection.contributor }, function(err, empObj){
          if (err) reject(`Unable to update employee ${newCollection.contributor}`);
          if (empObj){
            empObj['due'] = empObj['due'] - newCollection.amount;
            delete empObj._id;
            Employee.findOneAndUpdate({ _id: newCollection.contributor }, { $set: empObj }, 
              function(err, updatedEmp){
                if (err) reject(`Unable to update employee with new due ${newCollection.contributor}`);
                if(updatedEmp) {
                  resolve(updatedEmp);
                }
              }
            );
          }
        });
      }));

      Promise.all(newUpdationPromises).then(function(newResults){
        next();
      }, function(newErr){
        throw (new Error(errors));
      });
    }, function(errors){
      throw (new Error(errors));
    });
  });
});



module.exports = mongoose.model('EventCollection', eventCollectionSchema);