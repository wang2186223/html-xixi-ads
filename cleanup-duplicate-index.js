// Google Apps Script - 清理重复索引和表格
// 在 Google Apps Script 编辑器中运行此脚本

const MAIN_SPREADSHEET_ID = '1kEvOkFHVQ92HK0y7I1-8qEjfzYrwt0DFQWEiVNTqXS4';
const DATA_FOLDER_NAME = '网站统计数据';

/**
 * 清理重复的索引记录，每个日期只保留最早的一条
 */
function cleanupDuplicateIndex() {
  const mainSpreadsheet = SpreadsheetApp.openById(MAIN_SPREADSHEET_ID);
  const indexSheet = mainSpreadsheet.getSheetByName('📑表格索引');
  
  if (!indexSheet) {
    Logger.log('找不到表格索引sheet');
    return;
  }
  
  const data = indexSheet.getDataRange().getValues();
  const seen = new Map(); // 日期 -> {row: 行号, time: 创建时间}
  const rowsToDelete = [];
  
  // 从第2行开始（跳过表头）
  for (let i = 1; i < data.length; i++) {
    const dateString = data[i][0];
    const spreadsheetId = data[i][1];
    const createTime = data[i][3];
    
    if (!dateString || !spreadsheetId) {
      rowsToDelete.push(i + 1); // Sheet行号从1开始
      continue;
    }
    
    if (seen.has(dateString)) {
      // 已经有这个日期了，标记为删除
      rowsToDelete.push(i + 1);
      Logger.log(`发现重复日期 ${dateString}，将删除第 ${i + 1} 行`);
    } else {
      seen.set(dateString, {row: i + 1, time: createTime});
    }
  }
  
  // 从后往前删除（避免行号变化）
  rowsToDelete.reverse();
  for (const row of rowsToDelete) {
    indexSheet.deleteRow(row);
    Logger.log(`已删除第 ${row} 行`);
  }
  
  Logger.log(`清理完成！共删除 ${rowsToDelete.length} 条重复记录`);
  Logger.log(`保留 ${seen.size} 条唯一记录`);
}

/**
 * 删除重复的每日表格文件，每个日期只保留一个
 */
function cleanupDuplicateSpreadsheets() {
  const folders = DriveApp.getFoldersByName(DATA_FOLDER_NAME);
  
  if (!folders.hasNext()) {
    Logger.log('找不到数据文件夹');
    return;
  }
  
  const folder = folders.next();
  const files = folder.getFiles();
  const filesByDate = new Map(); // 日期 -> [文件对象数组]
  
  // 收集所有文件
  while (files.hasNext()) {
    const file = files.next();
    const name = file.getName();
    
    // 匹配 ads-recan-YYYY-MM-DD 格式
    const match = name.match(/^ads-recan-(\d{4}-\d{2}-\d{2})$/);
    if (match) {
      const dateString = match[1];
      if (!filesByDate.has(dateString)) {
        filesByDate.set(dateString, []);
      }
      filesByDate.get(dateString).push(file);
    }
  }
  
  let totalDeleted = 0;
  
  // 处理每个日期的重复文件
  for (const [dateString, fileList] of filesByDate.entries()) {
    if (fileList.length > 1) {
      Logger.log(`\n日期 ${dateString} 有 ${fileList.length} 个重复文件`);
      
      // 按创建时间排序，保留最早的
      fileList.sort((a, b) => a.getDateCreated().getTime() - b.getDateCreated().getTime());
      
      const keepFile = fileList[0];
      Logger.log(`保留: ${keepFile.getName()} (ID: ${keepFile.getId()}, 创建于: ${keepFile.getDateCreated()})`);
      
      // 删除其余文件
      for (let i = 1; i < fileList.length; i++) {
        const deleteFile = fileList[i];
        Logger.log(`删除: ${deleteFile.getName()} (ID: ${deleteFile.getId()}, 创建于: ${deleteFile.getDateCreated()})`);
        deleteFile.setTrashed(true);
        totalDeleted++;
      }
    }
  }
  
  Logger.log(`\n清理完成！共删除 ${totalDeleted} 个重复文件`);
}

/**
 * 重建索引：扫描文件夹，为每个唯一日期创建索引记录
 */
function rebuildIndex() {
  const mainSpreadsheet = SpreadsheetApp.openById(MAIN_SPREADSHEET_ID);
  let indexSheet = mainSpreadsheet.getSheetByName('📑表格索引');
  
  if (!indexSheet) {
    Logger.log('找不到表格索引sheet');
    return;
  }
  
  // 清空现有索引（保留表头）
  const lastRow = indexSheet.getLastRow();
  if (lastRow > 1) {
    indexSheet.deleteRows(2, lastRow - 1);
  }
  
  // 扫描文件夹
  const folders = DriveApp.getFoldersByName(DATA_FOLDER_NAME);
  if (!folders.hasNext()) {
    Logger.log('找不到数据文件夹');
    return;
  }
  
  const folder = folders.next();
  const files = folder.getFiles();
  const filesByDate = new Map();
  
  while (files.hasNext()) {
    const file = files.next();
    const name = file.getName();
    const match = name.match(/^ads-recan-(\d{4}-\d{2}-\d{2})$/);
    
    if (match) {
      const dateString = match[1];
      if (!filesByDate.has(dateString)) {
        filesByDate.set(dateString, file);
      }
    }
  }
  
  // 按日期排序并添加到索引
  const sortedDates = Array.from(filesByDate.keys()).sort();
  
  for (const dateString of sortedDates) {
    const file = filesByDate.get(dateString);
    indexSheet.appendRow([
      dateString,
      file.getId(),
      file.getUrl(),
      file.getDateCreated().toLocaleString('zh-CN', {timeZone: 'Asia/Shanghai'})
    ]);
    Logger.log(`添加索引: ${dateString} -> ${file.getId()}`);
  }
  
  Logger.log(`\n索引重建完成！共 ${sortedDates.length} 条记录`);
}

/**
 * 主函数：一键清理所有重复
 */
function cleanupAll() {
  Logger.log('=== 开始清理重复数据 ===\n');
  
  Logger.log('步骤1: 清理重复的表格文件...');
  cleanupDuplicateSpreadsheets();
  
  Logger.log('\n步骤2: 重建索引...');
  rebuildIndex();
  
  Logger.log('\n=== 清理完成！===');
}
