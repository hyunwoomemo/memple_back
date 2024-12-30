const express = require("express");
const userRouter = require("./src/router/user");
const playerRouter = require("./src/router/player");
const partyRouter = require("./src/router/party");
const app = express();
const http = require("http");
const server = http.createServer(app);
const socketIo = require("socket.io");
const setupSocket = require("./src/socket");
const cors = require("cors");

const io = socketIo(server);
console.log("ioio", io);
setupSocket(io, app);

app.use(express.json());

app.set("port", process.env.PORT || 8000);

app.use(
  cors({
    origin: "*", // 모든 도메인 허용
    // methods: ['GET', 'POST', 'PUT', 'DELETE'],  // 허용할 HTTP 메서드
    allowedHeaders: ["Content-Type", "Authorization"], // 허용할 헤더
    // credentials: true // 쿠키 포함 등의 옵션을 허용할 경우(origin을 *처리했을경우 쿠키설정 안먹음.)
  })
);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use((req, res, next) => {
  console.log("🔥🔥🔥", req.path);
  next();
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
