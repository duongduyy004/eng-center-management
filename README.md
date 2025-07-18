# English Center Management System

A comprehensive Node.js RESTful API for managing English language centers. This system provides complete functionality for managing students, teachers, classes, attendance, payments, parents, and administrative tasks.

## 🌟 Features

### Core Management
- **User Management**: Authentication, authorization, role-based access control
- **Student Management**: Complete student lifecycle management with class enrollment
- **Teacher Management**: Teacher profiles, class assignments, salary management
- **Class Management**: Class creation, scheduling, student enrollment, teacher assignment
- **Parent Management**: Parent profiles linked to students with controlled access
- **Attendance Management**: Digital attendance tracking with automatic payment calculations
- **Payment Management**: Student fee tracking, payment history, automated calculations with VNPay integration
- **VNPay Integration**: Secure online payment processing for student fees
- **Teacher Payment Management**: Salary calculations based on lessons taught
- **Announcements**: System-wide communication management

### Security & Authentication
- **Email Verification**: Secure email verification for new account registration
- **Password Reset**: Forgot password functionality with OTP (One-Time Password) via email
- **JWT Authentication**: Secure token-based authentication system
- **Role-based Access Control**: Different permission levels for admin, teacher, student, and parent roles

### Advanced Features
- **File Upload**: Avatar and image management with Cloudinary integration
- **Email Service**: Automated email notifications for verification, password reset, and system updates
- **OTP System**: Secure One-Time Password generation and verification for password reset
- **Statistics & Analytics**: Monthly enrollment changes, attendance reports, payment insights
- **VNPay Payment Gateway**: Secure online payment processing with transaction verification
- **Flexible Date Parsing**: Support for multiple date formats (DD/MM/YYYY, etc.)
- **Schedule Management**: Student and teacher schedule viewing
- **Automatic Calculations**: Payment amounts, discounts, teacher salaries
- **Soft Delete**: Data integrity with recoverable deletions
- **API Documentation**: Complete Swagger/OpenAPI documentation

## 🏗️ System Architecture

### Tech Stack
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with Passport.js
- **Payment Gateway**: VNPay integration
- **File Storage**: Cloudinary
- **Documentation**: Swagger UI
- **Testing**: Jest
- **Process Management**: PM2

### Project Structure
```
src/
├── app.js                 # Express app configuration
├── index.js              # Application entry point
├── config/               # Configuration files
│   ├── config.js         # Environment configuration
│   ├── cloudinary.js     # Cloudinary setup
│   ├── passport.js       # Authentication strategies
│   └── ...
├── controllers/          # Request handlers
├── middlewares/          # Custom middleware
├── models/              # Mongoose schemas
├── routes/              # API routes
├── services/            # Business logic
├── utils/               # Utility functions
└── validations/         # Request validation schemas
```

## 🚀 Getting Started

### Prerequisites
- Node.js (>= 12.0.0)
- MongoDB
- Cloudinary account (for file uploads)
- VNPay merchant account (for payment processing)
- SMTP Email Service (Gmail recommended for email verification and password reset)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/duongduyy004/eng-center-management.git
   cd English-center-management
   ```

2. **Install the dependencies**
   ```bash
   npm install
   ```

3. **Start the application**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

### Default Admin Account
The system automatically creates a default admin account on first run:
- **Email**: admin@gmail.com (configurable)
- **Password**: admin123 (configurable)

### Authentication Features

#### Email Verification
- **New User Registration**: All new users must verify their email address
- **Verification Process**: 
  1. User registers with email and password
  2. System sends verification email with secure token
  3. User clicks verification link to activate account
  4. Account becomes active and user can log in

#### Forgot Password with OTP
- **Secure Password Reset**: Uses One-Time Password (OTP) for enhanced security
- **Reset Process**:
  1. User requests password reset with email address
  2. System validates email exists in database
  3. 6-digit OTP generated and sent to user's email
  4. OTP expires after 10 minutes for security
  5. User enters OTP and new password to complete reset
  6. Old OTPs are automatically invalidated

## 📊 Business Logic

### Security & Data Protection
- **Email Verification**: Mandatory email verification for all new accounts
- **OTP Security**: Time-limited One-Time Passwords with automatic cleanup
- **Password Encryption**: Secure bcrypt hashing for all user passwords
- **JWT Tokens**: Stateless authentication with configurable expiration
- **Role-based Permissions**: Granular access control based on user roles

### Automatic Calculations
- **Student Payments**: Automatically calculated based on attended lessons and discount percentage
- **VNPay Payment Processing**: Secure online payment with automatic payment record updates
- **Teacher Salaries**: Calculated based on completed lessons and per-lesson rate
- **Attendance Impact**: Attendance directly affects payment calculations

### Enrollment Management
- Class capacity checking
- Duplicate enrollment prevention
- Student status tracking (active, completed)
- Automatic payment record creation

### Schedule Management
- Conflict detection for class scheduling
- Day-of-week based scheduling
- Date range validation
- Teacher availability checking

## 📈 Monitoring & Logging

The system includes comprehensive logging with Winston:
- Request/response logging
- Error tracking
- Payment calculation logs
- Attendance update logs

## �📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
1. Check the API documentation at `/v1/docs` endpoint
2. Review the validation schemas in `/src/validations`
3. Examine the test files for usage examples
4. Check the logs for detailed error information

## 🔄 Version History

- **v1.7.0** - Current version with full feature set
- Complete CRUD operations for all entities
- Advanced statistics and reporting
- File upload capabilities
- Comprehensive validation and security features

---

**Note**: This system is designed for educational institutions and English language centers. It provides a complete solution for managing the daily operations of language learning environments.

### Development Guidelines
- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

## 📧 Contact & Support

- **Repository**: [https://github.com/duongduyy004/eng-center-management](https://github.com/duongduyy004/eng-center-management)
- **Issues**: Report bugs and request features via GitHub Issues
- **Documentation**: API docs available at `/v1/docs` when server is running

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ for English language centers and educational institutions**
