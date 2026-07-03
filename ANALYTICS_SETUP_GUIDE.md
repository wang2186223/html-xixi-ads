# 📊 页面访问统计系统设置指南

## 🔧 设置步骤

### 第一步：创建 Google 表格
1. 打开 [Google Sheets](https://sheets.google.com)
2. 创建新的空白表格
3. 在第一行添加表头：
   - A1: `时间`
   - B1: `访问页面`
   - C1: `用户属性`
   - D1: `来源页面`
4. 记下表格的ID（URL中 `/d/` 和 `/edit` 之间的部分）

### 第二步：创建 Google Apps Script
1. 打开 [Google Apps Script](https://script.google.com)
2. 点击"新建项目"
3. 删除默认代码，复制粘贴 `analytics-script.js` 中的代码
4. 将 `YOUR_SPREADSHEET_ID_HERE` 替换为你的表格ID
5. 保存项目并命名（例如："页面访问统计"）

### 第三步：部署 Google Apps Script
1. 在 Apps Script 编辑器中点击"部署" > "新建部署"
2. 选择类型："网络应用"
3. 设置：
   - 说明：页面访问统计API
   - 执行身份：我
   - 访问权限：任何人
4. 点击"部署"
5. 复制"网络应用"的URL

### 第四步：更新网站代码
将所有模板文件中的 `YOUR_GOOGLE_APPS_SCRIPT_URL_HERE` 替换为你的 Apps Script URL：

```bash
# 在项目根目录运行
cd /Users/k/Desktop/novel-free-my/html-ads-xixi
sed -i '' 's/YOUR_GOOGLE_APPS_SCRIPT_URL_HERE/你的实际URL/g' tools/templates/*.html
```

### 第五步：重新构建和部署
```bash
python3 tools/build-website.py --force
git add .
git commit -m "添加页面访问统计功能"
git push origin main
```

## 📋 收集的数据字段

| 字段 | 描述 | 示例 |
|------|------|------|
| 时间 | 北京时间的访问时间 | 2025/10/11 14:30:25 |
| 访问页面 | 完整的页面URL | https://test.ststorys.com/novels/my-rejected-mate-regrets/chapter-1.html |
| 用户属性 | 浏览器信息 | Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) |
| 来源页面 | 用户从哪个页面跳转过来 | https://test.ststorys.com/novels/my-rejected-mate-regrets/ |

## 🔍 数据分析示例

在 Google Sheets 中，你可以：
1. 按时间筛选查看特定时间段的访问量
2. 统计最受欢迎的章节
3. 分析用户的阅读路径
4. 识别移动端 vs 桌面端用户比例

## 🛠️ 高级功能（可选）

### 添加地理位置信息
在 Google Apps Script 中添加：
```javascript
// 获取用户IP地理信息（需要第三方API）
const ipInfo = UrlFetchApp.fetch('http://ip-api.com/json/').getContentText();
```

### 添加页面停留时间
在前端代码中添加：
```javascript
let startTime = Date.now();
window.addEventListener('beforeunload', function() {
    const duration = Date.now() - startTime;
    // 发送停留时间数据
});
```

## 🔒 隐私和性能注意事项

1. **性能优化**：使用 `mode: 'no-cors'` 避免跨域问题
2. **隐私保护**：不收集个人身份信息
3. **错误处理**：包含了完整的错误捕获机制
4. **异步处理**：不会影响页面加载速度

## 📊 预期效果

设置完成后，每次用户访问页面时：
- 数据会自动记录到 Google Sheets
- 包含北京时间戳
- 支持所有页面类型（首页、小说详情页、章节页）
- 实时数据收集，无需手动操作