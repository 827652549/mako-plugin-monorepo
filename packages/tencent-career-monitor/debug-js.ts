import axios from 'axios';

async function analyzeJsFiles() {
  const baseUrl = 'https://cdn.multilingualres.hr.tencent.com';

  // 从HTML片段中找到的JS文件
  const jsFiles = [
    '/careersmlr/Search_zh-cn.js',
    '/careersmlr/JobDesc_zh-cn.js',
    '/tencentcareer/static/js/manifest.build.js',
    '/tencentcareer/static/js/vendor.build.js'
  ];

  console.log('分析JavaScript文件...\n');

  for (const file of jsFiles) {
    const url = baseUrl + file;
    try {
      console.log(`获取: ${url}`);
      const response = await axios.get(url, { timeout: 10000 });

      if (response.status === 200) {
        const content = response.data as string;

        // 查找可能的API端点
        const apiPatterns = [
          /['"]([/][^'"]*api[^'"]*)['"]/gi,
          /['"]([/][^'"]*search[^'"]*)['"]/gi,
          /['"]([/][^'"]*position[^'"]*)['"]/gi,
          /['"]([/][^'"]*job[^'"]*)['"]/gi,
          /url:\s*['"]([^'"]+)['"]/gi,
          /endpoint:\s*['"]([^'"]+)['"]/gi
        ];

        const foundUrls = new Set<string>();

        for (const pattern of apiPatterns) {
          let match;
          while ((match = pattern.exec(content)) !== null) {
            foundUrls.add(match[1]);
          }
        }

        console.log(`  大小: ${content.length} 字符`);
        console.log(`  找到 ${foundUrls.size} 个可能的URL:`);

        const urlsArray = Array.from(foundUrls).slice(0, 10);
        urlsArray.forEach(url => {
          console.log(`    - ${url}`);
        });

        // 查找包含"前端"或"搜索"的代码片段
        const searchPattern = /(search|position|job|前端)[^}]{0,200}/gi;
        const matches = content.match(searchPattern) || [];

        if (matches.length > 0) {
          console.log(`  相关代码片段:`);
          matches.slice(0, 5).forEach((match, i) => {
            console.log(`    ${i + 1}. ${match.substring(0, 100)}...`);
          });
        }

        console.log('');
      }
    } catch (error: any) {
      console.log(`  错误: ${error.message}`);
      console.log('');
    }
  }
}

// 也尝试直接查找已知的腾讯招聘API
async function checkKnownApis() {
  console.log('检查已知的腾讯招聘API...\n');

  // 尝试一些已知的可能端点
  const apis = [
    'https://careers.tencent.com/tencentcareer/api/post/Query',
    'https://careers.tencent.com/tencentcareer/api/post/ByKeyword',
    'https://careers.tencent.com/tencentcareer/api/post/Search',
    'https://careers.tencent.com/tencentcareer/api/post/QueryPosts'
  ];

  for (const api of apis) {
    try {
      console.log(`测试: ${api}`);
      const response = await axios.post(api, {
        keyword: '前端',
        pageIndex: 1,
        pageSize: 10
      }, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log(`  状态: ${response.status}`);
      if (response.data && typeof response.data === 'object') {
        console.log(`  响应键: ${Object.keys(response.data).join(', ')}`);
        if (response.data.Data && response.data.Data.Posts) {
          console.log(`  找到职位数据! 数量: ${response.data.Data.Posts.length}`);
          console.log(`  示例:`, JSON.stringify(response.data.Data.Posts[0], null, 2).substring(0, 300));
        } else {
          console.log(`  响应:`, JSON.stringify(response.data, null, 2).substring(0, 300));
        }
      } else {
        console.log(`  响应类型: ${typeof response.data}`);
      }
      console.log('');
    } catch (error: any) {
      console.log(`  错误: ${error.message}`);
      console.log('');
    }
  }
}

// 运行两个分析
async function main() {
  await analyzeJsFiles();
  await checkKnownApis();
}

main();