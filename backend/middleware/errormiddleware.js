const { stack } = require("../routes/users");
const logger = require("../utils/logger.js");

const errorHandler = (err, req, res, next) => {
  let statusCode 
  if(err.statusCode || res.statusCode){
    statusCode = err.statusCode ? err.statusCode : res.statusCode;
  }else{ statusCode=500;}
  const errorMessage = err.message
    ? err.message.startsWith("Error: ")
      ? err.message.slice(7)
      : err.message
    : process.env.NODE_ENV === "production"
    ? "Server Error"
    : "Something went wrong";

  res.status(statusCode).json({
    Message: errorMessage,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });

  logger.error(
    new Error(
      `${statusCode} - ${errorMessage} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`
    )
  );
  next();
};
module.exports = {
  errorHandler,
};
