"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var http_1 = require("http");
var url_1 = require("url");
var next_1 = __importDefault(require("next"));
var socket_server_1 = require("./src/lib/socket-server");
var dev = process.env.NODE_ENV !== "production";
var app = (0, next_1.default)({ dev: dev });
var handle = app.getRequestHandler();
var port = process.env.PORT || 3000;
app.prepare().then(function () {
    var server = (0, http_1.createServer)(function (req, res) {
        var parsedUrl = (0, url_1.parse)(req.url || "/", true);
        handle(req, res, parsedUrl);
    }).listen(port, function () {
        console.log("> Ready on http://localhost:3000");
    });
    // initialize Socket.IO singleton and handlers
    (0, socket_server_1.initSocket)(server);
});
