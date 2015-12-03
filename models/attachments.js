/**
* Model: Attachments
*/
var User = require("./user");
var mongoose = require("mongoose"), Schema = mongoose.Schema;
var Schema = mongoose.Schema;

//Attachments
AttachmentsSchema = new Schema({
  user: [{ type: Schema.ObjectId, ref: 'User' }],
  file: String,
  originalFilename: String,
  instancia: String,
  s3urls: Array,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

AttachmentsSchema.method('addUser', function(userId){
  this.user.push(userId);
});

var exports = module.exports = mongoose.model('Attachments', AttachmentsSchema);