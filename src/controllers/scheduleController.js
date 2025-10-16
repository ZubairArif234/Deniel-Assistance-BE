
const Schedule = require("../models/Schedule");
const SuccessHandler = require("../utils/SuccessHandler");
const ErrorHandler = require("../utils/ErrorHandler");
const sendGoogleOtpMail = require("../utils/SendGoogleMail");


const manageSchedule = async (req, res) => {
  // #swagger.tags = ['auth']
  try {
    const { fullName, email, company,employees,role  } = req.body;
   
    const newSchedule = await Schedule.create({
     fullName, email, company,employees,role
    });

     sendGoogleOtpMail.sendGoogleScheduleMail(fullName, email, company,employees,role);
    // const jwtToken = newUser.getJWTToken();
    return SuccessHandler(
      {
        schedule: newSchedule},
      200,
      res
    );
  } catch (error) {
    return ErrorHandler(error.message, 500, req, res);
  }
};

module.exports={manageSchedule}