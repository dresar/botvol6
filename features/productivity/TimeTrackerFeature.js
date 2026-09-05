class TimeTrackerFeature {
    constructor(client, databaseManager) {
        this.client = client;
        this.databaseManager = databaseManager;
        this.logger = require('../../utils/Logger');
        this.config = require('../../config/Config');
        
        this.name = 'timetrack';
        this.description = 'Pelacak waktu kerja dan aktivitas';
        this.usage = '!timetrack <start/stop/list/stats> [project]';
        this.examples = [
            '!timetrack start "Project A"',
            '!timetrack stop',
            '!timetrack stats'
        ];
    }

    async execute(phoneNumber, data) {
        return {
            message: '⏰ Fitur Time Tracker sedang dalam pengembangan...'
        };
    }
}

module.exports = TimeTrackerFeature; 