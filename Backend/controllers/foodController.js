const FoodPost = require('../models/FoodPost');
const User = require('../models/User');
const { uploadToCloudinary, deleteFromCloudinary } = require('../middleware/uploadMiddleware');

// @desc    Create a new food post
// @route   POST /api/food
// @access  Private
const createFoodPost = async (req, res) => {
  try {
    console.log('Creating food post...');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    
    const {
      name,
      description,
      category,
      expiryDate,
      location,
      imageUrl,
      quantity,
      condition,
      coordinates
    } = req.body;

    console.log('Extracted expiryDate:', expiryDate);
    console.log('Type of expiryDate:', typeof expiryDate);

    let finalImageUrl = imageUrl || '';
    let imageData = null;
    
    // Handle image upload if file is present
    if (req.file) {
      try {
        console.log(' Processing image upload...');
        imageData = await uploadToCloudinary(req.file.path);
        finalImageUrl = imageData.url;
        console.log('Image uploaded successfully:', finalImageUrl);
      } catch (err) {
        console.error('Image upload failed:', err.message);
        return res.status(400).json({ 
          message: 'Image upload failed: ' + err.message,
          error: 'IMAGE_UPLOAD_FAILED'
        });
      }
    }

    // Create food post with image data
    const foodPostData = {
      name,
      description,
      category,
      expiryDate,
      location,
      imageUrl: finalImageUrl,
      quantity,
      condition,
      user: req.user._id,
      coordinates: coordinates || {}
    };

    // Add image metadata if available
    if (imageData) {
      foodPostData.imageMetadata = {
        publicId: imageData.publicId,
        width: imageData.width,
        height: imageData.height,
        format: imageData.format,
        size: imageData.size
      };
    }

    const foodPost = await FoodPost.create(foodPostData);

    const populatedFoodPost = await FoodPost.findById(foodPost._id)
      .populate('user', 'username profilePicture location');

    console.log('Food post created successfully:', foodPost._id);
    res.status(201).json(populatedFoodPost);
  } catch (error) {
    console.error(' Create food post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all food posts with filters
// @route   GET /api/food
// @access  Public (with different data based on auth status)
const getFoodPosts = async (req, res) => {
  try {
    const {
      category,
      location,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
      minExpiryDate,
      maxExpiryDate
    } = req.query;

    // Build filter object - different for authenticated vs public users
    let filter = {};
    
    if (req.user) {
      // Authenticated user - can see all posts (including expired and unavailable)
      // No additional filters applied
    } else {
      // Public user - only see available, non-expired posts
      filter.isAvailable = true;
      filter.expiryDate = { $gte: new Date() }; // Only non-expired posts
    }

    if (category) {
      filter.category = category;
    }

    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (minExpiryDate || maxExpiryDate) {
      filter.expiryDate = filter.expiryDate || {};
      if (minExpiryDate) {
        filter.expiryDate.$gte = new Date(minExpiryDate);
      }
      if (maxExpiryDate) {
        filter.expiryDate.$lte = new Date(maxExpiryDate);
      }
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const foodPosts = await FoodPost.find(filter)
      .populate('user', 'username profilePicture location')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await FoodPost.countDocuments(filter);

    res.json({
      foodPosts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      },
      userType: req.user ? 'authenticated' : 'public'
    });
  } catch (error) {
    console.error('Get food posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get food post by ID
// @route   GET /api/food/:id
// @access  Public
const getFoodPostById = async (req, res) => {
  try {
    const foodPost = await FoodPost.findById(req.params.id)
      .populate('user', 'username profilePicture location bio');

    if (foodPost) {
      res.json(foodPost);
    } else {
      res.status(404).json({ message: 'Food post not found' });
    }
  } catch (error) {
    console.error('Get food post by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update food post
// @route   PUT /api/food/:id
// @access  Private
const updateFoodPost = async (req, res) => {
  try {
    const foodPost = await FoodPost.findById(req.params.id);

    if (!foodPost) {
      return res.status(404).json({ message: 'Food post not found' });
    }

    // Check if user owns the food post
    if (foodPost.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to update this food post' });
    }

    const {
      name,
      description,
      category,
      expiryDate,
      location,
      imageUrl,
      quantity,
      condition,
      isAvailable,
      coordinates
    } = req.body;

    let finalImageUrl = imageUrl !== undefined ? imageUrl : foodPost.imageUrl;
    if (req.file) {
      try {
        finalImageUrl = await uploadToCloudinary(req.file.path);
      } catch (err) {
        return res.status(400).json({ message: 'Image upload failed' });
      }
    }

    foodPost.name = name || foodPost.name;
    foodPost.description = description || foodPost.description;
    foodPost.category = category || foodPost.category;
    foodPost.expiryDate = expiryDate || foodPost.expiryDate;
    foodPost.location = location || foodPost.location;
    foodPost.imageUrl = finalImageUrl;
    foodPost.quantity = quantity || foodPost.quantity;
    foodPost.condition = condition || foodPost.condition;
    foodPost.isAvailable = isAvailable !== undefined ? isAvailable : foodPost.isAvailable;
    foodPost.coordinates = coordinates || foodPost.coordinates;

    const updatedFoodPost = await foodPost.save();

    const populatedFoodPost = await FoodPost.findById(updatedFoodPost._id)
      .populate('user', 'username profilePicture location');

    res.json(populatedFoodPost);
  } catch (error) {
    console.error('Update food post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete food post
// @route   DELETE /api/food/:id
// @access  Private
const deleteFoodPost = async (req, res) => {
  try {
    const foodPost = await FoodPost.findById(req.params.id);

    if (!foodPost) {
      return res.status(404).json({ message: 'Food post not found' });
    }

    // Check if user owns the food post
    if (foodPost.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to delete this food post' });
    }

    await foodPost.deleteOne();

    res.json({ message: 'Food post removed' });
  } catch (error) {
    console.error('Delete food post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user's food posts
// @route   GET /api/food/user/:userId
// @access  Public
const getUserFoodPosts = async (req, res) => {
  try {
    const foodPosts = await FoodPost.find({ 
      user: req.params.userId,
      isAvailable: true 
    })
      .populate('user', 'username profilePicture location')
      .sort({ createdAt: -1 });

    res.json(foodPosts);
  } catch (error) {
    console.error('Get user food posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get food categories
// @route   GET /api/food/categories
// @access  Public
const getFoodCategories = async (req, res) => {
  try {
    const categories = await FoodPost.distinct('category');
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get authenticated user's own food posts
// @route   GET /api/food/my-posts
// @access  Private
const getMyFoodPosts = async (req, res) => {
  try {
    const {
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
      isAvailable
    } = req.query;

    // Build filter object - only user's posts
    const filter = { user: req.user._id };

    // Optional filter for availability
    if (isAvailable !== undefined) {
      filter.isAvailable = isAvailable === 'true';
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const foodPosts = await FoodPost.find(filter)
      .populate('user', 'username profilePicture location')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await FoodPost.countDocuments(filter);

    res.json({
      foodPosts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get my food posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createFoodPost,
  getFoodPosts,
  getFoodPostById,
  updateFoodPost,
  deleteFoodPost,
  getUserFoodPosts,
  getFoodCategories,
  getMyFoodPosts
};
