var chai     = require('chai');
var _        = require('lodash');

var Event    = require('../app/models/event');
var Employee = require('../app/models/employee');
var h        = require('./test_helper');
var expect   = chai.expect;

describe('Event', function(){  
  let firstEmployee = null;  
  let secondEmployee = null;  
  beforeEach(function(done){ 
    let inserterPromises = [];  

    //add some test data
    let emp = h.newEmployee();
    inserterPromises.push(new Promise(function(resolve, reject){
      emp.save(function(err, empObj){
        if(err) {
          reject('Unable to create employee');
        }
        if(empObj) {
          firstEmployee = empObj;
          resolve(empObj);
        }
      });    
    }));

    let anotherEmp = h.newEmployee('Jane Doe', 123456789, 'jdoe');

    inserterPromises.push(new Promise(function(resolve, reject){
      anotherEmp.save(function(err, empObj){
        if(err) {
          reject('Unable to create employee');
        }
        if(empObj) {
          secondEmployee = empObj;
          resolve(empObj);
        }
      });    
    }));
    Promise.all(inserterPromises).then((values) => {
      done();
    }, (reason) => {
      throw (new Error(reason));
    });
  }); 

  context('Creating new event', function() {
    it('should update dues of employees', function(done){
      let ev = h.newEvent('Some Event', 150);
      ev.save(function(err, eventObj){
        expect(err).not.to.be.ok;
        let findPromises = [];
        findPromises.push(new Promise(function(resolve, reject) {
          Employee.findOne({ _id: firstEmployee._id }, function(err, empObj){
            expect(err).to.be.not.ok;
            expect(empObj).to.be.ok;
            expect(empObj).to.have.property('due');
            expect(empObj.due).to.equal(150);
            resolve();
          });
        }));

        findPromises.push(new Promise(function(resolve, reject){
          Employee.findOne({ _id: secondEmployee._id }, function(err, empObj){
            expect(err).to.be.not.ok;
            expect(empObj).to.be.ok;
            expect(empObj).to.have.property('due');
            expect(empObj.due).to.equal(150);
            resolve();
          });
        }));

        Promise.all(findPromises).then(function(values){
          done();
        });
      });

    });

    it('should update dues of only non-excluded employees', function(done){
      let ev = h.newEvent('Another Event', 300, [firstEmployee._id]);
      ev.save(function(err, eventObj){
        expect(err).not.to.be.ok;
        expect(eventObj).to.have.property('excluded_employees');
        expect(eventObj.excluded_employees).to.include(firstEmployee._id);
        expect(eventObj.excluded_employees).to.not.include(secondEmployee._id);
        let findPromises = [];
        findPromises.push(new Promise(function(resolve, reject){
          Employee.findOne({ _id: firstEmployee._id }, function(err, empObj){
            expect(err).to.be.not.ok;
            expect(empObj).to.be.ok;
            expect(empObj).to.have.property('due');
            expect(empObj.due).to.equal(0);
            resolve();
          });
        }));

        findPromises.push(new Promise(function(resolve, reject){
          Employee.findOne({ _id: secondEmployee._id }, function(err, empObj){
            expect(err).to.be.not.ok;
            expect(empObj).to.be.ok;
            expect(empObj).to.have.property('due');
            expect(empObj.due).to.equal(300);
            resolve();
          });
        }));

        Promise.all(findPromises).then(function(values){
          done();
        });
      }); 
    });

    it('should update due to proper value if more than one event is created', function(done){
      let creationPromises = [];
      let ev = h.newEvent('Some Event', 150);
      let ev2 = h.newEvent('Another Event', 300);
      
      ev.save(function(err, eventObj){
        expect(err).to.be.not.ok;
        expect(eventObj).to.be.ok;
        ev2.save(function(err, eventObj){
          expect(err).to.be.not.ok;
          expect(eventObj).to.be.ok;
          let findPromises = [];
          findPromises.push(new Promise(function(resolve, reject){
            Employee.findOne({ _id: firstEmployee._id }, function(err, empObj){
              expect(err).to.be.not.ok;
              expect(empObj).to.be.ok;
              expect(empObj).to.have.property('due');
              expect(empObj.due).to.equal(450);
              resolve();
            });
          }));

          findPromises.push(new Promise(function(resolve, reject){
            Employee.findOne({ _id: secondEmployee._id }, function(err, empObj){
              expect(err).to.be.not.ok;
              expect(empObj).to.be.ok;
              expect(empObj).to.have.property('due');
              expect(empObj.due).to.equal(450);
              resolve();
            });
          }));

          Promise.all(findPromises).then(function(values){
            done();
          });
        });
      });
    });
  });

  context('Updating existing event', function(){

    it('should update dues if employee is deleted from the exclusion list', function(done){
      let ev = h.newEvent('Some Event', 300, [firstEmployee._id]);
      ev.save(function(err, eventObj){
        expect(err).to.be.not.ok;
        expect(eventObj).to.be.ok;
        Employee.findOne({ _id: firstEmployee._id }, function(err, empObj){
          expect(err).to.be.not.ok;
          expect(empObj).to.have.property('due');
          expect(empObj.due).to.equal(0);
          eventObj.excluded_employees = [];
          delete eventObj._id;
          Event.findOneAndUpdate({ _id: eventObj.id }, { $set:eventObj }, function(err, newEventObj){
            expect(err).to.be.not.ok;
            Employee.findOne({ _id: firstEmployee._id }, function(err, empObj){
              expect(err).to.be.not.ok;
              expect(empObj).to.have.property('due');
              expect(empObj.due).to.equal(300);
              done();
            });
          });
        });
      })
    });

    it('should update dues if new employee is added to exclusion list', function(done){
      let ev = h.newEvent('Some Event', 300);
      ev.save(function(err, eventObj){
        expect(err).to.be.not.ok;
        expect(eventObj).to.be.ok;
        expect(eventObj).to.have.property('excluded_employees');
        expect(eventObj.excluded_employees).to.be.empty;
        Employee.findOne({ _id: firstEmployee._id }, function(err, empObj){
          expect(err).to.be.not.ok;
          expect(empObj).to.be.ok;
          expect(empObj).to.have.property('due');
          expect(empObj.due).to.equal(300);
          eventObj.excluded_employees = [firstEmployee._id];
          let eventId = eventObj._id;
          delete eventObj._id;
          Event.findOneAndUpdate({_id: eventId}, { $set:eventObj }, function(err, newEventObj){
            expect(err).to.be.not.ok;
            Employee.findOne({ _id: firstEmployee._id}, function(err, newEmpObj){
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

    it('should update dues if collectible amount is updated', function(done){
      let ev = h.newEvent('Some Event', 300);
      ev.save(function(err, eventObj){
        expect(err).to.be.not.ok;
        expect(eventObj).to.be.ok;
        Employee.findOne({ _id: firstEmployee._id }, function(err, empObj){
          expect(err).to.be.not.ok;
          expect(empObj).to.be.ok;
          expect(empObj).to.have.property('due');
          expect(empObj.due).to.equal(300);
          eventObj.collectible_amount = 150;
          let eventId = eventObj._id;
          delete eventObj._id;
          Event.findOneAndUpdate({_id: eventId}, { $set:eventObj }, function(err, newEventObj){
            expect(err).to.be.not.ok;
            Employee.findOne({ _id: firstEmployee._id}, function(err, newEmpObj){
              expect(err).to.be.not.ok;
              expect(newEmpObj).to.be.ok;
              expect(newEmpObj).to.have.property('due');
              expect(newEmpObj.due).to.equal(150);
              done();
            });
          });
        });
      });
    });
  });

  context('Deleting existing event', function(){

    it('should deduct dues if the event is deleted', function(done){
      let ev = h.newEvent('Some Event', 300);
      ev.save(function(err, eventObj){
        expect(err).to.be.not.ok;
        expect(eventObj).to.be.ok;
        Employee.findOne({ _id: firstEmployee._id }, function(err, empObj){
          expect(err).to.be.not.ok;
          expect(empObj).to.be.ok;
          expect(empObj).to.have.property('due');
          expect(empObj.due).to.equal(300);
          Event.findOneAndRemove({_id: eventObj._id}, function(err, newEventObj){
            expect(err).to.be.not.ok;
            Employee.findOne({ _id: firstEmployee._id}, function(err, newEmpObj){
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