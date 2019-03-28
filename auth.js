
const fetch = require("node-fetch");
const bcrypt = require('bcryptjs')

const saltRounds = 10

var auth = module.exports = {}

var userModel = require('./Models/userModel')

// smartFetch = (url, arguments) =>{
//     return new Promise((resolve, reject) =>{
//         fetch(url, arguments)
//             .then(stream => {
//                 stream.json().then(data =>{
//                     resolve (data)
//                 })
//             })
//             .catch(e =>{
//                 reject(e)
//             })
//     })
// }

// const rootURL = "https://clouda2backend.firebaseio.com"

// postEvent = (postData, url) =>{
//     return new Promise ((resolve) =>{
//         let arguments = {
//             method: "POST",
//             body: JSON.stringify(postData)
//         }
//         smartFetch(url, arguments).then(data =>{
//             resolve(data)
//         }).catch(e =>{
//             console.log(e)
//         })
//     })
// }

/**
 * Creates a VM for the specified user and returns {success, vmID, and ccID}
 */
auth.login = (username, password) => {
    return new Promise((resolve) => {        
        userModel.find({username: username}, (err, user) =>{
            if(err) console.log(err)            
            bcrypt.compare(password, user[0].password, function(err, success){
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
        // let url = `${rootURL}/auth/${username}.json`

        bcrypt.hash(password, saltRounds, (err, hash) => {
            if (!err) {               
                var newUser = userModel({
                    username: username,
                    password: hash
                });
                newUser.save((err) => {
                    resolve({success: true});
                })
            }
        })
    })
}
