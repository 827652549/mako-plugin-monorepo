import axios from 'axios';

async function findApiEndpoints() {
  const baseUrl = 'https://careers.tencent.com';

  // 尝试查找可能的API端点
  const possibleEndpoints = [
    '/ajax/search',
    '/api/search',
    '/search/data',
    '/position/search',
    '/job/search',
    '/career/search',
    '/recruit/search'
  ];

  console.log('尝试查找API端点...\n');

  for (const endpoint of possibleEndpoints) {
    const url = baseUrl + endpoint;
    try {
      console.log(`测试: ${url}`);
      const response = await axios.get(url, {
        params: { keyword: '前端' },
        timeout: 5000
      });

      console.log(`  状态: ${response.status}`);
      console.log(`  数据类型: ${typeof response.data}`);

      if (typeof response.data === 'object') {
        console.log(`  键: ${Object.keys(response.data).join(', ')}`);
        if (response.data.data || response.data.items || response.data.positions) {
          console.log(`  找到数据字段!`);
          console.log(`  数据结构:`, JSON.stringify(response.data, null, 2).substring(0, 500));
          break;
        }
      }
      console.log('');
    } catch (error: any) {
      if (error.response) {
        console.log(`  状态: ${error.response.status}`);
      } else if (error.code === 'ECONNABORTED') {
        console.log(`  超时`);
      } else {
        console.log(`  错误: ${error.message}`);
      }
      console.log('');
    }
  }

  // 尝试POST请求
  console.log('尝试POST请求...\n');
  const postEndpoints = [
    '/search',
    '/ajax/search',
    '/position/list'
  ];

  for (const endpoint of postEndpoints) {
    const url = baseUrl + endpoint;
    try {
      console.log(`测试POST: ${url}`);
      const response = await axios.post(url, {
        keyword: '前端',
        pageIndex: 1,
        pageSize: 20
      }, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log(`  状态: ${response.status}`);
      if (typeof response.data === 'object') {
        console.log(`  数据结构预览:`, JSON.stringify(response.data, null, 2).substring(0, 300));
      }
      console.log('');
    } catch (error: any) {
      if (error.response) {
        console.log(`  状态: ${error.response.status}`);
      } else {
        console.log(`  错误: ${error.message}`);
      }
      console.log('');
    }
  }
}

findApiEndpoints();