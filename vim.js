const monitor = require('./monitor')
const auth = require('./auth')
var express = require('express');        
var app = express();                 
var bodyParser = require('body-parser');
var router = express.Router();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
/**
 * OVERVIEW
 * 
 * Monitor.js
 * 
 * - Read monitor.js to examine the Event Object and Event Result format
 * - For all create events, call createVM(Event)
 * - For all other events (start, stop, etc) call event(Event)
 * - For vm information, call getVMs(Event)
 * - Sample monitor.js code below
 * 
 * Auth.js
 * - Auth has two functions: createUser and login
 * 
 */

const http = require("http");
const port = process.env.PORT || 5000;

router.get('/', function(req, res) {
  res.json({ message: 'Hello World!' });   
});

router.post('/createUser', (req, res) => {
  var username = req.query.username;
  var password = req.query.password;
  auth.createUser(username, password).then(function(data) {
    res.json(data);
  });  
});

router.post('/login', (req, res) => {
  var username = req.query.username;
  var password = req.query.password;
  auth.login(username, password).then(function(data) {
    res.json(data);
  });  
});

router.post('/create', (req, res) => {
  var event = req.body.event;
  monitor.createVM(event).then(function(data){
    res.json(data);
  }); 
});

router.post('/launchEvent', (req, res) => {
  var event = req.body.event;
  monitor.event(event).then(function(data){
    res.json(data);
  }); 
});

router.get('/vm/all', (req, res) => {
  var event = req.body.event;
  console.log(event);
  monitor.getVMs(event).then(function(data){
    res.json(data);
  });
});

router.get('/vm/getUsage', (req, res) => {
    var event = req.body.event;
    var startTime = req.body.startTime;
    var endTime = req.body.endTime;
    monitor.singleVMUsage(event, startTime, endTime).then(function(data){
        console.log(data);
    });
});

router.get('/totalVMUsage', (req, res) => {
  var event = req.body.event;
  var startTime = req.body.startTime;
  var endTime = req.body.endTime;
  monitor.allVMUsage(event, startTime, endTime).then(function(data){
    console.log(data);
  });
});


app.use('/', router);

app.listen(port ,function(){
  console.log("up and running on port "+ port);
});


//listen for request on port 3000, and as a callback function have the port listened on logged
// app.listen(port, () => {
//   console.log(`Server running at http://${hostname}:${port}/`);
// });

// let Event = {
//   eventType: "Create",
//   vmType: "Basic",
//   eventTime: Date.now(),
//   vmID: "-LZn3FahneHK2RFWVzVw",
//   ccID: "12312312"
// }

// monitor.getVMs(Event)
// monitor.event(Event)

// auth.login("12312312", "password")
// auth.login("12312312", "dd")
// auth.login("111", "dd")
