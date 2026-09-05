const ReminderFeature = require('./ReminderFeature');
const TaskFeature = require('./TaskFeature');
const NoteFeature = require('./NoteFeature');
const CalendarFeature = require('./CalendarFeature');
const TimerFeature = require('./TimerFeature');
const PomodoroFeature = require('./PomodoroFeature');
const HabitTrackerFeature = require('./HabitTrackerFeature');
const GoalTrackerFeature = require('./GoalTrackerFeature');
const TimeTrackerFeature = require('./TimeTrackerFeature');
const ProjectManagerFeature = require('./ProjectManagerFeature');
const MeetingSchedulerFeature = require('./MeetingSchedulerFeature');
const EmailManagerFeature = require('./EmailManagerFeature');
const DocumentManagerFeature = require('./DocumentManagerFeature');
const PasswordManagerFeature = require('./PasswordManagerFeature');
const BackupManagerFeature = require('./BackupManagerFeature');

class ProductivityFeatures {
    constructor(client, databaseManager) {
        this.client = client;
        this.databaseManager = databaseManager;
        this.logger = require('../../utils/Logger');
        this.config = require('../../config/Config');
        
        // Inisialisasi semua fitur produktivitas
        this.features = [
            new ReminderFeature(client, databaseManager),
            new TaskFeature(client, databaseManager),
            new NoteFeature(client, databaseManager),
            new CalendarFeature(client, databaseManager),
            new TimerFeature(client, databaseManager),
            new PomodoroFeature(client, databaseManager),
            new HabitTrackerFeature(client, databaseManager),
            new GoalTrackerFeature(client, databaseManager),
            new TimeTrackerFeature(client, databaseManager),
            new ProjectManagerFeature(client, databaseManager),
            new MeetingSchedulerFeature(client, databaseManager),
            new EmailManagerFeature(client, databaseManager),
            new DocumentManagerFeature(client, databaseManager),
            new PasswordManagerFeature(client, databaseManager),
            new BackupManagerFeature(client, databaseManager)
        ];
    }

    async initialize() {
        this.logger.info('🚀 Inisialisasi Productivity Features...');
        
        for (const feature of this.features) {
            if (feature.initialize) {
                await feature.initialize();
            }
        }
        
        this.logger.success(`✅ Productivity Features siap dengan ${this.features.length} fitur`);
    }

    getFeatures() {
        return this.features.map(feature => ({
            name: feature.name,
            description: feature.description,
            usage: feature.usage,
            examples: feature.examples || [],
            execute: feature.execute.bind(feature)
        }));
    }
}

module.exports = ProductivityFeatures; 