var mongoose  = require('mongoose');
var validator = require('validator');
var _         = require('lodash');
var Event     = require('./event');
var Employee  = require('./employee');
var Schema    = mongoose.Schema;

// set up a mongoose model
var eventExpenseSchema = new Schema({ 
  name: { type: String, required: true },
  amount: { type: Number, min: 0,  default: 0 },
  expense_date: { type: Date },
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
  expense_made_by: { 
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

eventExpenseSchema.post('save', function(expense, next) {
  let updationPromises = [];
  updationPromises.push(new Promise(function(resolve, reject){
    Event.findById(expense.event_id, function(err, ev){
      if (err) reject(`Problem while trying to find Event :: ${expense.event_id}`);
      ev['total_expense'] = ev['total_expense'] + expense.amount;
      delete ev._id;
      Event.findOneAndUpdate( { _id: expense.event_id }, { $set:ev }, 
        function(err, newEventObj){ 
          if(err) {
            reject(`Unable to update event ${expense.event_id}`);
          } else if(newEventObj) {
            resolve(newEventObj);
          }
        }
      );
    });  
  }));

  updationPromises.push(new Promise(function(resolve, reject){
    Employee.findOne({ _id: expense.expense_made_by }, function(err, empObj) {
      if (err) reject(`Problem when trying to find Employee :: ${expense.expense_made_by}`);
      empObj['due'] = empObj['due'] - expense.amount;
      delete empObj._id;
      Employee.findOneAndUpdate( { _id: expense.expense_made_by }, { $set: empObj },
        function(err, newEmpObj){
          if(err) {
            reject(`Unable to update employee ${expense.expense_made_by}`);
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

eventExpenseSchema.post('findOneAndRemove', function(expense, next) {
  let reductionPromises = [];
  reductionPromises.push(new Promise(function(resolve, reject){
    Event.findById(expense.event_id, function(err, ev){
      if (err) reject(`Error while finding event ${expense.event_id}`);
      ev['total_expense'] = ev['total_expense'] - expense.amount;
      delete ev._id;
      Event.findOneAndUpdate({ _id: expense.event_id }, { $set:ev }, (err, evnt) => {
        if(err) {
          reject(`Unable to update event ${expense.event_id}`);
        } else if(evnt) {
          resolve(evnt);
        }
      });
    });  
  }));

  reductionPromises.push(new Promise(function(resolve, reject){
    Employee.findById(expense.expense_made_by, function(err, empObj){
      if (err) reject(`Error while finding employee ${expense.expense_made_by}`);
      empObj['due'] = empObj['due'] + expense.amount;
      delete empObj._id;
      Employee.findOneAndUpdate({ _id: expense.expense_made_by }, { $set:empObj }, 
        (err, newEmp) => {
          if(err) {
            reject(`Unable to update employee ${expense.expense_made_by}`);
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

// Things need to be done
// first Section : first total_expense and due will be updated by the old expense 
// by doing this the change in amount won't affect the calculation
// also push the update instead of doing it on same object in that way if the 
// employee or event changed it won't affect

// second Section : then update again with new expense object
eventExpenseSchema.post('findOneAndUpdate', function(expense, next) {
  let oldExpense = expense;
  let newExpense = null;
  this.findOne({ _id: expense._id }, function(err, data) {
    newExpense = data;
    let updationPromises = [];
    // first Section
    updationPromises.push(new Promise(function(resolve, reject){
      Event.findOne({ _id: oldExpense.event_id }, function(err, evObj){
        if (err) reject(`Unable to update event ${oldExpense.event_id}`);
        if (evObj){
          evObj['total_expense'] = evObj['total_expense'] - oldExpense.amount;
          delete evObj._id;
          Event.findOneAndUpdate({ _id: oldExpense.event_id }, { $set: evObj }, 
            function(err, updatedEvent){
              if (err) reject(`Unable to update event with changed total_expense ${oldExpense.event_id}`);
              if (updatedEvent) {
                resolve(updatedEvent);
              }
            }
          );
        }
      });
    }));

    updationPromises.push(new Promise(function(resolve, reject) {
      Employee.findOne({ _id: oldExpense.expense_made_by }, function(err, empObj){
        if (err) reject(`Unable to update employee ${oldExpense.expense_made_by}`);
        if (empObj){
          empObj['due'] = empObj['due'] + oldExpense.amount;
          delete empObj._id;
          Employee.findOneAndUpdate({ _id: oldExpense.expense_made_by }, { $set: empObj }, 
            function(err, updatedEmp){
              if (err) reject(`Unable to update employee with new due ${oldExpense.expense_made_by}`);
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
        Event.findOne({ _id: newExpense.event_id }, function(err, evObj){
          if (err) reject(`Unable to update event ${newExpense.event_id}`);
          if (evObj){
            evObj['total_expense'] = evObj['total_expense'] + newExpense.amount;
            delete evObj._id;
            Event.findOneAndUpdate({ _id: newExpense.event_id }, { $set: evObj }, 
              function(err, updatedEvent){
                if (err) reject(`Unable to update event with changed total_expense ${newExpense.event_id}`);
                if (updatedEvent) {
                  resolve(updatedEvent);
                }
              }
            );
          }
        });
      }));

      newUpdationPromises.push(new Promise(function(resolve, reject) {
        Employee.findOne({ _id: newExpense.expense_made_by }, function(err, empObj){
          if (err) reject(`Unable to update employee ${newExpense.expense_made_by}`);
          if (empObj){
            empObj['due'] = empObj['due'] - newExpense.amount;
            delete empObj._id;
            Employee.findOneAndUpdate({ _id: newExpense.expense_made_by }, { $set: empObj }, 
              function(err, updatedEmp){
                if (err) reject(`Unable to update employee with new due ${newExpense.expense_made_by}`);
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




module.exports = mongoose.model('EventExpense', eventExpenseSchema);