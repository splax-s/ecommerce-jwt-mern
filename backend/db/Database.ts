import mongoose from 'mongoose';

const connectDatabase = () => {
  mongoose
    .connect(process.env.DB_URL as string)
    .then((data) => {
      console.log(`MongoDB connected with server: ${data.connection.host}`);
    })
    .catch((err) => {
      console.error(`Error: ${err.message}`);
    });
};

export default connectDatabase;
