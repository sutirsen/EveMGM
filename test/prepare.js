var mongoose = require('mongoose');
var config   = require('../config');
mongoose.Promise = require('bluebird');
mongoose.connect(config.test_database);