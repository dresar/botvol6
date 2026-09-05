const path = require('path');
const fs = require('fs');

// Import semua kategori fitur
const ProductivityFeatures = require('./productivity/ProductivityFeatures');
const FinanceFeatures = require('./finance/FinanceFeatures');
const EntertainmentFeatures = require('./entertainment/EntertainmentFeatures');
const InformationFeatures = require('./information/InformationFeatures');
const UtilityFeatures = require('./utilities/UtilityFeatures');
const AdminFeatures = require('./admin/AdminFeatures');

class FeatureManager {
    constructor(client, databaseManager) {
        this.client = client;
        this.databaseManager = databaseManager;
        this.logger = require('../utils/Logger');
        this.config = require('../config/Config');
        
        // Inisialisasi semua kategori fitur
        this.productivity = new ProductivityFeatures(client, databaseManager);
        this.finance = new FinanceFeatures(client, databaseManager);
        this.entertainment = new EntertainmentFeatures(client, databaseManager);
        this.information = new InformationFeatures(client, databaseManager);
        this.utilities = new UtilityFeatures(client, databaseManager);
        this.admin = new AdminFeatures(client, databaseManager);
        
        // Mapping semua fitur
        this.features = new Map();
        this.initializeFeatures();
    }

    async initialize() {
        this.logger.info('🚀 Inisialisasi Feature Manager...');
        
        // Inisialisasi semua kategori
        await this.productivity.initialize();
        await this.finance.initialize();
        await this.entertainment.initialize();
        await this.information.initialize();
        await this.utilities.initialize();
        await this.admin.initialize();
        
        this.logger.success(`✅ Feature Manager siap dengan ${this.features.size} fitur`);
    }

    initializeFeatures() {
        // Mapping fitur produktivitas
        this.mapFeatures(this.productivity.getFeatures(), 'productivity');
        
        // Mapping fitur keuangan
        this.mapFeatures(this.finance.getFeatures(), 'finance');
        
        // Mapping fitur hiburan
        this.mapFeatures(this.entertainment.getFeatures(), 'entertainment');
        
        // Mapping fitur informasi
        this.mapFeatures(this.information.getFeatures(), 'information');
        
        // Mapping fitur utilitas
        this.mapFeatures(this.utilities.getFeatures(), 'utilities');
        
        // Mapping fitur admin
        this.mapFeatures(this.admin.getFeatures(), 'admin');
    }

    mapFeatures(featureList, category) {
        featureList.forEach(feature => {
            this.features.set(feature.name, {
                ...feature,
                category: category
            });
        });
    }

    async executeFeature(featureName, phoneNumber, data = {}) {
        try {
            const feature = this.features.get(featureName);
            
            if (!feature) {
                return { success: false, message: `Fitur ${featureName} tidak ditemukan` };
            }

            // Log eksekusi fitur
            this.logger.featureLog(featureName, `Executed by ${phoneNumber}`, data);

            // Track usage
            await this.databaseManager.trackFeatureUsage(phoneNumber, featureName);

            // Execute feature
            const startTime = Date.now();
            const result = await feature.execute(phoneNumber, data);
            const duration = Date.now() - startTime;

            // Log performance
            this.logger.performanceLog(featureName, duration);

            return {
                success: true,
                ...result
            };

        } catch (error) {
            this.logger.error(`Error executing feature ${featureName}:`, error);
            return {
                success: false,
                message: `Terjadi kesalahan saat menjalankan fitur ${featureName}`
            };
        }
    }

    getTotalFeatures() {
        return this.features.size;
    }

    getFeaturesByCategory(category) {
        return Array.from(this.features.values())
            .filter(feature => feature.category === category)
            .map(feature => ({
                name: feature.name,
                description: feature.description,
                usage: feature.usage
            }));
    }

    getAllFeatures() {
        const categories = {};
        
        for (const [name, feature] of this.features) {
            if (!categories[feature.category]) {
                categories[feature.category] = [];
            }
            
            categories[feature.category].push({
                name: name,
                description: feature.description,
                usage: feature.usage
            });
        }
        
        return categories;
    }

    // Helper methods untuk fitur umum
    async getUser(phoneNumber) {
        let user = await this.databaseManager.getUser(phoneNumber);
        if (!user) {
            await this.databaseManager.createUser(phoneNumber);
            user = await this.databaseManager.getUser(phoneNumber);
        }
        return user;
    }

    async isAdmin(phoneNumber) {
        const user = await this.getUser(phoneNumber);
        return user && user.is_admin === 1;
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
            const { MessageMedia } = require('waweb.js');
            const media = new MessageMedia(mediaData.mimetype, mediaData.data, mediaData.filename);
            await this.client.sendMessage(phoneNumber, media);
        } catch (error) {
            this.logger.error('Error sending media:', error);
        }
    }

    // Rate limiting
    async checkRateLimit(phoneNumber, featureName) {
        const key = `rate_limit:${phoneNumber}:${featureName}`;
        const limit = this.config.get('security.rateLimit.max');
        const windowMs = this.config.get('security.rateLimit.windowMs');
        
        // Simple rate limiting implementation
        // In production, use Redis or similar for better performance
        return true; // Placeholder
    }

    // Feature availability check
    isFeatureEnabled(featureName) {
        const feature = this.features.get(featureName);
        if (!feature) return false;
        
        const configPath = `features.${feature.category}.${featureName}.enabled`;
        return this.config.get(configPath) !== false;
    }

    // Get feature statistics
    async getFeatureStats(featureName) {
        const sql = `
            SELECT 
                COUNT(*) as total_usage,
                COUNT(DISTINCT user_id) as unique_users,
                MAX(last_used) as last_used
            FROM usage_stats 
            WHERE feature_name = ?
        `;
        
        return await this.databaseManager.get(sql, [featureName]);
    }

    // Get user statistics
    async getUserStats(phoneNumber) {
        const user = await this.getUser(phoneNumber);
        if (!user) return null;
        
        const sql = `
            SELECT 
                feature_name,
                usage_count,
                last_used
            FROM usage_stats 
            WHERE user_id = ?
            ORDER BY usage_count DESC
            LIMIT 10
        `;
        
        return await this.databaseManager.all(sql, [user.id]);
    }

    // Search features
    searchFeatures(query) {
        const results = [];
        const searchTerm = query.toLowerCase();
        
        for (const [name, feature] of this.features) {
            if (name.toLowerCase().includes(searchTerm) ||
                feature.description.toLowerCase().includes(searchTerm) ||
                feature.usage.toLowerCase().includes(searchTerm)) {
                results.push({
                    name: name,
                    category: feature.category,
                    description: feature.description,
                    usage: feature.usage
                });
            }
        }
        
        return results;
    }

    // Get feature help
    getFeatureHelp(featureName) {
        const feature = this.features.get(featureName);
        if (!feature) return null;
        
        return {
            name: featureName,
            description: feature.description,
            usage: feature.usage,
            examples: feature.examples || [],
            category: feature.category
        };
    }

    // Batch execute features
    async executeBatch(phoneNumber, features) {
        const results = [];
        
        for (const featureName of features) {
            const result = await this.executeFeature(featureName, phoneNumber);
            results.push({
                feature: featureName,
                success: result.success,
                message: result.message
            });
        }
        
        return results;
    }

    // Get system status
    async getSystemStatus() {
        const totalFeatures = this.getTotalFeatures();
        const enabledFeatures = Array.from(this.features.values())
            .filter(feature => this.isFeatureEnabled(feature.name))
            .length;
        
        return {
            totalFeatures,
            enabledFeatures,
            disabledFeatures: totalFeatures - enabledFeatures,
            categories: Object.keys(this.getAllFeatures()),
            uptime: process.uptime(),
            memory: process.memoryUsage()
        };
    }
}

module.exports = FeatureManager; 