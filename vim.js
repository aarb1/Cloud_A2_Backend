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

  let req2 = http.request(options, function (res2){
    res2.on("data", function(data) {
      console.log("data: ", data);
      res.json(data);
    });
    res2.on('end', () => {
      console.log("get all vm request ended");
    });
  }).on("error", (err) => {
    console.log ("Error: " + err);
  })

  req2.write(event);
  req2.end();
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
  let options = {
    host: monitorDomain,
    path: "/create",
    method: "POST",
    headers: {
        "Content-Type": "application/json",
    }
  }
  let req2 = http.request(options, function (res2){
    res2.on("data", function(data) {
      console.log("data: ", data);
      res.json(data);
    });
    res2.on('end', () => {
      console.log("create VM request ended");
    });
  }).on("error", (err) => {
    console.log ("Error: " + err);
  })
  
  var event = req.body.event;
  
  //send the request
  req2.write(event); //the event will be in the req.body
  //end the request
  req2.end();
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
  let options = {
    host: monitorDomain,
    path: "/launchEvent",
    method: "POST",
    headers: {
        "Content-Type": "application/json",
    }
  }
  let req2 = http.request(options, function (res2){
    res2.on("data", function(data) {
      console.log("data: ", data);
      res.json(data);
    });
    res2.on('end', () => {
      console.log("launch event request ended");
    });
  }).on("error", (err) => {
    console.log ("Error: " + err);
  })
  
  var event = req.body.event;
  
  //send the request
  req2.write(event); //the event will be in the req.body
  //end the request
  req2.end();
});

router.get('/vm/usage', (req, res) => {
  var startTime = 0;
  var endTime = 0

  var event = {
    ccID: req.query.ccID,
    vmID: req.query.vmID,
    startTime: req.query.startTime,
    endTime: req.query.endTime
  };
  
 /*  if (event.startTime && event.endTime) {
    startTime = event.startTime;
    endTime = event.endTime;
  } */
  
  let options = {
    host: monitorDomain,
    path: "/vm/usage",
    method: "GET",
    headers: {
        "Content-Type": "application/json",
    }
  }

  let req2 = http.request(options, function (res2){
    res2.on("data", function(data) {
      console.log("data: ", data);
      res.json(data);
    });
    res2.on('end', () => {
      console.log("get single vm usage request ended");
    });
  }).on("error", (err) => {
    console.log ("Error: " + err);
  })

  req2.write(event);
  req2.end();
});

router.get('/vm/totalUsage', (req, res) => {
  var startTime = 0;
  var endTime = 0
  var event = {
    ccID: req.query.ccID,
    startTime: req.query.startTime,
    endTime: req.query.endTime
  };

  /* if (event.startTime && event.endTime) {
    startTime = req.query.startTime;
    endTime = req.query.endTime;
  } */
  
  let options = {
    host: monitorDomain,
    path: "/vm/totalUsage",
    method: "GET",
    headers: {
        "Content-Type": "application/json",
    }
  }

  let req2 = http.request(options, function (res2){
    res2.on("data", function(data) {
      console.log("data: ", data);
      res.json(data);
    });
    res2.on('end', () => {
      console.log("get all vm usage request ended");
    });
  }).on("error", (err) => {
    console.log ("Error: " + err);
  })

  req2.write(event);
  req2.end();
});


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
