
const mongoose = require("mongoose");
const { Schema } = mongoose;

const aiAnalysisSchema = new Schema(
    
  {
     user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required:true
    },
     case: {
      type: Schema.Types.ObjectId,
      ref: "Case",
      required:true
    },
    likes:{
        type:[]
    },
    dislikes:{
        type:[]
    },
   
    analysis: {
      type: {}
    },
   
  },
  { timestamps: true }
);

const AiAnalysis = mongoose.model("AiAnalysis", aiAnalysisSchema);
module.exports = AiAnalysis;