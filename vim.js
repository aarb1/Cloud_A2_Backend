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
    console.log(data);
    res.json(data);
  }); 
});

router.post('/launchEvent', (req, res) => {
  var event = req.body.event;
  monitor.event(event).then(function(data){
    res.json(data);
    console.log(data);
  }); 
});

router.get('/vm/all', (req, res) => {
  var event = req.body.event;
  console.log(event);
  monitor.getVMs(event).then(function(data){
    res.json(data);
  });
});

//Route for getting the usage for a single VM of a single user (vmID required)
//Duration in seconds, charge in dollars ($)
//Example body to pass for the following route
/*{
    "event": {
    "ccID": "leo2",
    "vmID": "-L_AOG8nhgnRwEhQ16k7"

},
    "startTime": "1551748108793",
    "endTime": "1551754901338"
}*/

router.get('/vm/usage', (req, res) => {
    var event = req.body.event;
    var startTime = 0;
    var endTime = 0
  
    if (req.body.startTime && req.body.endTime){
      startTime = req.body.startTime;
      endTime = req.body.endTime;
    }
  console.log(startTime, endTime);
    monitor.singleVMUsage(event, startTime, endTime).then(function(data){
        console.log(data);
        res.json(data);
    });
});
//Sample Result Data:
// {
//     "vm": "-L_AOG8nhgnRwEhQ16k7",
//     "usageCycles": [
//     {
//         "duration": 28.346,
//         "vmType": "Basic",
//         "charge": 0.23621666666666666
//     },
//     {
//         "duration": 9.443,
//         "vmType": "Large",
//         "charge": 0.015738333333333333
//     },
//     {
//         "duration": 3.762,
//         "vmType": "Ultra-Large",
//         "charge": 0.009405
//     }
// ]
// }

//Route for getting the usage for all VMs of a single user (vmID not needed for all VMs)
//Duration in seconds, charge in dollars ($)
//Example body to pass for the following route
// {
//     "event": {
//     "ccID": "leo2",
// },
//     "startTime": "1551748108793",
//     "endTime": "1551754901338"
// }
router.get('/vm/totalUsage', (req, res) => {
  console.log(req.body.startTime);
  var event = req.body.event;
  var startTime = 0;
  var endTime = 0

  if (req.body.startTime && req.body.endTime){
    startTime = req.body.startTime;
    endTime = req.body.endTime;
  }
  console.log(startTime, endTime);
  monitor.allVMUsage(event, startTime, endTime).then(function(data){
    console.log(data);
    res.json(data);
  });
});
//Sample result data:
// [
//     {
//         "vm": "-L_AOCphdmnqYnJQOTC-",
//         "usageCycles": []
//     },
//     {
//         "vm": "-L_AOFmFEKgRbpC_sCHe",
//         "usageCycles": []
//     },
//     {
//         "vm": "-L_AOG8nhgnRwEhQ16k7",
//         "usageCycles": [
//             {
//                 "duration": 28.346,
//                 "vmType": "Basic",
//                 "charge": 0.23621666666666666
//             },
//             {
//                 "duration": 9.443,
//                 "vmType": "Large",
//                 "charge": 0.015738333333333333
//             },
//             {
//                 "duration": 3.762,
//                 "vmType": "Ultra-Large",
//                 "charge": 0.009405
//             }
//         ]
//     },
//     {
//         "vm": "-L_AOGyMIwQ0bpvf_MOz",
//         "usageCycles": []
//     }
// ]


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
