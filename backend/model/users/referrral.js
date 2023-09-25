const mongoose = require("mongoose");

const roletask = new mongoose.Schema({
  task: {
    type: String,
    required: true,
  },
  permission: {
    type: Boolean,
    required: true,
    default:false
  },
});

const ROLE = mongoose.Schema({
  Role_name: {
    type: String,
    required: [true, "please add a tax class code"],
    unique:true
  },

  Link_Task: {
    type: subDocumentSchema, // Using the sub-document schema as a property
    required: [true, "please add a task name and their permissions"],
  },
},
{
  timestamps: true,
});

module.exports = mongoose.model("ROLE", ROLE);
