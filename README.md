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
- **Payment Management**: Student fee tracking, payment history, automated calculations
- **Teacher Payment Management**: Salary calculations based on lessons taught
- **Announcements**: System-wide communication management

### Advanced Features
- **File Upload**: Avatar and image management with Cloudinary integration
- **Statistics & Analytics**: Monthly enrollment changes, attendance reports, payment insights
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
- **Role**: admin

## 📊 Business Logic

### Automatic Calculations
- **Student Payments**: Automatically calculated based on attended lessons and discount percentage
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
