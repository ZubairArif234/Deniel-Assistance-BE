
const mongoose = require("mongoose");
const { Schema } = mongoose;

const caseSchema = new Schema(
    
  {
     user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required:true
    },
    currentClaim: {
      type: String,
     required:true
    },
    previousClaimDOS: {
      type: String,
    },
    previousClaimCPT: {
      type: String,
    },
    primaryPayer: {
      type: String,
      required: true
    },
    denialScreenShots: {
      type: [],
    },
    encounterScreenShots: {
      type: [],
    },
    diagnosisScreenShots: {
      type: [],
    },
    denialText: {
      type: String,
    },
    encounterText: {
      type: String
    },
    diagnosisText: {
      type: String
    },
   
  },
  { timestamps: true }
);

const Case = mongoose.model("Case", caseSchema);
module.exports = Case;