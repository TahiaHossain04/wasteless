const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://mhkkapur12:FgQ8w2pXQbut41tc@wastelessapp.xbjiwtg.mongodb.net/?retryWrites=true&w=majority&appName=WastelessApp');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
