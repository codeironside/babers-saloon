require("dotenv").config();
const express = require("express");
const http = require('http'); // Import http module
const socketIo = require('socket.io');
const morgan = require('morgan');
const requestIp = require('request-ip');
const cors = require("cors");
const corsOption = require("./config/corsOption");
const credentials = require("./middleware/credentials");
const { errorHandler } = require("./middleware/errormiddleware");
const { Server } = require('socket.io');
const connectDB = require("./config/db");
const logger = require("./utils/logger");

const app = express();


const port = process.env.PORT || 5087;

// Logger
app.use(morgan("tiny", { stream: logger.stream }));
app.use(morgan(':date[iso] - :method :url :status :res[content-length] - :response-time ms'));
app.use(requestIp.mw());

// Database connection
connectDB();

// Middleware
app.use(credentials);
app.use(cors(corsOption));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use("/users", require("./routes/users"));
app.use("/shops", require("./routes/shops.route"));
app.use("/chats", require("./routes/chat"));
app.use("/blogs", require("./routes/blog"));
app.use("/subscription", require("./routes/subscription"));
app.use("/booking", require("./routes/booking"));
app.use("/cart", require("./routes/cart"));
app.use("/payment", require("./routes/payment"));
app.use("/campaign", require("./routes/campaign"));

// Error handling middleware
app.use(errorHandler);


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  logger.info('Server running on development');
});
