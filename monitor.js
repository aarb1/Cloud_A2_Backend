/**
 * Example for what the Event Result should look like
class EventResult {
    success: Boolean denoting the success or failure of the action
    vmID: String denoting the ID of the VM
    ccID: String denoting the ID of the customer
}
*/


/**
 * Example for what the Event should look like
class Event {
    eventType: "Create" | "Start" | "Stop" | "Upgrade" | "Downgrade" | "Delete"
    eventTime: DateTime String
    vmID: String denoting the ID of the VM. Empty if eventType == "Create"
    vmType: String denoting the type of VM. Only used on eventTYpe == "Create". Options are "Basic" | "Large" | "Ultra-Large"
    ccID: String denoting the ID of the customer
}
*/


const fetch = require("node-fetch");
const vmTypes = ["Basic", "Large", "Ultra-Large"];

const monitor = module.exports = {};

smartFetch = (url, arguments) =>{
    return new Promise((resolve, reject) =>{
        fetch(url, arguments)
            .then(stream => {
                stream.json().then(data =>{
                    resolve (data)
                })
            })
            .catch(e =>{
                reject(e)
            })
    })
};

let rootURL = "https://clouda2backend.firebaseio.com";

postEvent = (postData, url) =>{
    return new Promise ((resolve) =>{
        let arguments = {
            method: "POST",
            body: JSON.stringify(postData)
        };
        smartFetch(url, arguments).then(data =>{
            resolve(data)
        }).catch(e =>{
            console.log(e)
        })
    })
};

/**
 * Creates a VM for the specified user and returns {success, vmID, and ccID}
 */
monitor.createVM = (Event) => {
    return new Promise((resolve) => {
        let url = `${rootURL}/${Event.ccID}.json`;

        let body = Event;
        let ccID = Event.ccID;

        console.log("event.ccID: ",Event.ccID);

        body.events = {};

        //Instantiate the VM's events with a "Create" event.
        body.events["-000000"] = {
            eventTime: Date.now(),
            eventType: "Create"
        };


        //Remove extraneous data properties
        delete body.eventType;
        delete body.eventTime;
        delete body.vmID;
        delete body.ccID;


        postEvent(body, url).then(data => {
            console.log(data);

            let response = {
                success: true,
                vmID: data.name, //firebase returns this as a name
                ccID: ccID
            };
            resolve(response)
        })
    })
};

/**
 * Start, Stop, Upgrade, Downgrade, Delete
 * Adds the event to the list of events for the specified VM belonging to the specified user
 */
monitor.event = (Event) => {
    return new Promise((resolve) => {
        let url = `${rootURL}/${Event.ccID}/${Event.vmID}/events.json`;
        let body = Event;

        //Remove extraneous data properties
        //delete body.vmType; need this for usage calculations
        delete body.vmID;
        delete body.ccID;

        body.eventTime = Date.now();
        body.vmType = null; //leave it as an empty field

        postEvent(body, url).then(data => {
            let response = {
                success: true,
                vmID: Event.vmID, //firebase returns this as a name
                ccID: Event.ccID
            };
            resolve(response)
        })
    })
};

// getVms returns an object, where each key is a VM and contains the current vmType (calculated)
// as well as the list of events that have ocurred

//****** Example list of vms
// ┌──────────────────────┬───────────────────────────────────────────────────┬─────────┬───────────────┐
// │       (index)        │                      events                       │ vmType  │ initialVMType │
// ├──────────────────────┼───────────────────────────────────────────────────┼─────────┼───────────────┤
// │ -LZn3FahneHK2RFWVzVw │ [ [Object], [Object], [Object], ... 1 more item ] │ 'Large' │    'Basic'    │
// │ -LZn8eJCIvVZ1Vbe2kO_ │                   [ [Object] ]                    │ 'Basic' │    'Basic'    │
// └──────────────────────┴───────────────────────────────────────────────────┴─────────┴───────────────┘

//****** Example list of events  ->  getVMS.then(result["-LZn3FahneHK2RFWVzVw"].events))
// ┌─────────┬───────────────┬─────────────┐
// │ (index) │   eventTime   │  eventType  │
// ├─────────┼───────────────┼─────────────┤
// │    0    │ 1551339948286 │  'Create'   │
// │    1    │ 1551340064605 │  'Upgrade'  │
// │    2    │ 1551340071543 │  'Upgrade'  │
// │    3    │ 1551340077151 │ 'Downgrade' │
// └─────────┴───────────────┴─────────────┘

monitor.getVMs = (Event) => {
    return new Promise((resolve) => {
        let url = `${rootURL}/${Event.ccID}.json`;
        let arguments = {
            method: "GET",
        };
        smartFetch(url, arguments).then(data =>{
            if (data !== null){

                Object.keys(data).forEach(key =>{
                    //Flatten events into arrays for eacn virtual machine
                    let vm = data[key];
                    if (vm.hasOwnProperty("events")){
                        vm.events = Object.values(vm.events)
                    }

                    vm.initialVMType = vm.vmType;
                    //Calculate current VM Type
                    let initType = vmTypes.findIndex(el =>{
                        return el = vm.vmType
                    });
                    let delta = 0;
                    vm.events.forEach(e => {
                        if (e.eventType === "Upgrade") delta++;
                        else if (e.eventType === "Downgrade") delta--
                    });

                    let newType = initType + delta;
                    if (newType <=2 && newType >= 0) vm.vmType = vmTypes[newType]
                    
                })       
            }
            resolve(data)
        })
    })
};

//check vim.js for examples
monitor.allVMUsage = (Event, startTime, endTime) =>{
    return new Promise((resolve) => {
        monitor.getVMs(Event).then(function(listOfVms){                

            //to record all the vms and their usageCycles
            let usageReport = [];

            Object.keys(listOfVms).forEach(key =>{

               var vm = listOfVms[key];
               console.log("current vm: ", vm);

               //find which events are actually within the time frame
                var usageEvents = [];

                //tracking VMType changes
                let delta = 0;

                let tempVMType = null;
                let startingVMType = null;

                vm.events.forEach(e => {

                    //find the vmType of the first event in the time period
                    if (startingVMType === null) {
                        if (e.eventType === "Upgrade") delta++;
                        else if (e.eventType === "Downgrade") delta--;

                        let initType = vmTypes.findIndex(el => {
                            return el = vm.initialVMType
                        });

                        let newType = initType + delta;
                        if (newType <= 2 && newType >= 0) tempVMType = vmTypes[newType];
                    }

                    //add to array of events that are within timeframe and find the vmType when the first event in the cycle occurs
                    //if no time frame specified, include all events 
                    if (startTime && endTime){
                        if (e.eventTime >= startTime && e.eventTime <= endTime) {
                            if (startingVMType===null) {startingVMType = tempVMType}
                            usageEvents.push(e);
                        }
                    } else {
                        if (startingVMType===null) {startingVMType = vm.initialVMType}
                        usageEvents.push(e);
                    }
                });

               console.log ("here are all events within this timeframe: ", usageEvents);

               //array for recording all usage cycles for the vm
               let usageCycles = [];

               //variable used to record the previous event of a usage cycle
                let previousEvent = null;
                let previousVMType = null;


               //iterate through all the events that occured within this time frame
               usageEvents.forEach(e => {
                   console.log("event: ",e);

                   //if the beginning of a cycle is upgrade or downgrade
                   if (previousEvent === null) {
                       //if the first event in the measured time period is a stop
                       if (e.eventType !== "Stop") {
                           previousEvent = e;
                           previousVMType = startingVMType;
                       }
                   }

                   if (e.eventType === "Create"){
                       previousEvent = null;
                   } else if (e.eventType === "Start") {
                       previousEvent = e;
                   } else {
                       let rate = 0;
                       if (previousVMType === "Large") {
                           rate = 0.10; //dollars per minute
                       } else if (previousVMType === "Ultra-Large") {
                           rate = 0.15;
                       } else {
                           rate = 0.5;
                       }
                       //calculate the cycle duration and multiply by the related rate based on the vm type
                       let cycle = {
                           duration: (e.eventTime - previousEvent.eventTime)/1000, //convert to seconds
                           vmType: previousVMType,
                           charge: (e.eventTime - previousEvent.eventTime)/1000/ 60 * rate //convert to minutes then multiply by rate
                       };


                       //add to the list of cycles for this vm within this time period
                       usageCycles.push(cycle);

                       //if the event was a stop event, reset the precedent event
                       if (e.eventType === "Stop") {
                           previousEvent = null;
                           startingVMType = previousVMType;
                       } else {
                           // update previous event
                           previousEvent = e;

                           //update previous vmType
                           let previousVMTypeIndex = vmTypes.findIndex(el => {
                               return el === previousVMType;
                           });

                           let newVMTypeIndex = 0;
                           if (e.eventType === "Upgrade"){
                               newVMTypeIndex = previousVMTypeIndex+1;
                               if (newVMTypeIndex <= 2 && newVMTypeIndex >= 0) {
                                   previousVMType = vmTypes[newVMTypeIndex];
                                   console.log("vm upgraded to type: ", previousVMType);
                               }
                           } else if (e.eventType === "Downgrade"){
                               newVMTypeIndex = previousVMTypeIndex-1;
                               if (newVMTypeIndex <= 2 && newVMTypeIndex >= 0) {
                                   previousVMType = vmTypes[newVMTypeIndex];
                                   console.log("vm downgraded to type: ", previousVMType);
                               }
                           }
                       }
                   }
               });
               //create an object to store the vm & the array of usage cycles
               let vmUsageReport = {
                   vm: key,
                   usageCycles: usageCycles
               };

               //add this object to the overall usage report for the user
               usageReport.push(vmUsageReport);
           });
            resolve(usageReport);
        });
    });
};

monitor.singleVMUsage = (Event, startTime, endTime) =>{
    return new Promise((resolve) => {
        monitor.getVMs(Event).then(function (listOfVms) {
            console.log("heres start time end times: ", startTime, endTime);

            let singleVMUsageReport = [];
            console.log(listOfVms);

            Object.keys(listOfVms).forEach(key => {
                console.log ("key: ",key);
                console.log (Event.vmID);
                if (Event.vmID === key) {
                    var vm = listOfVms[key];
                    console.log("matching vm found: ", vm);

                    //find which events are actually within the time frame
                    var usageEvents = [];

                    //tracking VMType changes
                    let delta = 0;

                    let tempVMType = null;
                    let startingVMType = null;

                    vm.events.forEach(e => {
                        
                        //find the vmType of the first event in the time period
                        if (startingVMType === null) {
                            if (e.eventType === "Upgrade") delta++;
                            else if (e.eventType === "Downgrade") delta--;

                            let initType = vmTypes.findIndex(el => {
                                return el = vm.initialVMType
                            });

                            let newType = initType + delta;
                            if (newType <= 2 && newType >= 0) tempVMType = vmTypes[newType];
                        }

                        // add to array of events that are within timeframe and find the vmType when the first event in the cycle occurs
                        //if no time frame specified, include all events 
                        if (startTime && endTime){
                            if (e.eventTime >= startTime && e.eventTime <= endTime) {
                                if (startingVMType === null) {
                                    startingVMType = tempVMType;
                                }
                                usageEvents.push(e);
                            }
                        } else {
                            if (startingVMType===null) {startingVMType = vm.initialVMType}
                            usageEvents.push(e);
                        }
                    });

                    console.log("here are all events within this timeframe: ", usageEvents);

                    //array for recording all usage cycles for the vm
                    let usageCycles = [];

                    //variable used to record the previous event of a usage cycle
                    let previousEvent = null;
                    let previousVMType = null;


                    //iterate through all the events that occured within this time frame
                    usageEvents.forEach(e => {
                        console.log("event: ", e);

                        //if the beginning of a cycle is upgrade or downgrade
                        if (previousEvent === null) {
                            //if the first event in the measured time period is a stop
                            if (e.eventType !== "Stop") {
                                previousEvent = e;
                                previousVMType = startingVMType;
                            }
                        }

                        if (e.eventType === "Create") {
                            previousEvent = null;
                        } else if (e.eventType === "Start") {
                            previousEvent = e;
                        } else {
                            let rate = 0;
                            if (previousVMType === "Large") {
                                rate = 0.10; //dollars per minute
                            } else if (previousVMType === "Ultra-Large") {
                                rate = 0.15;
                            } else {
                                rate = 0.5;
                            }
                            //calculate the cycle duration and multiply by the related rate based on the vm type
                            let cycle = {
                                duration: (e.eventTime - previousEvent.eventTime) / 1000, //convert to seconds
                                vmType: previousVMType,
                                charge: (e.eventTime - previousEvent.eventTime) / 1000 / 60 * rate //convert to minutes then multiply by rate
                            };


                            //add to the list of cycles for this vm within this time period
                            usageCycles.push(cycle);

                            //if the event was a stop event, reset the precedent event
                            if (e.eventType === "Stop") {
                                previousEvent = null;
                                startingVMType = previousVMType;
                            } else {
                                // update previous event
                                previousEvent = e;

                                //update previous vmType
                                let previousVMTypeIndex = vmTypes.findIndex(el => {
                                    return el === previousVMType;
                                });

                                let newVMTypeIndex = 0;
                                if (e.eventType === "Upgrade") {
                                    newVMTypeIndex = previousVMTypeIndex + 1;
                                    if (newVMTypeIndex <= 2 && newVMTypeIndex >= 0) {
                                        previousVMType = vmTypes[newVMTypeIndex];
                                        console.log("vm upgraded to type: ", previousVMType);
                                    }
                                } else if (e.eventType === "Downgrade") {
                                    newVMTypeIndex = previousVMTypeIndex - 1;
                                    if (newVMTypeIndex <= 2 && newVMTypeIndex >= 0) {
                                        previousVMType = vmTypes[newVMTypeIndex];
                                        console.log("vm downgraded to type: ", previousVMType);
                                    }
                                }
                            }
                        }
                    });
                    //create an object to store the vm & the array of usage cycles
                    singleVMUsageReport = {
                        vm: key,
                        usageCycles: usageCycles
                    };
                    resolve(singleVMUsageReport);
                }
            });
        });
    });
};

