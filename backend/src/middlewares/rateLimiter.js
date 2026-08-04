const rateLimiter = require("express-rate-limit");

const generalLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests, please try again later." },
});

const otpLimiter = rateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 3,
  message: { error: `Too many OTP requests, please try again later.` },
});

const authLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: `Too many OTP requests, please try again later.` },
});

module.exports = { generalLimiter, otpLimiter, authLimiter };
