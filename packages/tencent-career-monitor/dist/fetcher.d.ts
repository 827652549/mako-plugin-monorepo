import { JobPosting } from './types';
export declare class TencentCareerFetcher {
    fetchJobs(): Promise<JobPosting[]>;
    private parseHtml;
    private parseJobElement;
    private parsePublishDate;
    private generateJobId;
}
