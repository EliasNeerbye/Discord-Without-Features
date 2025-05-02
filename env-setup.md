# Environment Setup Guide

## Backend Environment Variables (.env)
Create a `server/.env` file with these variables:
```env
# Server Configuration
PORT=3000
NODE_ENV=production
MONGODB_URI=mongodb://your-mongodb-uri
JWT_KEY=your-jwt-secret-key

# Client URLs
CLIENT_URL=http://your-frontend-url
SERVER_URL=http://your-backend-url

# Email Configuration (if using)
EMAIL_HOST=smtp.your-email-provider.com
EMAIL_PORT=587
EMAIL_USER=your-email@example.com
EMAIL_PASSWORD=your-email-password
EMAIL_FROM=your-sender-email@example.com
EMAIL_SECURE=false

# OAuth Configuration (if using)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## Frontend Environment Variables (.env)
Create a `client/.env` file with these variables:
```env
VITE_API_URL=http://your-backend-url
VITE_SOCKET_URL=http://your-backend-url
```

## Docker Build & Run Instructions

### Backend
```bash
# Build the backend image
cd server
docker build -t discord-clone-backend .

# Run the backend container
docker run -d \
  --name discord-backend \
  -p 3000:3000 \
  --env-file .env \
  -v $(pwd)/uploads:/usr/src/app/uploads \
  discord-clone-backend
```

### Frontend
```bash
# Build the frontend image
cd client
docker build -t discord-clone-frontend .

# Run the frontend container
docker run -d \
  --name discord-frontend \
  -p 80:80 \
  -e API_URL=http://your-backend-url \
  discord-clone-frontend
```

## Important Notes

1. **Persistent Storage**: 
   - The backend container mounts the local `uploads` directory for persistent storage of user avatars
   - Make sure to create the directory before running the container

2. **Security**:
   - Never commit .env files to version control
   - Use strong, unique values for secrets
   - In production, use Docker secrets or a secure key management service

3. **Networking**:
   - Make sure the frontend can reach the backend URL
   - Update CORS settings in the backend if needed
   - The WebSocket connection must be properly configured

4. **Production Deployment**:
   - Consider using Docker Compose or Kubernetes for orchestration
   - Set up proper SSL/TLS certificates
   - Implement proper logging and monitoring
   - Use a production-grade MongoDB deployment