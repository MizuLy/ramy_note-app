const express = require("express");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const authRouter = require("./routes/auth.route");
const tagRoute = require("./routes/tag.route");
const noteRoute = require("./routes/note.route");
const dashboardRoute = require("./routes/admin.route");
const otpRoute = require("./routes/otp.route");

const app = express();
const PORT = process.env.PORT || 6969;

app.use(express.json());
app.use(morgan("dev"));
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/tag", tagRoute);
app.use("/api/notes", noteRoute);
app.use("/api/admin/dashboard", dashboardRoute);
app.use("/api/otp", otpRoute);

app.listen(PORT, () =>
  console.log(`Server is running on http://localhost:${PORT}`),
);
