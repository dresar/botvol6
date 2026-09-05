require('dotenv').config();

class Config {
    constructor() {
        this.config = {
            // Database
            database: {
                path: process.env.DATABASE_PATH || './data/botify.db',
                backupInterval: 24 * 60 * 60 * 1000 // 24 jam
            },

            // Bot settings
            bot: {
                name: 'Botify',
                version: '1.0.0',
                prefix: process.env.BOT_PREFIX || '!',
                adminNumbers: process.env.ADMIN_NUMBERS ? process.env.ADMIN_NUMBERS.split(',') : [],
                maxMessageLength: 4096,
                rateLimit: {
                    windowMs: 15 * 60 * 1000, // 15 menit
                    max: 100 // maksimal 100 request per window
                }
            },

            // API Keys
            apis: {
                openWeather: process.env.OPENWEATHER_API_KEY,
                newsApi: process.env.NEWS_API_KEY,
                currencyApi: process.env.CURRENCY_API_KEY,
                googleTranslate: process.env.GOOGLE_TRANSLATE_API_KEY,
                spotify: {
                    clientId: process.env.SPOTIFY_CLIENT_ID,
                    clientSecret: process.env.SPOTIFY_CLIENT_SECRET
                },
                youtube: process.env.YOUTUBE_API_KEY,
                openai: process.env.OPENAI_API_KEY,
                unsplash: process.env.UNSPLASH_API_KEY,
                giphy: process.env.GIPHY_API_KEY
            },

            // Feature settings
            features: {
                // Produktivitas
                productivity: {
                    reminders: {
                        enabled: true,
                        maxReminders: 50,
                        maxDays: 365
                    },
                    tasks: {
                        enabled: true,
                        maxTasks: 100,
                        categories: ['kerja', 'pribadi', 'belanja', 'kesehatan', 'pendidikan']
                    },
                    calendar: {
                        enabled: true,
                        syncWithGoogle: false
                    },
                    notes: {
                        enabled: true,
                        maxNotes: 200,
                        maxLength: 10000
                    }
                },

                // Keuangan
                finance: {
                    expenseTracker: {
                        enabled: true,
                        categories: ['makanan', 'transport', 'hiburan', 'belanja', 'tagihan', 'lainnya']
                    },
                    currencyConverter: {
                        enabled: true,
                        updateInterval: 60 * 60 * 1000 // 1 jam
                    },
                    stockTracker: {
                        enabled: true,
                        maxStocks: 20
                    }
                },

                // Hiburan
                entertainment: {
                    games: {
                        enabled: true,
                        availableGames: ['tebakangka', 'katakata', 'quiz', 'memory', 'puzzle']
                    },
                    music: {
                        enabled: true,
                        providers: ['spotify', 'youtube']
                    },
                    movies: {
                        enabled: true,
                        providers: ['tmdb', 'imdb']
                    },
                    memes: {
                        enabled: true,
                        providers: ['giphy', 'reddit']
                    }
                },

                // Informasi
                information: {
                    news: {
                        enabled: true,
                        categories: ['nasional', 'internasional', 'teknologi', 'olahraga', 'hiburan']
                    },
                    weather: {
                        enabled: true,
                        updateInterval: 30 * 60 * 1000 // 30 menit
                    },
                    dictionary: {
                        enabled: true,
                        languages: ['id', 'en', 'ja', 'ko', 'zh']
                    },
                    translator: {
                        enabled: true,
                        supportedLanguages: ['id', 'en', 'ja', 'ko', 'zh', 'ar', 'es', 'fr', 'de']
                    }
                },

                // Utilitas
                utilities: {
                    qrCode: {
                        enabled: true,
                        formats: ['text', 'url', 'wifi', 'contact']
                    },
                    fileConverter: {
                        enabled: true,
                        maxFileSize: 16 * 1024 * 1024, // 16MB
                        supportedFormats: ['pdf', 'docx', 'txt', 'jpg', 'png', 'mp3', 'mp4']
                    },
                    calculator: {
                        enabled: true,
                        scientific: true
                    },
                    ocr: {
                        enabled: true,
                        languages: ['eng', 'ind']
                    }
                }
            },

            // Logging
            logging: {
                level: process.env.LOG_LEVEL || 'info',
                file: './logs/botify.log',
                maxSize: 10 * 1024 * 1024, // 10MB
                maxFiles: 5
            },

            // Security
            security: {
                encryption: {
                    enabled: true,
                    algorithm: 'aes-256-gcm'
                },
                rateLimit: {
                    enabled: true,
                    windowMs: 15 * 60 * 1000,
                    max: 100
                }
            }
        };
    }

    get(key) {
        return key.split('.').reduce((obj, k) => obj && obj[k], this.config);
    }

    set(key, value) {
        const keys = key.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((obj, k) => obj[k] = obj[k] || {}, this.config);
        target[lastKey] = value;
    }

    getAll() {
        return this.config;
    }
}

module.exports = Config; 