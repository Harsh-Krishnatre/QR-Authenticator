const UserModel = require('../models/User');

class UserService {
    constructor(model) {
        this.model = model;
    }

    findByEmail(email) {
        if (!email) return null;
        return this.model.findOne({ email: email.toLowerCase().trim() });
    }

    async createUser(data) {
        /* eslint-disable-next-line new-cap */
        const doc = new this.model(data);
        await doc.validate();
        return doc.save();
    }

    async cleanupExpiredData() {
        return this.model.cleanupExpiredData();
    }

    async deletePendingOlderThan(cutoffDate) {
        return this.model.deleteMany({ accountStatus: 'pending_verification', createdAt: { $lt: cutoffDate } });
    }

    async addSessionToUser(userId, session) {
        const user = await this.model.findById(userId);
        if (!user) return null;
        return user.addSession(session.sessionId, session.deviceInfo, session.expiresAt);
    }

    async removeSession(userId, sessionId) {
        const user = await this.model.findById(userId);
        if (!user) return null;
        return user.removeSession(sessionId);
    }

    async incrementFailedAttempts(userId) {
        const user = await this.model.findById(userId);
        if (!user) return null;
        return user.incrementFailedAttempts();
    }

    async resetFailedAttempts(userId) {
        const user = await this.model.findById(userId);
        if (!user) return null;
        return user.resetFailedAttempts();
    }
}

module.exports = new UserService(UserModel);
