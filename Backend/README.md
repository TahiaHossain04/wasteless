# Wasteless Backend API

A Node.js/Express backend for the Wasteless food sharing application with user authentication, food post management, and chat functionality.

## Features

- **User Authentication**: Register, login, and profile management with JWT
- **Food Posts**: Create, read, update, delete food items with images
- **Search & Filter**: Filter food by category, location, expiry date
- **Chat System**: Real-time messaging between users about food posts
- **Image Upload**: Cloudinary integration for food images
- **MongoDB**: Mongoose ODM for data modeling

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Cloudinary account (for image uploads)

## Installation

1. **Clone the repository**
   ```bash
   cd wasteless_app/Backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables**
   ```bash
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # Database Configuration
   MONGO_URI=mongodb://localhost:27017/wasteless

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

   # Cloudinary Configuration (for image uploads)
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret

   # Frontend URL (for CORS)
   FRONTEND_URL=http://localhost:3000
   ```

5. **Start the server**
   ```bash
   npm start
   # or for development with nodemon
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Login user
- `GET /api/users/profile` - Get user profile (protected)
- `PUT /api/users/profile` - Update user profile (protected)
- `GET /api/users/:id` - Get user by ID
- `GET /api/users` - Get all users (protected)

### Food Posts
- `GET /api/food` - Get all food posts with filters
- `POST /api/food` - Create a new food post (protected)
- `GET /api/food/:id` - Get food post by ID
- `PUT /api/food/:id` - Update food post (protected)
- `DELETE /api/food/:id` - Delete food post (protected)
- `GET /api/food/user/:userId` - Get user's food posts
- `GET /api/food/categories` - Get all food categories

### Chat
- `POST /api/chat` - Send a message (protected)
- `GET /api/chat/conversations` - Get user's conversations (protected)
- `GET /api/chat/conversation/:foodPostId/:otherUserId` - Get conversation messages (protected)
- `PUT /api/chat/read/:foodPostId/:senderId` - Mark messages as read (protected)
- `GET /api/chat/unread` - Get unread message count (protected)
- `DELETE /api/chat/:messageId` - Delete a message (protected)

### Health Check
- `GET /api/health` - API health status
- `GET /` - API information

## Data Models

### User
```javascript
{
  username: String (required, unique),
  email: String (required, unique),
  password: String (required, hashed),
  profilePicture: String,
  location: String,
  bio: String,
  timestamps: true
}
```

### FoodPost
```javascript
{
  name: String (required),
  description: String (required),
  category: String (required, enum),
  expiryDate: Date (required),
  location: String (required),
  imageUrl: String,
  quantity: String (required),
  condition: String (required, enum),
  isAvailable: Boolean (default: true),
  user: ObjectId (ref: User),
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  timestamps: true
}
```

### Chat
```javascript
{
  sender: ObjectId (ref: User, required),
  receiver: ObjectId (ref: User, required),
  foodPost: ObjectId (ref: FoodPost, required),
  message: String (required),
  isRead: Boolean (default: false),
  messageType: String (enum: 'text', 'image'),
  timestamps: true
}
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Protected routes require a valid token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Error Handling

The API returns consistent error responses:

```javascript
{
  "message": "Error description"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Server Error

## Development

### Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests (if configured)

### File Structure
```
Backend/
├── config/
│   └── db.js              # Database connection
├── controllers/
│   ├── userController.js   # User authentication logic
│   ├── foodController.js   # Food post management
│   └── chatController.js   # Chat functionality
├── middleware/
│   ├── authMiddleware.js   # JWT authentication
│   └── uploadMiddleware.js # File upload handling
├── models/
│   ├── User.js            # User schema
│   ├── FoodPost.js        # Food post schema
│   └── Chat.js            # Chat message schema
├── routes/
│   ├── userRoutes.js      # User endpoints
│   ├── foodRoutes.js      # Food endpoints
│   └── chatRoutes.js      # Chat endpoints
├── server.js              # Main server file
├── package.json
└── README.md
```

## Security Features

- Password hashing with bcryptjs
- JWT token authentication
- Input validation and sanitization
- CORS configuration
- File upload restrictions
- Error handling without exposing sensitive information

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License. 