const { createApp } = require("./app");
const app = createApp();

// Start server (local/dev)
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
