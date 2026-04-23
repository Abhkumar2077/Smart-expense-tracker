// backend/services/csvService.js
const moment = require('moment');
const Expense = require('../models/Expense');
const Category = require('../models/Category');

class CSVService {
    // ============================================
    // 1. MAIN CSV PROCESSING
    // ============================================
    static async processCSV(fileBuffer, userId) {
        try {
            
            // Convert buffer to string
            const content = fileBuffer.toString();
            
            // Split lines and clean
            const lines = content.split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0);
            
            
            if (lines.length < 2) {
                throw new Error('CSV file must have headers and at least one data row');
            }

            // Parse headers - remove BOM if present
            let headers = lines[0].replace(/^\uFEFF/, '').split(',').map(h => 
                h.trim().replace(/^["']|["']$/g, '').toLowerCase()
            );

            // Get categories for auto-categorization
            const categories = await Category.getAll(userId);

            const expenses = [];
            const errors = [];

            // Process each data row
            for (let i = 1; i < lines.length; i++) {
                try {
                    if (!lines[i].trim()) {
                        continue;
                    }
                    
                    // Parse CSV row properly
                    const values = this.parseCSVRow(lines[i]);
                    
                    // Create expense object with type detection
                    const expense = {
                        user_id: userId,
                        category_id: null,
                        amount: 0,
                        description: '',
                        date: new Date().toISOString().split('T')[0],
                        type: 'expense' // Default to expense
                    };

                    let hasAmount = false;
                    let hasDate = false;
                    let explicitType = null;
                    let categoryName = null;

                    // First pass: detect income/expense type from headers
                    let isIncome = false;
                    headers.forEach((header, index) => {
                        const value = values[index] ? values[index].replace(/^["']|["']$/g, '').trim() : '';
                        const headerLower = header.toLowerCase();
                        
                        // Income indicators in header
                        if (headerLower.includes('credit') || 
                            headerLower.includes('deposit') || 
                            headerLower.includes('salary') || 
                            headerLower.includes('income') ||
                            headerLower.includes('received') ||
                            headerLower.includes('refund') ||
                            headerLower.includes('cashback') ||
                            headerLower.includes('interest') ||
                            headerLower.includes('dividend')) {
                            isIncome = true;
                        }
                        
                        // Check value for income keywords
                        if (value) {
                            const valueLower = value.toLowerCase();
                            if (valueLower.includes('salary') || 
                                valueLower.includes('income') || 
                                valueLower.includes('freelance') || 
                                valueLower.includes('refund') ||
                                valueLower.includes('credit')) {
                                isIncome = true;
                            }
                        }
                    });

                    // Second pass: extract data
                    headers.forEach((header, index) => {
                        const value = values[index] ? values[index].replace(/^["']|["']$/g, '').trim() : '';
                        const headerLower = header.toLowerCase();
                        
                        // Date detection
                        if (headerLower.includes('date') || 
                            headerLower.includes('trandate') || 
                            headerLower.includes('transaction') || 
                            headerLower.includes('day') ||
                            headerLower.includes('time') ||
                            headerLower.includes('posted')) {
                            const parsedDate = this.parseDate(value);
                            if (parsedDate) {
                                expense.date = parsedDate;
                                hasDate = true;
                            }
                        }
                        
                        // Amount detection - CREDIT/INCOME (explicit)
                        else if (headerLower.includes('credit') || 
                                headerLower.includes('deposit') || 
                                headerLower.includes('salary') || 
                                headerLower.includes('income') ||
                                headerLower.includes('received') ||
                                headerLower.includes('refund') ||
                                headerLower.includes('cashback')) {
                            const amount = this.parseAmount(value);
                            if (amount > 0) {
                                expense.amount = amount;
                                expense.type = 'income';
                                hasAmount = true;
                                explicitType = 'income';
                            }
                        }
                        
                        // Amount detection - DEBIT/EXPENSE (explicit)
                        else if (headerLower.includes('debit') || 
                                headerLower.includes('withdrawal') || 
                                headerLower.includes('payment') || 
                                headerLower.includes('purchase') ||
                                headerLower.includes('expense') ||
                                headerLower.includes('spent') ||
                                headerLower.includes('outflow')) {
                            const amount = this.parseAmount(value);
                            if (amount > 0) {
                                expense.amount = amount;
                                expense.type = 'expense';
                                hasAmount = true;
                                explicitType = 'expense';
                            }
                        }
                        
                        // Generic amount field - infer type from context
                        else if (headerLower.includes('amount') || 
                                headerLower.includes('value') || 
                                headerLower.includes('sum') ||
                                headerLower.includes('total')) {
                            const amount = this.parseAmount(value);
                            if (amount > 0) {
                                expense.amount = amount;
                                // Set type based on earlier detection
                                if (isIncome && !explicitType) {
                                    expense.type = 'income';
                                }
                                hasAmount = true;
                            }
                        }
                        
                        // Description detection
                        else if (headerLower.includes('description') || 
                                headerLower.includes('merchant') || 
                                headerLower.includes('payee') || 
                                headerLower.includes('vendor') || 
                                headerLower.includes('name') || 
                                headerLower.includes('remarks') || 
                                headerLower.includes('details') || 
                                headerLower.includes('memo') || 
                                headerLower.includes('note') ||
                                headerLower.includes('particulars') ||
                                headerLower.includes('narration')) {
                            if (value) {
                                expense.description = value.substring(0, 255);
                            }
                        }
                        
                        // Category detection
                        else if (headerLower.includes('category') || 
                                headerLower.includes('class') || 
                                headerLower.includes('group') ||
                                headerLower.includes('tag')) {
                            if (value) {
                                categoryName = value;
                            }
                        }
                        
                        // Type detection column
                        else if (headerLower.includes('type') || 
                                headerLower.includes('transaction type') || 
                                headerLower.includes('txn type') ||
                                headerLower.includes('nature')) {
                            if (value) {
                                const typeLower = value.toLowerCase();
                                if (typeLower.includes('credit') || 
                                    typeLower.includes('income') || 
                                    typeLower.includes('deposit')) {
                                    expense.type = 'income';
                                    explicitType = 'income';
                                } else if (typeLower.includes('debit') || 
                                         typeLower.includes('expense') || 
                                         typeLower.includes('payment')) {
                                    expense.type = 'expense';
                                    explicitType = 'expense';
                                }
                            }
                        }
                        
                        // If no description found, use first non-date/non-amount field
                        if (!expense.description && value && 
                            !headerLower.includes('date') && 
                            !headerLower.includes('amount') && 
                            !headerLower.includes('debit') && 
                            !headerLower.includes('credit') &&
                            !headerLower.includes('balance') &&
                            !headerLower.includes('type') &&
                            !headerLower.includes('category')) {
                            expense.description = value.substring(0, 255);
                        }
                    });

                    // If we still don't have a description, create one
                    if (!expense.description) {
                        expense.description = `Transaction on ${expense.date}`;
                    }

                    // Validate required fields
                    if (!hasAmount) {
                        errors.push({
                            row: i + 1,
                            data: lines[i].substring(0, 100),
                            error: 'No valid amount found',
                            reason: 'Could not find a valid amount column'
                        });
                        continue;
                    }

                    if (!hasDate) {
                    }

                    // Determine category
                    if (expense.amount > 0) {
                        // First try to use provided category name
                        if (categoryName) {
                            const matchedCategory = this.findCategoryByName(categoryName, categories);
                            if (matchedCategory) {
                                expense.category_id = matchedCategory.id;
                            } else {
                                // Category not found, auto-categorize
                                expense.category_id = await this.autoCategorize(expense.description, expense.type, categories);
                            }
                        } else {
                            // No category provided, auto-categorize
                            expense.category_id = await this.autoCategorize(expense.description, expense.type, categories);
                        }
                        
                        expenses.push(expense);
                    }

                } catch (err) {
                    console.error(`? Error processing row ${i + 1}:`, err);
                    errors.push({
                        row: i + 1,
                        data: lines[i].substring(0, 100),
                        error: err.message,
                        reason: this.getErrorMessage(err)
                    });
                }
            }


            // Save to database
            const saved = await this.saveExpenses(expenses, userId);

            // Calculate analysis
            const totalIncome = expenses.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
            const totalExpense = expenses.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
            
            // Group by date for daily average
            const dateMap = new Map();
            expenses.forEach(e => {
                dateMap.set(e.date, (dateMap.get(e.date) || 0) + e.amount);
            });
            const dailyAvg = dateMap.size > 0 ? (totalExpense + totalIncome) / dateMap.size : 0;

            return {
                success: true,
                message: 'CSV processed successfully',
                total_records: lines.length - 1,
                valid_records: saved.valid.length,
                invalid_records: saved.invalid.length + errors.length,
                saved: saved.valid,
                errors: errors.slice(0, 10),
                summary: {
                    total_income: Math.round(totalIncome * 100) / 100,
                    total_expense: Math.round(totalExpense * 100) / 100,
                    net_savings: Math.round((totalIncome - totalExpense) * 100) / 100,
                    transaction_count: expenses.length,
                    income_count: expenses.filter(e => e.type === 'income').length,
                    expense_count: expenses.filter(e => e.type === 'expense').length,
                    daily_average: Math.round(dailyAvg * 100) / 100,
                    unique_dates: dateMap.size
                }
            };

        } catch (error) {
            console.error('? CSV Processing Error:', error);
            throw new Error(`Failed to process CSV: ${error.message}`);
        }
    }

    // ============================================
    // 2. FIND CATEGORY BY NAME
    // ============================================
    static findCategoryByName(name, categories) {
        if (!name) return null;
        
        const searchName = name.toLowerCase().trim();
        
        // Try exact match first
        let match = categories.find(c => c.name.toLowerCase() === searchName);
        if (match) return match;
        
        // Try partial match
        match = categories.find(c => c.name.toLowerCase().includes(searchName) || 
                                      searchName.includes(c.name.toLowerCase()));
        return match || null;
    }

    // ============================================
    // 3. GET ERROR MESSAGE
    // ============================================
    static getErrorMessage(error) {
        if (error.message.includes('amount')) {
            return 'Invalid amount format - please use numbers only (e.g., 250.00)';
        }
        if (error.message.includes('date')) {
            return 'Invalid date format - please use DD/MM/YYYY or YYYY-MM-DD';
        }
        if (error.message.includes('category')) {
            return 'Category not found - transaction will use "Other"';
        }
        return error.message;
    }

    // ============================================
    // 4. PARSE CSV ROW (Handles quoted fields)
    // ============================================
    static parseCSVRow(row) {
        const result = [];
        let inQuotes = false;
        let currentValue = '';
        
        for (let i = 0; i < row.length; i++) {
            const char = row[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(currentValue);
                currentValue = '';
            } else {
                currentValue += char;
            }
        }
        
        result.push(currentValue);
        return result;
    }

    // ============================================
    // 5. PARSE DATE (Multiple formats)
    // ============================================
    static parseDate(dateStr) {
        if (!dateStr) return null;
        
        dateStr = dateStr.replace(/^["']|["']$/g, '').trim();
        if (!dateStr) return null;

        // Keep only the calendar date for timestamp-like values.
        const timestampMatch = dateStr.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})(?:[T\s].*)?$/);
        if (timestampMatch) {
            const [, year, month, day] = timestampMatch;
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }

        // Handle the default JavaScript Date.toString() format, for example:
        // Wed Dec 30 2026 00:00:00 GMT+0530 (India Standard Time)
        const jsDateStringMatch = dateStr.match(
            /^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+([A-Za-z]{3,9})\s+(\d{1,2})\s+(\d{4})\s+\d{2}:\d{2}:\d{2}\s+GMT[+-]\d{4}(?:\s+\(.+\))?$/
        );
        if (jsDateStringMatch) {
            const [, monthName, day, year] = jsDateStringMatch;
            const parsed = moment(`${day} ${monthName} ${year}`, 'D MMM YYYY', true);
            if (parsed.isValid()) {
                return parsed.format('YYYY-MM-DD');
            }
        }

        // Excel/Sheets serial dates sometimes appear in exported CSV files.
        if (/^\d{4,5}(?:\.0+)?$/.test(dateStr)) {
            const serial = parseInt(dateStr, 10);
            if (!Number.isNaN(serial) && serial > 0) {
                const excelEpoch = Date.UTC(1899, 11, 30);
                return new Date(excelEpoch + serial * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
            }
        }
        
        // Try YYYY-MM-DD, YYYY/MM/DD, or YYYY.MM.DD.
        let match = dateStr.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
        if (match) {
            let [, y, m, d] = match;
            return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }

        // Try DD/MM/YYYY.
        match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (match) {
            let [, d, m, y] = match;
            return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }

        // Try DD/MM/YY or MM/DD/YY using a small heuristic.
        match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
        if (match) {
            let [, first, second, year] = match;
            const firstNumber = parseInt(first, 10);
            const secondNumber = parseInt(second, 10);
            const fullYear = parseInt(year, 10) >= 70 ? `19${year}` : `20${year}`;

            if (firstNumber > 12) {
                return `${fullYear}-${second.padStart(2, '0')}-${first.padStart(2, '0')}`;
            }

            if (secondNumber > 12) {
                return `${fullYear}-${first.padStart(2, '0')}-${second.padStart(2, '0')}`;
            }

            return `${fullYear}-${second.padStart(2, '0')}-${first.padStart(2, '0')}`;
        }
        
        // Try DD-MM-YYYY or MM-DD-YYYY.
        match = dateStr.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
        if (match) {
            let [, first, second, year] = match;
            const firstNumber = parseInt(first, 10);
            const secondNumber = parseInt(second, 10);

            if (firstNumber > 12) {
                return `${year}-${second.padStart(2, '0')}-${first.padStart(2, '0')}`;
            }

            if (secondNumber > 12) {
                return `${year}-${first.padStart(2, '0')}-${second.padStart(2, '0')}`;
            }

            return `${year}-${second.padStart(2, '0')}-${first.padStart(2, '0')}`;
        }
        
        // Try YYYY/MM/DD
        match = dateStr.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
        if (match) {
            let [, y, m, d] = match;
            d = d.padStart(2, '0');
            m = m.padStart(2, '0');
            return `${y}-${m}-${d}`;
        }
        
        // Try DD.MM.YYYY
        match = dateStr.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
        if (match) {
            let [, d, m, y] = match;
            d = d.padStart(2, '0');
            m = m.padStart(2, '0');
            return `${y}-${m}-${d}`;
        }

        const strictFormats = [
            moment.ISO_8601,
            'YYYY-MM-DD HH:mm:ss',
            'YYYY-MM-DD HH:mm:ss.SSS',
            'YYYY-MM-DDTHH:mm:ss',
            'YYYY-MM-DDTHH:mm:ss.SSS',
            'YYYY-MM-DDTHH:mm:ssZ',
            'YYYY-MM-DDTHH:mm:ss.SSSZ',
            'YYYY/MM/DD HH:mm:ss',
            'YYYY/MM/DD HH:mm:ss.SSS',
            'DD/MM/YYYY HH:mm:ss',
            'DD/MM/YYYY HH:mm:ss.SSS',
            'MM/DD/YYYY HH:mm:ss',
            'MM/DD/YYYY HH:mm:ss.SSS',
            'DD-MM-YYYY HH:mm:ss',
            'DD-MM-YYYY HH:mm:ss.SSS',
            'MM-DD-YYYY HH:mm:ss',
            'MM-DD-YYYY HH:mm:ss.SSS',
            'D MMM YYYY',
            'DD MMM YYYY',
            'D MMMM YYYY',
            'DD MMMM YYYY',
            'D MMM YYYY HH:mm:ss',
            'DD MMM YYYY HH:mm:ss',
            'D MMMM YYYY HH:mm:ss',
            'DD MMMM YYYY HH:mm:ss',
            'MMM D, YYYY',
            'MMM DD, YYYY',
            'MMMM D, YYYY',
            'MMMM DD, YYYY',
            'MMM D, YYYY HH:mm:ss',
            'MMM DD, YYYY HH:mm:ss',
            'MMMM D, YYYY HH:mm:ss',
            'MMMM DD, YYYY HH:mm:ss'
        ];

        for (const format of strictFormats) {
            const parsed = moment(dateStr, format, true);
            if (parsed.isValid()) {
                return parsed.format('YYYY-MM-DD');
            }
        }

        const relaxedParsed = moment(dateStr);
        if (relaxedParsed.isValid()) {
            return relaxedParsed.format('YYYY-MM-DD');
        }
        
        return null;
    }

    // ============================================
    // 6. PARSE AMOUNT (Handles currency symbols)
    // ============================================
    static parseAmount(amountStr) {
        if (!amountStr) return 0;
        
        // Remove quotes, currency symbols, and spaces
        let cleaned = amountStr.toString()
            .replace(/^["']|["']$/g, '')
            .replace(/[?$,€£¥\s]/g, '')
            .replace(/\(/g, '-')
            .replace(/\)/g, '')
            .replace(/,/g, '') // Remove thousand separators
            .trim();
        
        if (!cleaned) return 0;
        
        // Handle negative numbers (parentheses or minus sign)
        if (cleaned.startsWith('-') || cleaned.includes('-')) {
            cleaned = cleaned.replace('-', '');
            const amount = parseFloat(cleaned);
            return isNaN(amount) ? 0 : Math.abs(amount);
        }
        
        const amount = parseFloat(cleaned);
        return isNaN(amount) ? 0 : Math.abs(amount);
    }

    // ============================================
    // 7. AUTO-CATEGORIZATION (Without icons)
    // ============================================
    static async autoCategorize(description, type, categories) {
        if (!description) return await this.getDefaultCategoryId(categories, type);
        
        const descLower = description.toLowerCase();
        
        // If it's income, try to use Income category
        if (type === 'income') {
            const incomeCategory = categories.find(c => 
                c.name === 'Income' || c.name.toLowerCase().includes('income')
            );
            if (incomeCategory) return incomeCategory.id;
        }
        
        // Enhanced keyword mapping
        const keywordMap = {
            'Food & Dining': ['food', 'restaurant', 'cafe', 'coffee', 'starbucks', 'pizza', 'burger', 'swiggy', 'zomato', 'dinner', 'lunch', 'breakfast', 'meal', 'eat', 'dining'],
            'Transportation': ['uber', 'ola', 'taxi', 'cab', 'metro', 'bus', 'train', 'petrol', 'fuel', 'gas', 'transport', 'parking', 'toll', 'flight', 'railway'],
            'Shopping': ['amazon', 'flipkart', 'myntra', 'shopping', 'mall', 'clothes', 'shoes', 'bag', 'electronics', 'amazon', 'purchase', 'store'],
            'Entertainment': ['netflix', 'prime', 'hotstar', 'movie', 'cinema', 'pvr', 'concert', 'game', 'spotify', 'youtube', 'entertainment', 'theatre'],
            'Bills & Utilities': ['bill', 'electricity', 'water', 'gas', 'broadband', 'wifi', 'internet', 'phone', 'mobile', 'recharge', 'rent', 'utility', 'maintenance'],
            'Healthcare': ['hospital', 'doctor', 'clinic', 'medicine', 'pharmacy', 'apollo', 'health', 'medical', 'gym', 'fitness', 'healthcare', 'dental'],
            'Education': ['course', 'udemy', 'coursera', 'book', 'library', 'tuition', 'school', 'college', 'university', 'education', 'training'],
            'Groceries': ['grocery', 'supermarket', 'bigbasket', 'zepto', 'blinkit', 'dmart', 'vegetable', 'fruit', 'milk', 'bread', 'grocery', 'market'],
            'Travel': ['hotel', 'resort', 'booking', 'makemytrip', 'goibibo', 'yatra', 'vacation', 'holiday', 'flight', 'travel', 'trip'],
            'Income': ['salary', 'income', 'freelance', 'consulting', 'interest', 'dividend', 'refund', 'cashback', 'bonus', 'payment received', 'credit']
        };

        // Check each category's keywords
        for (const category of categories) {
            const keywords = keywordMap[category.name];
            if (keywords) {
                for (const keyword of keywords) {
                    if (descLower.includes(keyword)) {
                        return category.id;
                    }
                }
            }
        }

        // Return default category
        return await this.getDefaultCategoryId(categories, type);
    }

    // ============================================
    // 8. GET DEFAULT CATEGORY ID
    // ============================================
    static async getDefaultCategoryId(categories, type) {
        if (type === 'income') {
            const incomeCat = categories.find(c => c.name === 'Income');
            if (incomeCat) return incomeCat.id;
        }
        
        const otherCat = categories.find(c => c.name === 'Other');
        return otherCat ? otherCat.id : 10; // Fallback to 10 if Other not found
    }

    // ============================================
    // 9. SAVE EXPENSES TO DATABASE
    // ============================================
    static async saveExpenses(expenses, userId) {
        const saved = [];
        const invalid = [];

        for (const expenseData of expenses) {
            try {
                // Ensure category_id is set
                if (!expenseData.category_id) {
                    throw new Error('Category ID is required');
                }
                
                const expenseId = await Expense.create(expenseData);
                const savedExpense = await Expense.findById(expenseId, userId);
                saved.push(savedExpense);
            } catch (error) {
                console.error('? Error saving expense:', error.message);
                invalid.push({
                    ...expenseData,
                    error: error.message
                });
            }
        }

        return { valid: saved, invalid: invalid };
    }

    // ============================================
    // 10. VALIDATE CSV WITHOUT SAVING
    // ============================================
    static async parseCSV(fileBuffer) {
        const content = fileBuffer.toString();
        const lines = content.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
        
        if (lines.length === 0) {
            throw new Error('Empty CSV file');
        }

        const headers = lines[0].replace(/^\uFEFF/, '').split(',').map(h => 
            h.trim().replace(/^["']|["']$/g, '')
        );
        
        const records = [];

        for (let i = 1; i < Math.min(lines.length, 11); i++) {
            if (!lines[i].trim()) continue;
            const values = this.parseCSVRow(lines[i]);
            const record = {};
            headers.forEach((header, index) => {
                record[header] = values[index] ? values[index].replace(/^["']|["']$/g, '').trim() : '';
            });
            records.push(record);
        }

        return records;
    }

    // ============================================
    // 11. GENERATE CSV TEMPLATE
    // ============================================
    static generateTemplate() {
        const headers = ['Date', 'Description', 'Amount', 'Type', 'Category'];
        const rows = [
            ['15/02/2026', 'Monthly Salary', '50000.00', 'income', 'Income'],
            ['15/02/2026', 'Starbucks Coffee', '250.00', 'expense', 'Food & Dining'],
            ['16/02/2026', 'Uber Ride', '180.00', 'expense', 'Transportation'],
            ['16/02/2026', 'Freelance Payment', '5000.00', 'income', 'Income'],
            ['17/02/2026', 'Amazon Shopping', '1500.00', 'expense', 'Shopping']
        ];

        let csv = headers.join(',') + '\n';
        rows.forEach(row => {
            csv += row.map(cell => `"${cell}"`).join(',') + '\n';
        });

        return csv;
    }

    // ============================================
    // 12. DETECT COLUMN MAPPINGS
    // ============================================
    static detectColumns(sampleRow) {
        const mapping = {
            date: null,
            amount: null,
            description: null,
            category: null,
            type: null
        };

        const patterns = {
            date: ['date', 'trandate', 'transaction', 'day', 'time', 'posted', 'tran date'],
            amount: ['amount', 'debit', 'credit', 'withdrawal', 'payment', 'value', 'sum', 'total'],
            description: ['description', 'merchant', 'payee', 'vendor', 'name', 'details', 'memo', 'remarks', 'particulars', 'narration'],
            category: ['category', 'class', 'group', 'tag', 'section'],
            type: ['type', 'transaction type', 'txn type', 'nature', 'credit/debit']
        };

        if (!sampleRow) return mapping;

        Object.keys(sampleRow).forEach(column => {
            const colLower = column.toLowerCase();
            
            for (const [field, fieldPatterns] of Object.entries(patterns)) {
                if (fieldPatterns.some(pattern => colLower.includes(pattern))) {
                    mapping[field] = column;
                    break;
                }
            }
        });

        return mapping;
    }
}

module.exports = CSVService;
