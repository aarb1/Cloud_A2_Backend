const mongoose = require('mongoose');
const Schema = mongoose.Schema;
mongoose.connect('mongodb://localhost/cloudDatabase');

var vmSchema = new Schema({
    owner: String,
    vmType: String,
    initialVMType: String,
    state: String,
    events: []
})

var vmModel = mongoose.model('vmModel', vmSchema);

module.exports = vmModel;