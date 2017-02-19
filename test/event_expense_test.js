var chai  = require('chai');
var _     = require('lodash');

var Event        = require('../app/models/event');
var EventExpense = require('../app/models/event_expense');
var Employee     = require('../app/models/employee');
var h            = require('./test_helper');
var expect       = chai.expect;

describe('EventExpense', function(){

  let employee = null;  
  let event = null;  
  beforeEach(function(done){ 
    let inserterPromises = [];  
    let emp = h.newEmployee();
    inserterPromises.push(new Promise(function(resolve, reject){
      emp.save(function(err, empObj){
        if(err) {
          reject('Unable to create employee');
        }
        if(empObj) {
          employee = empObj;
          resolve(empObj);
        }
      });    
    }));

    let ev = h.newEvent('Random Ev', 0);
    inserterPromises.push(new Promise(function(resolve, reject){
      ev.save(function(err, evObj){
        if(err) {
          reject('Unable to create employee');
        }
        if(evObj) {
          event = evObj;
          resolve(evObj);
        }
      });    
    }));
    Promise.all(inserterPromises).then((values) => {
      done();
    }, (reason) => {
      throw (new Error(reason));
    });
  });

  context('Creating a new EventExpense', function(){
    it('should be able to add a new event expense', function(done){
      let eventExpense = h.newEventExpense(event, employee);
      eventExpense.save(function(err, evexObj) {
        expect(err).to.be.not.ok;
        expect(evexObj).to.be.ok;  
        done();
      });
    });

    it('should not be able to add event expense without a valid event id', 
      function(done){
        let eventExpense = h.newEventExpense(employee._id, employee);
        eventExpense.save(function(err, evexObj) {
          expect(err).to.be.ok;
          expect(evexObj).to.be.not.ok;  
          done();
        });
      }
    );

    it('should not be able to add event expense without a valid employee id', 
      function(done){
        let eventExpense = h.newEventExpense(event, event._id);
        eventExpense.save(function(err, evexObj) {
          expect(err).to.be.ok;
          expect(evexObj).to.be.not.ok;
          done();
        });
      }
    );

    it('should update the total expense of the referred event', function(done){
      let eventExpense = h.newEventExpense(event, employee, 'Cake', 200);
      expect(event).to.have.property('total_expense');
      expect(event.total_expense).to.equal(0);
      eventExpense.save(function(err, evexObj) {
        expect(err).to.be.not.ok;
        expect(evexObj).to.be.ok;  
        Event.findOne({ _id: event._id }, function(err, evObj){
          expect(err).to.be.not.ok;
          expect(evObj).to.be.ok;
          expect(evObj).to.have.property('total_expense');
          expect(evObj.total_expense).to.equal(200);
          done();
        });
      });
    });

    it('should update the due of referred employee after deducting the expense amount',
      function(done){
        let eventExpense = h.newEventExpense(event, employee, 'Cake', 200);
        expect(employee).to.have.property('due');
        expect(employee.due).to.equal(0);
        eventExpense.save(function(err, evexObj) {
          expect(err).to.be.not.ok;
          expect(evexObj).to.be.ok;  
          Employee.findOne({ _id: employee._id }, function(err, empObj){
            expect(err).to.be.not.ok;
            expect(empObj).to.be.ok;
            expect(empObj).to.have.property('due');
            expect(empObj.due).to.equal(-200);
            done();
          });
        });
      }
    );
  });

  context('Updating an EventExpense', function() {
    it('should update the total expense of the referred event if amount is changed', function(done){
      let evex = h.newEventExpense(event, employee, 'Cake', 200);
      evex.save(function(err, evexObj){
        expect(err).to.not.be.ok;
        expect(evexObj).to.be.ok;
        Event.findOne({ _id: event._id }, function(err, evObj){
          expect(err).to.be.not.ok;
          expect(evObj).to.have.property('total_expense');
          expect(evObj.total_expense).to.equal(200);
          let evexId = evexObj._id;
          evexObj['amount'] = 100;
          delete evexObj._id;
          EventExpense.findOneAndUpdate({ _id: evexId }, { $set: evexObj }, function(err, updatedEvEx){
            expect(err).to.be.not.ok;
            Event.findOne({ _id: event._id }, function(err, updatedEvent){
              expect(err).to.be.not.ok;
              expect(updatedEvent).to.be.ok;
              expect(updatedEvent).to.have.property('total_expense');
              expect(updatedEvent.total_expense).to.be.equal(100);
              done();
            });
          });
        });
      });
    });

    it('should update the due of the referred employee if amount is changed', function(done){
      let evex = h.newEventExpense(event, employee, 'Cake', 200);
      evex.save(function(err, evexObj){
        expect(err).to.not.be.ok;
        expect(evexObj).to.be.ok;
        Employee.findOne({ _id: employee._id }, function(err, empObj){
          expect(err).to.be.not.ok;
          expect(empObj).to.have.property('due');
          expect(empObj.due).to.equal(-200);
          let evexId = evexObj._id;
          evexObj['amount'] = 100;
          delete evexObj._id;
          EventExpense.findOneAndUpdate({ _id: evexId }, { $set: evexObj }, function(err, updatedEvEx){
            expect(err).to.be.not.ok;
            Employee.findOne({ _id: employee._id }, function(err, updatedEmp){
              expect(err).to.be.not.ok;
              expect(updatedEmp).to.be.ok;
              expect(updatedEmp).to.have.property('due');
              expect(updatedEmp.due).to.be.equal(-100);
              done();
            });
          });
        });
      });
    });

    it('should update the total expense of both old and new event if referred event is changed',
      function(done){
        let evex = h.newEventExpense(event, employee, 'Cake', 200);
        evex.save(function(err, evexObj){
          expect(err).to.not.be.ok;
          expect(evexObj).to.be.ok;
          Event.findOne({ _id: event._id }, function(err, evObj){
            expect(err).to.be.not.ok;
            expect(evObj).to.have.property('total_expense');
            expect(evObj.total_expense).to.equal(200);
            let newEv = h.newEvent('Another Random Ev', 200);
            newEv.save(function(err, newEvSaved){
              expect(err).to.be.not.ok;
              let evexId = evexObj._id;
              evexObj['event_id'] = newEvSaved._id;
              delete evexObj._id;
              EventExpense.findOneAndUpdate({ _id: evexId }, { $set: evexObj }, function(err, updatedEvEx){
                expect(err).to.be.not.ok;
                let findPromises = [];
                findPromises.push(new Promise(function(resolve, reject){
                  Event.findOne({ _id: event._id }, function(err, updatedEvent){
                    expect(err).to.be.not.ok;
                    expect(updatedEvent).to.be.ok;
                    expect(updatedEvent).to.have.property('total_expense');
                    expect(updatedEvent.total_expense).to.be.equal(0);
                    resolve();
                  });
                }));

                findPromises.push(new Promise(function(resolve, reject){
                  Event.findOne({ _id: newEvSaved._id }, function(err, updatedEvent){
                    expect(err).to.be.not.ok;
                    expect(updatedEvent).to.be.ok;
                    expect(updatedEvent).to.have.property('total_expense');
                    expect(updatedEvent.total_expense).to.be.equal(200);
                    resolve();
                  });
                }));
                Promise.all(findPromises).then(function(){
                  done();
                });           
              });
            });            
          });
        });
      }
    );

    it('should update the due of both old and new employee if referred employee is changed',
      function(done){
        let evex = h.newEventExpense(event, employee, 'Cake', 200);
        evex.save(function(err, evexObj){
          expect(err).to.not.be.ok;
          expect(evexObj).to.be.ok;
          Employee.findOne({ _id: employee._id }, function(err, empObj){
            expect(err).to.be.not.ok;
            expect(empObj).to.have.property('due');
            expect(empObj.due).to.equal(-200);
            let newEmp = h.newEmployee('Jane Doe', 123456, 'jdoe', 'jdoe@ex.com');
            newEmp.save(function(err, newEmpSaved){
              expect(err).to.be.not.ok;
              let evexId = evexObj._id;
              evexObj['expense_made_by'] = newEmpSaved._id;
              delete evexObj._id;
              EventExpense.findOneAndUpdate({ _id: evexId }, { $set: evexObj }, function(err, updatedEvEx){
                expect(err).to.be.not.ok;
                let findPromises = [];
                findPromises.push(new Promise(function(resolve, reject){
                  Employee.findOne({ _id: employee._id }, function(err, emp){
                    expect(err).to.be.not.ok;
                    expect(emp).to.be.ok;
                    expect(emp).to.have.property('due');
                    expect(emp.due).to.be.equal(0);
                    resolve();
                  });
                }));

                findPromises.push(new Promise(function(resolve, reject){
                  Employee.findOne({ _id: newEmpSaved._id }, function(err, emp){
                    expect(err).to.be.not.ok;
                    expect(emp).to.be.ok;
                    expect(emp).to.have.property('due');
                    expect(emp.due).to.be.equal(-200);
                    resolve();
                  });
                }));
                Promise.all(findPromises).then(function(){
                  done();
                });           
              });
            });            
          });
        });
      }
    );

    it('should update the due of both old and new employee if both referred employee and amount is changed',
      function(done){
        let evex = h.newEventExpense(event, employee, 'Cake', 200);
        evex.save(function(err, evexObj){
          expect(err).to.not.be.ok;
          expect(evexObj).to.be.ok;
          Employee.findOne({ _id: employee._id }, function(err, empObj){
            expect(err).to.be.not.ok;
            expect(empObj).to.have.property('due');
            expect(empObj.due).to.equal(-200);
            let newEmp = h.newEmployee('Jane Doe', 123456, 'jdoe', 'jdoe@ex.com');
            newEmp.save(function(err, newEmpSaved){
              expect(err).to.be.not.ok;
              let evexId = evexObj._id;
              evexObj['expense_made_by'] = newEmpSaved._id;
              evexObj['amount'] = 100;
              delete evexObj._id;
              EventExpense.findOneAndUpdate({ _id: evexId }, { $set: evexObj }, function(err, updatedEvEx){
                expect(err).to.be.not.ok;
                let findPromises = [];
                findPromises.push(new Promise(function(resolve, reject){
                  Employee.findOne({ _id: employee._id }, function(err, emp){
                    expect(err).to.be.not.ok;
                    expect(emp).to.be.ok;
                    expect(emp).to.have.property('due');
                    expect(emp.due).to.be.equal(0);
                    resolve();
                  });
                }));

                findPromises.push(new Promise(function(resolve, reject){
                  Employee.findOne({ _id: newEmpSaved._id }, function(err, emp){
                    expect(err).to.be.not.ok;
                    expect(emp).to.be.ok;
                    expect(emp).to.have.property('due');
                    expect(emp.due).to.be.equal(-100);
                    resolve();
                  });
                }));
                Promise.all(findPromises).then(function(){
                  done();
                });           
              });
            });            
          });
        });
      }
    );

    it('should update the total expense of both old and new event if both referred event and amount is changed',
      function(done){
        let evex = h.newEventExpense(event, employee, 'Cake', 200);
        evex.save(function(err, evexObj){
          expect(err).to.not.be.ok;
          expect(evexObj).to.be.ok;
          Event.findOne({ _id: event._id }, function(err, evObj){
            expect(err).to.be.not.ok;
            expect(evObj).to.have.property('total_expense');
            expect(evObj.total_expense).to.equal(200);
            let newEv = h.newEvent('Another Random Ev', 200);
            newEv.save(function(err, newEvSaved){
              expect(err).to.be.not.ok;
              let evexId = evexObj._id;
              evexObj['event_id'] = newEvSaved._id;
              evexObj['amount'] = 100;
              delete evexObj._id;
              EventExpense.findOneAndUpdate({ _id: evexId }, { $set: evexObj }, function(err, updatedEvEx){
                expect(err).to.be.not.ok;
                let findPromises = [];
                findPromises.push(new Promise(function(resolve, reject){
                  Event.findOne({ _id: event._id }, function(err, updatedEvent){
                    expect(err).to.be.not.ok;
                    expect(updatedEvent).to.be.ok;
                    expect(updatedEvent).to.have.property('total_expense');
                    expect(updatedEvent.total_expense).to.be.equal(0);
                    resolve();
                  });
                }));

                findPromises.push(new Promise(function(resolve, reject){
                  Event.findOne({ _id: newEvSaved._id }, function(err, updatedEvent){
                    expect(err).to.be.not.ok;
                    expect(updatedEvent).to.be.ok;
                    expect(updatedEvent).to.have.property('total_expense');
                    expect(updatedEvent.total_expense).to.be.equal(100);
                    resolve();
                  });
                }));
                Promise.all(findPromises).then(function(){
                  done();
                });           
              });
            });            
          });
        });
      }
    );
  });

  context('Deleting an EventExpense', function(){
    it('should reduce the total expense of referred event', function(done){
      let evex = h.newEventExpense(event, employee, 'Cake', 200);
      evex.save(function(err, evexObj){
        expect(err).to.be.not.ok;
        expect(evexObj).to.be.ok;
        Event.findOne({ _id: event._id }, function(err, evObj) {
          expect(err).to.be.not.ok;
          expect(evObj).to.be.ok;
          expect(evObj).to.have.property('total_expense');
          expect(evObj.total_expense).to.equal(200);
          EventExpense.findOneAndRemove({ _id: evexObj._id }, function(err, devexObj){
            expect(err).to.be.not.ok;
            Event.findOne({ _id: event._id }, function(err, newEvObj){
              expect(err).to.be.not.ok;
              expect(newEvObj).to.be.ok;
              expect(newEvObj).to.have.property('total_expense');
              expect(newEvObj.total_expense).to.equal(0);
              done();
            });  
          });
        });
      });
    });

    it('should update the due of the referred employee', function(done){
      let evex = h.newEventExpense(event, employee, 'Cake', 200);
      evex.save(function(err, evexObj){
        expect(err).to.be.not.ok;
        expect(evexObj).to.be.ok;
        Employee.findOne({ _id: employee._id }, function(err, empObj) {
          expect(err).to.be.not.ok;
          expect(empObj).to.be.ok;
          expect(empObj).to.have.property('due');
          expect(empObj.due).to.equal(-200);
          EventExpense.findOneAndRemove({ _id: evexObj._id }, function(err, devexObj){
            expect(err).to.be.not.ok;
            Employee.findOne({ _id: employee._id }, function(err, newEmpObj){
              expect(err).to.be.not.ok;
              expect(newEmpObj).to.be.ok;
              expect(newEmpObj).to.have.property('due');
              expect(newEmpObj.due).to.equal(0);
              done();
            });  
          });
        });
      });
    });
  });

  afterEach(function(done){
    let deletionPromises = [];
    EventExpense.remove({}, function(err) {
      if (err) throw err;
      deletionPromises.push(new Promise(function(resolve, reject){
        Employee.remove({}, function() {
          resolve();
        });
      })); 

      deletionPromises.push(new Promise(function(resolve, reject){
        Event.remove({}, function() {
          resolve();
        });
      }));

      Promise.all(deletionPromises).then(function(){
        done();
      });    
    });

          
  });
});