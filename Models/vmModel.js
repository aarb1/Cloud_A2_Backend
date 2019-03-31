const mongoose = require('mongoose');
const Schema = mongoose.Schema;
mongoose.connect('mongodb://10.0.1.7:20000/cloudDatabase');
//mongoose.connect('mongodb://localhost/patrick');

var vmSchema = new Schema({
    owner: String,
    vmType: String,
    initialVMType: String,
    state: String,
    events: []
})

var vmModel = mongoose.model('vmModel', vmSchema);

module.exports = vmModel;
