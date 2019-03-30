const monitor = require('./monitor')
const auth = require('./auth')
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var router = express.Router();
var cors = require('cors');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var monitorDomain;
var http = require("http");

//CORS to allow acess to backend from frontend
app.use(cors({
  'allowedHeaders': ['sessionId', 'Content-Type'],
  'exposedHeaders': ['sessionId'],
  'origin': '*',
  'methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
  'preflightContinue': false
}))



const port = process.env.PORT || 8080;

router.get('/', function (req, res) {
  res.json({ message: 'Hello World!' });
});




//get all the VMs
router.get('/vm/all', (req, res) => {
  var event = {
    ccID: req.query.ccID
  };
  
  let options = {
    host: monitorDomain,
    path: "/vm/all",
    method: "GET",
    headers: {
        "Content-Type": "application/json",
    }
  }

  let req = http.request(options, function (res){
    res.on("data", function(data) {
      res.json(data);
    });
    res.on('end', () => {
      console.log("get all vm request ended");
    });
  }).on("error", (err) => {
    console.log ("Error: " + err);
  })

  req.write();
  req.end();
});

router.post('/createUser', (req, res) => {
  var username = req.query.username;
  var password = req.query.password;
  auth.createUser(username, password).then(function (data) {
    res.json(data);
  });
});

//create VM
router.post('/create', (req, res) => {
  var event = req.body.event;
  monitor.createVM(event).then(function (data) {
    res.json(data);
  });
});

router.post('/login', (req, res) => {
  var username = req.body.username;
  var password = req.body.password;
  auth.login(username, password).then(function (data) {
    res.json(data);
  });
});

//route to launch event
router.post('/launchEvent', (req, res) => {
  var event = req.body.event;
  monitor.event(event).then(function (data) {
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
  var startTime = 0;
  var endTime = 0

  var event = {
    ccID: req.query.ccID,
    vmID: req.query.vmID,
    startTime: req.query.startTime,
    endTime: req.query.endTime
  };
  
  if (event.startTime && event.endTime) {
    startTime = event.startTime;
    endTime = event.endTime;
  }
  monitor.singleVMUsage(event, startTime, endTime).then(function (data) {
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
  var startTime = 0;
  var endTime = 0
  var event = {
    ccID: req.query.ccID,
    startTime: req.query.startTime,
    endTime: req.query.endTime
  };

  if (event.startTime && event.endTime) {
    startTime = req.query.startTime;
    endTime = req.query.endTime;
  }
  monitor.allVMUsage(event, startTime, endTime).then(function (data) {
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

app.listen(port, function () {
  console.log("up and running on port " + port);
});


//listen for request on port 3000, and as a callback function have the port listened on logged
// app.listen(port, () => {
//   console.log(`Server running at http://${hostname}:${port}/`);
// });

// let Event = {
//   eventType: "Upgrade",
//   vmType: "Basic",
//   eventTime: Date.now(),
//   vmID: "-L_JZH1Vf1Ud7yXyBZDs",
//   ccID: "patrick"
// }

// let Event2 = {
//   eventType: "Start",
//   vmType: "Basic",
//   eventTime: Date.now(),
//   vmID: "-LZn3FahneHK2RFWVzVw",
//   ccID: "12312312"
// }

// monitor.event(Event)

// monitor.getVMs(Event).then(result => console.log(result))
// monitor.event(Event)

//logs user in
// auth.login("12312312", "password")
// auth.login("12312312", "dd")
// auth.login("111", "dd")
// auth.createUser("12312312", "password")
