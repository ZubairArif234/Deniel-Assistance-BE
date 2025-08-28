const Case = require("../models/Case");
const SuccessHandler = require("../utils/SuccessHandler");
const ErrorHandler = require("../utils/ErrorHandler");
const User = require("../models/User");

//get users
const getAllUsers = async (req, res) => {
  // #swagger.tags = ['user']
  try {
      const { page = 1, limit = 10 } = req.query;
    const users = await User.aggregate([
        {
            $match:{"role":"user"}
        },
         {
        $facet: {
          totalCount: [{ $count: "count" }],
          data: [
            { $skip: (Number(page) - 1) * Number(limit) },
            { $limit: Number(limit) }
          ]
        }
      },
      {
        $unwind:"$totalCount"
      }
    ])
    

    return SuccessHandler(
     users,
      200,
      res
    );
  } catch (error) {
    return ErrorHandler(error.message, 500, req, res);
  }
};


module.exports = {
  getAllUsers
};