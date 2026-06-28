"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STORAGE_FILE = exports.TODAY = exports.SHANGHAI_KEYWORDS = exports.TENCENT_CAREER_PARAMS = exports.TENCENT_CAREER_URL = void 0;
exports.TENCENT_CAREER_URL = 'https://careers.tencent.com/search.html';
exports.TENCENT_CAREER_PARAMS = {
    keyword: '前端',
    page: 1,
    // 可以添加其他参数
};
exports.SHANGHAI_KEYWORDS = ['上海', 'Shanghai'];
exports.TODAY = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
exports.STORAGE_FILE = 'tencent-career-data.json';
//# sourceMappingURL=constants.js.map