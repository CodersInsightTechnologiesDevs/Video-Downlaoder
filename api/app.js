const express = require("express");
const serverless = require("serverless-http"); // 👈 Required for Express on Vercel

const tiktok = require("./routes/tiktok");
const facebook = require("./routes/facebook");
const instagram = require("./routes/instagram");
const dailymotion = require("./routes/dailymotion");
const linkedin = require("./routes/linkedin");
const snackvideo = require("./routes/snackvideo");
const pinterest = require("./routes/pinterest");
const vimeo = require("./routes/vimeo");

const app = express();

app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Serverless Express is working on Vercel!");
});

app.use("/api", tiktok);
app.use("/api", facebook);
app.use("/api", instagram);
app.use("/api", dailymotion);
app.use("/api", linkedin);
app.use("/api", snackvideo);
app.use("/api", pinterest);
app.use("/api", vimeo);

// 👇 This exports the app as a serverless function
module.exports = app;
module.exports.handler = serverless(app);
