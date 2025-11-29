import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { initSocket } from "./src/lib/socket-server.ts";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const port = process.env.PORT || 3000;

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url || "/", true);
    handle(req, res, parsedUrl);
  }).listen(port, () => {
    console.log("> Ready on http://localhost:3000");
  });

  // initialize Socket.IO singleton and handlers
  initSocket(server);
});
