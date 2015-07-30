/**
* Model: Jobs
*/
var Attachments = require("../../../models").Attachments;
var mongoose = require("mongoose"), Schema = mongoose.Schema;
var Schema = mongoose.Schema;

//Jobs
JobsSchema = new Schema({
  attachments: [{ type: Schema.ObjectId, ref: 'Attachments' }],
  status: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});


var exports = module.exports = mongoose.model('Jobs', JobsSchema);