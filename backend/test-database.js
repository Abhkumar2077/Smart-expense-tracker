// backend/test-database.js
const db = require('./config/db');
const Expense = require('./models/Expense');

async function testDatabase() {
    try {
        console.log('🔍 Testing database connection...');
        
        // Test 1: Check if we can connect
        const [result] = await db.execute('SELECT 1 + 1 as solution');
        console.log('✅ Database connected:', result[0].solution === 2);
        
        // Test 2: Check if expenses table exists
        const [tables] = await db.execute('SHOW TABLES');
        console.log('📊 Tables in database:', tables.map(t => Object.values(t)[0]));
        
        // Test 3: Check expenses table structure
        const [columns] = await db.execute('DESCRIBE expenses');
        console.log('📋 Expenses table columns:', columns.map(c => c.Field));
        
        // Test 4: Check if type column exists
        const typeColumn = columns.find(c => c.Field === 'type');
        if (typeColumn) {
            console.log('✅ type column exists:', typeColumn);
        } else {
            console.log('❌ type column missing! Run: ALTER TABLE expenses ADD COLUMN type ENUM("income", "expense") DEFAULT "expense";');
        }
        
        // Test 5: Get a user ID to test with
        const [users] = await db.execute('SELECT id FROM users LIMIT 1');
        if (users.length > 0) {
            const userId = users[0].id;
            console.log('👤 Found user ID:', userId);
            
            // Test 6: Try to insert a test expense
            try {
                const testExpense = {
                    user_id: userId,
                    category_id: 1, // Assuming category 1 exists
                    amount: 100,
                    description: 'Test transaction',
                    date: new Date().toISOString().split('T')[0],
                    type: 'expense'
                };
                
                const id = await Expense.create(testExpense);
                console.log('✅ Test expense created with ID:', id);
                
                // Test 7: Retrieve it
                const saved = await Expense.findById(id, userId);
                console.log('✅ Retrieved test expense:', saved);
                
            } catch (error) {
                console.error('❌ Failed to create test expense:', error.message);
            }
        } else {
            console.log('❌ No users found in database');
        }
        
    } catch (error) {
        console.error('❌ Database test failed:', error);
    }
}

testDatabase();