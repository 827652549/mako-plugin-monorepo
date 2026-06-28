import { JobPosting, JobSnapshot, StorageData } from './types';
export declare class CareerStorage {
    private dataPath;
    constructor(customPath?: string);
    saveSnapshot(jobs: JobPosting[]): Promise<JobSnapshot>;
    loadData(): Promise<StorageData>;
    saveData(data: StorageData): Promise<void>;
    getLatestJobs(): Promise<JobPosting[] | null>;
    getAllSnapshots(): Promise<JobSnapshot[]>;
    clearHistory(): Promise<void>;
    getNewJobsSince(lastTimestamp: string): Promise<JobPosting[]>;
    private removeDuplicates;
}
