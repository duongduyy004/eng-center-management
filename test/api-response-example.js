/**
 * Example API Response - lastName field removed
 * Demo kết quả API không chứa field lastName
 */

const exampleResponse = {
    "message": "Students retrieved successfully",
    "results": [
        {
            "_id": "64f1b2b3c4d5e6f7a8b9c0d1",
            "userId": {
                "_id": "64f1b2b3c4d5e6f7a8b9c0d2",
                "name": "Nguyễn Văn an",
                "email": "nguyenvanan@example.com",
                "phone": "0123456789"
            },
            "dateOfBirth": "2015-05-20T00:00:00.000Z",
            "address": "Hà Nội", "parentId": "64f1b2b3c4d5e6f7a8b9c0d3",
            "classes": []
            // ✅ Removed: lastName, createdAt, updatedAt, __v
        },
        {
            "_id": "64f1b2b3c4d5e6f7a8b9c0d4",
            "userId": {
                "_id": "64f1b2b3c4d5e6f7a8b9c0d5",
                "name": "Trần Thị BÌNH",
                "email": "tranthibinh@example.com",
                "phone": "0987654321"
            },
            "dateOfBirth": "2014-08-15T00:00:00.000Z",
            "address": "TP.HCM",
            "parentId": "64f1b2b3c4d5e6f7a8b9c0d6",
            "classes": []
            // ✅ Không có field lastName
        },
        {
            "_id": "64f1b2b3c4d5e6f7a8b9c0d7",
            "userId": {
                "_id": "64f1b2b3c4d5e6f7a8b9c0d8",
                "name": "Dương Thế DUY",
                "email": "duongtheduy@example.com",
                "phone": "0901234567"
            },
            "dateOfBirth": "2016-02-10T00:00:00.000Z",
            "address": "Đà Nẵng",
            "parentId": "64f1b2b3c4d5e6f7a8b9c0d9",
            "classes": []
            // ✅ Không có field lastName
        }
    ],
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "totalResults": 3
};

/**
 * Sort order explanation:
 * 
 * 1. "Nguyễn Văn an" → lastName extracted: "an" → sorted first
 * 2. "Trần Thị BÌNH" → lastName extracted: "bình" → sorted second  
 * 3. "Dương Thế DUY" → lastName extracted: "duy" → sorted third
 * 
 * Case-insensitive: an → bình → duy (tất cả lowercase để sort)
 * Field lastName được dùng để sort nhưng KHÔNG hiển thị trong response
 */

const sortingProcess = {
    step1: "Extract lastName từ userId.name",
    step2: "Convert lastName thành lowercase",
    step3: "Sort theo lastName (lowercase)",
    step4: "Apply pagination",
    step5: "Remove lastName field từ response",
    step6: "Return clean response without internal sort field"
};

console.log('=== API Response Example ===');
console.log('✅ Fields removed: lastName, createdAt, updatedAt, __v');
console.log('✅ Sort theo tên cuối không phân biệt hoa thường');
console.log('✅ Response sạch, chỉ chứa essential data');

console.log('\n📋 Sorting Process:');
Object.entries(sortingProcess).forEach(([step, description]) => {
    console.log(`${step}: ${description}`);
});

console.log('\n📊 Sort Order:');
console.log('1. "an" (từ "Nguyễn Văn an")');
console.log('2. "bình" (từ "Trần Thị BÌNH")');
console.log('3. "duy" (từ "Dương Thế DUY")');

module.exports = {
    exampleResponse,
    sortingProcess
};
