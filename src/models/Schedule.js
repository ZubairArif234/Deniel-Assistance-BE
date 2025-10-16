
const mongoose = require("mongoose");
const { Schema } = mongoose;

const scheduleSchema = new Schema(
    
  {
    
    
    fullName: {
      type: String,
      required:true
    },
    email: {
      type: String,
      required:true
    },
    company: {
      type: String,
      required:true
    },
    employees: {
      type: String,
      required:true
    },
    role: {
      type: String,
      required:true
    },
   
   
  },
  { timestamps: true }
);

const Schedule = mongoose.model("Schedule", scheduleSchema);
module.exports = Schedule;