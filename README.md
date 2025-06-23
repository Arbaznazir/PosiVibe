# PosiVibe

**Positive Social Networking for Digital Wellness**

PosiVibe is a revolutionary social media platform that prioritizes mental health and digital wellness through built-in content moderation, healthy usage limits, and a beautiful user interface designed for positive interactions.

## 🌟 Key Features

### 🛡️ **Advanced Content Moderation**

- AI-powered content filtering with zero tolerance policy
- Automatic blocking of inappropriate content
- Real-time content analysis and moderation

### ⏰ **Healthy Usage Limits**

- Built-in time tracking with 2.5-hour daily limit
- Session management and automatic logout
- Digital wellness promotion and addiction prevention

### 🔔 **Smart Notifications**

- Real-time notifications for likes, comments, follows, and mentions
- Unread count badges and notification management
- Non-overwhelming notification system

### 🌙 **Modern UI/UX**

- Beautiful dark and light themes
- Glassmorphism effects and smooth animations
- Mobile-responsive design across all devices
- Premium user experience

### 📱 **Complete Social Features**

- User profiles and photo sharing
- Post creation, likes, and comments
- Follow/unfollow system
- Stories and timeline feeds

## 🚀 Tech Stack

### **Frontend**

- **React 18** - Modern React with hooks
- **React Router DOM** - Client-side routing
- **React Context API** - State management
- **SCSS** - Advanced styling with variables and mixins
- **React Hot Toast** - Beautiful notifications
- **Date-fns** - Date formatting and manipulation
- **Axios** - HTTP client for API requests

### **Backend**

- **Node.js & Express** - Server framework
- **MySQL** - Primary database
- **JWT Authentication** - Secure user sessions
- **Multer** - File upload handling
- **Content Moderation APIs** - Multiple filtering services
- **Rate Limiting** - API protection
- **CORS** - Cross-origin resource sharing

## 🎨 Design Preview

![Design](assets/react_social_design.jpg)

## 🎬 Demo

![Demo](assets/Buckety_social_demo.gif)

## 🛠️ Installation & Setup

### Prerequisites

- Node.js (v14 or higher)
- MySQL (v8 or higher)
- Git

### 1. Clone Repository

```bash
git clone https://github.com/your-repo/posivibe.git
cd posivibe
```

### 2. Database Setup

- Install MySQL Workbench
- Create a schema named `social`
- Import the database structure from `/assets/social_db.sql`

### 3. Backend Setup

```bash
cd api
npm install

# Configure database connection in api/connect.js
# Add your MySQL credentials

npm start
# Server runs on http://localhost:8800
```

### 4. Frontend Setup

```bash
cd client
npm install
npm start
# Client runs on http://localhost:3000
```

## 🔧 Configuration

### Environment Variables

Create `.env` file in the `api` directory:

```env
DB_HOST=localhost
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=social
JWT_SECRET=your_jwt_secret
PORT=8800
```

### API Endpoints

- **Authentication**: `/api/auth/login`, `/api/auth/register`
- **Posts**: `/api/posts/` (GET, POST, DELETE)
- **Users**: `/api/users/` (GET, PUT)
- **Notifications**: `/api/notifications/`
- **Time Tracking**: `/api/users/time-limit`

## 📁 Project Structure

```
posivibe/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── context/        # React context providers
│   │   └── assets/         # Static assets
│   └── public/
├── api/                    # Node.js backend
│   ├── controllers/        # Route handlers
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   ├── utils/              # Utility functions
│   └── middleware/         # Custom middleware
└── assets/                 # Project assets
```

## 🎯 Core Features Implementation

### Time Tracking System

- Real-time session tracking
- Daily usage limits (2.5 hours)
- Automatic logout when limit exceeded
- Beautiful time limit page with inspirational quotes

### Content Moderation

- Multiple filtering layers
- Profanity detection and blocking
- Inappropriate content removal
- Zero tolerance policy enforcement

### Notification System

- Real-time updates using polling
- Like, comment, follow, and mention notifications
- Unread count management
- User-friendly notification interface

## 🎨 UI/UX Highlights

- **Glassmorphism Design** - Modern frosted glass effects
- **Gradient Backgrounds** - Beautiful color transitions
- **Smooth Animations** - Micro-interactions and transitions
- **Mobile Responsive** - Optimized for all devices
- **Dark Mode Support** - Eye-friendly theme options

## 👥 Authors

**Created by:**

- **Arbaz Nazir** - Full Stack Developer
- **Jamsheed Mushtaq** - Frontend Developer
- **Danish Manzoor** - Backend Developer

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🆘 Support

If you encounter any issues or have questions, please open an issue on GitHub or contact the development team.

---

**PosiVibe** - _Transforming social media for better digital wellness_ 🌟
