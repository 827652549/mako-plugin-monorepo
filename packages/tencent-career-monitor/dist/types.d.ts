export interface JobPosting {
    id: string;
    title: string;
    department: string;
    location: string;
    publishDate: string;
    jobType?: string;
    link: string;
    isShanghai: boolean;
    isToday: boolean;
    fetchedAt: string;
}
export interface JobSnapshot {
    timestamp: string;
    jobs: JobPosting[];
}
export interface MonitorResult {
    metadata: {
        generatedAt: string;
        totalJobs: number;
        newToday: number;
        shanghaiJobs: number;
    };
    jobs: JobPosting[];
}
export interface StorageData {
    snapshots: JobSnapshot[];
    latestSnapshot?: JobSnapshot;
}
