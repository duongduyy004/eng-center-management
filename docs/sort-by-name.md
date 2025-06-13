# Sort By Name Documentation (Sắp xếp theo tên cuối - Không phân biệt hoa thường)

## Cách sử dụng sortBy name với Student API

### **Lưu ý quan trọng:**
Hệ thống sắp xếp theo **tên cuối** (tên gọi) và **không phân biệt hoa thường**:
- "Dương Thế Duy" → sắp xếp theo "duy"
- "Nguyễn Văn AN" → sắp xếp theo "an"  
- "Trần Thị BÌNH" → sắp xếp theo "bình"
- "Phạm Hoàng đức" → sắp xếp theo "đức"

**Thứ tự sắp xếp:** an → bình → đức → duy (không phân biệt hoa/thường)

### **GET** `/api/v1/students`

#### **Query Parameters cho sorting:**

1. **Sort tăng dần theo tên:**
   ```
   ?sortBy=name:asc
   ```

2. **Sort giảm dần theo tên:**
   ```
   ?sortBy=name:desc
   ```

3. **Kết hợp với các options khác:**
   ```
   ?sortBy=name:asc&page=1&limit=10&name=nguyen
   ```

### **Examples:**

#### **1. Sort tăng dần theo tên:**
```bash
curl -X GET "http://localhost:3000/api/v1/students?sortBy=name:asc" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### **2. Sort giảm dần theo tên:**
```bash
curl -X GET "http://localhost:3000/api/v1/students?sortBy=name:desc" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### **3. Sort theo tên + search + pagination:**
```bash
curl -X GET "http://localhost:3000/api/v1/students?sortBy=name:asc&name=nguyen&page=1&limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### **JavaScript Examples:**

```javascript
// Sort students by name ascending
const getStudentsSortedByName = async (order = 'asc') => {
  try {
    const response = await fetch(`/api/v1/students?sortBy=name:${order}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('Students sorted by name:', data.results);
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
};

// Usage
getStudentsSortedByName('asc');  // A -> Z
getStudentsSortedByName('desc'); // Z -> A
```

### **Kết hợp với search và pagination:**

```javascript
const searchAndSortStudents = async (searchName, sortOrder = 'asc', page = 1, limit = 10) => {
  const params = new URLSearchParams({
    sortBy: `name:${sortOrder}`,
    page: page.toString(),
    limit: limit.toString()
  });
  
  if (searchName) {
    params.append('name', searchName);
  }
  
  try {
    const response = await fetch(`/api/v1/students?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
};

// Usage
searchAndSortStudents('nguyen', 'asc', 1, 10);
```

### **Response Example (sắp xếp theo tên cuối, không phân biệt hoa thường):**

```json
{
  "results": [
    {
      "_id": "64f1b2b3c4d5e6f7a8b9c0d1",
      "userId": {
        "_id": "64f1b2b3c4d5e6f7a8b9c0d2",
        "name": "Nguyễn Văn AN",
        "email": "nguyenvanan@example.com"
      }
    },
    {
      "_id": "64f1b2b3c4d5e6f7a8b9c0d4", 
      "userId": {
        "_id": "64f1b2b3c4d5e6f7a8b9c0d5",
        "name": "Trần Thị bình", 
        "email": "tranthibinh@example.com"
      }
    },
    {
      "_id": "64f1b2b3c4d5e6f7a8b9c0d7",
      "userId": {
        "_id": "64f1b2b3c4d5e6f7a8b9c0d8", 
        "name": "Dương Thế DUY",
        "email": "duongtheduy@example.com"
      }
    }
  ]
}
```

**Thứ tự sắp xếp:** AN → bình → DUY (không phân biệt hoa thường, chỉ xét tên cuối)
```

### **Other Sort Options:**

Ngoài sort by name, bạn cũng có thể sort theo:

```bash
# Sort by creation date
?sortBy=createdAt:desc

# Sort by email (if populated)
?sortBy=email:asc

# Multiple sort criteria
?sortBy=name:asc,createdAt:desc
```

### **Technical Implementation:**

Hệ thống sử dụng MongoDB Aggregation Pipeline để sort theo tên cuối (không phân biệt hoa thường):

```javascript
{
  $addFields: {
    'lastName': {
      $trim: {
        input: {
          $arrayElemAt: [
            { $split: ['$userId.name', ' '] },
            -1  // Lấy phần tử cuối cùng (tên gọi)
          ]
        }
      }
    },
    'lastNameLower': {
      $toLower: {
        $trim: {
          input: {
            $arrayElemAt: [
              { $split: ['$userId.name', ' '] },
              -1
            ]
          }
        }
      }
    }
  }
},
{ $sort: { 'lastNameLower': 1 } }  // Sort theo tên cuối (lowercase)
```

**Các bước:**
1. **$lookup**: Join với collection `users`
2. **$unwind**: Flatten user data  
3. **$addFields**: Tạo field `lastName` (lowercase) để sort
4. **$split**: Chia tên theo dấu cách
5. **$arrayElemAt(-1)**: Lấy từ cuối cùng
6. **$toLower**: Chuyển về lowercase (không phân biệt hoa thường)
7. **$sort**: Sort theo `lastName`
8. **$skip & $limit**: Pagination
9. **$project**: Loại bỏ các fields không cần thiết:
   - `lastName` (chỉ dùng để sort)
   - `createdAt` (metadata)
   - `updatedAt` (metadata)  
   - `__v` (version field)

**Ví dụ tách tên (case-insensitive):**
- "Dương Thế DUY" → sort by "duy" (nhưng không hiển thị field này)
- "Nguyễn Văn an" → sort by "an"
- "Trần Thị BÌNH" → sort by "bình"

**Kết quả sắp xếp:** an → bình → duy (không phân biệt hoa thường)
- "Nguyễn Văn an" → lastName: "an", lastNameLower: "an"  
- "Trần BÌNH" → lastName: "BÌNH", lastNameLower: "bình"

**Kết quả sắp xếp:** an → bình → duy (theo lastNameLower)

### **Performance Notes:**

- Sort by populated field (name) sẽ chậm hơn sort by direct field
- Nên tạo index cho `userId.name` nếu sort thường xuyên
- Kết hợp search + sort có thể impact performance với large data

### **Error Handling:**

```json
// Invalid sort field
{
  "code": 400,
  "message": "Invalid sort field"
}

// Missing authentication
{
  "code": 401,
  "message": "Please authenticate"
}
```
