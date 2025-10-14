// 优化的 Google Apps Script 代码 - 可持续数据管理系统
// 复制到 Google Apps Script 编辑器中

function doPost(e) {
  try {
    // 获取电子表格
    const spreadsheetId = '1kEvOkFHVQ92HK0y7I1-8qEjfzYrwt0DFQWEiVNTqXS4';
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    
    // 解析请求数据
    const data = JSON.parse(e.postData.contents);
    
    // 获取用户IP地址（优先使用前端发送的IP）
    const userIP = data.userIP || getUserIP(e);
    
    // 北京时间处理 - 直接使用timeZone配置，不手动加减时间
    const beijingTime = new Date();
    const timeString = beijingTime.toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false  // 使用24小时制
    });
    
    const dateString = new Date().toLocaleDateString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '-');
    
    // 获取或创建今日数据表
    const todaySheet = getOrCreateDailySheet(spreadsheet, dateString);
    
    // 准备要插入的数据（新增IP地址字段）
    const rowData = [
      timeString,                    // 时间 (北京时间)
      data.page || '',              // 访问页面
      data.userAgent || '',         // 用户属性 (浏览器信息)
      data.referrer || '',          // 来源页面
      userIP || ''                  // 用户IP地址
    ];
    
    // 插入数据到今日表格
    todaySheet.appendRow(rowData);
    
    // 更新实时统计（每100次访问更新一次，减少性能开销）
    if (Math.random() < 0.01) { // 1%概率执行统计更新
      updateDashboard(spreadsheet, dateString);
      cleanupOldSheets(spreadsheet);
      updateStatisticsTable(spreadsheet); // 更新统计汇总表
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({status: 'success'}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error:', error);
    return ContentService
      .createTextOutput(JSON.stringify({status: 'error', message: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 获取用户IP地址
function getUserIP(e) {
  try {
    // 由于Google Apps Script的安全限制，无法直接获取真实用户IP
    // IP地址将由前端JavaScript获取并通过data参数发送
    // 这里只是一个备用处理
    return 'Pending'; // 等待前端发送
    
  } catch (error) {
    console.error('获取IP地址失败:', error);
    return 'Error';
  }
}

// 验证IP地址格式
function isValidIP(ip) {
  // IPv4 格式验证
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  // IPv6 格式验证（简化版）
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip) || ip === '::1' || ip === 'localhost';
}

// 获取或创建每日数据表
function getOrCreateDailySheet(spreadsheet, dateString) {
  const sheetName = `详细-${dateString}`;
  let sheet = spreadsheet.getSheetByName(sheetName);
  
  if (!sheet) {
    // 创建新的日期表格
    sheet = spreadsheet.insertSheet(sheetName);
    
    // 设置标题行（新增IP地址列）
    sheet.getRange(1, 1, 1, 5).setValues([
      ['时间', '访问页面', '用户属性', '来源页面', 'IP地址']
    ]);
    
    // 格式化标题行
    const headerRange = sheet.getRange(1, 1, 1, 5);
    headerRange.setBackground('#4285f4');
    headerRange.setFontColor('white');
    headerRange.setFontWeight('bold');
    
    console.log(`创建新的日期表格: ${sheetName}`);
  }
  
  return sheet;
}

// 更新控制台统计
function updateDashboard(spreadsheet, currentDate) {
  try {
    // 获取或创建控制台表格
    let dashboardSheet = spreadsheet.getSheetByName('📊控制台');
    if (!dashboardSheet) {
      dashboardSheet = spreadsheet.insertSheet('📊控制台', 0);
      initializeDashboard(dashboardSheet);
    }
    
    // 更新今日统计
    const todaySheet = spreadsheet.getSheetByName(`详细-${currentDate}`);
    if (todaySheet) {
      const dataRange = todaySheet.getDataRange();
      const rowCount = Math.max(0, dataRange.getNumRows() - 1); // 减去标题行
      
      // 更新今日访问量
      dashboardSheet.getRange(2, 2).setValue(rowCount);
      dashboardSheet.getRange(2, 3).setValue(new Date());
    }
    
    // 更新总计统计（扫描所有详细表格）
    updateTotalStats(spreadsheet, dashboardSheet);
    
  } catch (error) {
    console.error('更新控制台失败:', error);
  }
}

// 初始化控制台
function initializeDashboard(sheet) {
  // 设置标题
  sheet.getRange(1, 1, 1, 5).merge();
  sheet.getRange(1, 1).setValue('📊 网站访问统计控制台');
  
  // 设置统计项目
  const headers = [
    ['统计项目', '数值', '最后更新', '说明', ''],
    ['今日访问量', 0, '', '当天的访问次数', ''],
    ['总访问量', 0, '', '所有详细记录的总数', ''],
    ['活跃天数', 0, '', '有访问记录的天数', ''],
    ['平均日访问', 0, '', '每日平均访问量', ''],
    ['', '', '', '', ''],
    ['数据管理', '', '', '', ''],
    ['详细数据保留', '7天', '', '自动删除7天前数据', ''],
    ['表格状态', '正常', '', '系统运行状态', ''],
    ['', '', '', '', ''],
    ['数据字段', '', '', '', ''],
    ['时间', '', '', '北京时间24小时制', ''],
    ['访问页面', '', '', '用户访问的完整URL', ''],
    ['用户属性', '', '', '浏览器和设备信息', ''],
    ['来源页面', '', '', '用户来源页面URL', ''],
    ['IP地址', '', '', '用户访问IP地址', '']
  ];
  
  sheet.getRange(2, 1, headers.length, 5).setValues(headers);
  
  // 格式化
  sheet.getRange(1, 1).setBackground('#1a73e8').setFontColor('white').setFontSize(14).setFontWeight('bold');
  sheet.getRange(2, 1, 1, 5).setBackground('#4285f4').setFontColor('white').setFontWeight('bold');
}

// 更新总计统计
function updateTotalStats(spreadsheet, dashboardSheet) {
  const sheets = spreadsheet.getSheets();
  let totalVisits = 0;
  let activeDays = 0;
  
  sheets.forEach(sheet => {
    const sheetName = sheet.getName();
    if (sheetName.startsWith('详细-')) {
      const dataRange = sheet.getDataRange();
      const rowCount = Math.max(0, dataRange.getNumRows() - 1);
      totalVisits += rowCount;
      if (rowCount > 0) activeDays++;
    }
  });
  
  // 更新统计数据
  dashboardSheet.getRange(3, 2).setValue(totalVisits); // 总访问量
  dashboardSheet.getRange(4, 2).setValue(activeDays); // 活跃天数
  dashboardSheet.getRange(5, 2).setValue(activeDays > 0 ? Math.round(totalVisits / activeDays) : 0); // 平均日访问
  
  // 更新时间戳
  const updateTime = new Date();
  dashboardSheet.getRange(3, 3).setValue(updateTime);
  dashboardSheet.getRange(4, 3).setValue(updateTime);
  dashboardSheet.getRange(5, 3).setValue(updateTime);
}

// 清理旧数据表格
function cleanupOldSheets(spreadsheet) {
  try {
    const sheets = spreadsheet.getSheets();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7); // 保留7天
    
    sheets.forEach(sheet => {
      const sheetName = sheet.getName();
      if (sheetName.startsWith('详细-')) {
        const dateStr = sheetName.replace('详细-', '');
        const sheetDate = new Date(dateStr);
        
        if (sheetDate < cutoffDate) {
          console.log(`删除过期数据表: ${sheetName}`);
          spreadsheet.deleteSheet(sheet);
        }
      }
    });
  } catch (error) {
    console.error('清理旧数据失败:', error);
  }
}

// 手动触发数据清理（可以设置定时器调用）
function manualCleanup() {
  const spreadsheetId = '1kEvOkFHVQ92HK0y7I1-8qEjfzYrwt0DFQWEiVNTqXS4';
  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  
  cleanupOldSheets(spreadsheet);
  
  const today = new Date().toLocaleDateString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\//g, '-');
  
  updateDashboard(spreadsheet, today);
  
  return '数据清理完成';
}

function doGet(e) {
  // 处理 GET 请求 (可选，用于测试)
  return ContentService
    .createTextOutput('Analytics endpoint is working!')
    .setMimeType(ContentService.MimeType.TEXT);
}

// ==================== 统计汇总表功能 ====================

// 更新统计汇总表
function updateStatisticsTable(spreadsheet) {
  try {
    // 获取或创建统计表
    let statsSheet = spreadsheet.getSheetByName('📈统计汇总表');
    if (!statsSheet) {
      statsSheet = spreadsheet.insertSheet('📈统计汇总表', 1); // 插入到第二位
      initializeStatisticsTable(statsSheet);
    }
    
    // 生成今日统计数据
    const today = new Date().toLocaleDateString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      month: 'numeric',
      day: 'numeric'
    });
    const todayLabel = `${today.split('/')[0]}月${today.split('/')[1]}日`;
    
    const todayStats = generateDailyStatistics(spreadsheet, todayLabel);
    
    // 更新统计表
    updateStatsInTable(statsSheet, todayStats, todayLabel);
    
    console.log('统计汇总表更新完成');
    
  } catch (error) {
    console.error('更新统计汇总表失败:', error);
  }
}

// 初始化统计汇总表
function initializeStatisticsTable(sheet) {
  // 设置标题
  sheet.getRange(1, 1, 1, 5).merge();
  sheet.getRange(1, 1).setValue('📈 网站访问统计汇总表');
  
  // 设置表头
  const headers = [
    ['时间', '域名来源（不记录后缀）', '书籍名称', '累计章节（含chapter的url）', '累计ip数量（去重）']
  ];
  
  sheet.getRange(2, 1, 1, 5).setValues(headers);
  
  // 格式化标题和表头
  sheet.getRange(1, 1).setBackground('#1a73e8').setFontColor('white').setFontSize(14).setFontWeight('bold');
  sheet.getRange(2, 1, 1, 5).setBackground('#4285f4').setFontColor('white').setFontWeight('bold');
  
  // 设置列宽
  sheet.setColumnWidth(1, 100);  // 时间
  sheet.setColumnWidth(2, 200);  // 域名来源
  sheet.setColumnWidth(3, 300);  // 书籍名称
  sheet.setColumnWidth(4, 150);  // 累计章节
  sheet.setColumnWidth(5, 120);  // 累计IP数量
  
  console.log('统计汇总表初始化完成');
}

// 生成每日统计数据
function generateDailyStatistics(spreadsheet, dateLabel) {
  const sheets = spreadsheet.getSheets();
  const stats = {};
  
  // 获取今日数据表
  const todayDateString = new Date().toLocaleDateString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\//g, '-');
  
  const todaySheetName = `详细-${todayDateString}`;
  const todaySheet = spreadsheet.getSheetByName(todaySheetName);
  
  if (!todaySheet) {
    console.log('未找到今日数据表:', todaySheetName);
    return {};
  }
  
  // 读取今日数据
  const dataRange = todaySheet.getDataRange();
  const values = dataRange.getValues();
  
  // 跳过标题行
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const pageUrl = row[1] || '';    // 访问页面
    const userIP = row[4] || '';     // IP地址
    
    if (!pageUrl || !userIP) continue;
    
    // 解析URL获取域名和书籍信息
    const urlInfo = parsePageUrl(pageUrl);
    if (!urlInfo) continue;
    
    const { domain, bookName, isChapter } = urlInfo;
    
    // 构建统计键
    const key = `${domain}|${bookName}`;
    
    if (!stats[key]) {
      stats[key] = {
        domain: domain,
        bookName: bookName,
        chapterCount: 0,
        ipSet: new Set()
      };
    }
    
    // 累计章节访问
    if (isChapter) {
      stats[key].chapterCount++;
    }
    
    // 累计IP（去重）
    if (userIP && userIP !== 'Unknown' && userIP !== 'Error') {
      stats[key].ipSet.add(userIP);
    }
  }
  
  // 转换为数组格式
  const result = [];
  for (const key in stats) {
    const stat = stats[key];
    result.push([
      dateLabel,                    // 时间
      stat.domain,                  // 域名来源
      stat.bookName,                // 书籍名称
      stat.chapterCount,            // 累计章节
      stat.ipSet.size              // 累计IP数量（去重）
    ]);
  }
  
  return result;
}

// 解析页面URL
function parsePageUrl(url) {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    const path = urlObj.pathname;
    
    // 检查是否是小说相关页面
    const novelMatch = path.match(/\/novels\/([^\/]+)/);
    if (!novelMatch) return null;
    
    const bookName = novelMatch[1];
    const isChapter = path.includes('/chapter-');
    
    return {
      domain: domain,
      bookName: bookName,
      isChapter: isChapter
    };
    
  } catch (error) {
    console.error('URL解析失败:', url, error);
    return null;
  }
}

// 更新统计表中的数据
function updateStatsInTable(sheet, newStats, dateLabel) {
  if (!newStats || newStats.length === 0) {
    console.log('没有新的统计数据需要更新');
    return;
  }
  
  // 获取现有数据
  const dataRange = sheet.getDataRange();
  const existingData = dataRange.getNumRows() > 2 ? dataRange.getValues().slice(2) : [];
  
  // 过滤掉今日的旧数据（覆盖更新）
  const nonTodayData = existingData.filter(row => row[0] !== dateLabel);
  
  // 合并数据：非今日数据 + 今日新数据
  const allData = [...nonTodayData, ...newStats];
  
  // 清除现有数据（保留标题）
  if (dataRange.getNumRows() > 2) {
    sheet.getRange(3, 1, dataRange.getNumRows() - 2, 5).clear();
  }
  
  // 写入新数据
  if (allData.length > 0) {
    sheet.getRange(3, 1, allData.length, 5).setValues(allData);
  }
  
  // 更新时间戳
  const updateTime = new Date().toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai'
  });
  
  // 在表格底部添加更新时间
  const lastRow = sheet.getLastRow() + 2;
  sheet.getRange(lastRow, 1, 1, 5).merge();
  sheet.getRange(lastRow, 1).setValue(`最后更新时间: ${updateTime}`);
  sheet.getRange(lastRow, 1).setFontStyle('italic').setFontColor('#666666');
  
  console.log(`统计表更新完成，共 ${allData.length} 条记录`);
}

// 每小时统计更新函数（用于定时触发器）
function hourlyStatisticsUpdate() {
  const spreadsheetId = '1kEvOkFHVQ92HK0y7I1-8qEjfzYrwt0DFQWEiVNTqXS4';
  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  
  updateStatisticsTable(spreadsheet);
  
  return '每小时统计更新完成';
}

// 手动触发统计更新（测试用）
function manualStatisticsUpdate() {
  const spreadsheetId = '1kEvOkFHVQ92HK0y7I1-8qEjfzYrwt0DFQWEiVNTqXS4';
  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  
  updateStatisticsTable(spreadsheet);
  
  return '手动统计更新完成';
}