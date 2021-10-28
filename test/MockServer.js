const express = require('express');

class MockServer {
  async start() {
    const http = require("http");

    this.app = express();
    this.server = http.createServer(this.app).listen(0);
    this.app.set("port", this.server.address().port);
    this.mocks = [];

    this.app.get("*", (req, res) => {
      console.log(`${req.method} ${req.url}`);

      const mock = this.mocks.shift();
      if (!mock || (!req.url.match(mock.url) && req.url !== mock.url)) {
        res.writeHead(404);
        res.end();
        return;
      }

      res.writeHead(200);
      res.end(JSON.stringify(mock.data));
    });
  }

  reset() {
    this.mocks = [];
  }

  add(mock) {
    this.mocks.push(mock);
  }

  url() {
    return `http://localhost:${this.server.address().port}`;
  }

  close() {
    this.server.close();
  }
}

module.exports = MockServer;
