const FeatureManager = require('../features/FeatureManager');
const DatabaseManager = require('../database/DatabaseManager');
const Logger = require('../utils/Logger');
const Config = require('../config/Config');

class MessageHandler {
    constructor(client) {
        this.client = client;
        this.databaseManager = new DatabaseManager();
        this.featureManager = new FeatureManager(client, this.databaseManager);
        this.logger = new Logger();
        this.config = new Config();
        this.prefix = this.config.get('bot.prefix');
    }

    async handleMessage(message) {
        try {
            // Skip pesan dari bot sendiri
            if (message.fromMe) return;

            const phoneNumber = message.from;
            const messageText = message.body || '';
            const messageType = message.type;

            // Update user activity
            await this.databaseManager.updateUserLastActive(phoneNumber);

            // Log pesan masuk
            this.logger.debug(`Pesan masuk dari ${phoneNumber}: ${messageText}`);

            // Handle different message types
            if (messageType === 'image') {
                await this.handleImageMessage(message);
            } else if (messageType === 'document') {
                await this.handleDocumentMessage(message);
            } else if (messageType === 'audio') {
                await this.handleAudioMessage(message);
            } else if (messageType === 'video') {
                await this.handleVideoMessage(message);
            } else if (messageType === 'location') {
                await this.handleLocationMessage(message);
            } else if (messageType === 'contact') {
                await this.handleContactMessage(message);
            } else {
                await this.handleTextMessage(message);
            }

        } catch (error) {
            this.logger.error('Error handling message:', error);
            await this.sendErrorMessage(message.from);
        }
    }

    async handleTextMessage(message) {
        const phoneNumber = message.from;
        const messageText = message.body.trim();

        // Check if message starts with prefix
        if (!messageText.startsWith(this.prefix)) {
            // Handle natural language processing for non-prefix messages
            await this.handleNaturalLanguage(message);
            return;
        }

        // Extract command and arguments
        const commandParts = messageText.slice(this.prefix.length).trim().split(' ');
        const command = commandParts[0].toLowerCase();
        const args = commandParts.slice(1);

        this.logger.debug(`Command: ${command}, Args: ${args.join(' ')}`);

        // Route to appropriate feature
        await this.routeCommand(phoneNumber, command, args, message);
    }

    async handleImageMessage(message) {
        const phoneNumber = message.from;
        
        try {
            // Download image
            const media = await message.downloadMedia();
            
            // Handle OCR if requested
            if (message.caption && message.caption.toLowerCase().includes('ocr')) {
                await this.featureManager.executeFeature('ocr', phoneNumber, {
                    imageData: media.data,
                    mimeType: media.mimetype
                });
            } else {
                // Default image processing
                await this.sendMessage(phoneNumber, '🖼️ Gambar diterima! Gunakan caption "ocr" untuk mengekstrak teks dari gambar.');
            }
        } catch (error) {
            this.logger.error('Error handling image message:', error);
            await this.sendErrorMessage(phoneNumber);
        }
    }

    async handleDocumentMessage(message) {
        const phoneNumber = message.from;
        
        try {
            const media = await message.downloadMedia();
            const fileName = message.filename || 'document';
            
            await this.sendMessage(phoneNumber, `📄 Dokumen "${fileName}" diterima! Sedang memproses...`);
            
            // Handle document processing
            await this.featureManager.executeFeature('documentProcessor', phoneNumber, {
                fileName: fileName,
                fileData: media.data,
                mimeType: media.mimetype
            });
        } catch (error) {
            this.logger.error('Error handling document message:', error);
            await this.sendErrorMessage(phoneNumber);
        }
    }

    async handleAudioMessage(message) {
        const phoneNumber = message.from;
        
        try {
            const media = await message.downloadMedia();
            
            await this.sendMessage(phoneNumber, '🎵 Audio diterima! Sedang memproses...');
            
            // Handle audio processing (transcription, etc.)
            await this.featureManager.executeFeature('audioProcessor', phoneNumber, {
                audioData: media.data,
                mimeType: media.mimetype
            });
        } catch (error) {
            this.logger.error('Error handling audio message:', error);
            await this.sendErrorMessage(phoneNumber);
        }
    }

    async handleVideoMessage(message) {
        const phoneNumber = message.from;
        
        try {
            const media = await message.downloadMedia();
            
            await this.sendMessage(phoneNumber, '🎬 Video diterima! Sedang memproses...');
            
            // Handle video processing
            await this.featureManager.executeFeature('videoProcessor', phoneNumber, {
                videoData: media.data,
                mimeType: media.mimetype
            });
        } catch (error) {
            this.logger.error('Error handling video message:', error);
            await this.sendErrorMessage(phoneNumber);
        }
    }

    async handleLocationMessage(message) {
        const phoneNumber = message.from;
        const location = message.location;
        
        try {
            await this.sendMessage(phoneNumber, `📍 Lokasi diterima: ${location.latitude}, ${location.longitude}`);
            
            // Handle location-based features
            await this.featureManager.executeFeature('locationServices', phoneNumber, {
                latitude: location.latitude,
                longitude: location.longitude,
                description: location.description
            });
        } catch (error) {
            this.logger.error('Error handling location message:', error);
            await this.sendErrorMessage(phoneNumber);
        }
    }

    async handleContactMessage(message) {
        const phoneNumber = message.from;
        const contact = message.contact;
        
        try {
            await this.sendMessage(phoneNumber, `👤 Kontak diterima: ${contact.name} (${contact.number})`);
            
            // Handle contact processing
            await this.featureManager.executeFeature('contactManager', phoneNumber, {
                name: contact.name,
                number: contact.number
            });
        } catch (error) {
            this.logger.error('Error handling contact message:', error);
            await this.sendErrorMessage(phoneNumber);
        }
    }

    async handleNaturalLanguage(message) {
        const phoneNumber = message.from;
        const messageText = message.body.toLowerCase();

        // Simple natural language processing
        if (messageText.includes('halo') || messageText.includes('hai') || messageText.includes('hello')) {
            await this.sendWelcomeMessage(phoneNumber);
        } else if (messageText.includes('bantuan') || messageText.includes('help')) {
            await this.sendHelpMessage(phoneNumber);
        } else if (messageText.includes('menu') || messageText.includes('fitur')) {
            await this.sendMenuMessage(phoneNumber);
        } else if (messageText.includes('cuaca') || messageText.includes('weather')) {
            await this.featureManager.executeFeature('weather', phoneNumber, { query: messageText });
        } else if (messageText.includes('berita') || messageText.includes('news')) {
            await this.featureManager.executeFeature('news', phoneNumber, { query: messageText });
        } else {
            // Try to understand intent and route accordingly
            await this.routeNaturalLanguage(phoneNumber, messageText);
        }
    }

    async routeCommand(phoneNumber, command, args, message) {
        try {
            // Track command usage
            await this.databaseManager.trackFeatureUsage(phoneNumber, command);

            // Route to feature manager
            const result = await this.featureManager.executeFeature(command, phoneNumber, {
                args: args,
                message: message
            });

            if (result && result.success) {
                if (result.message) {
                    await this.sendMessage(phoneNumber, result.message);
                }
                if (result.media) {
                    await this.sendMedia(phoneNumber, result.media);
                }
            } else {
                await this.sendUnknownCommandMessage(phoneNumber, command);
            }

        } catch (error) {
            this.logger.error(`Error executing command ${command}:`, error);
            await this.sendErrorMessage(phoneNumber);
        }
    }

    async routeNaturalLanguage(phoneNumber, messageText) {
        // Simple intent recognition
        const intents = {
            'reminder': ['ingat', 'pengingat', 'remind', 'reminder'],
            'task': ['tugas', 'task', 'todo', 'daftar'],
            'expense': ['pengeluaran', 'expense', 'belanja', 'bayar'],
            'weather': ['cuaca', 'weather', 'hujan', 'panas'],
            'news': ['berita', 'news', 'informasi'],
            'calculator': ['hitung', 'calculator', 'kalkulator'],
            'translate': ['terjemah', 'translate', 'bahasa'],
            'qr': ['qr', 'qrcode', 'barcode'],
            'game': ['game', 'main', 'permainan', 'tebak'],
            'music': ['musik', 'music', 'lagu', 'song'],
            'movie': ['film', 'movie', 'sinema'],
            'meme': ['meme', 'gif', 'lucu']
        };

        for (const [intent, keywords] of Object.entries(intents)) {
            if (keywords.some(keyword => messageText.includes(keyword))) {
                await this.featureManager.executeFeature(intent, phoneNumber, { query: messageText });
                return;
            }
        }

        // Default response for unrecognized messages
        await this.sendDefaultResponse(phoneNumber);
    }

    async sendWelcomeMessage(phoneNumber) {
        const welcomeMessage = `🤖 *Selamat datang di Botify!*

Saya adalah asisten WhatsApp canggih dengan 300+ fitur untuk membantu produktivitas dan hiburan Anda.

*Fitur utama:*
📝 Produktivitas (Pengingat, Tugas, Catatan)
💰 Keuangan (Pelacakan Pengeluaran, Konversi Mata Uang)
🎮 Hiburan (Game, Musik, Film, Meme)
📰 Informasi (Berita, Cuaca, Kamus)
🛠️ Utilitas (QR Code, Kalkulator, OCR)

Ketik *!menu* untuk melihat semua fitur atau *!help* untuk bantuan.`;
        
        await this.sendMessage(phoneNumber, welcomeMessage);
    }

    async sendHelpMessage(phoneNumber) {
        const helpMessage = `📚 *Bantuan Botify*

*Cara menggunakan:*
1. Gunakan prefix *${this.prefix}* diikuti perintah
2. Contoh: *${this.prefix}reminder* atau *${this.prefix}weather*

*Perintah dasar:*
• *${this.prefix}menu* - Lihat semua fitur
• *${this.prefix}help* - Bantuan ini
• *${this.prefix}info* - Informasi bot
• *${this.prefix}stats* - Statistik penggunaan

*Kategori fitur:*
• *${this.prefix}productivity* - Fitur produktivitas
• *${this.prefix}finance* - Fitur keuangan
• *${this.prefix}entertainment* - Fitur hiburan
• *${this.prefix}information* - Fitur informasi
• *${this.prefix}utilities* - Fitur utilitas

*Butuh bantuan lebih lanjut?*
Hubungi admin atau ketik *${this.prefix}contact*`;

        await this.sendMessage(phoneNumber, helpMessage);
    }

    async sendMenuMessage(phoneNumber) {
        const menuMessage = `📋 *Menu Botify - 300+ Fitur*

*🎯 PRODUKTIVITAS*
• *${this.prefix}reminder* - Buat pengingat
• *${this.prefix}task* - Kelola tugas
• *${this.prefix}note* - Catatan pribadi
• *${this.prefix}calendar* - Kalender & jadwal

*💰 KEUANGAN*
• *${this.prefix}expense* - Lacak pengeluaran
• *${this.prefix}currency* - Konversi mata uang
• *${this.prefix}stock* - Info saham
• *${this.prefix}budget* - Manajemen anggaran

*🎮 HIBURAN*
• *${this.prefix}game* - Permainan
• *${this.prefix}music* - Cari musik
• *${this.prefix}movie* - Rekomendasi film
• *${this.prefix}meme* - Generator meme

*📰 INFORMASI*
• *${this.prefix}news* - Berita terkini
• *${this.prefix}weather* - Info cuaca
• *${this.prefix}dictionary* - Kamus
• *${this.prefix}translate* - Penerjemah

*🛠️ UTILITAS*
• *${this.prefix}qr* - Generator QR Code
• *${this.prefix}calculator* - Kalkulator
• *${this.prefix}ocr* - Ekstrak teks dari gambar
• *${this.prefix}converter* - Konversi file

*Ketik kategori untuk detail lebih lanjut*
Contoh: *${this.prefix}productivity*`;

        await this.sendMessage(phoneNumber, menuMessage);
    }

    async sendUnknownCommandMessage(phoneNumber, command) {
        const message = `❌ Perintah *${command}* tidak dikenali.

Ketik *${this.prefix}menu* untuk melihat semua fitur yang tersedia atau *${this.prefix}help* untuk bantuan.`;
        
        await this.sendMessage(phoneNumber, message);
    }

    async sendDefaultResponse(phoneNumber) {
        const responses = [
            "🤔 Maaf, saya tidak mengerti. Ketik *!help* untuk bantuan.",
            "❓ Tidak yakin apa yang Anda maksud. Coba ketik *!menu* untuk melihat fitur.",
            "💡 Butuh bantuan? Ketik *!help* untuk panduan lengkap.",
            "🎯 Ingin tahu fitur apa saja? Ketik *!menu* untuk melihat semuanya."
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        await this.sendMessage(phoneNumber, randomResponse);
    }

    async sendErrorMessage(phoneNumber) {
        const message = `❌ Maaf, terjadi kesalahan dalam memproses permintaan Anda.

Silakan coba lagi atau hubungi admin jika masalah berlanjut.`;
        
        await this.sendMessage(phoneNumber, message);
    }

    async sendMessage(phoneNumber, message) {
        try {
            await this.client.sendMessage(phoneNumber, message);
        } catch (error) {
            this.logger.error('Error sending message:', error);
        }
    }

    async sendMedia(phoneNumber, mediaData) {
        try {
            const { data, mimetype, filename } = mediaData;
            const media = new MessageMedia(mimetype, data, filename);
            await this.client.sendMessage(phoneNumber, media);
        } catch (error) {
            this.logger.error('Error sending media:', error);
        }
    }
}

module.exports = MessageHandler; 