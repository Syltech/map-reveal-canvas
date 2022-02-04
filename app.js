const express = require("express");
const fileUpload = require("express-fileupload");
const app = express();
const fs = require("fs");

app.use(express.static("public"));
app.use(fileUpload());

app.post("/mask", (req, res) => {
  const imgdata = req.body.file;
  // to convert base64 format into random filename
  const base64Data = imgdata.replace(/^data:([A-Za-z-+/]+);base64,/, "");
  fs.writeFileSync("./public/img/mask.png", base64Data, { encoding: "base64" });

  res.send("ok");
});

app.post("/export", (req, res) => {
  const imgdata = req.body.file;
  const base64Data = imgdata.replace(/^data:([A-Za-z-+/]+);base64,/, "");
  fs.writeFileSync("./public/img/export.png", base64Data, {
    encoding: "base64",
  });

  res.send("ok");
});

app.listen(3000, () => {
  console.log("Started on PORT 3000");
});
