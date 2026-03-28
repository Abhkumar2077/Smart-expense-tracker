// backend/models/Category.js
const db = require('../config/db');

class Category {
    // ============================================
    // 1. GET ALL CATEGORIES FOR A USER
    // ============================================
    static async getAll(userId = null) {
        try {
            console.log(`Category.getAll called for user: ${userId}`);
            
            let query;
            let params = [];
            
            // First, check if user_id column exists (for backward compatibility)
            const [columns] = await db.execute('SHOW COLUMNS FROM categories');
            const hasUserId = columns.some(col => col.Field === 'user_id');
            const hasUsageCount = columns.some(col => col.Field === 'usage_count');
            
            if (hasUserId && userId) {
                // New structure with user_id - get system categories + user's custom categories
                query = 'SELECT * FROM categories WHERE is_default = TRUE OR user_id = ?';
                params = [userId];
            } else {
                // Old structure without user_id - just get all categories
                query = 'SELECT * FROM categories';
            }
            
            query += ' ORDER BY is_default DESC, name ASC';
            
            console.log('Query:', query);
            console.log('Params:', params);
            
            const [rows] = await db.execute(query, params);
            
            // Add default values for missing columns
            const categories = rows.map(row => ({
                id: row.id,
                name: row.name,
                color: row.color || '#808080',
                icon: row.icon || '\uD83D\uDCCC',
                is_default: row.is_default === 1 || row.is_default === true,
                user_id: row.user_id || null,
                usage_count: hasUsageCount ? (row.usage_count || 0) : 0,
                last_used: row.last_used || null,
                created_at: row.created_at
            }));
            
            console.log(`Found ${categories.length} categories`);
            return categories;
            
        } catch (error) {
            console.error('Error in getAll:', error);
            throw error;
        }
    }

    // ============================================
    // 2. GET ONLY USER'S CUSTOM CATEGORIES
    // ============================================
    static async getUserCategories(userId) {
        try {
            console.log(`Getting custom categories for user: ${userId}`);
            
            // Check if user_id column exists
            const [columns] = await db.execute('SHOW COLUMNS FROM categories');
            const hasUserId = columns.some(col => col.Field === 'user_id');
            
            if (!hasUserId) {
                console.log('user_id column does not exist, returning empty array');
                return [];
            }
            
            const [rows] = await db.execute(
                'SELECT * FROM categories WHERE user_id = ? AND is_default = FALSE ORDER BY name',
                [userId]
            );
            
            const categories = rows.map(row => ({
                id: row.id,
                name: row.name,
                color: row.color || '#808080',
                icon: row.icon || '\uD83D\uDCCC',
                is_default: false,
                user_id: row.user_id,
                usage_count: row.usage_count || 0,
                last_used: row.last_used,
                created_at: row.created_at
            }));
            
            console.log(`Found ${categories.length} custom categories`);
            return categories;
            
        } catch (error) {
            console.error('Error in getUserCategories:', error);
            return [];
        }
    }

    // ============================================
    // 3. CREATE CUSTOM CATEGORY
    // ============================================
    static async create(categoryData) {
        try {
            const { user_id, name, color = '#808080', icon = '\uD83D\uDCCC' } = categoryData;
            
            console.log(`Creating category "${name}" for user ${user_id}`);
            
            // Validate input
            if (!name || name.trim() === '') {
                throw new Error('Category name is required');
            }
            
            if (!user_id) {
                throw new Error('User ID is required');
            }
            
            // Check if user_id column exists
            const [columns] = await db.execute('SHOW COLUMNS FROM categories');
            const hasUserId = columns.some(col => col.Field === 'user_id');
            
            if (!hasUserId) {
                throw new Error('Database migration required: user_id column does not exist');
            }
            
            // Check if category already exists for this user
            const [existing] = await db.execute(
                'SELECT id FROM categories WHERE user_id = ? AND name = ?',
                [user_id, name.trim()]
            );
            
            if (existing.length > 0) {
                throw new Error('Category already exists');
            }
            
            // Insert new category
            const [result] = await db.execute(
                'INSERT INTO categories (user_id, name, color, icon, is_default) VALUES (?, ?, ?, ?, FALSE)',
                [user_id, name.trim(), color, icon]
            );
            
            console.log(`Category created with ID: ${result.insertId}`);
            
            // Return the created category
            return {
                id: result.insertId,
                name: name.trim(),
                color: color,
                icon: icon,
                is_default: false,
                user_id: user_id,
                usage_count: 0,
                last_used: null
            };
            
        } catch (error) {
            console.error('Error in create:', error);
            throw error;
        }
    }

    // ============================================
    // 4. UPDATE CATEGORY
    // ============================================
    static async update(id, userId, categoryData) {
        try {
            const { name, color, icon } = categoryData;
            
            console.log(`Updating category ${id} for user ${userId}`);
            
            // Validate input
            if (!name || name.trim() === '') {
                throw new Error('Category name is required');
            }
            
            // Check if category exists and belongs to user
            const [existing] = await db.execute(
                'SELECT * FROM categories WHERE id = ? AND user_id = ? AND is_default = FALSE',
                [id, userId]
            );
            
            if (existing.length === 0) {
                throw new Error('Category not found or cannot be modified');
            }
            
            // Check if new name conflicts with existing category
            const [nameConflict] = await db.execute(
                'SELECT id FROM categories WHERE user_id = ? AND name = ? AND id != ?',
                [userId, name.trim(), id]
            );
            
            if (nameConflict.length > 0) {
                throw new Error('Another category with this name already exists');
            }
            
            // Update category
            const [result] = await db.execute(
                'UPDATE categories SET name = ?, color = ?, icon = ? WHERE id = ? AND user_id = ? AND is_default = FALSE',
                [name.trim(), color, icon, id, userId]
            );
            
            console.log(`Category updated: ${result.affectedRows > 0}`);
            
            // Return updated category
            return {
                id: parseInt(id),
                name: name.trim(),
                color: color,
                is_default: false,
                user_id: userId
            };
            
        } catch (error) {
            console.error('Error in update:', error);
            throw error;
        }
    }

    // ============================================
    // 5. DELETE CUSTOM CATEGORY
    // ============================================
    static async delete(id, userId) {
        try {
            console.log(`Deleting category ${id} for user ${userId}`);
            
            // Check if category exists and belongs to user
            const [category] = await db.execute(
                'SELECT * FROM categories WHERE id = ? AND user_id = ? AND is_default = FALSE',
                [id, userId]
            );
            
            if (category.length === 0) {
                throw new Error('Category not found or cannot be deleted');
            }
            
            // Check if category is being used by any expenses
            const [usage] = await db.execute(
                'SELECT COUNT(*) as count FROM expenses WHERE category_id = ?',
                [id]
            );
            
            if (usage[0].count > 0) {
                throw new Error('Cannot delete category that has transactions');
            }
            
            // Delete category
            const [result] = await db.execute(
                'DELETE FROM categories WHERE id = ? AND user_id = ? AND is_default = FALSE',
                [id, userId]
            );
            
            console.log(`Category deleted: ${result.affectedRows > 0}`);
            return result.affectedRows > 0;
            
        } catch (error) {
            console.error('Error in delete:', error);
            throw error;
        }
    }

    // ============================================
    // 6. INCREMENT CATEGORY USAGE COUNT
    // ============================================
    static async incrementUsage(categoryId) {
        try {
            // Check if usage_count column exists
            const [columns] = await db.execute('SHOW COLUMNS FROM categories');
            const hasUsageCount = columns.some(col => col.Field === 'usage_count');
            const hasLastUsed = columns.some(col => col.Field === 'last_used');
            
            if (!hasUsageCount || !hasLastUsed) {
                // Columns don't exist, skip
                return;
            }
            
            await db.execute(
                'UPDATE categories SET usage_count = usage_count + 1, last_used = CURDATE() WHERE id = ?',
                [categoryId]
            );
            console.log(`Incremented usage for category ${categoryId}`);
            
        } catch (error) {
            console.error('Error in incrementUsage:', error);
            // Don't throw - this is not critical
        }
    }

    // ============================================
    // 7. GET CATEGORY SUGGESTIONS FROM UNCATEGORIZED TRANSACTIONS
    // ============================================
    static async getSuggestions(userId) {
        try {
            console.log(`Getting suggestions for user ${userId}`);
            
            const [suggestions] = await db.execute(`
                SELECT 
                    UPPER(SUBSTRING_INDEX(description, ' ', 1)) as suggested_name,
                    COUNT(*) as frequency,
                    AVG(amount) as avg_amount
                FROM expenses 
                WHERE user_id = ? 
                    AND category_id = 10
                    AND description IS NOT NULL 
                    AND description != ''
                GROUP BY suggested_name
                HAVING frequency >= 2
                ORDER BY frequency DESC, avg_amount DESC
                LIMIT 10
            `, [userId]);
            
            console.log(`✅ Found ${suggestions.length} suggestions`);
            return suggestions;
            
        } catch (error) {
            console.error('❌ Error in getSuggestions:', error);
            return [];
        }
    }

    // ============================================
    // 8. GET POPULAR CATEGORIES FROM OTHER USERS
    // ============================================
    static async getPopularCategories() {
        try {
            console.log('Getting popular categories');
            
            // Check if required columns exist
            const [columns] = await db.execute('SHOW COLUMNS FROM categories');
            const hasUserId = columns.some(col => col.Field === 'user_id');
            const hasUsageCount = columns.some(col => col.Field === 'usage_count');
            
            if (!hasUserId || !hasUsageCount) {
                console.log('Required columns missing for popular categories');
                return [];
            }
            
            const [popular] = await db.execute(`
                SELECT 
                    name,
                    color,
                    COUNT(*) as user_count,
                    AVG(usage_count) as avg_usage
                FROM categories 
                WHERE is_default = FALSE
                GROUP BY name, color
                HAVING user_count > 1
                ORDER BY avg_usage DESC
                LIMIT 5
            `);
            
            console.log(`✅ Found ${popular.length} popular categories`);
            return popular;
            
        } catch (error) {
            console.error('❌ Error in getPopularCategories:', error);
            return [];
        }
    }

    // ============================================
    // 9. GET CATEGORY BY ID
    // ============================================
    static async findById(id) {
        try {
            const [rows] = await db.execute('SELECT * FROM categories WHERE id = ?', [id]);
            
            if (rows.length === 0) {
                return null;
            }
            
            const row = rows[0];
            return {
                id: row.id,
                name: row.name,
                color: row.color || '#808080',
                is_default: row.is_default === 1 || row.is_default === true,
                user_id: row.user_id || null,
                usage_count: row.usage_count || 0,
                last_used: row.last_used,
                created_at: row.created_at
            };
            
        } catch (error) {
            console.error('❌ Error in findById:', error);
            throw error;
        }
    }

    // ============================================
    // 10. GET DEFAULT CATEGORY ID FOR INCOME/EXPENSE
    // ============================================
    static async getDefaultCategoryId(type = 'expense') {
        try {
            if (type === 'income') {
                const [rows] = await db.execute(
                    'SELECT id FROM categories WHERE name = "Income" LIMIT 1'
                );
                return rows.length > 0 ? rows[0].id : 10;
            } else {
                const [rows] = await db.execute(
                    'SELECT id FROM categories WHERE name = "Other" LIMIT 1'
                );
                return rows.length > 0 ? rows[0].id : 10;
            }
        } catch (error) {
            console.error('❌ Error in getDefaultCategoryId:', error);
            return 10; // Fallback to ID 10 (Other)
        }
    }

    // ============================================
    // 11. INITIALIZE DEFAULT CATEGORIES
    // ============================================
    static async initializeDefaults() {
        try {
            console.log('Initializing default categories...');
            
            const defaultCategories = [
                { name: 'Food & Dining', color: '#FF6B6B' },
                { name: 'Transportation', color: '#4ECDC4' },
                { name: 'Shopping', color: '#45B7D1' },
                { name: 'Entertainment', color: '#96CEB4' },
                { name: 'Bills & Utilities', color: '#FFEAA7' },
                { name: 'Healthcare', color: '#DDA0DD' },
                { name: 'Education', color: '#98D8C8' },
                { name: 'Groceries', color: '#FF9F1C' },
                { name: 'Travel', color: '#A06AB4' },
                { name: 'Income', color: '#48C774' },
                { name: 'Other', color: '#B0B0B0' }
            ];
            
            let inserted = 0;
            let existing = 0;
            
            for (const cat of defaultCategories) {
                // Check if category already exists
                const [exists] = await db.execute(
                    'SELECT id FROM categories WHERE name = ? AND is_default = TRUE',
                    [cat.name]
                );
                
                if (exists.length === 0) {
                    await db.execute(
                        'INSERT INTO categories (name, color, is_default) VALUES (?, ?, TRUE)',
                        [cat.name, cat.color]
                    );
                    inserted++;
                    console.log(`✅ Inserted: ${cat.name}`);
                } else {
                    existing++;
                }
            }
            
            console.log(`📊 Default categories: ${inserted} inserted, ${existing} existing`);
            return { inserted, existing };
            
        } catch (error) {
            console.error('❌ Error initializing defaults:', error);
            throw error;
        }
    }

    // ============================================
    // 12. CHECK IF DATABASE MIGRATION IS NEEDED
    // ============================================
    static async checkMigrationNeeded() {
        try {
            const [columns] = await db.execute('SHOW COLUMNS FROM categories');
            const hasUserId = columns.some(col => col.Field === 'user_id');
            const hasUsageCount = columns.some(col => col.Field === 'usage_count');
            const hasLastUsed = columns.some(col => col.Field === 'last_used');
            
            return {
                user_id: !hasUserId,
                usage_count: !hasUsageCount,
                last_used: !hasLastUsed,
                all_needed: !(hasUserId && hasUsageCount && hasLastUsed)
            };
            
        } catch (error) {
            console.error('❌ Error checking migration:', error);
            return { all_needed: false, error: error.message };
        }
    }

    // ============================================
    // 13. RUN MIGRATION TO ADD MISSING COLUMNS
    // ============================================
    static async runMigration() {
        try {
            console.log('Running category table migration...');
            
            const migrationNeeded = await this.checkMigrationNeeded();
            
            if (migrationNeeded.user_id) {
                await db.execute('ALTER TABLE categories ADD COLUMN user_id INT NULL AFTER id');
                console.log('Added user_id column');
            }
            
            if (migrationNeeded.usage_count) {
                await db.execute('ALTER TABLE categories ADD COLUMN usage_count INT DEFAULT 0 AFTER color');
                console.log('Added usage_count column');
            }
            
            if (migrationNeeded.last_used) {
                await db.execute('ALTER TABLE categories ADD COLUMN last_used DATE NULL AFTER usage_count');
                console.log('Added last_used column');
            }
            
            // Add foreign key if user_id column was added
            if (migrationNeeded.user_id) {
                try {
                    // Check if foreign key already exists
                    const [fkExists] = await db.execute(`
                        SELECT CONSTRAINT_NAME 
                        FROM information_schema.TABLE_CONSTRAINTS 
                        WHERE CONSTRAINT_SCHEMA = DATABASE() 
                        AND TABLE_NAME = 'categories' 
                        AND CONSTRAINT_TYPE = 'FOREIGN KEY'
                    `);
                    
                    if (fkExists.length === 0) {
                        await db.execute(
                            'ALTER TABLE categories ADD CONSTRAINT fk_categories_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE'
                        );
                        console.log('Added foreign key constraint');
                    } else {
                        console.log('Foreign key already exists');
                    }
                } catch (fkError) {
                    console.log('Could not add foreign key:', fkError.message);
                }
            }
            
            // Update system categories to have NULL user_id
            await db.execute('UPDATE categories SET user_id = NULL WHERE is_default = TRUE');
            
            console.log('Migration completed successfully');
            return { success: true };
            
        } catch (error) {
            console.error('❌ Migration failed:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = Category;