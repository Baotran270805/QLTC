
const http = require("node:http");
const net = require("node:net");

let result = "CHECKING";

const socket = net.createConnection({
  host: "qltc-mysql-bao.mysql.database.azure.com",
  port: 3306,
  timeout: 10000,
});

socket.on("connect", () => {
  result = "TCP_OK";
  console.log(result);
  socket.end();
});

socket.on("timeout", () => {
  result = "TCP_TIMEOUT";
  console.log(result);
  socket.destroy();
});

socket.on("error", (error) => {
  result = "TCP_ERROR: " + error.code;
  console.log(result);
});

http.createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/plain",
  });
  res.end(result);
}).listen(process.env.PORT || 8080, "0.0.0.0", () => {
  console.log("DIAGNOSTIC_READY");
});
