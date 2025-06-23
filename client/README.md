# PosiVibe Frontend

**React Frontend for PosiVibe Social Platform**

This is the frontend application for PosiVibe, a positive social networking platform focused on digital wellness and mental health.

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn package manager

### Installation

```bash
npm install
npm start
```

The application will open at [http://localhost:3000](http://localhost:3000)

## 🎯 Features

### 🏠 **Landing Page**

- Beautiful homepage with feature showcase
- Call-to-action for registration and login
- Responsive design with glassmorphism effects

### 🔐 **Authentication**

- User registration and login
- JWT token management
- Automatic redirection based on auth state

### 📱 **Social Features**

- Timeline with posts and interactions
- User profiles and photo sharing
- Like, comment, and follow system
- Real-time notifications

### ⏰ **Digital Wellness**

- Time tracking with usage limits
- Beautiful time limit exceeded page
- Session management and automatic logout

### 🎨 **UI/UX**

- Dark and light theme support
- Mobile-responsive design
- Smooth animations and transitions
- Modern glassmorphism effects

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── navbar/         # Navigation bar
│   ├── leftBar/        # Left sidebar
│   ├── rightBar/       # Right sidebar
│   ├── post/           # Post component
│   ├── comments/       # Comments system
│   └── notifications/  # Notification system
├── pages/              # Page components
│   ├── home/           # Landing page
│   ├── login/          # Login page
│   ├── register/       # Registration page
│   ├── profile/        # User profile
│   └── timeLimit/      # Time limit page
├── context/            # React Context providers
│   ├── authContext.js  # Authentication state
│   └── darkModeContext.js # Theme state
├── assets/             # Static assets
└── style.scss          # Global styles
```

## 🛠️ Available Scripts

### Development

```bash
npm start           # Start development server
npm test            # Run test suite
npm run build       # Build for production
```

### Code Quality

```bash
npm run lint        # Run ESLint
npm run format      # Format with Prettier
```

## 🎨 Styling

- **SCSS** for advanced styling capabilities
- **CSS Variables** for theme management
- **Mobile-first** responsive design
- **Glassmorphism** modern UI effects

## 🔧 Configuration

### Environment Variables

Create `.env` file in the client directory:

```env
REACT_APP_API_URL=http://localhost:8800/api
REACT_APP_UPLOAD_URL=http://localhost:8800/upload
```

### API Integration

- Axios for HTTP requests
- Interceptors for token management
- Error handling and toast notifications

## 📱 Responsive Design

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

All components are optimized for mobile-first experience.

## 🎯 Key Components

### Authentication Flow

- Login/Register forms with validation
- JWT token management
- Protected routes and redirects

### Social Features

- Post creation and interaction
- User profiles and following
- Real-time notification system

### Digital Wellness

- Time tracking integration
- Usage limit enforcement
- Wellness-focused UI elements

## 👥 Authors

**Created by:**

- **Arbaz Nazir** - Full Stack Developer
- **Jamsheed Mushtaq** - Frontend Developer
- **Danish Manzoor** - Backend Developer

## 📄 License

This project is part of PosiVibe and is licensed under the MIT License.

---

**PosiVibe Frontend** - _Beautiful, responsive interface for positive social networking_ ✨
