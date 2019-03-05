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

        body.events = {};

        //Instantiate the VM's events with a "Create" event.
        body.events["-000000"] = {
            eventTime: Event.eventTime,
            eventType: "Create"
        };

        //Remove extraneous data properties
        delete body.eventType;
        delete body.eventTime;
        delete body.vmID;
        delete body.ccID;

        postEvent(body, url).then(data => {
            let response = {
                success: true,
                vmID: data.name, //firebase returns this as a name
                ccID: Event.ccID
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
        delete body.vmType;
        delete body.vmID;
        delete body.ccID;

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


//****** Example customerUsageReport
// ┌─────────┬───────────────––––––––┬
// │   vmID  │   usageCycle          │
// ├─────────┼───────────────────────│
// │    0    │ [cycle, cycle, cycle] │
// │    1    │                       │
// │    2    │                       │
// │    3    │                       │
//
//*** structure of a cycle object */
// let cycle = {
//     duration: how long was this cycle in seconds
//     vmType: during this cycle, which type of vm was used
//     charge: how much money was charged for this cycle in dollars
// }

//calculateUsage returns the customerUsage report for the consumer.
monitor.allVMUsage = (Event, startTime, endTime) =>{
    return new Promise((resolve) => {
        monitor.getVMs(Event).then(function(listOfVms){                
            // returns the list of VMs owned by the current user
            console.log(listOfVms);
            //to record all the vms and their usageCycles
            let usageReport = [];

            listOfVms.forEach(vm => {
                vm.events.forEach(e => {
                    //find which events are actually within the time frame
                    let usageEvents= [];
                    if (e.eventTime >= startTime && e.eventTime <= endTime){
                        usageEvents.push(e)
                    }
                });
                //array for recording all usage cycles for the vm
                let usageCycles = [];

                //iterate through all the events that occured within this time frame
                for (i = 0; i < usageEvents.length; i++){

                    //set the fees based on the vmType during which the usage cycle occurred .
                    let rate = 0;
                    if (usageEvents[i].vmType === "Large"){
                        rate = 0.10; //dollars per minute
                    } else if (usageEvents[i].vmType === "Ultra-Large") {
                        rate = 0.15;
                    } else {
                        rate = 0.5;
                    }

                    //variable used to record the beginning event of a usage cycle
                    let previousEvent = null;

                    //record the beginning of a cycle
                    if (previousEvent == null){
                        if (usageEvents[i].eventType !== "Stop"){
                            previousEvent = usageEvents[i];
                        }
                    }

                    //if the event is a Start
                    if (usageEvents[i].eventType === "Start"){
                        previousEvent = usageEvents[i];
                    }  else {
                        //calculate the cycle duration and multiply by the related rate based on the vm type
                        let cycle = {
                            duration: (usageEvents[i].eventTime - previousEvent.eventTime)*1000, //convert to seconds
                            vmType: usageEvents[i].vmType,
                            charge: (usageEvents[i].eventTime - previousEvent.eventTime)*1000/60*rate //convert to minutes
                        };

                        //add to the list of cycles for this vm within this time period
                        usageCycles.push(cycle);

                        //if the event was a stop event, reset the precedent event
                        if (usageEvents[i].eventType === "Stop"){
                            previousEvent = null
                        }  else {
                            previousEvent = usageEvents[i];
                        }
                    }
                }
                //create an object to store the vm & the array of usage cycles
                let vmUsageReport = {
                    vm: vm.vmID,
                    usageCycles: usageCycles
                };

                //add this object to the overall usage report for the user
                usageReport.push(vmUsageReport);
            });
            resolve(usageReport);

        });
    })
};

monitor.singleVMUsage = (Event, startTime, endTime) =>{
    return new Promise((resolve) => {
        monitor.getVMs(Event).then(function(listOfVms){
            // returns the list of VMs owned by the current user
            console.log(listOfVms);
        });
    });
};

