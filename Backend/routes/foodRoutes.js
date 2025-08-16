const express = require('express');
const router = express.Router();
const {
  createFoodPost,
  getFoodPosts,
  getFoodPostById,
  updateFoodPost,
  deleteFoodPost,
  getUserFoodPosts,
  getFoodCategories,
  getMyFoodPosts
} = require('../controllers/foodController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const { upload, handleUploadError } = require('../middleware/uploadMiddleware');

// Public routes (specific routes first)
router.get('/', optionalAuth, getFoodPosts);
router.get('/categories', getFoodCategories);
router.get('/user/:userId', getUserFoodPosts);

// Protected routes
router.post('/', protect, upload.single('image'), handleUploadError, createFoodPost);
router.put('/:id', protect, upload.single('image'), handleUploadError, updateFoodPost);
router.delete('/:id', protect, deleteFoodPost);
router.get('/my-posts', protect, getMyFoodPosts);

// Parameterized routes (after specific routes)
router.get('/:id', getFoodPostById);

module.exports = router;
