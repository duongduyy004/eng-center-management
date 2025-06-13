/**
 * Test script for Last Name Sorting (Case-Insensitive)
 * Demo việc sắp xếp theo tên cuối (tên gọi) - không phân biệt hoa thường
 */

const testNames = [
    "Dương Thế DUY",
    "Nguyễn Văn AN",
    "Trần Thị bình",
    "Lê Minh CHÂU",
    "Phạm Hoàng đức",
    "Võ Thị Em",
    "Hoàng Văn phúc",
    "Đinh Thị GIANG",
    "Bùi Minh hiếu",
    "Đặng Thị lan"
];

/**
 * Extract last name from full name
 * @param {string} fullName 
 * @returns {string}
 */
const extractLastName = (fullName) => {
    const parts = fullName.trim().split(' ');
    return parts[parts.length - 1];
};

/**
 * Sort names by last name (case-insensitive)
 * @param {string[]} names 
 * @param {string} order - 'asc' or 'desc'
 * @returns {Object[]}
 */
const sortByLastName = (names, order = 'asc') => {
    const namesWithLastName = names.map(name => ({
        fullName: name,
        lastName: extractLastName(name),
        lastNameLower: extractLastName(name).toLowerCase()
    }));

    namesWithLastName.sort((a, b) => {
        if (order === 'desc') {
            return b.lastNameLower.localeCompare(a.lastNameLower, 'vi');
        }
        return a.lastNameLower.localeCompare(b.lastNameLower, 'vi');
    });

    return namesWithLastName;
};

// Demo sorting
console.log('=== DEMO: Sắp xếp theo tên cuối (Không phân biệt hoa thường) ===\n');

console.log('📝 Danh sách tên ban đầu (mixed case):');
testNames.forEach((name, index) => {
    const lastName = extractLastName(name);
    console.log(`${index + 1}. ${name} → tên cuối: "${lastName}" → lowercase: "${lastName.toLowerCase()}"`);
});

console.log('\n🔤 Sắp xếp tăng dần (A-Z, case-insensitive):');
const sortedAsc = sortByLastName(testNames, 'asc');
sortedAsc.forEach((item, index) => {
    console.log(`${index + 1}. ${item.fullName} (${item.lastName} → ${item.lastNameLower})`);
});

console.log('\n🔤 Sắp xếp giảm dần (Z-A, case-insensitive):');
const sortedDesc = sortByLastName(testNames, 'desc');
sortedDesc.forEach((item, index) => {
    console.log(`${index + 1}. ${item.fullName} (${item.lastName} → ${item.lastNameLower})`);
});

console.log('\n=== API Usage Examples ===\n');

const apiExamples = [
    {
        description: 'Sắp xếp tăng dần theo tên cuối',
        url: 'GET /api/v1/students?sortBy=name:asc',
        result: 'An → Bình → Châu → Đức → Em → ...'
    },
    {
        description: 'Sắp xếp giảm dần theo tên cuối',
        url: 'GET /api/v1/students?sortBy=name:desc',
        result: 'Phúc → Lan → Hiếu → Giang → Em → ...'
    },
    {
        description: 'Kết hợp search + sort',
        url: 'GET /api/v1/students?sortBy=name:asc&name=Thị',
        result: 'Chỉ hiển thị học sinh có "Thị" trong tên, sắp xếp theo tên cuối'
    }
];

apiExamples.forEach((example, index) => {
    console.log(`${index + 1}. ${example.description}`);
    console.log(`   ${example.url}`);
    console.log(`   Kết quả: ${example.result}\n`);
});

console.log('=== MongoDB Aggregation Pipeline ===\n');

const aggregationPipeline = {
    title: 'Pipeline sử dụng trong paginate plugin:',
    stages: [
        {
            stage: '$match',
            purpose: 'Filter theo điều kiện'
        },
        {
            stage: '$lookup',
            purpose: 'Join với collection users'
        },
        {
            stage: '$unwind',
            purpose: 'Flatten user data'
        },
        {
            stage: '$addFields',
            purpose: 'Tạo field lastName từ full name',
            code: `{
  lastName: {
    $trim: {
      input: {
        $arrayElemAt: [
          { $split: ['$userId.name', ' '] },
          -1
        ]
      }
    }
  }
}`
        },
        {
            stage: '$sort',
            purpose: 'Sort theo lastName'
        },
        {
            stage: '$skip + $limit',
            purpose: 'Pagination'
        }
    ]
};

console.log(aggregationPipeline.title);
aggregationPipeline.stages.forEach((stage, index) => {
    console.log(`${index + 1}. ${stage.stage}: ${stage.purpose}`);
    if (stage.code) {
        console.log(`   Code: ${stage.code}`);
    }
});

module.exports = {
    extractLastName,
    sortByLastName,
    testNames
};

// Run demo if executed directly
if (require.main === module) {
    console.log('\n✅ Demo completed! Chức năng sắp xếp theo tên cuối đã ready.');
}
