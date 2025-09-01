
const mongoose = require("mongoose");
const { Schema } = mongoose;

const transactionSchema = new Schema(
    
  {
     user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required:true
    },
    
    stripeSessionId: {
      type: String
    },
    amountTotal: {
      type: Number
    },
    currency: {
      type: String
    },
    paymentStatus: {
      type: String
    },
    subscriptionId: {
      type: String
    },
    type: {
      type: String,
      default:"subscription"
    },
   
  },
  { timestamps: true }
);

const Transaction = mongoose.model("Transaction", transactionSchema);
module.exports = Transaction;