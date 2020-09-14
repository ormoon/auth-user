const http = require("http");
const express = require("express");
const morgan = require("morgan");

require('./db/connection');
require("dotenv").config();


const app = express();
const apiRouter = require("./api_routes/router");

// console.log(process.env)

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", apiRouter);
app.use("/", (req, res, next) => {
  res.send(`<center><h1>---------- Page Not Found Error -------------</h1></center>`);
});

const server = http.createServer(app);

server.listen(process.env.PORT, process.env.Hostname, () => {
  console.log(
    `----------Server is running >> http://${process.env.Hostname}:${process.env.PORT}`
  );
});
