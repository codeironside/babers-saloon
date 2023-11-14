
const { stack } = require("../routes/users")
const logger = require("../utils/logger.js")



const errorHandler=(err,req,res,next)=>{
    // const statusCode = res.statusCode? res.statusCode:500
    // res.status(statusCode).json({
    //     Message:err.Message,
    //     stack:process.env.NODE_ENV === "production"? null: err.stack
    // })
    // logger.error(new Error(`${res.status} - ${res.Message} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`));
    // next()
    let statusCode = err.statusCode || res.statusCode || 500;

    // Customize error message based on production or development environment
    const errorMessage = process.env.NODE_ENV === "production" ? err.message : err.message;

    res.status(statusCode).json({
        Message: errorMessage,
    });

    logger.error(new Error(`${statusCode} - ${errorMessage} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`));
    next();
}
module.exports={
    errorHandler,
}
