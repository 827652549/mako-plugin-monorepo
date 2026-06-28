import { JobPosting, JobSnapshot, StorageData } from './types';
import { STORAGE_FILE } from './constants';
import fs from 'fs';
import path from 'path';

export class CareerStorage {
  private dataPath: string;

  constructor(customPath?: string) {
    this.dataPath = customPath || path.join(process.cwd(), STORAGE_FILE);
  }

  async saveSnapshot(jobs: JobPosting[]): Promise<JobSnapshot> {
    const snapshot: JobSnapshot = {
      timestamp: new Date().toISOString(),
      jobs,
    };

    const data = await this.loadData();
    data.snapshots.push(snapshot);
    data.latestSnapshot = snapshot;

    await this.saveData(data);
    return snapshot;
  }

  async loadData(): Promise<StorageData> {
    try {
      if (fs.existsSync(this.dataPath)) {
        const content = fs.readFileSync(this.dataPath, 'utf-8');
        return JSON.parse(content) as StorageData;
      }
    } catch (error) {
      console.warn('读取存储数据失败，将使用默认数据:', error);
    }

    // 默认空数据
    return {
      snapshots: [],
    };
  }

  async saveData(data: StorageData): Promise<void> {
    try {
      const dir = path.dirname(this.dataPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.dataPath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      console.error('保存数据失败:', error);
      throw error;
    }
  }

  async getLatestJobs(): Promise<JobPosting[] | null> {
    const data = await this.loadData();
    return data.latestSnapshot?.jobs || null;
  }

  async getAllSnapshots(): Promise<JobSnapshot[]> {
    const data = await this.loadData();
    return data.snapshots;
  }

  async clearHistory(): Promise<void> {
    const emptyData: StorageData = {
      snapshots: [],
    };
    await this.saveData(emptyData);
  }

  async getNewJobsSince(lastTimestamp: string): Promise<JobPosting[]> {
    const data = await this.loadData();
    const lastDate = new Date(lastTimestamp);

    const allJobs: JobPosting[] = [];
    data.snapshots.forEach(snapshot => {
      if (new Date(snapshot.timestamp) > lastDate) {
        allJobs.push(...snapshot.jobs);
      }
    });

    // 去重
    const uniqueJobs = this.removeDuplicates(allJobs);
    return uniqueJobs;
  }

  private removeDuplicates(jobs: JobPosting[]): JobPosting[] {
    const seen = new Set<string>();
    return jobs.filter(job => {
      if (seen.has(job.id)) {
        return false;
      }
      seen.add(job.id);
      return true;
    });
  }
}