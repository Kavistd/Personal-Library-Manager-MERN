# Readers' Choice - Personal Library Manager

A MERN stack application for managing personal book libraries. Users can search books via Google Books API, save them to their collection, track reading status, and write reviews.

## Tech Stack

**Backend:**
- Node.js, Express.js (v5.2.1)
- MongoDB, Mongoose (v9.1.2)
- JWT (jsonwebtoken v9.0.3), bcryptjs (v3.0.3)

**Frontend:**
- React (v19.2.3), React Router DOM (v7.12.0)
- Axios (v1.13.2), Vite (v7.3.1)
- CSS3 with dark mode support

**External APIs:**
- Google Books API

## Installation & Setup

### Prerequisites
- Node.js (v14+)
- MongoDB (local or MongoDB Atlas)

### Backend

```bash
cd server
npm install
```

Create `.env` in `server/`:
```env
MONGODB_URI=mongodb://localhost:27017/library-manager
JWT_SECRET=your-secret-key-here
PORT=5000
```

```bash
npm run dev
```

### Frontend

```bash
cd client
npm install
npm run dev
```

Access the application at `http://localhost:3000`

## Environment Variables

### Backend (.env)
| Variable | Required | Example |
|----------|----------|---------|
| `MONGODB_URI` | Yes | `mongodb://localhost:27017/library-manager` or MongoDB Atlas connection string |
| `JWT_SECRET` | Yes | `your-secure-random-key-32-characters` |
| `PORT` | No | `5000` |

### Frontend
No environment variables required. The application uses Vite proxy for API calls.

## Architecture

**Frontend:** React with Context API for authentication and theme management. Axios interceptors handle JWT token injection and automatic logout on session expiration.

**Backend:** Layered architecture with routes, controllers, models, and middleware. Express handles API endpoints, Mongoose manages MongoDB schemas, bcryptjs hashes passwords, and JWT provides stateless authentication.

**Database:** MongoDB collections for Users and SavedBooks. JWT tokens are used instead of server-side sessions for scalability.

## Project Structure

```
├── server/
│   ├── controllers/          # Request handlers
│   ├── middleware/           # JWT authentication
│   ├── models/               # Mongoose schemas
│   ├── routes/               # API routes
│   ├── index.js              # Server entry point
│   └── .env                  # Environment variables
│
├── client/
│   ├── src/
│   │   ├── api/              # Axios configuration with interceptors
│   │   ├── components/       # Reusable components
│   │   ├── context/          # AuthContext, ThemeContext
│   │   ├── pages/            # Page components
│   │   └── App.jsx           # Main app with routing
│   └── vite.config.js
│
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/user` - Get current user (requires JWT)

### Books
- `GET /api/books` - Get all saved books (requires JWT)
- `POST /api/books` - Save a new book (requires JWT)
- `PUT /api/books/:id` - Update book status/review (requires JWT)
- `DELETE /api/books/:id` - Delete a book (requires JWT)

## Features

- User authentication with JWT
- Book search via Google Books API
- Personal library management
- Reading status tracking (Want to Read, Reading, Completed)
- Book reviews and ratings
- Protected routes and endpoints
- Dark mode toggle
- Responsive design
- Axios interceptors for automatic token management

## Security

- Password hashing with bcryptjs
- JWT-based authentication
- Protected API routes with middleware verification
- CORS configuration
- Input validation on backend


