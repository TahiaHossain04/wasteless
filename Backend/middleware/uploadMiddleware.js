const multer = require('multer');
const { cloudinary } = require('../config/cloudinary');
const fs = require('fs');
const path = require('path');

// Configure multer for local temp storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Create unique filename with timestamp and random number
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const originalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `food-${uniqueSuffix}-${originalName}`);
  }
});

// Enhanced file filter with better validation
const fileFilter = (req, file, cb) => {
  // Check file type
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('❌ Only image files are allowed!'), false);
  }
  
  // Check file extension
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (!allowedExtensions.includes(fileExtension)) {
    return cb(new Error('❌ Invalid file type! Allowed: JPG, PNG, GIF, WEBP'), false);
  }
  
  // Check file size (5MB limit)
  if (file.size > 5 * 1024 * 1024) {
    return cb(new Error('❌ File too large! Maximum size is 5MB'), false);
  }
  
  cb(null, true);
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only allow 1 file per request
  },
  fileFilter: fileFilter
});

// Enhanced Cloudinary upload with better error handling and transformations
const uploadToCloudinary = async (filePath, options = {}) => {
  try {
    console.log('📤 Uploading to Cloudinary:', path.basename(filePath));
    
    // Default upload options
    const uploadOptions = {
      folder: 'wasteless/food',
      public_id: `food_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      transformation: [
        { width: 800, height: 600, crop: 'limit' }, // Resize to max 800x600
        { quality: 'auto:good' }, // Optimize quality
        { format: 'auto' } // Auto-format (WebP if supported)
      ],
      ...options
    };

    const result = await cloudinary.uploader.upload(filePath, uploadOptions);
    
    console.log('✅ Upload successful:', result.secure_url);
    
    // Clean up local file
    fs.unlink(filePath, (err) => {
      if (err) console.error('⚠️ Error deleting local file:', err);
    });
    
    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      size: result.bytes
    };
    
  } catch (error) {
    console.error(' Cloudinary upload failed:', error.message);
    
    // Clean up local file even if upload fails
    fs.unlink(filePath, (err) => {
      if (err) console.error('Error deleting local file:', err);
    });
    
    throw new Error(`Image upload failed: ${error.message}`);
  }
};

// Delete image from Cloudinary
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    
    if (result.result === 'ok') {
      console.log('Image deleted from Cloudinary:', publicId);
      return true;
    } else {
      console.error('Failed to delete image from Cloudinary:', publicId);
      return false;
    }
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error.message);
    return false;
  }
};

// Enhanced error handling middleware
const handleUploadError = (error, req, res, next) => {
  console.error('Upload error:', error.message);
  
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({ 
          message: 'File too large. Maximum size is 5MB.',
          error: 'FILE_TOO_LARGE'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({ 
          message: 'Too many files. Only 1 image allowed.',
          error: 'TOO_MANY_FILES'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({ 
          message: 'Unexpected file field.',
          error: 'UNEXPECTED_FILE'
        });
      default:
        return res.status(400).json({ 
          message: 'File upload error.',
          error: 'UPLOAD_ERROR'
        });
    }
  } else if (error.message) {
    return res.status(400).json({ 
      message: error.message,
      error: 'VALIDATION_ERROR'
    });
  }
  
  next();
};

// Validate image before upload
const validateImage = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ 
      message: ' Image is required',
      error: 'IMAGE_REQUIRED'
    });
  }
  next();
};

// Clean up temporary files on error
const cleanupTempFiles = (req, res, next) => {
  // Clean up any temp files if request fails
  if (req.file && req.file.path) {
    fs.unlink(req.file.path, (err) => {
      if (err) console.error(' Error cleaning up temp file:', err);
    });
  }
  next();
};

module.exports = { 
  upload, 
  handleUploadError, 
  uploadToCloudinary, 
  deleteFromCloudinary,
  validateImage,
  cleanupTempFiles
};
