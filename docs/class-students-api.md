# API Documentation: Lấy danh sách học sinh của lớp

## 1. Lấy danh sách học sinh cơ bản

### **GET** `/api/v1/classes/:classId/students`

Lấy danh sách học sinh của một lớp với thông tin cơ bản và phân trang.

#### **Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

#### **Query Parameters:**
- `page` (optional): Trang hiện tại (default: 1)
- `limit` (optional): Số học sinh mỗi trang (default: 10)
- `sortBy` (optional): Sắp xếp theo trường (ví dụ: `createdAt:desc`)

#### **Response:**
```json
{
  "message": "Class students retrieved successfully",
  "data": {
    "class": {
      "id": "64f1b2b3c4d5e6f7a8b9c0d1",
      "name": "Lớp 3A",
      "grade": "3",
      "section": "A",
      "year": 2025,
      "maxStudents": 25,
      "currentStudents": 15,
      "teacher": "64f1b2b3c4d5e6f7a8b9c0d2"
    },
    "students": [
      {
        "id": "64f1b2b3c4d5e6f7a8b9c0d3",
        "name": "Nguyễn Văn A",
        "email": "nguyenvana@example.com",
        "phone": "0123456789",
        "parentName": "Nguyễn Văn B",
        "parentPhone": "0987654321",
        "enrollmentDate": "2025-01-15T00:00:00.000Z",
        "discountPercent": 10,
        "status": "active",
        "dateOfBirth": "2015-05-20T00:00:00.000Z",
        "address": "Hà Nội"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalPages": 2,
      "totalResults": 15
    }
  }
}
```

---

## 2. Lấy danh sách học sinh chi tiết

### **GET** `/api/v1/classes/:classId/students/detailed`

Lấy danh sách học sinh với thông tin chi tiết bao gồm thống kê điểm danh và thanh toán.

#### **Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

#### **Response:**
```json
{
  "message": "Class students detailed info retrieved successfully",
  "data": {
    "class": {
      "id": "64f1b2b3c4d5e6f7a8b9c0d1",
      "name": "Lớp 3A",
      "grade": "3",
      "section": "A",
      "year": 2025,
      "maxStudents": 25,
      "currentStudents": 15
    },
    "students": [
      {
        "id": "64f1b2b3c4d5e6f7a8b9c0d3",
        "name": "Nguyễn Văn A",
        "email": "nguyenvana@example.com",
        "phone": "0123456789",
        "dateOfBirth": "2015-05-20T00:00:00.000Z",
        "address": "Hà Nội",
        "parent": {
          "name": "Nguyễn Văn B",
          "phone": "0987654321"
        },
        "enrollment": {
          "date": "2025-01-15T00:00:00.000Z",
          "discountPercent": 10,
          "status": "active"
        },
        "attendance": {
          "totalClasses": 20,
          "presentClasses": 18,
          "absentClasses": 2,
          "attendanceRate": 90
        },
        "payment": {
          "totalPayments": 6,
          "paidPayments": 5,
          "pendingPayments": 1,
          "paymentRate": 83.33
        }
      }
    ],
    "summary": {
      "totalStudents": 15,
      "averageAttendanceRate": 85.5,
      "averagePaymentRate": 78.2
    }
  }
}
```

---

## 3. Ví dụ sử dụng với JavaScript

### **Lấy danh sách học sinh cơ bản:**
```javascript
const getClassStudents = async (classId, page = 1, limit = 10) => {
  try {
    const response = await fetch(`/api/v1/classes/${classId}/students?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('Students:', data.data.students);
    console.log('Pagination:', data.data.pagination);
    
    return data;
  } catch (error) {
    console.error('Error fetching students:', error);
  }
};

// Usage
getClassStudents('64f1b2b3c4d5e6f7a8b9c0d1', 1, 15);
```

### **Lấy thông tin chi tiết:**
```javascript
const getClassStudentsDetailed = async (classId) => {
  try {
    const response = await fetch(`/api/v1/classes/${classId}/students/detailed`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('Class summary:', data.data.summary);
    console.log('Students with stats:', data.data.students);
    
    return data;
  } catch (error) {
    console.error('Error fetching detailed students:', error);
  }
};

// Usage
getClassStudentsDetailed('64f1b2b3c4d5e6f7a8b9c0d1');
```

---

## 4. Curl Examples

### **Lấy danh sách cơ bản:**
```bash
curl -X GET "http://localhost:3000/api/v1/classes/64f1b2b3c4d5e6f7a8b9c0d1/students?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### **Lấy thông tin chi tiết:**
```bash
curl -X GET "http://localhost:3000/api/v1/classes/64f1b2b3c4d5e6f7a8b9c0d1/students/detailed" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

---

## 5. Error Responses

### **Class not found:**
```json
{
  "code": 404,
  "message": "Class not found"
}
```

### **Invalid class ID:**
```json
{
  "code": 400,
  "message": "\"classId\" must be a valid mongo id"
}
```

### **Unauthorized:**
```json
{
  "code": 401,
  "message": "Please authenticate"
}
```

### **Insufficient permissions:**
```json
{
  "code": 403,
  "message": "Forbidden"
}
```

---

## 6. Notes

1. **Permissions**: Cần quyền `getClasses` để access các API này
2. **Pagination**: API cơ bản hỗ trợ phân trang, API chi tiết trả về tất cả học sinh
3. **Performance**: API chi tiết tốn nhiều tài nguyên hơn do tính toán thống kê
4. **Data**: Chỉ hiển thị học sinh có status `active` trong lớp
5. **Populated fields**: Tự động populate thông tin user và parent
