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
const server = http.createServer(app);
const io = socketIo(server);

// ... Configure Express middleware, such as body parser, static files, and views ...

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('a user connected');

  // Handle socket events here
  socket.on('chat message', (msg) => {
    // Handle incoming chat messages
    io.emit('chat message', msg);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});


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

// Error handling middleware
app.use(errorHandler);


server.listen(port, () => {
  console.log(`Server running on port ${port}`);
  logger.info('Server running on development');
});
