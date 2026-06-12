const app = require('./app');
const connectDB = require('./config/db');

const port = process.env.PORT || 5000;

async function startServer() {
  await connectDB();
  app.listen(port, () => console.log(`Server running on ${port}`));
}

startServer().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
