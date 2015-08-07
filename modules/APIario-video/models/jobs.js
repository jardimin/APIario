/**
* Model: Jobs
*/
var Attachments = require("../../../models").Attachments;
var mongoose = require("mongoose"), Schema = mongoose.Schema;
var Schema = mongoose.Schema;

//Jobs
JobsSchema = new Schema({
  attachments: [{ type: Schema.ObjectId, ref: 'Attachments' }],
  schedule: [{
    id: Number,
    source_file: String,
    destination_file: String,
    preset_id: Number,
    created_at: Date,
    updated_at: Date,
    state: String,
    remote_job_id: String,
    message: String,
    progress: String,
    duration: String,
    filesize: String,
    completed_at: Date,
    locked: Boolean,
    priority: String
   }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

var exports = module.exports = mongoose.model('Jobs', JobsSchema);