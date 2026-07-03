# 免费狼人小说网站构建和部署指南

## 快速开始

### 前置条件
- Python 3.8 或更高版本
- Git
- GitHub 账户
- 文本编辑器

### 第一步：项目初始化

1. **创建GitHub仓库**
   ```bash
   # 在GitHub上创建新仓库，名为 werewolf-novels-site
   # 克隆到本地
   git clone https://github.com/your-username/werewolf-novels-site.git
   cd werewolf-novels-site
   ```

2. **设置项目结构**
   ```bash
   mkdir -p docs/{novels,assets/{css,js,images},covers}
   mkdir -p tools/{templates,scripts}
   mkdir -p source
   ```

3. **安装Python依赖**
   ```bash
   pip install beautifulsoup4 jinja2 pillow requests
   ```

### 第二步：准备小说数据

1. **复制小说库**
   ```bash
   cp -r "/Users/k/Desktop/novel library" source/
   ```

2. **运行数据检查脚本**
   ```bash
   python tools/scripts/validate_novel_data.py
   ```

### 第三步：生成网站

1. **运行主构建脚本**
   ```bash
   python tools/build-website.py --source source --output docs
   ```

2. **验证生成结果**
   - 检查 `docs/` 目录下的文件
   - 验证 `docs/index.html` 可以正常打开
   - 确认小说详情页和章节页正常生成

### 第四步：部署到GitHub Pages

1. **提交到Git**
   ```bash
   git add .
   git commit -m "Initial website build with novels"
   git push origin main
   ```

2. **启用GitHub Pages**
   - 进入GitHub仓库设置
   - 找到 "Pages" 选项
   - Source 选择 "Deploy from a branch"
   - Branch 选择 "main" 
   - Folder 选择 "/docs"
   - 保存设置

3. **访问网站**
   - 网站地址：`https://your-username.github.io/werewolf-novels-site/`

---

## 详细操作指南

### 脚本使用说明

#### 主构建脚本：`build-website.py`

**基本用法：**
```bash
python tools/build-website.py [选项]
```

**常用选项：**
- `--source PATH`：指定小说库源目录（默认：source）
- `--output PATH`：指定输出目录（默认：docs）
- `--force`：强制重建所有页面
- `--incremental`：只更新变更的内容
- `--verbose`：显示详细日志

**使用示例：**

1. **首次完整构建**
   ```bash
   python tools/build-website.py --source "source/novel library" --output docs --verbose
   ```

2. **增量更新（推荐日常使用）**
   ```bash
   python tools/build-website.py --incremental
   ```

3. **强制重建特定小说**
   ```bash
   python tools/build-website.py --novel "Abyssal Bonds" --force
   ```

#### 新增小说处理流程

1. **添加新小说到源目录**
   ```bash
   # 将新小说文件夹复制到 source/novel library/
   cp -r "新小说文件夹" "source/novel library/"
   ```

2. **运行增量构建**
   ```bash
   python tools/build-website.py --incremental
   ```

3. **检查生成结果**
   ```bash
   # 查看新生成的文件
   ls docs/novels/
   ```

4. **部署更新**
   ```bash
   git add docs/
   git commit -m "Add new novel: 小说标题"
   git push origin main
   ```

#### 更新现有小说章节

1. **更新源文件**
   - 修改对应小说的 `书籍正文.txt`
   - 保存文件

2. **运行增量构建**
   ```bash
   python tools/build-website.py --incremental
   ```
   脚本会自动检测到文件变化并只更新相关页面

3. **部署更新**
   ```bash
   git add docs/
   git commit -m "Update novel: 小说标题 - new chapters"
   git push origin main
   ```

### 数据格式规范

#### 小说文件夹结构
```
小说标题/
├── 书籍描述.txt          # 必需：小说描述和元数据
├── 书籍正文.txt          # 必需：小说正文内容
└── cover.jpg/png         # 必需：封面图片
```

#### 书籍描述.txt 格式
```
标题: Abyssal Bonds
作者: Author Name
类型: werewolf, romance, paranormal
状态: completed
评分: 4.5
标签: alpha, mate, pack, supernatural
简介: 
这里是小说的详细描述...
可以多行...
```

#### 书籍正文.txt 格式
```
### Chapter 1: The Awakening
章节内容...

### Chapter 2: The Discovery  
章节内容...

### Chapter 3: The Truth
章节内容...
```

### 故障排除

#### 常见问题及解决方案

1. **脚本运行错误**
   ```bash
   # 检查Python版本
   python --version
   
   # 检查依赖包
   pip list | grep -E "(beautifulsoup4|jinja2|pillow)"
   
   # 重新安装依赖
   pip install --upgrade beautifulsoup4 jinja2 pillow
   ```

2. **HTML页面显示异常**
   - 检查模板文件是否完整
   - 验证CSS和JS文件路径
   - 查看浏览器控制台错误

3. **GitHub Pages无法访问**
   - 确认仓库是公开的
   - 检查Pages设置是否正确
   - 等待5-10分钟让更改生效

4. **图片无法显示**
   ```bash
   # 检查图片格式和大小
   python tools/scripts/validate_images.py
   
   # 转换图片格式
   python tools/scripts/convert_images.py
   ```

### 性能优化

#### 构建优化
1. **使用增量构建**：避免重建未修改的页面
2. **并行处理**：对于大量小说，启用多线程处理
3. **图片优化**：自动压缩封面图片

#### 网站优化
1. **启用压缩**：在GitHub Pages中启用gzip
2. **图片懒加载**：大列表页面使用懒加载
3. **CDN加速**：对于CSS和JS使用CDN

### 监控和维护

#### 定期任务
1. **每日构建检查**
   ```bash
   # 创建cron任务（Linux/Mac）
   0 2 * * * cd /path/to/project && python tools/build-website.py --incremental
   ```

2. **SEO监控**
   - 使用Google Search Console
   - 检查sitemap.xml状态
   - 监控页面收录情况

3. **性能监控**
   - 使用Google PageSpeed Insights
   - 监控网站加载速度
   - 检查移动端兼容性

#### 备份策略
1. **源数据备份**
   ```bash
   # 定期备份小说库
   tar -czf backup-$(date +%Y%m%d).tar.gz "source/novel library"
   ```

2. **生成文件备份**
   - GitHub自动保存历史版本
   - 可以随时回滚到之前版本

### 扩展功能

#### 添加搜索功能
1. 生成搜索索引JSON
2. 实现前端搜索界面
3. 支持按标题、作者、标签搜索

#### 实现评论系统
1. 集成第三方评论服务（如Disqus）
2. 或使用GitHub Issues作为评论系统

#### 添加RSS订阅
1. 生成RSS feed
2. 支持新章节通知

---

## 目录清单

完成部署后，您的网站将包含：

```
网站根目录/
├── index.html                    # 首页 - 显示所有小说
├── novels/                       # 小说目录
│   ├── abyssal-bonds/           # 示例：第一本小说
│   │   ├── index.html           # 小说详情页
│   │   ├── chapter-1.html       # 第1章
│   │   ├── chapter-2.html       # 第2章
│   │   └── ...                  # 更多章节
│   ├── alphas-cursed-mate/      # 示例：第二本小说
│   │   └── ...
│   └── ...                      # 更多小说（目标10,000本）
├── covers/                      # 小说封面图片
├── assets/                      # 网站资源
│   ├── css/
│   ├── js/
│   └── images/
└── sitemap.xml                  # SEO站点地图
```

总页面数量估计：
- 首页：1页
- 小说详情页：10,000页（每本小说1页）
- 章节页面：1,000,000页（每本小说平均100章）
- **总计：约100万个独立HTML页面**

这个规模的网站将为Google SEO提供丰富的内容，每个页面都是独立可索引的。

---

*最后更新：2024-09-14*
