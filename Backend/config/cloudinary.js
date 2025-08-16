const cloudinary = require('cloudinary').v2;

// Validate environment variables
const validateCloudinaryConfig = () => {
  const requiredVars = [
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY', 
    'CLOUDINARY_API_SECRET'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('Missing Cloudinary environment variables:');
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    console.error('Please check your .env file');
    return false;
  }
  
  return true;
};

// Configure Cloudinary
const configureCloudinary = () => {
  if (!validateCloudinaryConfig()) {
    return false;
  }
  
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
    
    console.log('Cloudinary configured successfully');
    console.log(`   Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
    console.log(`   API Key: ${process.env.CLOUDINARY_API_KEY.substring(0, 8)}...`);
    
    return true;
  } catch (error) {
    console.error('Failed to configure Cloudinary:', error.message);
    return false;
  }
};

// Test Cloudinary connection
const testCloudinaryConnection = async () => {
  try {
    if (!validateCloudinaryConfig()) {
      return false;
    }
    
    // Try to get account info to test connection
    const result = await cloudinary.api.ping();
    
    if (result.status === 'ok') {
      console.log('Cloudinary connection test successful');
      return true;
    } else {
      console.error(' Cloudinary connection test failed');
      return false;
    }
  } catch (error) {
    console.error(' Cloudinary connection test error:', error.message);
    return false;
  }
};

// Get Cloudinary configuration info (for debugging)
const getCloudinaryInfo = () => {
  if (!validateCloudinaryConfig()) {
    return null;
  }
  
  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY ? 
      `${process.env.CLOUDINARY_API_KEY.substring(0, 8)}...` : null,
    hasApiSecret: !!process.env.CLOUDINARY_API_SECRET
  };
};

module.exports = {
  cloudinary,
  validateCloudinaryConfig,
  configureCloudinary,
  testCloudinaryConnection,
  getCloudinaryInfo
}; 