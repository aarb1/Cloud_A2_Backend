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
const vmModel = require('./Models/vmModel')
const monitor = module.exports = {};

  

smartFetch = (url, arguments) => {
    return new Promise((resolve, reject) => {
        fetch(url, arguments)
            .then(stream => {
                stream.json().then(data => {
                    resolve(data)
                })
            })
            .catch(e => {
                reject(e)
            })
    })
};

let rootURL = "https://clouda2backend.firebaseio.com";

postEvent = (postData, url) => {
    return new Promise((resolve) => {
        let arguments = {
            method: "POST",
            body: JSON.stringify(postData)
        }
        smartFetch(url, arguments).then(data => {
            resolve(data)
        }).catch(e => {
            console.log(e)
        })
    })
};

/**
 * Creates a VM for the specified user and returns {success, vmID, and ccID}
 */
monitor.createVM = (Event) => {
    return new Promise((resolve) => {
        let ccID = Event.ccID;
        let newVM = vmModel({
            owner: ccID,
            vmType: Event.vmType,
            initialVMType: Event.vmType,
            state: "Suspended",
            events: []
        });

        newVM.events.push({
            eventTime: Date.now(),
            eventType: "Create"
        })

        newVM.save((err) => {
            if(err) console.log(err)

            resolve({success: true});
        })
    })
};



var levels = new Map([
    ["Basic", 0],
    ["Large", 1],
    ["Ultra-Large", 2]
]);

var levels2 = new Map([
    [0, "Basic"],
    [1, "Large"],
    [2, "Ultra-Large"]
]);


/**
 * Start, Stop, Upgrade, Downgrade, Delete
 * Adds the event to the list of events for the specified VM belonging to the specified user
 */
monitor.event = (Event) => {
    return new Promise((resolve) => {
        vmModel.findById(Event.vmID, (err, data) =>{
            if(err) console.log(err)
            
            if(Event.eventType == "Start" || Event.eventType == "Stop") {
                if (Event.eventType == "Start") {
                    data.state = "Running";
                } else {
                    data.state = "Suspended";
                }
                data.events.push({eventTime: Date.now(), eventType: Event.eventType});
                data.save((err) => {
                    if(err) console.log(err)
                    resolve({success: true});
                });

            } else if (Event.eventType == "Upgrade" || Event.eventType == "Downgrade") {
                var levelId = levels.get(data.vmType);
                if(Event.eventType == "Upgrade") {
                    levelId++;
                } else if (Event.eventType == "Downgrade") {
                    levelId--;
                }                
                data.vmType = levels2.get(levelId);        
                data.events.push({eventTime: Date.now(), eventType: Event.eventType});
                data.save((err) => {
                    if(err) console.log(err)
                    resolve({success: true});
                });

            } else if (Event.eventType == "Delete") {
                vmModel.findByIdAndDelete(Event.vmID, (err,data) =>
                {
                    if(err){
                        console.log(err);
                        resolve({success: false});
                    }
                    resolve({success: true});
                });
            } else {
                resolve({success: false});
            }
        })
    })
};

// getVms returns an object, where each key is a VM and contains the current vmType (calculated)
// as well as the list of events that have ocurred

//****** Example list of vms
// ┌──────────────────────┬──────────────────────────────────┬─────────┬───────────────┬─────────────┐
// │       (index)        │              events              │ vmType  │ initialVMType │    state    │
// ├──────────────────────┼──────────────────────────────────┼─────────┼───────────────┼─────────────┤
// │ -L_JZH1Vf1Ud7yXyBZDs │ [ [Object], [Object], [Object] ] │ 'Large' │    'Basic'    │  'Running'  │
// │ -L_JZVN01QD5TzhfBZeU │           [ [Object] ]           │ 'Basic' │    'Basic'    │ 'Suspended' │
// │ -L_JZcE1obHystr0teVB │           [ [Object] ]           │ 'Basic' │    'Basic'    │ 'Suspended' │
// └──────────────────────┴──────────────────────────────────┴─────────┴───────────────┴─────────────┘

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
        
        vmModel.find({owner: Event.ccID}, (err, data) =>{ 
            var total = {};
            data.forEach((oneData) => {
                total[oneData._id] = oneData;
            })
            resolve(total);
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
                            return el === vm.initialVMType
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
                        if (previousEvent!== null){
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
                            if (cycle.duration!==0) usageCycles.push(cycle);
                        }

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
            let vm;
            console.log(listOfVms);

            Object.keys(listOfVms).forEach(key => {
                console.log ("key: ",key);
                console.log (Event.vmID);
                if (Event.vmID === key) {
                    vm = listOfVms[key];
                    console.log("matching vm found: ", vm);
                };
            });
                    //find which events are actually within the time frame
                    var usageEvents = [];

                    //tracking VMType changes
                    let delta = 0;

                    let tempVMType = null;
                    let startingVMType = null;

                    vm.events.forEach(e => {
                        
                        //tracks vmTypes until first event within timeframe is reached
                        if (startingVMType === null) {
                            if (e.eventType === "Upgrade") delta++;
                            else if (e.eventType === "Downgrade") delta--;

                            let initType = vmTypes.findIndex(el => {
                                return el === vm.initialVMType
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
                            if (cycle.duration !==0) usageCycles.push(cycle);

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
                        vm: Event.vmID,
                        usageCycles: usageCycles
                    };
                    resolve(singleVMUsageReport);
        });
    });
};
