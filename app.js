const express = require("express");
const userRouter = require("./src/router/user");
const playerRouter = require("./src/router/player");
const partyRouter = require("./src/router/party");
const app = express();
const http = require('http');
const server = http.createServer(app);
const socketIo = require('socket.io');
const setupSocket = require('./src/socket')

const io = socketIo(server)
console.log('ioio', io)
setupSocket(io, app)

app.use(express.json());

app.set("port", process.env.PORT || 8000);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/user", userRouter);
app.use("/player", playerRouter);
app.use("/party", partyRouter);

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Server Error !!";

  res.status(statusCode).json({
    success: false,
    message,
  });
};

app.use(errorHandler);

server.listen(app.get("port"), () => {
  console.log(app.get("port"), "번에서 대기중");
});
