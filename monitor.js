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
const vmTypes = ["Basic", "Large", "Ultra-Large"]

const monitor = module.exports = {}

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
}

let rootURL = "https://clouda2backend.firebaseio.com"

postEvent = (postData, url) =>{
    return new Promise ((resolve) =>{
        let arguments = {
            method: "POST",
            body: JSON.stringify(postData)
        }
        smartFetch(url, arguments).then(data =>{
            resolve(data)
        }).catch(e =>{
            console.log(e)
        })
    })
}

/**
 * Creates a VM for the specified user and returns {success, vmID, and ccID}
 */
monitor.createVM = (Event) => {
    return new Promise((resolve) => {
        let url = `${rootURL}/${Event.ccID}.json`

        let body = Event

        body.events = {}

        //Instantiate the VM's events with a "Create" event.
        body.events["-000000"] = {
            eventTime: Event.eventTime,
            eventType: "Create"
        }

        //Remove extraneous data properties
        delete body.eventType
        delete body.eventTime
        delete body.vmID
        delete body.ccID

        postEvent(body, url).then(data => {
            let response = {
                success: true,
                vmID: data.name, //firebase returns this as a name
                ccID: Event.ccID
            }
            resolve(response)
        })
    })
}

/**
 * Start, Stop, Upgrade, Downgrade, Delete
 * Adds the event to the list of events for the specified VM belonging to the specified user
 */
monitor.event = (Event) => {
    return new Promise((resolve) => {
        let url = `${rootURL}/${Event.ccID}/${Event.vmID}/events.json`
        let body = Event

        //Remove extraneous data properties
        delete body.vmType
        delete body.vmID
        delete body.ccID

        postEvent(body, url).then(data => {
            let response = {
                success: true,
                vmID: Event.vmID, //firebase returns this as a name
                ccID: Event.ccID
            }
            resolve(response)
        })
    })
}

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
        let url = `${rootURL}/${Event.ccID}.json`
        let arguments = {
            method: "GET",
        }
        smartFetch(url, arguments).then(data =>{
            if (data !== null){

                Object.keys(data).forEach(key =>{
                    //Flatten events into arrays for eacn virtual machine
                    let vm = data[key]
                    if (vm.hasOwnProperty("events")){
                        vm.events = Object.values(vm.events)
                    }

                    vm.initialVMType = vm.vmType
                    //Calculate current VM Type
                    let initType = vmTypes.findIndex(el =>{
                        return el = vm.vmType
                    })
                    let delta = 0
                    vm.events.forEach(e => {
                        if (e.eventType === "Upgrade") delta++
                        else if (e.eventType === "Downgrade") delta--
                    })

                    let newType = initType + delta
                    if (newType <=2 && newType >= 0) vm.vmType = vmTypes[newType]
                    
                })       
            }
            resolve(data)
        })
    })
}

monitor.calculateUsage = (vm, startTime, endTime) =>{
    //TODO - LEO
}
    
