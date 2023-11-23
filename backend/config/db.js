const mongoose = require("mongoose");
const logger=require("../utils/logger")
const connectDB = async () => {
  try {
    mongoose.set('strictQuery', true)
    const conn = await mongoose.connect(process.env.MONGO_URI);
  
    console.log(`Mongodb connected:${conn.connection.host}`);
    logger.info(`database up and running on development`)
  } catch (error) {
    console.log(error);
    logger.error(`${error.message}`)
    process.exit(1);
  }
};
module.exports = connectDB;
