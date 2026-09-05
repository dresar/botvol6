const { Client, LocalAuth } = require('waweb.js');
const qrcode = require('qrcode-terminal');
const path = require('path');
require('dotenv').config();

// Import modul-modul utama
const MessageHandler = require('./handlers/MessageHandler');
const DatabaseManager = require('./database/DatabaseManager');
const FeatureManager = require('./features/FeatureManager');
const Logger = require('./utils/Logger');
const Config = require('./config/Config');

class Botify {
    constructor() {
        this.client = new Client({
            authStrategy: new LocalAuth(),
            puppeteer: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu'
                ]
            }
        });

        this.messageHandler = new MessageHandler(this.client);
        this.databaseManager = new DatabaseManager();
        this.featureManager = new FeatureManager(this.client, this.databaseManager);
        this.logger = new Logger();
        this.config = new Config();

        this.initializeBot();
    }

    async initializeBot() {
        try {
            this.logger.info('🚀 Memulai Botify WhatsApp Bot...');

            // Event listeners
            this.client.on('qr', (qr) => {
                this.logger.info('📱 Scan QR Code untuk login:');
                qrcode.generate(qr, { small: true });
            });

            this.client.on('ready', () => {
                this.logger.success('✅ Botify siap digunakan!');
                this.logger.info(`📊 Total fitur tersedia: ${this.featureManager.getTotalFeatures()}`);
                this.logger.info('🤖 Bot aktif dan siap menerima pesan');
            });

            this.client.on('message', async (message) => {
                await this.messageHandler.handleMessage(message);
            });

            this.client.on('message_create', async (message) => {
                if (message.fromMe) return;
                await this.messageHandler.handleMessage(message);
            });

            this.client.on('disconnected', (reason) => {
                this.logger.warn(`❌ Bot terputus: ${reason}`);
            });

            // Inisialisasi database
            await this.databaseManager.initialize();
            
            // Inisialisasi fitur-fitur
            await this.featureManager.initialize();

            // Login ke WhatsApp
            await this.client.initialize();

        } catch (error) {
            this.logger.error('❌ Error saat inisialisasi bot:', error);
            process.exit(1);
        }
    }
}

// Jalankan bot
const bot = new Botify();

// Handle process termination
process.on('SIGINT', async () => {
    bot.logger.info('🛑 Mematikan bot...');
    await bot.client.destroy();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    bot.logger.info('🛑 Mematikan bot...');
    await bot.client.destroy();
    process.exit(0);
}); 