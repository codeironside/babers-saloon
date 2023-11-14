const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../model/users/user");

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Calculate the current time in seconds since Unix epoch
      const currentTimeInSeconds = Math.floor(Date.now() / 1000);

      // Calculate the time elapsed since token creation
      const timeElapsedInSeconds = currentTimeInSeconds - decoded.iat;

      // Check if more than 12 hours (12 hours * 60 minutes * 60 seconds)
      if (timeElapsedInSeconds > 12 * 60 * 60) {
        throw Object.assign(new Error("Session expired"), { statusCode: 401 });
;
      }

      // Get user from the token
      req.auth = await User.findById(decoded.id).select("-password");

      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw Object.assign(new Error("Session expired"), { statusCode: 401 });

      } else {
        throw Object.assign(new Error("Not authorized"), { statusCode: 403 });
;
      }
    }
  } else {
    throw Object.assign(new Error("Not authorized"), { statusCode: 403 });
;
  }
});

module.exports = { protect };
