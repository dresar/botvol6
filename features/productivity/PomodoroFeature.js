class PomodoroFeature {
    constructor(client, databaseManager) {
        this.client = client;
        this.databaseManager = databaseManager;
        this.logger = require('../../utils/Logger');
        this.config = require('../../config/Config');
        
        this.name = 'pomodoro';
        this.description = 'Teknik Pomodoro untuk produktivitas';
        this.usage = '!pomodoro <start/stop/status> [duration]';
        this.examples = [
            '!pomodoro start',
            '!pomodoro stop',
            '!pomodoro status'
        ];
    }

    async execute(phoneNumber, data) {
        return {
            message: '🍅 Fitur Pomodoro sedang dalam pengembangan...'
        };
    }
}

module.exports = PomodoroFeature; 