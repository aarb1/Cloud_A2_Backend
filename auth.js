
const fetch = require("node-fetch");
const bcrypt = require('bcryptjs')

const saltRounds = 10

var auth = module.exports = {}

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

const rootURL = "https://clouda2backend.firebaseio.com"

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
auth.login = (username, password) => {
    return new Promise((resolve) => {
        let url = `${rootURL}/auth/${username}.json`

        smartFetch(url, {method: "GET"}).then(hash => {
            bcrypt.compare(password, hash, function(err, success){
                if (success){
                    console.log(`Username "${username}" and password "${password}" successfully logged in.`)
                    resolve(true)
                }else{
                    console.log(`Username "${username}" and password "${password}" are not recognized.`)
                    resolve(false)
                }
            })
        })
    })
}

auth.createUser = (username, password) => {
    return new Promise((resolve) => {
        //Hash stored as the object where the key is the username == ccID
        let url = `${rootURL}/auth/${username}.json`

        bcrypt.hash(password, saltRounds, function(err, hash){
            if (!err) {
                let arguments = {
                    method: "PUT",
                    body: JSON.stringify(hash)
                }
                smartFetch(url, arguments).then(data => {
                    console.log(data)
                    let response = {
                        success: true,
                    }
                    resolve(response)  
                })
            }
        })
    })
}
