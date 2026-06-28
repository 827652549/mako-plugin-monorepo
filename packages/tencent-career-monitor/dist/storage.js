"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CareerStorage = void 0;
const constants_1 = require("./constants");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class CareerStorage {
    constructor(customPath) {
        this.dataPath = customPath || path_1.default.join(process.cwd(), constants_1.STORAGE_FILE);
    }
    async saveSnapshot(jobs) {
        const snapshot = {
            timestamp: new Date().toISOString(),
            jobs,
        };
        const data = await this.loadData();
        data.snapshots.push(snapshot);
        data.latestSnapshot = snapshot;
        await this.saveData(data);
        return snapshot;
    }
    async loadData() {
        try {
            if (fs_1.default.existsSync(this.dataPath)) {
                const content = fs_1.default.readFileSync(this.dataPath, 'utf-8');
                return JSON.parse(content);
            }
        }
        catch (error) {
            console.warn('读取存储数据失败，将使用默认数据:', error);
        }
        // 默认空数据
        return {
            snapshots: [],
        };
    }
    async saveData(data) {
        try {
            const dir = path_1.default.dirname(this.dataPath);
            if (!fs_1.default.existsSync(dir)) {
                fs_1.default.mkdirSync(dir, { recursive: true });
            }
            fs_1.default.writeFileSync(this.dataPath, JSON.stringify(data, null, 2), 'utf-8');
        }
        catch (error) {
            console.error('保存数据失败:', error);
            throw error;
        }
    }
    async getLatestJobs() {
        const data = await this.loadData();
        return data.latestSnapshot?.jobs || null;
    }
    async getAllSnapshots() {
        const data = await this.loadData();
        return data.snapshots;
    }
    async clearHistory() {
        const emptyData = {
            snapshots: [],
        };
        await this.saveData(emptyData);
    }
    async getNewJobsSince(lastTimestamp) {
        const data = await this.loadData();
        const lastDate = new Date(lastTimestamp);
        const allJobs = [];
        data.snapshots.forEach(snapshot => {
            if (new Date(snapshot.timestamp) > lastDate) {
                allJobs.push(...snapshot.jobs);
            }
        });
        // 去重
        const uniqueJobs = this.removeDuplicates(allJobs);
        return uniqueJobs;
    }
    removeDuplicates(jobs) {
        const seen = new Set();
        return jobs.filter(job => {
            if (seen.has(job.id)) {
                return false;
            }
            seen.add(job.id);
            return true;
        });
    }
}
exports.CareerStorage = CareerStorage;
//# sourceMappingURL=storage.js.map