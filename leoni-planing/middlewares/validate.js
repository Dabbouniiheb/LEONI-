const { validationResult } = require("express-validator");
const logger = require("../utils/appLogger");

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn("Validation failed", { errors: errors.array(), path: req.originalUrl, ip: req.ip });
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  }
  next();
};

module.exports = validate;
