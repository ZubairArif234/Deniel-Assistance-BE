// import dotenv from "dotenv";
const  transporter = require( "../provider/emailTransport.js");
const dotenv = require("dotenv");

dotenv.config({ path: "./src/config/config.env" });

const sendGoogleOtpMail = async (recipientEmail, otp , type="register") => {
  try {
    const mailOptions = {
      from: `"Denial Analyzer" <${process.env.EMAIL}>`,
      to: recipientEmail,
      subject: "Your OTP Code",
      text: `Your OTP code is: ${otp}`,
      html: `<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Login Code</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #036958;
            margin-bottom: 10px;
        }
        .code-container {
            // background: #e5faf4;
            // border: 2px dashed #036958;
            border-radius: 8px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
        }
        .code {
            font-size: 36px;
            font-weight: bold;
            color: #036958;
            letter-spacing: 8px;
            margin: 10px 0;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 14px;
            color: #666;
            text-align: center;
        }
        .warning {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
            color: #856404;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img style="height:'150px'" src="https://res.cloudinary.com/drqtz5s5m/image/upload/v1760532070/logo_knw7jo.png"/>
            <h2>Your Email Verification Code</h2>
        </div>
        
       
        <div class="code-container">
            <div class="code">${otp}</div>
            <div style="font-size: 14px; color: #666; margin-top: 10px;">
                This code will expire in 5 minutes
            </div>
        </div>
        
        <div class="warning">
            <strong>Security Notice:</strong> If you didn't request this code, please ignore this email. Never share this code with anyone.
        </div>
        
        <p>If you're having trouble in verify your email, please contact our support team <a href="mailto:'support@covehealthsolutions.com'">support@covehealthsolutions.com</a>.</p>
        
        <div class="footer">
            <p>This is an automated message from Denial Analyzer.</p>
            <p>&copy; 2025 Cove Health. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("OTP sent: ", info.messageId);
  } catch (error) {
    console.error("Error sending OTP: ", error);
  }
};


const sendGoogleScheduleMail = async ( fullName,email,company,employees,role ) => {
  try {
    const mailOptions = {
      from: `"Denial Analyzer" <${process.env.EMAIL}>`,
      to: `${email}`,
      subject: "Schedule Demo",
      text: `New schedule demo request`,
      html: `<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Form Submission</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f7f7f7;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
            border-top: 5px solid #036958; /* Accent color */
        }
        .header {
            text-align: center;
            margin-bottom: 25px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #036958;
            margin-bottom: 5px;
        }
        .title {
            color: #1a1a1a;
            font-size: 22px;
            margin-top: 0;
        }
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        .data-table th, .data-table td {
            padding: 12px 15px;
            text-align: left;
            border-bottom: 1px solid #eee;
        }
        .data-table th {
            background-color: #f9f9f9;
            color: #555;
            font-weight: 600;
            width: 35%; /* Control column width */
        }
        .data-table td {
            color: #333;
            word-break: break-word; /* Handle long content */
        }
        .cta-button-container {
            text-align: center;
            margin-top: 30px;
        }
        .cta-button {
            display: inline-block;
            padding: 10px 20px;
            background-color: #036958;
            color: white !important;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 12px;
            color: #999;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
           <img style="height:'150px'" src="https://res.cloudinary.com/drqtz5s5m/image/upload/v1760532070/logo_knw7jo.png"/>
           
            <h2 class="title">New Submission!</h2>
        </div>
        
        <p>A new submission has been received through your website form. Here are the details:</p>
        
        <table class="data-table">
            <tr>
                <th>Full Name</th>
                <td>${fullName}</td>
            </tr>
            <tr>
                <th>Work Email</th>
                <td><a href="mailto:${email}" style="color: #036958;">${email}</a></td>
            </tr>
            <tr>
                <th>Company</th>
                <td>${company}</td>
            </tr>
            <tr>
                <th>Number of Full-Time Employees</th>
                <td>${employees}</td>
            </tr>
            <tr>
                <th>Role</th>
                <td>${role}</td>
            </tr>
            </table>

       

        <p style="margin-top: 30px;">Please take the necessary action to follow up on this submission.</p>
        
        <div class="footer">
            <p>This is an automated notification from Denial Analyzer system.</p>
           
        </div>
    </div>
</body>
</html>`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("OTP sent: ", info.messageId);
  } catch (error) {
    console.error("Error sending OTP: ", error);
  }
};

module.exports = {
  sendGoogleOtpMail,
  sendGoogleScheduleMail
};