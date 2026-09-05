const fs = require('fs');
const path = require('path');

class Logger {
    constructor() {
        this.logDir = './logs';
        this.ensureLogDirectory();
    }

    ensureLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    getTimestamp() {
        return new Date().toISOString();
    }

    formatMessage(level, message, data = null) {
        const timestamp = this.getTimestamp();
        let formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
        
        if (data) {
            formattedMessage += ` | Data: ${JSON.stringify(data)}`;
        }
        
        return formattedMessage;
    }

    writeToFile(message) {
        const logFile = path.join(this.logDir, 'botify.log');
        const formattedMessage = message + '\n';
        
        fs.appendFileSync(logFile, formattedMessage);
    }

    info(message, data = null) {
        const formattedMessage = this.formatMessage('info', message, data);
        console.log(`ℹ️  ${message}`);
        this.writeToFile(formattedMessage);
    }

    success(message, data = null) {
        const formattedMessage = this.formatMessage('success', message, data);
        console.log(`✅ ${message}`);
        this.writeToFile(formattedMessage);
    }

    warn(message, data = null) {
        const formattedMessage = this.formatMessage('warn', message, data);
        console.log(`⚠️  ${message}`);
        this.writeToFile(formattedMessage);
    }

    error(message, data = null) {
        const formattedMessage = this.formatMessage('error', message, data);
        console.log(`❌ ${message}`);
        this.writeToFile(formattedMessage);
    }

    debug(message, data = null) {
        if (process.env.NODE_ENV === 'development') {
            const formattedMessage = this.formatMessage('debug', message, data);
            console.log(`🔍 ${message}`);
            this.writeToFile(formattedMessage);
        }
    }

    // Log khusus untuk fitur
    featureLog(featureName, action, data = null) {
        const message = `[FEATURE: ${featureName}] ${action}`;
        this.info(message, data);
    }

    // Log untuk performa
    performanceLog(operation, duration, data = null) {
        const message = `[PERFORMANCE] ${operation} completed in ${duration}ms`;
        this.info(message, data);
    }

    // Log untuk error dengan stack trace
    errorWithStack(message, error) {
        const data = {
            message: error.message,
            stack: error.stack,
            name: error.name
        };
        this.error(message, data);
    }
}

module.exports = Logger; 