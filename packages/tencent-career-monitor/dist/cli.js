#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const fetcher_1 = require("./fetcher");
const storage_1 = require("./storage");
const dayjs_1 = __importDefault(require("dayjs"));
const program = new commander_1.Command();
program
    .name('tencent-career')
    .description('监控腾讯前端岗位招聘信息')
    .version('0.1.0');
program
    .command('fetch')
    .description('抓取最新的腾讯前端岗位信息')
    .option('-o, --output <file>', '输出JSON文件路径')
    .option('--no-save', '不保存到历史记录')
    .action(async (options) => {
    try {
        console.log('开始抓取腾讯前端岗位信息...');
        const fetcher = new fetcher_1.TencentCareerFetcher();
        const jobs = await fetcher.fetchJobs();
        console.log(`抓取到 ${jobs.length} 个岗位`);
        // 统计信息
        const todayJobs = jobs.filter(job => job.isToday);
        const shanghaiJobs = jobs.filter(job => job.isShanghai);
        console.log(`今日新岗位: ${todayJobs.length}`);
        console.log(`上海岗位: ${shanghaiJobs.length}`);
        // 保存到历史记录
        if (options.save !== false) {
            const storage = new storage_1.CareerStorage();
            await storage.saveSnapshot(jobs);
            console.log('数据已保存到历史记录');
        }
        // 输出到文件
        if (options.output) {
            const fs = await Promise.resolve().then(() => __importStar(require('fs')));
            const path = await Promise.resolve().then(() => __importStar(require('path')));
            const outputPath = path.resolve(options.output);
            const result = {
                metadata: {
                    generatedAt: new Date().toISOString(),
                    totalJobs: jobs.length,
                    newToday: todayJobs.length,
                    shanghaiJobs: shanghaiJobs.length,
                },
                jobs,
            };
            fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');
            console.log(`数据已保存到: ${outputPath}`);
        }
        // 控制台输出摘要
        console.log('\n=== 岗位摘要 ===');
        jobs.slice(0, 5).forEach((job, index) => {
            const tags = [];
            if (job.isToday)
                tags.push('今日');
            if (job.isShanghai)
                tags.push('上海');
            const tagStr = tags.length > 0 ? ` [${tags.join(', ')}]` : '';
            console.log(`${index + 1}. ${job.title} - ${job.department} - ${job.location}${tagStr}`);
        });
        if (jobs.length > 5) {
            console.log(`... 以及 ${jobs.length - 5} 个更多岗位`);
        }
    }
    catch (error) {
        console.error('抓取失败:', error);
        process.exit(1);
    }
});
program
    .command('list')
    .description('列出历史记录中的岗位')
    .option('-l, --limit <number>', '限制显示数量', '20')
    .option('--today', '只显示今日岗位')
    .option('--shanghai', '只显示上海岗位')
    .option('--sort <field>', '排序字段 (date, title, location)', 'date')
    .option('--reverse', '反向排序')
    .action(async (options) => {
    try {
        const storage = new storage_1.CareerStorage();
        const data = await storage.loadData();
        const latestJobs = data.latestSnapshot?.jobs || [];
        if (latestJobs.length === 0) {
            console.log('没有找到岗位数据，请先运行 fetch 命令');
            return;
        }
        // 过滤
        let filteredJobs = [...latestJobs];
        if (options.today) {
            filteredJobs = filteredJobs.filter(job => job.isToday);
        }
        if (options.shanghai) {
            filteredJobs = filteredJobs.filter(job => job.isShanghai);
        }
        // 排序
        filteredJobs.sort((a, b) => {
            let comparison = 0;
            switch (options.sort) {
                case 'date':
                    comparison = (0, dayjs_1.default)(b.publishDate).diff((0, dayjs_1.default)(a.publishDate));
                    break;
                case 'title':
                    comparison = a.title.localeCompare(b.title);
                    break;
                case 'location':
                    comparison = a.location.localeCompare(b.location);
                    break;
                default:
                    comparison = (0, dayjs_1.default)(b.publishDate).diff((0, dayjs_1.default)(a.publishDate));
            }
            return options.reverse ? -comparison : comparison;
        });
        // 限制数量
        const limit = parseInt(options.limit, 10);
        const displayJobs = filteredJobs.slice(0, limit);
        console.log(`显示 ${displayJobs.length} 个岗位 (共 ${filteredJobs.length} 个):\n`);
        displayJobs.forEach((job, index) => {
            const tags = [];
            if (job.isToday)
                tags.push('今日');
            if (job.isShanghai)
                tags.push('上海');
            const tagStr = tags.length > 0 ? ` [${tags.join(', ')}]` : '';
            console.log(`${index + 1}. ${job.title}`);
            console.log(`   部门: ${job.department}`);
            console.log(`   地点: ${job.location}`);
            console.log(`   发布日期: ${job.publishDate}${tagStr}`);
            console.log(`   链接: ${job.link}`);
            console.log('');
        });
    }
    catch (error) {
        console.error('列出岗位失败:', error);
        process.exit(1);
    }
});
program
    .command('report')
    .description('生成详细报告')
    .option('-o, --output <file>', '输出JSON文件路径')
    .action(async (options) => {
    try {
        const storage = new storage_1.CareerStorage();
        const data = await storage.loadData();
        const latestJobs = data.latestSnapshot?.jobs || [];
        if (latestJobs.length === 0) {
            console.log('没有找到岗位数据，请先运行 fetch 命令');
            return;
        }
        const todayJobs = latestJobs.filter(job => job.isToday);
        const shanghaiJobs = latestJobs.filter(job => job.isShanghai);
        const result = {
            metadata: {
                generatedAt: new Date().toISOString(),
                totalJobs: latestJobs.length,
                newToday: todayJobs.length,
                shanghaiJobs: shanghaiJobs.length,
            },
            jobs: latestJobs,
        };
        // 控制台输出
        console.log('=== 腾讯前端岗位监控报告 ===');
        console.log(`生成时间: ${result.metadata.generatedAt}`);
        console.log(`总岗位数: ${result.metadata.totalJobs}`);
        console.log(`今日新岗位: ${result.metadata.newToday}`);
        console.log(`上海岗位: ${result.metadata.shanghaiJobs}`);
        console.log('\n📢 今日最新岗位:');
        todayJobs.forEach((job, index) => {
            console.log(`  ${index + 1}. ${job.title} - ${job.department} - ${job.location}`);
        });
        console.log('\n📍 上海岗位:');
        shanghaiJobs.forEach((job, index) => {
            console.log(`  ${index + 1}. ${job.title} - ${job.department} - ${job.location}`);
        });
        console.log('\n📅 所有岗位 (按日期排序):');
        const sortedJobs = [...latestJobs].sort((a, b) => (0, dayjs_1.default)(b.publishDate).diff((0, dayjs_1.default)(a.publishDate)));
        sortedJobs.forEach((job, index) => {
            const tags = [];
            if (job.isToday)
                tags.push('今日');
            if (job.isShanghai)
                tags.push('上海');
            const tagStr = tags.length > 0 ? ` [${tags.join(', ')}]` : '';
            console.log(`  ${index + 1}. ${job.title} - ${job.department} - ${job.location} - ${job.publishDate}${tagStr}`);
        });
        // 输出到文件
        if (options.output) {
            const fs = await Promise.resolve().then(() => __importStar(require('fs')));
            const path = await Promise.resolve().then(() => __importStar(require('path')));
            const outputPath = path.resolve(options.output);
            fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');
            console.log(`\n报告已保存到: ${outputPath}`);
        }
    }
    catch (error) {
        console.error('生成报告失败:', error);
        process.exit(1);
    }
});
program
    .command('history')
    .description('查看抓取历史')
    .action(async () => {
    try {
        const storage = new storage_1.CareerStorage();
        const snapshots = await storage.getAllSnapshots();
        console.log(`共 ${snapshots.length} 次抓取记录:\n`);
        snapshots.forEach((snapshot, index) => {
            const date = (0, dayjs_1.default)(snapshot.timestamp).format('YYYY-MM-DD HH:mm:ss');
            console.log(`${index + 1}. ${date} - ${snapshot.jobs.length} 个岗位`);
        });
    }
    catch (error) {
        console.error('查看历史失败:', error);
        process.exit(1);
    }
});
program
    .command('clear')
    .description('清除所有历史数据')
    .action(async () => {
    try {
        const storage = new storage_1.CareerStorage();
        await storage.clearHistory();
        console.log('历史数据已清除');
    }
    catch (error) {
        console.error('清除历史失败:', error);
        process.exit(1);
    }
});
program.parse(process.argv);
//# sourceMappingURL=cli.js.map