
const { stack } = require("../routes/users")
const logger = require("../utils/logger.js")



const errorHandler=(err,req,res,next)=>{
    // const statusCode = res.statusCode? res.statusCode:500
    // res.status(statusCode).json({
    //     Message:err.Message,
    //     s
    // })
    // logger.error(new Error(`${res.status} - ${res.Message} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`));
    // next()
    let statusCode = err.statusCode || res.statusCode||500;

    // Customize error message based on production or development environment
    const errorMessage = (err.message.startsWith('Error: ') ? err.message.slice(7) : err.message);

    res.status(statusCode).json({
        Message: errorMessage,
        stack:process.env.NODE_ENV === "production"? null: err.stack
    });

    logger.error(new Error(`${statusCode} - ${errorMessage} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`));
    next();
}
module.exports={
    errorHandler,
}
