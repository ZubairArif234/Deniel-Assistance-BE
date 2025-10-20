
// import nodemailer from "nodemailer";

const nodemailer = require("nodemailer")
const dotenv = require("dotenv");
dotenv.config({ path: "./src/config/config.env" });
 


const transporter = nodemailer.createTransport({
  service: "gmail",                  
  auth: {
    user: process.env.EMAIL,          
    pass: process.env.APP_PASSWORD,  
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error("Error with mail transporter config:", error);
  } else {
    console.log("Mail transporter is ready to send emails");
  }
});


module.exports = transporter;