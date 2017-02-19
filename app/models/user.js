var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// set up a mongoose model
var userSchema = new Schema({ 
  name: String,
  email: { type: String, index: { unique: true }}
});

userSchema.plugin(require('mongoose-bcrypt'));


module.exports = mongoose.model('User', userSchema);