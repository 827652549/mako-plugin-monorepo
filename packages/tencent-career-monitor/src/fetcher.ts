import axios from 'axios';
import * as cheerio from 'cheerio';
import { JobPosting } from './types';
import { TENCENT_CAREER_URL, SHANGHAI_KEYWORDS, TODAY } from './constants';
import dayjs from 'dayjs';

export class TencentCareerFetcher {
  async fetchJobs(): Promise<JobPosting[]> {
    const url = TENCENT_CAREER_URL;
    const params = {
      keyword: '前端',
      page: 1,
    };

    try {
      const response = await axios.get(url, { params });
      const html = response.data;
      return this.parseHtml(html);
    } catch (error) {
      console.error('抓取腾讯招聘页面失败:', error);
      throw error;
    }
  }

  private parseHtml(html: string): JobPosting[] {
    const $ = cheerio.load(html);
    const jobs: JobPosting[] = [];

    // 腾讯招聘页面的职位列表选择器需要根据实际情况调整
    // 这里是一个示例选择器，可能需要修改
    $('.recruit-list .recruit-item').each((index, element) => {
      try {
        const job = this.parseJobElement($, element);
        if (job) {
          jobs.push(job);
        }
      } catch (error) {
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
        } catch (error) {
          console.warn(`解析职位 ${index} 失败:`, error);
        }
      });
    }

    return jobs;
  }

  private parseJobElement($: any, element: any): JobPosting | null {
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
      publishDate = TODAY;
    }

    // 检查是否为上海岗位
    const isShanghai = SHANGHAI_KEYWORDS.some(keyword =>
      location.includes(keyword) || title.includes(keyword)
    );

    // 检查是否为今天发布的岗位
    const isToday = publishDate === TODAY;

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

  private parsePublishDate(dateText: string): string | null {
    if (!dateText) return null;

    // 尝试解析常见日期格式
    const today = dayjs();
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

  private generateJobId(title: string, department: string, location: string, publishDate: string): string {
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