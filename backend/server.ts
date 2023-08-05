import app from './app';
import connectDatabase from './db/Database';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

// Handling uncaught Exception
process.on('uncaughtException', (err: Error) => {
  console.log(`Error: ${err.message}`);
  console.log('shutting down the server due to uncaught exception');
  process.exit(1);
});

// config
if (process.env.NODE_ENV !== 'PRODUCTION') {
  dotenv.config({
    path: 'config/.env',
  });
}

// connect db
connectDatabase();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// create server
const server = app.listen(process.env.PORT, () => {
  console.log(`Server is running on http://localhost:${process.env.PORT}`);
});

// unhandled promise rejection
process.on('unhandledRejection', (err: Error) => {
  console.log(`Error: ${err.message}`);
  console.log('shutting down the server due to unhandled promise rejection');

  // Close the server and exit
  server.close(() => {
    process.exit(1);
  });
});
