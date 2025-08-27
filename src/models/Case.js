
const mongoose = require("mongoose");
const { Schema } = mongoose;

const caseSchema = new Schema(
    
  {
     user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    currentClaim: {
      type: String,
     required:true
    },
    prevClaimDOS: {
      type: String,
     required:true
    },
    prevClaimCPT: {
      type: String,
     required:true
    },
    denialScreenShots: {
      type: [],
    },
    encounterScreenShots: {
      type: [],
    },
    denialText: {
      type: String,
    },
    encounterText: {
      type: String
    },
    primaryPayer: {
      type: String
    },
   
  },
  { timestamps: true }
);

const Case = mongoose.model("Case", caseSchema);
module.exports = Case;