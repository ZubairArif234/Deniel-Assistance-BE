const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const ApiError = require("./utils/ApiError");
const app = express();
const router = require("./router");
const loggerMiddleware = require("./middleware/loggerMiddleware");
const swaggerUi = require("swagger-ui-express");
const swaggerFile = require("../swagger_output.json"); // Generated Swagger file
const path = require("path");
// const user = require("./models/User/user");
// const League = require("./models/League/league");
// const Team = require("./models/League/team");
// const { CronJob } = require("cron");
// const sendNotification = require("./utils/pushNotification");
// const { handlePayment } = require("./functions/webhook");
const dotenv = require("dotenv");
// const adminNotification = require("./utils/adminNotification");
// const Season = require("./models/League/season");
dotenv.config({ path: "./config/config.env" });
const stripe = require("stripe")(process.env.STRIPE_SECRET);
const moment = require('moment')
const {handleStripeWebhook} = require('./controllers/webhookController')


console.log(moment().endOf("day").toDate())

console.log(global.onlineUsers);

// Middlewares - CORS must be first
// CORS configuration for both development and production
// const allowedOrigins = [
//   "http://localhost:5173", 
//   "http://localhost:3000", 
//   "http://localhost:8080", 
//   // Production frontend URLs - you'll add these when you deploy frontend
//   process.env.FRONTEND_URL, // Will be set when you deploy frontend
//   process.env.FRONTEND_URL_2, // Additional domains if needed
//   // Common frontend deployment domains (remove after you get your actual domain)
//   "https://green-appeal-flow-2pk8.vercel.app",
// ].filter(Boolean); // Remove undefined values

// app.use(cors({
//   origin: function (origin, callback) {
//     // Allow requests with no origin (like mobile apps or curl requests)
//     if (!origin) return callback(null, true);
    
//     if ( allowedOrigins.some(o => origin?.startsWith(o)) || process.env.NODE_ENV === 'development') {
//       callback(null, true);
//     } else {
//       console.log('CORS blocked origin:', origin);
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
//   allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
//   preflightContinue: false,
//   optionsSuccessStatus: 204
// }));

// Handle preflight requests
app.use(cors());
app.options("*", cors());

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use(loggerMiddleware);
app.post(
  "/webhook",
  express.raw({ type: "*/*" }),
  handleStripeWebhook
);


app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: false, limit: '50mb' }));
app.use(express.json({ limit: '50mb' }));

// router index
app.use("/", router);
// api doc
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerFile));

app.get("/", async (req, res) => {
  // await Match.updateMany({}, { $set: { status: "pending" } });
  // await Season.insertMany([
  //   { name: "Summer'24" },
  //   { name: "Winter'24" },
  //   { name: "Spring'24" },
  //   { name: "Fall'24" },
  //   { name: "Summer'25" },
  //   { name: "Winter'25" },
  //   { name: "Spring'25" },
  //   { name: "Fall'25" },
  //   { name: "Summer'26" },
  //   { name: "Winter'26" },
  //   { name: "Spring'26" },
  //   { name: "Fall'26" },
  //   { name: "Summer'27" },
  //   { name: "Winter'27" },
  //   { name: "Spring'27" },
  //   { name: "Fall'27" },
  //   { name: "Summer'28" },
  //   { name: "Winter'28" },
  //   { name: "Spring'28" },
  //   { name: "Fall'28" },
  //   { name: "Summer'29" },
  //   { name: "Winter'29" },
  //   { name: "Spring'29" },
  //   { name: "Fall'29" },
  //   { name: "Summer'30" },
  //   { name: "Winter'30" },
  //   { name: "Spring'30" },
  //   { name: "Fall'30" },
  // ]);
  res.send("BE-boilerplate v1.1");
  // await user.updateMany({}, { $set: { isNotificationEnabled: true } });
});

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
  next(new ApiError(404, "Not found"));
});

module.exports = app;
