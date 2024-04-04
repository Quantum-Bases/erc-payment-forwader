
const { validationResult } = require("express-validator");

const validateRequest = (req, res, next) => {
   const errors = validationResult(req);

   if (!errors.isEmpty()) {
      let error = errors.array().map((err) => {
         return { message: err.msg, field: err.param };
      });
      return res.status(400).json({ success: false, errors: error });


   }
   next()
}

module.exports = {
   validateRequest
}