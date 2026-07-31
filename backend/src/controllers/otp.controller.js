const { prisma } = require("../configs/db");
const { sendOtp, sendSuccess } = require("../utils/sendMail");

// We have request OTP to help if people need to resend another OTP, e.g: user didn't receive or expired
const requestOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const otp = Math.floor(1000 + Math.random() * 9000).toString(); // 4 digits
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    await prisma.otps.deleteMany({ where: { email } }); // user might send otp multiple times

    await prisma.otps.create({
      data: { email, otp, expiresAt },
    });

    await sendOtp(email, otp);

    res.status(200).json({ status: "success", message: "OTP sent to email" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const record = await prisma.otps.findFirst({
      where: { email, otp },
    });

    if (!record) return res.status(400).json({ error: "Invalid OTP" });
    if (record.expiresAt < new Date())
      return res.status(400).json({ error: "OTP expired" });

    await prisma.otps.deleteMany({ where: { email } });

    await prisma.users.update({ where: { email }, data: { isVerified: true } });
    await sendSuccess(email);

    res.status(200).json({ status: "success", message: "OTP verified" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { requestOtp, verifyOtp };
