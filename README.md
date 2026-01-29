# 🚀 Smart Attendance Management System

A comprehensive MERN Stack QR-Based Smart Attendance Management System with advanced security features, real-time attendance tracking, and role-based access control.

## 📋 Features

### 🔐 Authentication & Security

- JWT-based authentication with refresh tokens
- Role-based access control (Admin, Teacher, Student)
- Device fingerprinting for security
- Rate limiting and suspicious activity detection
- Password hashing with bcrypt
- University email validation for students

### 👨‍🏫 Teacher Features

- **Class Preset Management**: Create reusable class configurations
- **QR Code Generation**: One-click QR generation with 90-second expiry
- **Real-time Monitoring**: Live attendance count and recent attendees
- **Attendance Records**: Comprehensive attendance tracking with filters
- **Excel Export**: Export attendance data to Excel format
- **Statistics Dashboard**: Attendance analytics and insights

### 👨‍🎓 Student Features

- **QR Code Scanner**: Camera-based QR code scanning
- **Attendance History**: Personal attendance records and statistics
- **Dashboard**: Overview of attendance summary and recent activities
- **Mobile Responsive**: Optimized for mobile devices

### 👨‍💼 Admin Features

- **User Management**: Create and manage users (bulk import via CSV)
- **Department & Course Management**: Organize academic structure
- **System Reports**: Comprehensive attendance and user reports
- **Activity Monitoring**: Security logs and suspicious activity tracking
- **Analytics Dashboard**: System-wide statistics and insights

## 🛠️ Tech Stack

### Backend

- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **ExcelJS** for Excel export
- **Helmet** for security headers
- **Rate limiting** with express-rate-limit

### Frontend

- **React 18** with Vite
- **Material-UI (MUI)** for UI components
- **React Router** for navigation
- **Axios** for API calls
- **React Hook Form** for form handling
- **html5-qrcode** for QR scanning
- **qrcode.react** for QR generation

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- Modern web browser with camera support

### 1. Clone the Repository

```bash
git clone <repository-url>
cd attendance-system
```

### 2. Backend Setup

```bash
cd server
npm install

# Create .env file
cp .env.example .env
# Edit .env with your configuration

# Start the server
npm run dev
```

### 3. Frontend Setup

```bash
cd client
npm install

# Create .env file
cp .env.example .env
# Edit .env with your configuration

# Start the development server
npm run dev
```

### 4. Environment Variables

#### Server (.env)

```env
MONGO_URI=mongodb://localhost:27017/attendance-system
JWT_SECRET=your_super_secret_jwt_key
QR_SECRET=qr_token_secret_key
PORT=5000
CLIENT_URL=http://localhost:5173
NODE_ENV=development
UNIVERSITY_EMAIL_DOMAIN=university.edu
```

#### Client (.env)

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Smart Attendance System
VITE_APP_VERSION=1.0.0
```

## 📱 Usage Guide

### For Students

1. **Register**: Use your university email to create an account
2. **Login**: Access your student dashboard
3. **Scan QR**: Use the camera to scan teacher's QR code
4. **View History**: Check your attendance records and statistics

### For Teachers

1. **Create Presets**: Set up class configurations (department, batch, course)
2. **Generate QR**: Create time-limited QR codes for attendance
3. **Monitor Live**: Watch real-time attendance marking
4. **Export Data**: Download attendance reports in Excel format

### For Admins

1. **Manage Users**: Create and manage student/teacher accounts
2. **System Overview**: Monitor system-wide statistics
3. **Security**: Track suspicious activities and system logs
4. **Reports**: Generate comprehensive attendance reports

## 🔒 Security Features

### Device Fingerprinting

- Browser and device identification
- Canvas and WebGL fingerprinting
- IP address tracking
- Suspicious activity detection

### QR Code Security

- JWT-based tokens with 90-second expiry
- Unique session identifiers
- Encrypted payload data
- One-time use validation

### Anti-Fraud Measures

- Duplicate attendance prevention
- Device cooldown periods
- Location verification (optional)
- Rate limiting on all endpoints

## 📊 Database Schema

### Collections

- **Users**: Student, teacher, and admin accounts
- **ClassPresets**: Reusable class configurations
- **QRSessions**: Active QR code sessions
- **AttendanceRecords**: Individual attendance entries
- **Departments**: Academic departments
- **Courses**: Course information
- **ActivityLogs**: Security and activity tracking

## 🚀 Deployment

### Backend Deployment (Railway/Render)

1. Create account on Railway or Render
2. Connect your GitHub repository
3. Set environment variables
4. Deploy automatically

### Frontend Deployment (Vercel/Netlify)

1. Create account on Vercel or Netlify
2. Connect your GitHub repository
3. Set build command: `npm run build`
4. Set publish directory: `dist`
5. Deploy automatically

### Database (MongoDB Atlas)

1. Create MongoDB Atlas account
2. Create cluster and database
3. Get connection string
4. Update MONGO_URI in environment variables

## 🧪 Testing

### Backend Testing

```bash
cd server
npm test
```

### Frontend Testing

```bash
cd client
npm test
```

## 📈 Performance Optimization

- **Database Indexing**: Optimized queries with proper indexes
- **Caching**: Redis caching for frequently accessed data
- **Image Optimization**: Compressed QR codes and assets
- **Code Splitting**: Lazy loading of React components
- **CDN**: Static asset delivery via CDN

## 🔧 Development

### Project Structure

```
attendance-system/
├── server/                 # Backend API
│   ├── config/            # Database configuration
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Custom middleware
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── utils/            # Utility functions
│   └── server.js         # Main server file
├── client/               # Frontend React app
│   ├── public/           # Static assets
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── context/      # React context
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   ├── utils/        # Utility functions
│   │   └── App.jsx       # Main App component
│   └── package.json
└── README.md
```

### API Endpoints

#### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh-token` - Refresh JWT token
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

#### Teacher Routes

- `POST /api/teacher/presets` - Create class preset
- `GET /api/teacher/presets` - Get teacher's presets
- `POST /api/teacher/generate-qr/:presetId` - Generate QR code
- `GET /api/teacher/attendance/:presetId` - Get attendance records
- `GET /api/teacher/export/:presetId` - Export attendance data

#### Student Routes

- `POST /api/student/mark-attendance` - Mark attendance via QR
- `GET /api/student/my-attendance` - Get personal attendance
- `GET /api/student/attendance-summary` - Get attendance summary

#### Admin Routes

- `POST /api/admin/departments` - Create department
- `GET /api/admin/users` - Get all users
- `POST /api/admin/bulk-import` - Bulk import users
- `GET /api/admin/reports/attendance` - System reports

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- Create an issue on GitHub
- Email: support@attendance-system.com
- Documentation: [Wiki](https://github.com/your-repo/wiki)

## 🎯 Roadmap

- [ ] Mobile app (React Native)
- [ ] Face recognition integration
- [ ] Offline mode support
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Progressive Web App (PWA)
- [ ] Email notifications
- [ ] Automated reports

---

**Built with ❤️ using MERN Stack**
