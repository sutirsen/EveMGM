var express         = require('express');
var _               = require('lodash');
var jwt             = require('jsonwebtoken');
var User            = require('../models/user');
var Employee        = require('../models/employee');
var Event           = require('../models/event');
var EventExpense    = require('../models/event_expense');
var EventCollection = require('../models/event_collection');
var resource        = require('../models/resource');

var router = express.Router();


router.get('/', function(req, res) {
  res.send({ message: 'Welcome to Event API' });
});

router.get('/setup', function(req, res) {
  if(req.query.admin && req.query.admin == 'superSecret') {
    User.create({
      name: req.query.name,
      email: req.query.email,
      password: req.query.password
    }, function(err, usr) {
      if(err) res.status(400).json({ success: false, message: 'Not created!' });

      if(usr) {
        res.status(200).json({ success: true, message: 'User created!' });      
      }
    });
  } else {
    res.status(200).json({ success: false, message: 'You don\'t have the secret' }); 
  }  
});

router.post('/authenticate', function(req, res) {
  if(!req.body.email || !req.body.password) {
    res.status(400).json({ 
      success: false, 
      message: 'Authentication failed.' });
    return;
  }
  // find the user
  User.findOne({
    email: req.body.email
  }, function(err, user) {

    if (err) throw err;

    if (!user) {
      res.status(400).json({ success: false, message: 'Authentication failed.' });
    } else if (user) {

      // check if password matches
      user.verifyPassword(req.body.password, function(err, valid) {
        if (err) {
          res.status(400).json({ success: false, message: 'Authentication failed.' });
        }
        if(valid) {
          var token = jwt.sign(user, req.app.get('superSecret'), {
            expiresIn: 86400 // expires in 24 hours
          });
          res.status(200).json({
            success: true,
            message: 'Enjoy your token!',
            token: token,
            user: user
          });  
        } else {
          res.status(400).json({ success: false, message: 'Authentication failed.' }); 
        }
        

      });
    }

  });
});

// Protection gateway
router.use(function(req, res, next) {

  // check header or url parameters or post parameters for token
  var token = req.query.token || req.body.token || req.params.token || req.headers['x-access-token'];

  // decode token
  if (token) {

    // verifies secret and checks exp
    jwt.verify(token, req.app.get('superSecret'), function(err, decoded) {      
      if (err) {
        return res.json({ success: false, message: 'Failed to authenticate token.' });    
      } else {
        // if everything is good, save to request for use in other routes
        req.user = decoded;  
        next();
      }
    });

  } else {

    // if there is no token
    // return an error
    return res.status(403).send({ 
      success: false, 
      message: 'No token provided.'
    });
    
  }
  
});


router.get('/protected', function(req, res) {
  res.send({ message: 'Protected Event API' });
});

router.get('/employees/find', function(req, res) {
  console.log('Trapped');
  let qryObj = req.query;
  delete qryObj.token;
  for(let k in qryObj){
    if(qryObj[k] == 'true' || qryObj[k] == 'false'){
      qryObj[k] = eval(qryObj[k]);
    }
  }
  Employee.find(qryObj).exec(function(err, data){
    if(err) { return res.status(500).send(err); }
    res.status(200).json(data);
  });
});
router.use('/employees', resource('employee', Employee));

router.get('/events/find', function(req, res) {
  let qryObj = req.query;
  delete qryObj.token;
  Event.find(qryObj).exec(function(err, data){
    if(err) { return res.status(500).send(err); }
    res.status(200).json(data);
  });
});
router.use('/events', resource('event', Event));

router.get('/event_expenses/find', function(req, res) {
  let qryObj = req.query;
  delete qryObj.token;
  EventExpense.find(qryObj).exec(function(err, data){
    if(err) { return res.status(500).send(err); }
    res.status(200).json(data);
  });
});
router.use('/event_expenses', resource('event_expense', EventExpense));

router.get('/event_collections/find', function(req, res) {
  let qryObj = req.query;
  delete qryObj.token;
  EventCollection.find(qryObj).exec(function(err, data){
    if(err) { return res.status(500).send(err); }
    res.status(200).json(data);
  });
});
router.use('/event_collections', resource('event_collection', EventCollection));

module.exports = router;