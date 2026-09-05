const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class DatabaseManager {
    constructor() {
        this.dbPath = './data/botify.db';
        this.db = null;
        this.ensureDataDirectory();
    }

    ensureDataDirectory() {
        const dataDir = path.dirname(this.dbPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
    }

    async initialize() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    reject(err);
                } else {
                    this.createTables().then(resolve).catch(reject);
                }
            });
        });
    }

    async createTables() {
        const tables = [
            // Tabel pengguna
            `CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                phone_number TEXT UNIQUE NOT NULL,
                name TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
                settings TEXT DEFAULT '{}',
                is_admin BOOLEAN DEFAULT 0
            )`,

            // Tabel pengingat
            `CREATE TABLE IF NOT EXISTS reminders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                title TEXT NOT NULL,
                description TEXT,
                reminder_time DATETIME NOT NULL,
                is_completed BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )`,

            // Tabel tugas
            `CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                title TEXT NOT NULL,
                description TEXT,
                category TEXT,
                priority TEXT DEFAULT 'medium',
                due_date DATETIME,
                is_completed BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )`,

            // Tabel catatan
            `CREATE TABLE IF NOT EXISTS notes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                title TEXT NOT NULL,
                content TEXT,
                category TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )`,

            // Tabel pengeluaran
            `CREATE TABLE IF NOT EXISTS expenses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                amount DECIMAL(10,2) NOT NULL,
                category TEXT NOT NULL,
                description TEXT,
                date DATE DEFAULT CURRENT_DATE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )`,

            // Tabel saham yang diikuti
            `CREATE TABLE IF NOT EXISTS stock_watches (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                symbol TEXT NOT NULL,
                name TEXT,
                added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )`,

            // Tabel game scores
            `CREATE TABLE IF NOT EXISTS game_scores (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                game_name TEXT NOT NULL,
                score INTEGER NOT NULL,
                played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )`,

            // Tabel cache API
            `CREATE TABLE IF NOT EXISTS api_cache (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                key TEXT UNIQUE NOT NULL,
                value TEXT NOT NULL,
                expires_at DATETIME NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Tabel statistik penggunaan
            `CREATE TABLE IF NOT EXISTS usage_stats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                feature_name TEXT NOT NULL,
                usage_count INTEGER DEFAULT 1,
                last_used DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )`,

            // Tabel file yang diupload
            `CREATE TABLE IF NOT EXISTS uploaded_files (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                original_name TEXT NOT NULL,
                file_path TEXT NOT NULL,
                file_size INTEGER,
                mime_type TEXT,
                uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )`,

            // Tabel konversi mata uang
            `CREATE TABLE IF NOT EXISTS currency_rates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                from_currency TEXT NOT NULL,
                to_currency TEXT NOT NULL,
                rate DECIMAL(10,6) NOT NULL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Tabel cuaca cache
            `CREATE TABLE IF NOT EXISTS weather_cache (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                city TEXT NOT NULL,
                country TEXT,
                weather_data TEXT NOT NULL,
                expires_at DATETIME NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Tabel berita cache
            `CREATE TABLE IF NOT EXISTS news_cache (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category TEXT NOT NULL,
                news_data TEXT NOT NULL,
                expires_at DATETIME NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Tabel sesi chat
            `CREATE TABLE IF NOT EXISTS chat_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                session_type TEXT NOT NULL,
                session_data TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )`
        ];

        for (const table of tables) {
            await this.run(table);
        }
    }

    async run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    async get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    async all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // User management
    async createUser(phoneNumber, name = null) {
        const sql = `INSERT OR IGNORE INTO users (phone_number, name) VALUES (?, ?)`;
        return await this.run(sql, [phoneNumber, name]);
    }

    async getUser(phoneNumber) {
        const sql = `SELECT * FROM users WHERE phone_number = ?`;
        return await this.get(sql, [phoneNumber]);
    }

    async updateUserLastActive(phoneNumber) {
        const sql = `UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE phone_number = ?`;
        return await this.run(sql, [phoneNumber]);
    }

    // Reminder management
    async createReminder(userId, title, description, reminderTime) {
        const sql = `INSERT INTO reminders (user_id, title, description, reminder_time) VALUES (?, ?, ?, ?)`;
        return await this.run(sql, [userId, title, description, reminderTime]);
    }

    async getReminders(userId, includeCompleted = false) {
        let sql = `SELECT * FROM reminders WHERE user_id = ?`;
        if (!includeCompleted) {
            sql += ` AND is_completed = 0`;
        }
        sql += ` ORDER BY reminder_time ASC`;
        return await this.all(sql, [userId]);
    }

    // Task management
    async createTask(userId, title, description, category, priority, dueDate) {
        const sql = `INSERT INTO tasks (user_id, title, description, category, priority, due_date) VALUES (?, ?, ?, ?, ?, ?)`;
        return await this.run(sql, [userId, title, description, category, priority, dueDate]);
    }

    async getTasks(userId, includeCompleted = false) {
        let sql = `SELECT * FROM tasks WHERE user_id = ?`;
        if (!includeCompleted) {
            sql += ` AND is_completed = 0`;
        }
        sql += ` ORDER BY due_date ASC, priority DESC`;
        return await this.all(sql, [userId]);
    }

    // Expense tracking
    async addExpense(userId, amount, category, description) {
        const sql = `INSERT INTO expenses (user_id, amount, category, description) VALUES (?, ?, ?, ?)`;
        return await this.run(sql, [userId, amount, category, description]);
    }

    async getExpenses(userId, startDate = null, endDate = null) {
        let sql = `SELECT * FROM expenses WHERE user_id = ?`;
        const params = [userId];
        
        if (startDate && endDate) {
            sql += ` AND date BETWEEN ? AND ?`;
            params.push(startDate, endDate);
        }
        
        sql += ` ORDER BY date DESC`;
        return await this.all(sql, params);
    }

    // API Cache management
    async setCache(key, value, expiresInMinutes = 60) {
        const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
        const sql = `INSERT OR REPLACE INTO api_cache (key, value, expires_at) VALUES (?, ?, ?)`;
        return await this.run(sql, [key, JSON.stringify(value), expiresAt.toISOString()]);
    }

    async getCache(key) {
        const sql = `SELECT value FROM api_cache WHERE key = ? AND expires_at > datetime('now')`;
        const result = await this.get(sql, [key]);
        return result ? JSON.parse(result.value) : null;
    }

    // Usage statistics
    async trackFeatureUsage(userId, featureName) {
        const sql = `INSERT OR REPLACE INTO usage_stats (user_id, feature_name, usage_count, last_used) 
                     VALUES (?, ?, 
                         COALESCE((SELECT usage_count + 1 FROM usage_stats WHERE user_id = ? AND feature_name = ?), 1),
                         CURRENT_TIMESTAMP)`;
        return await this.run(sql, [userId, featureName, userId, featureName]);
    }

    async getFeatureUsage(userId, featureName) {
        const sql = `SELECT * FROM usage_stats WHERE user_id = ? AND feature_name = ?`;
        return await this.get(sql, [userId, featureName]);
    }

    // Cleanup expired cache
    async cleanupExpiredCache() {
        const sql = `DELETE FROM api_cache WHERE expires_at < datetime('now')`;
        return await this.run(sql);
    }

    async close() {
        return new Promise((resolve) => {
            if (this.db) {
                this.db.close(resolve);
            } else {
                resolve();
            }
        });
    }
}

module.exports = DatabaseManager; 