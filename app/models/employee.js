var mongoose  = require('mongoose');
var validator = require('validator');
var Schema = mongoose.Schema;

// set up a mongoose model
var employeeSchema = new Schema({ 
  name: { type: String, required: true },
  email: { 
            type: String, 
            validate: {
              validator: function(v) {
                return validator.isEmail(v);
              },
              message: '{VALUE} is not a valid email address!'
            },
            required: true
          },
  employee_id: { type: String, index: { unique: true }, required: true},
  unix_id: { type: String, index: { unique: true }, required: true},
  due: { type: Number, default: 0.0 },
  date_of_birth: Date,
  group: String,
  isActive: { type: Boolean, default: true }
});


module.exports = mongoose.model('Employee', employeeSchema);