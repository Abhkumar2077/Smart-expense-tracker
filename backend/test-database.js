// backend/test-database.js
const db = require('./config/db');
const Expense = require('./models/Expense');

async function testDatabase() {
    try {
        
        // Test 1: Check if we can connect
        const [result] = await db.execute('SELECT 1 + 1 as solution');
        
        // Test 2: Check if expenses table exists
        const [tables] = await db.execute('SHOW TABLES');
        
        // Test 3: Check expenses table structure
        const [columns] = await db.execute('DESCRIBE expenses');
        
        // Test 4: Check if type column exists
        const typeColumn = columns.find(c => c.Field === 'type');
        if (typeColumn) {
        } else {
        }
        
        // Test 5: Get a user ID to test with
        const [users] = await db.execute('SELECT id FROM users LIMIT 1');
        if (users.length > 0) {
            const userId = users[0].id;
            
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
                
                // Test 7: Retrieve it
                const saved = await Expense.findById(id, userId);
                
            } catch (error) {
                console.error('❌ Failed to create test expense:', error.message);
            }
        } else {
        }
        
    } catch (error) {
        console.error('❌ Database test failed:', error);
    }
}

testDatabase();
