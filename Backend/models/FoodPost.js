const mongoose = require('mongoose');

const foodPostSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Food name is required'],
    trim: true,
    maxlength: [100, 'Food name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
category: {
  type: String,
  enum: ["Fruits", "Vegetables", "Dairy", "Meat", "Grains", "Baked Goods", "Other"],
  required: [true, "Please select a valid category"]
},
  expiryDate: {
    type: Date,
    required: [true, 'Expiry date is required']
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  imageUrl: {
    type: String,
    default: ''
  },
  quantity: {
    type: String,
    required: [true, 'Quantity is required'],
    trim: true
  },
condition: {
  type: String,
  enum: ["Fresh", "Near Expiry", "Frozen", "Opened"],
  required: [true, "Please select a valid condition"]
},
  isAvailable: {
    type: Boolean,
    default: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  coordinates: {
    latitude: {
      type: Number,
      required: false
    },
    longitude: {
      type: Number,
      required: false
    }
  }
}, {
  timestamps: true
});

// Index for better query performance
foodPostSchema.index({ category: 1, location: 1, expiryDate: 1 });
foodPostSchema.index({ user: 1 });
foodPostSchema.index({ isAvailable: 1 });

// Virtual for checking if food is expired
foodPostSchema.virtual('isExpired').get(function() {
  return new Date() > this.expiryDate;
});

// Method to get food posts with user details
foodPostSchema.methods.toJSON = function() {
  const foodPost = this.toObject();
  foodPost.isExpired = this.isExpired;
  return foodPost;
};

module.exports = mongoose.model('FoodPost', foodPostSchema);
