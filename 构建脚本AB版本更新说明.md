# 构建脚本AB版本更新说明

## 更新日期
2025年10月26日

## 更新内容

### 主要改进
`build-website.py` 脚本现已支持自动生成AB版本章节页面！

### 功能说明

#### 自动生成两个版本
每次运行构建脚本时，系统会自动为每个章节生成两个版本：

1. **广告版本** (`chapter-X.html`)
   - 包含AB版本检测脚本
   - 包含完整的广告引导系统
   - 文件大小约135-140 KB
   - 代码行数约3500-3600行

2. **纯净版本** (`chapter-X-clean.html`)
   - 不含AB版本检测脚本
   - 不含广告引导系统
   - 文件大小约88-92 KB
   - 代码行数约2400-2500行
   - 比广告版本小约35%

### 使用方法

```bash
# 正常构建（增量构建）
python3 tools/build-website.py

# 强制重建所有页面
python3 tools/build-website.py --force
```

### 构建输出示例

```
构建小说: The Queen's Rebirth
  ├─ 生成章节页面: 300 章
  ├─ AB版本模式: 每章生成2个文件（广告版 + 纯净版）
  └─ 预计生成文件: 600 个章节文件
     进度: 10/300 章 (已生成 20 个文件)
     进度: 20/300 章 (已生成 40 个文件)
     ...
     进度: 300/300 章 (已生成 600 个文件)
```

### 文件命名规则

- **广告版本**: `chapter-1.html`, `chapter-2.html`, ...
- **纯净版本**: `chapter-1-clean.html`, `chapter-2-clean.html`, ...

### 统计数据

根据当前9本小说的构建结果：

| 小说 | 章节数 | 广告版 | 纯净版 | 合计文件 |
|------|--------|--------|--------|----------|
| The Queen's Rebirth | 300 | 300 | 300 | 600 |
| My Phone Traveled with Me to the-80s | 300 | 300 | 300 | 600 |
| The Hidden Heiress Divorces the CEO | 500 | 500 | 500 | 1000 |
| Runaway Heiress Reborn | 507 | 507 | 507 | 1014 |
| The Fallen Heiress' Gambit | 301 | 301 | 301 | 602 |
| Irresistible Seduction | 107 | 107 | 107 | 214 |
| Heartbreak Billionaire | 248 | 248 | 248 | 496 |
| My Rejected Mate Regrets | 498 | 498 | 498 | 996 |
| His Ex-Wife's Secret | 500 | 500 | 500 | 1000 |

**总计**: 3261 章 → 生成 6522 个文件

### 工作原理

1. **模板加载**
   ```python
   template_ads = self.env.get_template('chapter.html')      # 广告版模板
   template_clean = self.env.get_template('chapter-clean.html')  # 纯净版模板
   ```

2. **数据准备**
   - 两个版本使用相同的渲染数据
   - 包括章节内容、导航链接、小说信息等

3. **并行渲染**
   ```python
   # 渲染广告版本
   html_content_ads = template_ads.render(**render_data)
   
   # 渲染纯净版本
   html_content_clean = template_clean.render(**render_data)
   ```

4. **文件保存**
   - 广告版: `chapter-{number}.html`
   - 纯净版: `chapter-{number}-clean.html`

### 性能优化

- **智能增量构建**: 仅重建有变化的小说
- **进度显示**: 每10章显示一次进度
- **批量处理**: 一次性生成所有章节的两个版本

### AB版本工作流程

```
用户访问 chapter-1.html
        ↓
   AB检测脚本执行
        ↓
   检测跟踪参数？
   ↓           ↓
  有          无
   ↓           ↓
显示广告版   检查localStorage
(chapter-1.html)  ↓
            有记录？(未过期)
            ↓           ↓
           有          无
            ↓           ↓
      显示广告版    重定向纯净版
                (chapter-1-clean.html)
```

### 文件大小对比

以第1章为例：

```
广告版本 (chapter-1.html):
- 大小: 137,976 字节 (135 KB)
- 行数: 3,590 行
- 包含: AB检测 + 广告引导系统

纯净版本 (chapter-1-clean.html):
- 大小: 89,754 字节 (88 KB)
- 行数: 2,496 行
- 包含: 仅基础功能

差异: -1,094 行代码 (-35% 文件大小)
```

### 维护建议

1. **修改基础功能**
   - 需要同时修改 `chapter.html` 和 `chapter-clean.html` 模板
   - 确保两个版本的基础功能保持一致

2. **修改广告功能**
   - 只需修改 `chapter.html` 模板
   - `chapter-clean.html` 不受影响

3. **重新构建**
   ```bash
   # 修改模板后，强制重建所有页面
   python3 tools/build-website.py --force
   ```

### 验证方法

```bash
# 检查文件是否正确生成
ls -lh docs/novels/*/chapter-*-clean.html | wc -l

# 对比文件大小
ls -lh docs/novels/the-queens-rebirth/chapter-1.html
ls -lh docs/novels/the-queens-rebirth/chapter-1-clean.html

# 验证AB检测脚本
grep -c "AB Version Detection" docs/novels/the-queens-rebirth/chapter-1.html
grep -c "AB Version Detection" docs/novels/the-queens-rebirth/chapter-1-clean.html
```

预期结果：
- 广告版本包含AB检测脚本（结果为1）
- 纯净版本不包含AB检测脚本（结果为0）

### 注意事项

1. **构建时间**: AB版本模式会使构建时间增加约一倍（因为每章生成2个文件）
2. **存储空间**: 需要约2倍的存储空间来保存两个版本
3. **模板同步**: 修改基础功能时记得同步两个模板文件
4. **缓存清理**: 强制重建时会清空并重新生成所有文件

### 相关文件

- `tools/build-website.py` - 构建脚本（已更新）
- `tools/templates/chapter.html` - 广告版本模板
- `tools/templates/chapter-clean.html` - 纯净版本模板
- `AB版本实施报告.md` - AB版本详细文档
- `AB版本验证清单.md` - 验证清单

### 更新日志

- **2025-10-26**: 实施AB版本自动生成功能
  - 修改 `build_chapter_pages()` 方法
  - 添加双模板渲染逻辑
  - 添加进度显示功能
  - 优化日志输出

---

**状态**: ✅ 已完成并测试
**测试结果**: ✅ 所有9本小说共6522个文件正确生成
