var chai     = require('chai');
var _        = require('lodash');

var Employee = require('../app/models/employee');
var h        = require('./test_helper');
var expect   = chai.expect;

describe('Employee', function(){  
  afterEach(function(done){    
    Employee.remove({}, function() {      
      done();    
    });  
  });

  it('should be able to add new employee', function(done){
    let emp = h.newEmployee();
    emp.save(function(err, empObj){
      expect(err).to.not.be.ok;
      expect(emp.due).to.equal(0);
      done();
    });
  });

  it('should not be able to add new employee if email is invalid', function(done){
    let emp = h.newEmployee();
    emp.email = 'incorrectEmailFormat';
    emp.save(function(err, empObj){
      expect(err).to.be.ok;
      expect(err.errors).to.be.ok;
      expect(err.errors).to.have.property('email');
      done();
    });
  });

  it('should not be able to add two employees with same employee id', function(done){
    let emp = h.newEmployee();
    emp.save(function(err, empObj){
      expect(err).to.be.not.ok;
      let anotherEmp = _.pick(emp, ['name', 'email', 'employee_id', 'unix_id']);
      Employee.create(anotherEmp, function(err2, anotherEmp){
        expect(err2).to.be.ok;
        let errObj = err2.toJSON();
        expect(errObj).to.have.property('code');
        expect(errObj).to.have.property('errmsg');
        done();
      });      
    });
  });
});