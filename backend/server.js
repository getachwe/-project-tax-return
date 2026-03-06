const PORT = process.env.PORT || 4000;

try {
  const { createApp } = require("./app");
  const app = createApp();
  app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
  });
} catch (err) {
  console.error("Failed to start server:", err);
  process.exit(1);
}
