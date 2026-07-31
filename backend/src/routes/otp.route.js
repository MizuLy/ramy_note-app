const express = require("express");
const { requestOtp, verifyOtp } = require("../controllers/otp.controller");
const { otpLimiter } = require("../middlewares/rateLimiter");

const router = express.Router();

router.post("/request", otpLimiter, requestOtp);
router.post("/verify", verifyOtp);

module.exports = router;
