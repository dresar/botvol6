class GoalTrackerFeature {
    constructor(client, databaseManager) {
        this.client = client;
        this.databaseManager = databaseManager;
        this.logger = require('../../utils/Logger');
        this.config = require('../../config/Config');
        
        this.name = 'goal';
        this.description = 'Pelacak tujuan dan target';
        this.usage = '!goal <add/track/list/stats> [detail]';
        this.examples = [
            '!goal add "Belajar bahasa Inggris" 3 months',
            '!goal track "Belajar bahasa Inggris"',
            '!goal list'
        ];
    }

    async execute(phoneNumber, data) {
        return {
            message: '🎯 Fitur Goal Tracker sedang dalam pengembangan...'
        };
    }
}

module.exports = GoalTrackerFeature; 