# PosiVibe Deployment Guide.

## Backend Deployment on Koyeb

### Step 1: Fix Current Deployment Issues
1. We've added Node.js version specification in `package.json`
2. We've created a `Procfile` to explicitly define how to run the app

### Step 2: Configure Koyeb Deployment
1. Go to your Koyeb dashboard
2. Click on your service (posivibe)
3. Go to Settings tab
4. Make sure these settings are correct:
   - **Work directory**: `/api`
   - **Run command**: `npm run start:prod`
   - **Builder type**: Buildpack

### Step 3: Set Required Environment Variables
Add these environment variables in Koyeb dashboard:

```
NODE_ENV=production
PORT=8800
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/posivibe?retryWrites=true&w=majority
JWT_SECRET=your-strong-secret-key-here
ALLOWED_ORIGINS=https://your-frontend-vercel-domain.vercel.app,http://localhost:3000

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email Configuration
EMAIL_VERIFICATION=your-email@gmail.com
EMAIL_VERIFICATION_PASSWORD=your-app-password
USE_MOCK_EMAIL=false

# OpenAI API for content moderation
OPENAI_API_KEY=your-openai-api-key

# Google Perspective API for content moderation
GOOGLE_PERSPECTIVE_API_KEY=your-perspective-api-key
```

### Step 4: Redeploy
1. After making these changes, commit and push to your repository
2. In Koyeb dashboard, click "Redeploy" button

## Frontend Deployment on Vercel

### Step 1: Prepare Frontend
1. Make sure your frontend code is in the `client` directory
2. Ensure it's using the centralized axios instance

### Step 2: Deploy to Vercel
1. Connect your GitHub repository to Vercel
2. Set the root directory to `/client`
3. Add this environment variable:
   ```
   REACT_APP_API_BASE_URL=https://your-koyeb-app-name.koyeb.app/api/
   ```

### Step 3: After Deployment
1. Test authentication flow
2. Test post creation and image uploads
3. Test real-time messaging
4. Verify content moderation is working

## Important Security Note
Remember to rotate all exposed secrets as soon as possible, especially if they were committed to the repository at any point.
