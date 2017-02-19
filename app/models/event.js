var mongoose  = require('mongoose');
var validator = require('validator');
var _         = require('lodash');
var Employee = require('./employee');
var Schema = mongoose.Schema;
var eventTypes = ['Marriage', 'Birthday', 'Farewell', 'Visit', 'Misc'];

// set up a mongoose model
var eventSchema = new Schema({ 
  name: { type: String, required: true },
  type: { type: String, enum: eventTypes },
  date_of_event: { type: Date, required: true },
  collectible_amount: { type: Number, required: true },
  excluded_employees: { 
                        type: [Schema.Types.ObjectId],
                        validate: {
                                  validator: function(v, cb) {
                                    let empValidate = [];
                                    _(v).each(function(empId){
                                      empValidate.push(new Promise((resolve, reject) => {
                                        Employee.findById(empId, function(err, emp) {
                                          if (err){
                                            reject('Error executing queries');
                                          } 
                                          if(emp) {
                                            resolve(emp);
                                          } else {
                                            reject(`Employee not found for ${empId}`);
                                          }
                                        });
                                      }));
                                    });
                                    Promise.all(empValidate).then((values) => {
                                      cb(true);
                                    }, (reason) => {
                                      cb(false, reason);
                                    });
                                  },
                                  message: '{VALUE} is not a valid employee!'
                                },
                      },
  total_expense: { type: Number, default: 0.0 },
  total_collection: { type: Number, default: 0.0 }
});

eventSchema.virtual('left_over').get(function () {
  return this.total_collection - this.total_expense;
});

// On save update the due for every employee
eventSchema.post('save', function(event, next) {
  // Find all employee
  Employee.find({isActive: true}, function(err, emps){
    if (err) throw err;
    let updatePromises = [];
    _(emps).each(function(emp) {
      // if some one is excluded do not update their dues
      if(_.findIndex(event.excluded_employees, emp._id) == -1){
        emp['due'] = emp['due'] + event.collectible_amount;
        let empId = emp._id;
        delete emp._id;
        updatePromises.push(new Promise(function(resolve, reject){
          Employee.findOneAndUpdate({ _id: empId }, { $set:emp }, (err, empObj) => {
            if (err) reject(`Unable to update employee ${empId}`);
            if(empObj) {
              resolve(empObj);
            }
          });
        })); 
      }      
    });
    Promise.all(updatePromises).then((values) => {
      next();
    }, (reason) => {
      throw (new Error(reason));
    });    
  });
});

// On removal of event remove due for every employee
eventSchema.post('findOneAndRemove', function(event, next) {
  Employee.find({ isActive: true }, function(err, emps){
    if (err) throw err;
    let updatePromises = [];
    _(emps).each(function(emp) {
      // if some one is excluded do not update their dues
      if(_.findIndex(event.excluded_employees, emp._id) == -1){
        emp['due'] = emp['due'] - event.collectible_amount;
        let empId = emp._id;
        delete emp._id;
        updatePromises.push(new Promise(function(resolve, reject){
          Employee.findOneAndUpdate({ _id: empId }, { $set:emp }, (err, empObj) => {
            if (err) reject(`Unable to update employee ${empId}`);
            if(empObj) {
              resolve(empObj);
            }
          });
        }));
      }
    });
    Promise.all(updatePromises).then((values) => {
      next();
    }, (reason) => {
      throw (new Error(reason));
    });    
  });
});


eventSchema.post('findOneAndUpdate', function(event, next) {
  this.findOne({ _id: event._id }, function(err, updatedEvent) {
    Employee.find({ isActive: true }, function(err, emps){
      if (err) throw err;
      let updatePromises = [];
      _(emps).each(function(emp) {
        if(_.findIndex(updatedEvent.excluded_employees, emp._id) == -1 && 
           _.findIndex(event.excluded_employees, emp._id) != -1){
          // Currently not in the exclusion list but
          // previously was on exclusion list
          // update dues with latest collectible amount
          emp['due'] = emp['due'] + updatedEvent.collectible_amount;
        } else if(_.findIndex(updatedEvent.excluded_employees, emp._id) != -1 && 
                  _.findIndex(event.excluded_employees, emp._id) == -1) {
          // Currently in the exclusion list but 
          // Previously was not on the exclusion list
          // remove previous collectible amount from due
          emp['due'] = emp['due'] - event.collectible_amount;
        } else if(_.findIndex(updatedEvent.excluded_employees, emp._id) == -1 && 
                  _.findIndex(event.excluded_employees, emp._id) == -1) {
          // Both time not on exclusion list 
          // Normal changes in dues
          emp['due'] = emp['due'] - event.collectible_amount;
          emp['due'] = emp['due'] + updatedEvent.collectible_amount;
        }

        let empId = emp._id;
        delete emp._id;
        updatePromises.push(new Promise(function(resolve, reject){
          Employee.findOneAndUpdate({ _id: empId }, { $set:emp }, (err, empObj) => {
            if (err) reject(`Unable to update employee ${empId}`);
            if(empObj) {
              resolve(empObj);
            }
          });
        }));
      });
      Promise.all(updatePromises).then((values) => {
        next();
      }, (reason) => {
        throw (new Error(reason));
      });      
    });
  });
});

module.exports = mongoose.model('Event', eventSchema);