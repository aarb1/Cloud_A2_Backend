const monitor = require('./monitor')
const auth = require('./auth')


/**
 * OVERVIEW
 * 
 * Monitor.js
 * 
 * - Read monitor.js to examine the Event Object and Event Result format
 * - For all create events, call createVM(Event)
 * - For all other events (start, stop, etc) call event(Event)
 * - For vm information, call getVMs(Event)
 * - Sample monitor.js code below - @Aayush let me know if I need to clarify
 * 
 * Auth.js
 * - Auth has two functions: createUser and login
 * 
 */

//Install Express for easier routing - @Aayush

const http = require("http");
const hostname = '127.0.0.1';
const port = process.env.PORT || 3000;

//Create HTTP server and listen on port 3000 for requests
const server = http.createServer((req, res) => {

  //Set the response HTTP header with HTTP status and Content type
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World\n');
});

//listen for request on port 3000, and as a callback function have the port listened on logged
server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

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
