const fs = require("fs");
const path = require("path");
const https = require("https");
const colors = require("colors");
const crypto = require("crypto");
const multer = require("multer");
const express = require("express");
const bcrypt = require("bcryptjs");
const connectDB = require("./config/db");
const dotenv = require("dotenv").config();
const sessions = require("./middleware/sessions");
// const GridFsStorage = require("multer-gridfs-storage");
const morgan = require('morgan');
const requestIp = require('request-ip');
const { errorHandler } = require("./middleware/errormiddleware");
const cors = require("cors");
const corsOption = require("./config/corsOption")
const credentials = require("./middleware/credentials")




// const helmet = require("./middleware/helmet");
const app = express();
//port  number
const port = process.env.port || 5087;

app.set('trust proxy', true);

const logger = require("./utils/logger");
//logger
app.use(morgan("tiny", { stream: logger.stream }));
app.use(morgan(':date[iso] - :method :url :status :res[content-length] - :response-time ms'));
app.use(requestIp.mw());
// app.use(morgan('tiny', { stream: stafflogger.stream }));

connectDB();

//credentials 
app.use(credentials)

//CORS
app.use(cors(corsOption));

//... mz
//middlewares
// if (app.get('env') === 'production') {
//   app.set('trust proxy', 1) // trust first proxy
//   sess.cookie.secure = true // serve secure cookies
// }
// app.use(sessions);

app.use(express.json());
//TODO:sessions
app.use(express.urlencoded({ extended: false }));
// app.use(methodOverride("_method"));


app.use("/users", require("./routes/users"))
app.use("/shops", require("./routes/shops.route"))

app.use(errorHandler);

app.listen(port, () => {
  console.log(`server running on port ${port}`);
  logger.info(`server running on development`);
});
