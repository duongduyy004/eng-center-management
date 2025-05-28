# Models Documentation

## Overview
Hệ thống quản lý trung tâm tiếng Anh với các models được thiết kế để đáp ứng đầy đủ yêu cầu quản lý lớp học, học viên, giáo viên, và thanh toán.

## Models Structure

### 1. User Model
- Quản lý thông tin cơ bản của tất cả người dùng (admin, teacher, student, parent)
- Roles: admin, teacher, student, parent
- Bao gồm thông tin xác thực, profile cơ bản

### 2. Class Model
- Quản lý lớp học theo năm và cấp độ
- Hỗ trợ multiple sections (3.1, 3.2, 3.3)
- Status: upcoming, active, closed
- Soft delete để giữ lại thông tin cũ

### 3. Student Model
- Liên kết với User model
- Có thể tham gia nhiều lớp cùng lúc
- Discount percent riêng cho từng lớp
- Thông tin liên hệ khẩn cấp

### 4. Teacher Model
- Liên kết với User model
- Quản lý lương theo buổi dạy
- Chuyên môn và kinh nghiệm
- Có thể dạy nhiều lớp

### 5. Parent Model
- Liên kết với User model
- Có thể quản lý nhiều học sinh
- Cấu hình xem thông tin giáo viên
- Quan hệ với học sinh

### 6. Attendance Model
- Điểm danh theo từng buổi học
- Trạng thái: present, absent, late, excused
- Ghi chú cho từng học sinh
- Theo dõi topic và notes của giáo viên

### 7. Payment Model
- Quản lý thanh toán học phí theo tháng
- Tính toán discount riêng cho từng học sinh
- Lịch sử thanh toán chi tiết
- Trạng thái: pending, partial, paid, overdue

### 8. TeacherPayment Model
- Quản lý thanh toán lương giáo viên
- Tính theo số buổi dạy thực tế
- Lịch sử thanh toán

### 9. Enrollment Model
- Quản lý đăng ký học
- Workflow: pending -> approved -> active
- Lý do discount và withdrawal

### 10. Announcement Model
- Quảng cáo lớp học mới
- Multiple display types: popup, slider, banner
- Target audience specific
- Schedule hiển thị

### 11. Statistics Model
- Thống kê revenue, student count, teacher payments
- Theo tháng, quý, năm
- Breakdown chi tiết theo lớp

## Key Features Supported

### Multi-class Enrollment
- Học sinh có thể học nhiều lớp cùng lúc
- Discount riêng cho từng lớp

### Flexible Payment System
- Tính tiền theo số buổi học thực tế
- Discount percentage khác nhau cho mỗi học sinh
- Partial payment support

### Parent Dashboard
- Xem thông tin con em theo cấu hình admin
- Chi tiết attendance và payment
- Multiple children support

### Teacher Management
- Track số buổi dạy
- Salary calculation
- Class assignment

### Advanced Reporting
- Revenue vs Expected revenue
- Student growth tracking
- Teacher cost analysis
- Profit by class

## Plugins Used
- **toJSON**: Format output, hide sensitive fields
- **paginate**: Pagination support
- **softDelete**: Soft deletion with restore capability

## Indexes
- Optimized for common queries
- Unique constraints where needed
- Performance optimized for reports

## Usage Examples

### Creating a new class
```javascript
const newClass = new Class({
  name: "English Grade 3 - Section 1",
  grade: "Grade 3",
  section: "3.1",
  year: 2025,
  feePerLesson: 100000,
  maxStudents: 20
});
```

### Enrolling a student with discount
```javascript
const enrollment = new Enrollment({
  studentId: studentId,
  classId: classId,
  discountPercent: 10,
  discountReason: "Returning student"
});
```

### Recording attendance
```javascript
const attendance = new Attendance({
  classId: classId,
  date: new Date(),
  lessonNumber: 5,
  teacherId: teacherId,
  students: [
    { studentId: student1Id, status: 'present' },
    { studentId: student2Id, status: 'absent', note: 'Sick' }
  ]
});
```
