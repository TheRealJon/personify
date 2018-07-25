//  OpenShift sample Node application
const express = require('express'),
    avatarStorage = require('./backend/avatarStorage'),
    imgFilter = require('./backend/imgFilter'),
    morgan  = require('morgan'),
    mongodb = require('mongodb');
    multer = require('multer'),
    path    = require('path'),
    app     = express(),
    upload = multer({storage: avatarStorage, fileFilter: imgFilter });

Object.assign=require('object-assign')

// Serve static files from specific folders folder
app.use(express.static('./frontend/dist'));
app.use('/assets', express.static('./frontend/dist/assets'));

// Server logging
app.use(morgan('combined'));

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0',
    mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL,
    mongoURLLabel = '';

if (mongoURL == null && process.env.DATABASE_SERVICE_NAME) {
  var mongoServiceName = process.env.DATABASE_SERVICE_NAME.toUpperCase(),
      mongoHost = process.env[mongoServiceName + '_SERVICE_HOST'],
      mongoPort = process.env[mongoServiceName + '_SERVICE_PORT'],
      mongoDatabase = process.env[mongoServiceName + '_DATABASE'],
      mongoPassword = process.env[mongoServiceName + '_PASSWORD']
      mongoUser = process.env[mongoServiceName + '_USER'];

  if (mongoHost && mongoPort && mongoDatabase) {
    mongoURLLabel = mongoURL = 'mongodb://';
    if (mongoUser && mongoPassword) {
      mongoURL += mongoUser + ':' + mongoPassword + '@';
    }
    // Provide UI label that excludes user id and pw
    mongoURLLabel += mongoHost + ':' + mongoPort + '/' + mongoDatabase;
    mongoURL += mongoHost + ':' +  mongoPort + '/' + mongoDatabase;

  }
}
var db = null,
    dbDetails = new Object();

var initDb = function(callback) {
  if (mongoURL == null) {
    console.log("Cannot connect to MongoDB. No URL provided.");
    return;
  }


  if (mongodb == null) {
    console.log("Cannot connect to MongoDB. No client instance is present.");
    return;
  }

  mongodb.connect(mongoURL, function(err, conn) {
    if (err) {
      callback(err);
      return;
    }
    db = conn;
    dbDetails.databaseName = db.databaseName;
    dbDetails.url = mongoURLLabel;
    dbDetails.type = 'MongoDB';
    console.log('Connected to MongoDB at: %s', dbDetails.url);
  });
};

app.get('/api/personas', function (req, res) {
  db.collection('personas').find({}).toArray(function(err, result){
    if (err) throw err
    personas = result;
    res.render('home', {personas: result, navItems});
  });
});

app.get('/api/persona/:id/card', function(req, res){
  var id = new mongodb.ObjectID(req.params.id);
  db.collection('personas').find({ _id: id }).toArray(function(err, result){
    if(err) throw err;
    if(result.length > 0){
      res.render('persona-card', {persona: result[0], navItems});
    } else {
      res.render('404');
    }
  });
});

app.get('/api/persona/:id/details', function(req, res){
  // TODO retrieve persona from mongodb
  var id = new mongodb.ObjectID(req.params.id);
  db.collection('personas').find({ _id: id }).toArray(function(err, result){
    if(err) throw err;
    if(result.length > 0){
      res.render('persona-details', {persona: result[0], navItems});
    } else {
      res.render('404');
    }
  });
})

app.get('/api/create', function(req, res){
  res.render('create-persona', {navItems});
});

app.post('/create', upload.single('photo'), function(req, res){
  var persona = {};
  persona.name = req.body.name;
  persona.jobTitle = req.body.jobTitle;
  persona.keysToSuccess = req.body.keysToSuccess;
  persona.dangers = req.body.dangers;
  persona.quote = req.body.quote;
  persona.network = req.body.quote;
  persona.photo = '/avatars/' + req.file.filename;
  persona.network = req.body.network;
  persona.dayInTheLife = {};
  persona.skills = [];
  persona.dayInTheLife.summary = req.body.dayInTheLife;
  req.body.skills.forEach(function(skill, index){
    persona.skills.push({
      name: skill,
      rating: req.body.ratings[index]
    });
  });
  db.collection('personas').insertOne(persona, function(err, res){
    if (err) throw err;
  });
  res.redirect('/');
});

// error handling
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500).send('Something bad happened!');
});

initDb(function(err){
  console.log('Error connecting to Mongo. Message:\n'+err);
});

app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);

module.exports = app;
