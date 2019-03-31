const port = process.env.PORT || 10000;
const monitor = require('./monitor')
const auth = require('./auth')

var fs = require("fs")
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var router = express.Router();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//middleware to handle logging
app.use(function (req, res, next) {
    JSON.parse(req.body).then(bood => {
        console.log(bood);
    })
    let user = req.body.event.ccID || "patrick";
    let eventType = req.url;
    let date = new Date()
    date = date.toUTCString();
    processInput(user, eventType, date);
    next()
});
function processInput(user, event, date) {
    fs.open('cloud/log.txt', 'a', 666, function (e, id) {
        let str ="USER:" + user + ".EVENT:" + event + ".DATE:" + date + "\n";
        console.log(str);
        fs.write(id, str, null, 'utf8', function () {
            fs.close(id, function () {
                console.log('file is updated');
            });
        });
    });
}

router.get('/', function (req, res) {
    res.json({ message: 'Hello World!' });
});



//get all the VMs
router.post('/vm/all', (req, res) => {
    console.log(req.body);
    var event = {
        ccID: req.body.event.ccID
    };
    monitor.getVMs(event).then(function (data) {
        console.log(data);
        res.json(data);
    });
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
    var username = req.body.event.username;
    var password = req.body.event.password;
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
router.post('/vm/usage', (req, res) => {
    var startTime = 0;
    var endTime = 0

    var event = {
        ccID: req.body.event.ccID,
        vmID: req.body.event.vmID,
        startTime: req.body.event.startTime,
        endTime: req.body.event.endTime
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
router.post('/vm/totalUsage', (req, res) => {
    var startTime = 0;
    var endTime = 0
    var event = {
        ccID: req.body.event.ccID,
        startTime: req.body.event.startTime,
        endTime: req.body.event.endTime
    };

    if (event.startTime && event.endTime) {
        startTime = req.body.event.startTime;
        endTime = req.body.event.endTime;
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
