var _ = require('lodash');
var Employee = require('../models/employee');
class EmployeesCtrl {
  index(req, res) {
    Employee.find({}, function(err, employees) {
      if (err) throw err;
      res.send(employees);  
    });
  }

  create(req, res) {
    const thingsNeedToBeValidated = ['name', 'email', 'employee_id', 'unix_id'];
    let validated = true;
    _(thingsNeedToBeValidated).each(function(thing){
      console.log(thing,req.body[thing]);
      if(!validated) return;

      if (!req.body[thing] || _.isEmpty(req.body[thing])){
        validated = false;
        res.status(400).json({ success: false, message: `${thing} is required` });
      }
    });

    if(validated) {
      res.send({success: true});
    }
  }
}

module.exports = EmployeesCtrl;