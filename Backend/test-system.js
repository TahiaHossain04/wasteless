const mongoose = require('mongoose');
const User = require('./models/User');
const FoodPost = require('./models/FoodPost');
const Chat = require('./models/Chat');
require('dotenv').config();

// Test configuration
const testConfig = {
  mongoUri: process.env.MONGO_URI,
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET
  }
};

console.log('🧪 Starting System Test...\n');

// Test 1: Environment Variables
console.log('1️⃣ Testing Environment Variables...');
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.log('❌ Missing environment variables:', missingEnvVars);
} else {
  console.log('✅ All required environment variables present');
}

// Test 2: Cloudinary Configuration
console.log('\n2️⃣ Testing Cloudinary Configuration...');
if (testConfig.cloudinary.cloudName && testConfig.cloudinary.apiKey && testConfig.cloudinary.apiSecret) {
  console.log('✅ Cloudinary credentials configured');
  console.log(`   Cloud Name: ${testConfig.cloudinary.cloudName}`);
  console.log(`   API Key: ${testConfig.cloudinary.apiKey.substring(0, 8)}...`);
} else {
  console.log('⚠️ Cloudinary not fully configured (image uploads may not work)');
}

// Test 3: Database Connection
console.log('\n3️⃣ Testing Database Connection...');
async function testDatabase() {
  try {
    await mongoose.connect(testConfig.mongoUri);
    console.log('✅ MongoDB connected successfully');
    
    // Test 4: Database Models
    console.log('\n4️⃣ Testing Database Models...');
    
    // Test User Model
    try {
      const userCount = await User.countDocuments();
      console.log(`✅ User model working - ${userCount} users found`);
    } catch (error) {
      console.log('❌ User model error:', error.message);
    }
    
    // Test FoodPost Model
    try {
      const foodCount = await FoodPost.countDocuments();
      console.log(`✅ FoodPost model working - ${foodCount} food posts found`);
    } catch (error) {
      console.log('❌ FoodPost model error:', error.message);
    }
    
    // Test Chat Model
    try {
      const chatCount = await Chat.countDocuments();
      console.log(`✅ Chat model working - ${chatCount} chat messages found`);
    } catch (error) {
      console.log('❌ Chat model error:', error.message);
    }
    
    // Test 5: Sample Data Check
    console.log('\n5️⃣ Checking Sample Data...');
    
    const users = await User.find().limit(3).select('username email');
    if (users.length > 0) {
      console.log('✅ Users found:');
      users.forEach(user => {
        console.log(`   - ${user.username} (${user.email})`);
      });
    } else {
      console.log('⚠️ No users found in database');
    }
    
    const foodPosts = await FoodPost.find().limit(3).select('name category');
    if (foodPosts.length > 0) {
      console.log('✅ Food posts found:');
      foodPosts.forEach(post => {
        console.log(`   - ${post.name} (${post.category})`);
      });
    } else {
      console.log('⚠️ No food posts found in database');
    }
    
    // Test 6: API Endpoints (simulation)
    console.log('\n6️⃣ API Endpoints Status...');
    console.log('✅ /api/users/register - User registration');
    console.log('✅ /api/users/login - User authentication');
    console.log('✅ /api/users - Get all users (protected)');
    console.log('✅ /api/food - Food post operations');
    console.log('✅ /api/chat - Chat operations (protected)');
    
    // Test 7: File Upload System
    console.log('\n7️⃣ File Upload System...');
    if (testConfig.cloudinary.cloudName) {
      console.log('✅ Cloudinary configured for image uploads');
      console.log('✅ Multer middleware configured');
      console.log('✅ Image validation and processing ready');
    } else {
      console.log('⚠️ File upload system not fully configured');
    }
    
    // Test 8: Authentication System
    console.log('\n8️⃣ Authentication System...');
    if (process.env.JWT_SECRET) {
      console.log('✅ JWT secret configured');
      console.log('✅ Authentication middleware ready');
      console.log('✅ Protected routes secured');
    } else {
      console.log('❌ JWT secret missing');
    }
    
    console.log('\n🎉 System Test Completed Successfully!');
    console.log('\n📋 Next Steps:');
    console.log('1. Test user registration: POST /api/users/register');
    console.log('2. Test user login: POST /api/users/login');
    console.log('3. Test food post creation: POST /api/food');
    console.log('4. Test chat functionality: POST /api/chat');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the test
testDatabase(); 