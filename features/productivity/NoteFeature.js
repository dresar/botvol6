class NoteFeature {
    constructor(client, databaseManager) {
        this.client = client;
        this.databaseManager = databaseManager;
        this.logger = require('../../utils/Logger');
        this.config = require('../../config/Config');
        
        this.name = 'note';
        this.description = 'Kelola catatan pribadi';
        this.usage = '!note <add/list/view/delete> [detail]';
        this.examples = [
            '!note add "Ide bisnis" "Catatan penting untuk bisnis"',
            '!note list',
            '!note view 1'
        ];
    }

    async execute(phoneNumber, data) {
        const args = data.args || [];
        const command = args[0]?.toLowerCase();

        switch (command) {
            case 'add':
                return await this.addNote(phoneNumber, args.slice(1));
            case 'list':
                return await this.listNotes(phoneNumber);
            case 'view':
                return await this.viewNote(phoneNumber, args[1]);
            case 'delete':
                return await this.deleteNote(phoneNumber, args[1]);
            case 'edit':
                return await this.editNote(phoneNumber, args.slice(1));
            default:
                return await this.showHelp(phoneNumber);
        }
    }

    async addNote(phoneNumber, args) {
        if (args.length < 2) {
            return {
                message: `❌ Format: !note add "judul" "isi catatan"
Contoh: !note add "Ide bisnis" "Catatan penting untuk bisnis"`
            };
        }

        const title = args[0].replace(/"/g, '');
        const content = args[1].replace(/"/g, '');

        try {
            const user = await this.databaseManager.getUser(phoneNumber);
            const sql = `INSERT INTO notes (user_id, title, content) VALUES (?, ?, ?)`;
            await this.databaseManager.run(sql, [user.id, title, content]);

            return {
                message: `✅ Catatan berhasil ditambahkan!
📝 *${title}*
📄 ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`
            };

        } catch (error) {
            this.logger.error('Error adding note:', error);
            return {
                message: '❌ Terjadi kesalahan saat menambahkan catatan'
            };
        }
    }

    async listNotes(phoneNumber) {
        try {
            const user = await this.databaseManager.getUser(phoneNumber);
            const sql = `SELECT * FROM notes WHERE user_id = ? ORDER BY created_at DESC`;
            const notes = await this.databaseManager.all(sql, [user.id]);

            if (notes.length === 0) {
                return {
                    message: '📝 Tidak ada catatan'
                };
            }

            let message = `📋 *Daftar Catatan Anda*\n\n`;
            
            notes.forEach((note, index) => {
                const date = new Date(note.created_at).toLocaleDateString('id-ID');
                message += `${index + 1}. *${note.title}*\n`;
                message += `   📅 ${date}\n`;
                message += `   ID: ${note.id}\n\n`;
            });

            return { message };

        } catch (error) {
            this.logger.error('Error listing notes:', error);
            return {
                message: '❌ Terjadi kesalahan saat mengambil daftar catatan'
            };
        }
    }

    async viewNote(phoneNumber, noteId) {
        if (!noteId) {
            return {
                message: '❌ Format: !note view <ID>'
            };
        }

        try {
            const user = await this.databaseManager.getUser(phoneNumber);
            const sql = `SELECT * FROM notes WHERE id = ? AND user_id = ?`;
            const note = await this.databaseManager.get(sql, [noteId, user.id]);

            if (!note) {
                return {
                    message: '❌ Catatan tidak ditemukan'
                };
            }

            const date = new Date(note.created_at).toLocaleDateString('id-ID');
            const message = `📝 *${note.title}*

📄 ${note.content}

📅 Dibuat: ${date}
🆔 ID: ${note.id}`;

            return { message };

        } catch (error) {
            this.logger.error('Error viewing note:', error);
            return {
                message: '❌ Terjadi kesalahan saat melihat catatan'
            };
        }
    }

    async deleteNote(phoneNumber, noteId) {
        if (!noteId) {
            return {
                message: '❌ Format: !note delete <ID>'
            };
        }

        try {
            const user = await this.databaseManager.getUser(phoneNumber);
            const sql = `DELETE FROM notes WHERE id = ? AND user_id = ?`;
            const result = await this.databaseManager.run(sql, [noteId, user.id]);

            if (result.changes > 0) {
                return {
                    message: '✅ Catatan berhasil dihapus'
                };
            } else {
                return {
                    message: '❌ Catatan tidak ditemukan'
                };
            }

        } catch (error) {
            this.logger.error('Error deleting note:', error);
            return {
                message: '❌ Terjadi kesalahan saat menghapus catatan'
            };
        }
    }

    async editNote(phoneNumber, args) {
        if (args.length < 2) {
            return {
                message: '❌ Format: !note edit <ID> "isi baru"'
            };
        }

        const noteId = args[0];
        const newContent = args[1].replace(/"/g, '');

        try {
            const user = await this.databaseManager.getUser(phoneNumber);
            const sql = `UPDATE notes SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`;
            const result = await this.databaseManager.run(sql, [newContent, noteId, user.id]);

            if (result.changes > 0) {
                return {
                    message: `✅ Catatan berhasil diperbarui!
📄 ${newContent.substring(0, 50)}${newContent.length > 50 ? '...' : ''}`
                };
            } else {
                return {
                    message: '❌ Catatan tidak ditemukan'
                };
            }

        } catch (error) {
            this.logger.error('Error editing note:', error);
            return {
                message: '❌ Terjadi kesalahan saat mengedit catatan'
            };
        }
    }

    async showHelp(phoneNumber) {
        const helpMessage = `📝 *Fitur Catatan Pribadi*

*Perintah yang tersedia:*
• *!note add* - Tambah catatan baru
• *!note list* - Lihat semua catatan
• *!note view* - Lihat isi catatan
• *!note delete* - Hapus catatan
• *!note edit* - Edit isi catatan

*Contoh penggunaan:*
• \`!note add "Ide bisnis" "Catatan penting untuk bisnis"\`
• \`!note list\`
• \`!note view 1\`
• \`!note delete 1\`
• \`!note edit 1 "Isi catatan yang diperbarui"\`

*Fitur:*
• 📝 Simpan catatan pribadi
• 📋 Daftar semua catatan
• 🔍 Lihat isi catatan lengkap
• ✏️ Edit catatan
• 🗑️ Hapus catatan`;

        return { message: helpMessage };
    }
}

module.exports = NoteFeature; 