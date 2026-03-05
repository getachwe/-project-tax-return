// Vercel serverless entry - mounts the Express app and exports the handler
const serverless = require("serverless-http");

let app;
let handler;

try {
  const { createApp } = require("./app");
  app = createApp();

  // Log route registration for debugging
  console.log("Express app routes registered:");
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      console.log(
        `  ${Object.keys(middleware.route.methods).join(",").toUpperCase()} ${
          middleware.route.path
        }`
      );
    }
  });

  handler = serverless(app, {
    request(request, event, context) {
      // Log incoming requests for debugging
      console.log(`Incoming request: ${request.method} ${request.url}`);
    },
  });
} catch (error) {
  console.error("Error creating app:", error);
  handler = async (req, res) => {
    console.error("Handler error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
      stack: error.stack,
    });
  };
}

module.exports = handler;
