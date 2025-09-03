const express = require("express");
const tiktok = require("./routes/tiktok");
const facebook = require("./routes/facebook");
const instagram = require("./routes/instagram");
const dailymotion = require("./routes/dailymotion");
const linkedin = require("./routes/linkedin");
const snackvideo = require("./routes/snackvideo");
const pinterest = require("./routes/pinterest");
const vimeo = require("./routes/vimeo");

const app = express();

app.get("/",(req,res) =>{
     res.send("Server is running")
});

app.use(express.urlencoded({ extended: true }));
app.use("/api", tiktok);
app.use("/api", facebook);
app.use("/api", instagram);
app.use("/api", dailymotion);
app.use("/api", linkedin);
app.use("/api", snackvideo);
app.use("/api", pinterest);
app.use("/api", vimeo);

const PORT = 3000
app.listen(PORT,()=>{
     console.log(`Server running at http://localhost:${PORT}`);
});