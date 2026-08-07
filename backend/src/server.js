const express = require("express");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const dashboardRoute = require("./routes/admin.route");
const authRouter = require("./routes/auth.route");
const otpRoute = require("./routes/otp.route");
const tagRoute = require("./routes/tag.route");
const noteRoute = require("./routes/note.route");
const todoRoute = require("./routes/todo.route");
const folderRoute = require("./routes/folder.route");

const { generalLimiter } = require("./middlewares/rateLimiter");

const app = express();
const PORT = process.env.PORT || 6969;

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use(morgan("dev"));
app.use(cookieParser());
app.use(generalLimiter);

app.use("/api/admin/dashboard", dashboardRoute);
app.use("/api/auth", authRouter);
app.use("/api/otp", otpRoute);
app.use("/api/tags", tagRoute);
app.use("/api/notes", noteRoute);
app.use("/api/todos", todoRoute);
app.use("/api/folders", folderRoute);

app.listen(PORT, () =>
  console.log(`Server is running on http://localhost:${PORT}`),
);
