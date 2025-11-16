// Vercel serverless entry - mounts the Express app and exports the handler
const serverless = require("serverless-http");

let app;
let handler;

try {
  const { createApp } = require("./app");
  app = createApp();
  handler = serverless(app);
} catch (error) {
  console.error("Error creating app:", error);
  handler = async (req, res) => {
    console.error("Handler error:", error);
    res.status(500).json({ 
      error: "Internal server error", 
      message: error.message,
      stack: error.stack 
    });
  };
}

module.exports = handler;

