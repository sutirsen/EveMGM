var app = require('./app');

app.set('port', process.env.PORT || 3030);

var server = app.listen(app.get('port'), '0.0.0.0', function(err) {
  if (err) {
    console.log(err);
    return;
  }
  console.log('Express server listening on port ' + server.address().port);
});
