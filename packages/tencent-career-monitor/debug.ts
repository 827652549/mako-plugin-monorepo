import axios from 'axios';
import * as cheerio from 'cheerio';

async function debugPage() {
  const url = 'https://careers.tencent.com/search.html';
  const params = { keyword: '前端' };

  try {
    const response = await axios.get(url, { params });
    const html = response.data;
    const $ = cheerio.load(html);

    console.log('页面标题:', $('title').text());

    // 查找所有包含"job"或"recruit"的class
    const allClasses = new Set<string>();
    $('*').each((i, el) => {
      const classes = $(el).attr('class');
      if (classes) {
        classes.split(' ').forEach(cls => {
          if (cls.includes('job') || cls.includes('recruit') || cls.includes('position')) {
            allClasses.add(cls);
          }
        });
      }
    });

    console.log('\n相关class:', Array.from(allClasses).slice(0, 30));

    // 检查可能的容器
    const possibleContainers = [
      '.job-list', '.recruit-list', '.position-list',
      '.search-result', '.result-list', '.list-content'
    ];

    console.log('\n检查容器:');
    possibleContainers.forEach(selector => {
      const elements = $(selector);
      if (elements.length > 0) {
        console.log(`${selector}: 找到 ${elements.length} 个元素`);
        // 输出第一个元素的部分HTML
        console.log(`  示例HTML: ${$(elements[0]).html()?.substring(0, 200)}...`);
      }
    });

    // 如果没有找到，尝试更通用的选择器
    console.log('\n尝试通用列表选择器:');
    const listSelectors = ['ul', 'ol', 'div[class*="list"]', 'div[class*="result"]'];
    listSelectors.forEach(selector => {
      const elements = $(selector);
      if (elements.length > 0) {
        // 检查元素是否包含职位相关信息
        const text = $(elements[0]).text();
        if (text.includes('前端') || text.includes('开发')) {
          console.log(`${selector}: 可能包含职位信息`);
        }
      }
    });

    // 输出部分HTML以便手动检查
    console.log('\n=== 页面片段 (前2000字符) ===');
    console.log(html.substring(0, 2000));

  } catch (error) {
    console.error('调试失败:', error);
  }
}

debugPage();