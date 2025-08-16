# WasteLess

WasteLess is a web application that helps neighbors share surplus food, reduce waste, and connect with each other. Users can register, post available food items, claim items, and chat to arrange pickups.

## Features

- User registration and login (JWT authentication)
- Create, view, and claim food posts
- Real-time chat for arranging pickups
- Profile and stats dashboard
- Image uploads (Cloudinary)
- MongoDB backend

## Folder Structure

```
Backend/   # Node.js/Express API server
Frontend/  # Static HTML/CSS/JS client
uploads/   # Uploaded images (if not using Cloudinary)
```

## Getting Started

### 1. Clone the repository

```sh
git clone https://github.com/tahia2004/wasteless.git
cd wasteless
```

### 2. Setup the Backend

```sh
cd Backend
npm install
cp .env.example .env
```

- Edit `.env` with your MongoDB URI, JWT secret, and Cloudinary credentials.

### 3. Start the Backend Server

```sh
npm run dev
```
The backend will run on [http://localhost:5000](http://localhost:5000).

### 4. Access the Frontend

- Open a new terminal.
- Serve the `Frontend` folder using the backend server (static files are already served by Express).
- Visit [http://localhost:5000](http://localhost:5000) in your browser.

## Environment Variables

See `Backend/.env.example` for required variables:
- `PORT`
- `MONGO_URI`
- `JWT_SECRET`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `FRONTEND_URL`

## API Documentation

See [Backend/README.md](Backend/README.md) for detailed API endpoints and data models.

## Contributing

1. Fork the repo
2. Create a feature branch
3. Commit your changes
4. Open a pull request

## License

This project is licensed under the ISC License.
