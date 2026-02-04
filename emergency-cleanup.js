// Google Apps Script - 紧急清理脚本
// 用于清理大量重复索引和表格

const MAIN_SPREADSHEET_ID = '1kEvOkFHVQ92HK0y7I1-8qEjfzYrwt0DFQWEiVNTqXS4';
const DATA_FOLDER_NAME = '网站统计数据';

/**
 * 紧急清理：删除所有 2025-10-27 的重复记录，只保留第一条
 */
function emergencyCleanup() {
  const mainSpreadsheet = SpreadsheetApp.openById(MAIN_SPREADSHEET_ID);
  const indexSheet = mainSpreadsheet.getSheetByName('📑表格索引');
  
  if (!indexSheet) {
    Logger.log('找不到索引表');
    return;
  }
  
  const data = indexSheet.getDataRange().getValues();
  const targetDate = '2025-10-27';
  let firstRowFound = false;
  const rowsToDelete = [];
  
  // 找到所有 2025-10-27 的行
  for (let i = 1; i < data.length; i++) {
    const dateString = data[i][0];
    
    if (dateString === targetDate) {
      if (!firstRowFound) {
        // 保留第一条
        firstRowFound = true;
        Logger.log(`保留第 ${i + 1} 行作为唯一记录`);
      } else {
        // 标记删除其他所有记录
        rowsToDelete.push(i + 1);
      }
    }
  }
  
  Logger.log(`\n找到 ${rowsToDelete.length} 条重复记录需要删除`);
  
  // 从后往前删除
  rowsToDelete.reverse();
  for (const row of rowsToDelete) {
    indexSheet.deleteRow(row);
    Logger.log(`✅ 已删除第 ${row} 行`);
  }
  
  Logger.log(`\n✅ 清理完成！删除了 ${rowsToDelete.length} 条重复索引`);
}

/**
 * 删除所有重复的 2025-10-27 表格文件（除了第一个）
 */
function deleteExtraSpreadsheets() {
  const folders = DriveApp.getFoldersByName(DATA_FOLDER_NAME);
  
  if (!folders.hasNext()) {
    Logger.log('找不到数据文件夹');
    return;
  }
  
  const folder = folders.next();
  const files = folder.getFilesByName('ads-recan-2025-10-27');
  const fileList = [];
  
  while (files.hasNext()) {
    fileList.push(files.next());
  }
  
  Logger.log(`找到 ${fileList.length} 个同名表格文件`);
  
  if (fileList.length <= 1) {
    Logger.log('只有1个或0个文件，无需删除');
    return;
  }
  
  // 保留最早创建的
  fileList.sort((a, b) => a.getDateCreated().getTime() - b.getDateCreated().getTime());
  
  const keepFile = fileList[0];
  Logger.log(`\n保留: ${keepFile.getName()}`);
  Logger.log(`  ID: ${keepFile.getId()}`);
  Logger.log(`  创建时间: ${keepFile.getDateCreated()}`);
  
  // 删除其他所有文件
  for (let i = 1; i < fileList.length; i++) {
    const file = fileList[i];
    Logger.log(`\n删除: ${file.getName()}`);
    Logger.log(`  ID: ${file.getId()}`);
    Logger.log(`  创建时间: ${file.getDateCreated()}`);
    file.setTrashed(true);
  }
  
  Logger.log(`\n✅ 删除了 ${fileList.length - 1} 个重复表格文件`);
}

/**
 * 一键执行全部清理
 */
function cleanupAll2025_10_27() {
  Logger.log('=== 开始紧急清理 2025-10-27 的重复数据 ===\n');
  
  Logger.log('步骤1: 删除重复的表格文件...');
  deleteExtraSpreadsheets();
  
  Logger.log('\n步骤2: 清理索引中的重复记录...');
  emergencyCleanup();
  
  Logger.log('\n=== ✅ 清理完成！===');
  Logger.log('请立即部署新版本代码，防止继续产生重复！');
}

/**
 * 查看当前索引状态
 */
function checkIndexStatus() {
  const mainSpreadsheet = SpreadsheetApp.openById(MAIN_SPREADSHEET_ID);
  const indexSheet = mainSpreadsheet.getSheetByName('📑表格索引');
  
  const data = indexSheet.getDataRange().getValues();
  const dateCount = {};
  
  for (let i = 1; i < data.length; i++) {
    const date = data[i][0];
    dateCount[date] = (dateCount[date] || 0) + 1;
  }
  
  Logger.log('📊 索引统计：');
  for (const [date, count] of Object.entries(dateCount)) {
    if (count > 1) {
      Logger.log(`⚠️  ${date}: ${count} 条记录 (重复！)`);
    } else {
      Logger.log(`✅ ${date}: ${count} 条记录`);
    }
  }
}
