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
exports.TencentCareerFetcher = void 0;
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const constants_1 = require("./constants");
const dayjs_1 = __importDefault(require("dayjs"));
class TencentCareerFetcher {
    async fetchJobs() {
        const url = constants_1.TENCENT_CAREER_URL;
        const params = {
            keyword: '前端',
            page: 1,
        };
        try {
            const response = await axios_1.default.get(url, { params });
            const html = response.data;
            return this.parseHtml(html);
        }
        catch (error) {
            console.error('抓取腾讯招聘页面失败:', error);
            throw error;
        }
    }
    parseHtml(html) {
        const $ = cheerio.load(html);
        const jobs = [];
        // 腾讯招聘页面的职位列表选择器需要根据实际情况调整
        // 这里是一个示例选择器，可能需要修改
        $('.recruit-list .recruit-item').each((index, element) => {
            try {
                const job = this.parseJobElement($, element);
                if (job) {
                    jobs.push(job);
                }
            }
            catch (error) {
                console.warn(`解析职位 ${index} 失败:`, error);
            }
        });
        // 如果没有找到任何职位，尝试其他选择器
        if (jobs.length === 0) {
            console.warn('使用默认选择器未找到职位，尝试其他选择器...');
            $('.job-list .job-item').each((index, element) => {
                try {
                    const job = this.parseJobElement($, element);
                    if (job) {
                        jobs.push(job);
                    }
                }
                catch (error) {
                    console.warn(`解析职位 ${index} 失败:`, error);
                }
            });
        }
        return jobs;
    }
    parseJobElement($, element) {
        const $element = $(element);
        // 这些选择器需要根据实际页面结构调整
        const title = $element.find('.job-title').text().trim() ||
            $element.find('.recruit-title').text().trim();
        const department = $element.find('.department').text().trim() ||
            $element.find('.recruit-department').text().trim();
        const location = $element.find('.location').text().trim() ||
            $element.find('.recruit-location').text().trim();
        const publishDateText = $element.find('.publish-date').text().trim() ||
            $element.find('.recruit-date').text().trim();
        const link = $element.find('a').attr('href') || '';
        if (!title || !link) {
            return null;
        }
        // 处理链接，可能需要补全完整URL
        const fullLink = link.startsWith('http') ? link : `https://careers.tencent.com${link}`;
        // 解析发布日期
        let publishDate = this.parsePublishDate(publishDateText);
        if (!publishDate) {
            // 如果没有发布日期，使用今天
            publishDate = constants_1.TODAY;
        }
        // 检查是否为上海岗位
        const isShanghai = constants_1.SHANGHAI_KEYWORDS.some(keyword => location.includes(keyword) || title.includes(keyword));
        // 检查是否为今天发布的岗位
        const isToday = publishDate === constants_1.TODAY;
        // 生成唯一ID（使用标题、部门、地点和发布日期的哈希）
        const id = this.generateJobId(title, department, location, publishDate);
        return {
            id,
            title,
            department,
            location,
            publishDate,
            link: fullLink,
            isShanghai,
            isToday,
            fetchedAt: new Date().toISOString(),
        };
    }
    parsePublishDate(dateText) {
        if (!dateText)
            return null;
        // 尝试解析常见日期格式
        const today = (0, dayjs_1.default)();
        const yesterday = today.subtract(1, 'day');
        if (dateText.includes('今天') || dateText.includes('Today')) {
            return today.format('YYYY-MM-DD');
        }
        if (dateText.includes('昨天') || dateText.includes('Yesterday')) {
            return yesterday.format('YYYY-MM-DD');
        }
        // 尝试解析YYYY-MM-DD格式
        const ymdMatch = dateText.match(/\d{4}-\d{2}-\d{2}/);
        if (ymdMatch) {
            return ymdMatch[0];
        }
        // 尝试解析MM-DD格式，假设是今年
        const mdMatch = dateText.match(/(\d{1,2})-(\d{1,2})/);
        if (mdMatch) {
            const month = mdMatch[1].padStart(2, '0');
            const day = mdMatch[2].padStart(2, '0');
            const year = today.year();
            return `${year}-${month}-${day}`;
        }
        return null;
    }
    generateJobId(title, department, location, publishDate) {
        const content = `${title}-${department}-${location}-${publishDate}`;
        // 简单哈希函数
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }
}
exports.TencentCareerFetcher = TencentCareerFetcher;
//# sourceMappingURL=fetcher.js.map