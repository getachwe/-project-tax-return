// Vercel serverless entry - mounts the Express app and exports the handler
const serverless = require("serverless-http");
const { createApp } = require("../app");

const app = createApp();

module.exports = app;
module.exports.handler = serverless(app);
