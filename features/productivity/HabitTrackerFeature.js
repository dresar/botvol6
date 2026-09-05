class HabitTrackerFeature {
    constructor(client, databaseManager) {
        this.client = client;
        this.databaseManager = databaseManager;
        this.logger = require('../../utils/Logger');
        this.config = require('../../config/Config');
        
        this.name = 'habit';
        this.description = 'Pelacak kebiasaan harian';
        this.usage = '!habit <add/track/list/stats> [detail]';
        this.examples = [
            '!habit add "Olahraga" daily',
            '!habit track "Olahraga"',
            '!habit list'
        ];
    }

    async execute(phoneNumber, data) {
        return {
            message: '📊 Fitur Habit Tracker sedang dalam pengembangan...'
        };
    }
}

module.exports = HabitTrackerFeature; 