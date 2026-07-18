# JS Canvas 内容覆盖方案文档

更新日期：2026-07-19

---

## 一、整体目标

FB 流量用户打开章节页时，用 canvas 把 Supabase 上的内容画在原始 `<p>` 文字上面，SEO 保留原始 HTML，DevTools 无法直接选中文字内容。

---

## 二、整体执行流程

```
t = 0（DOMContentLoaded）
  └─ createPlaceholders()
       ├─ 读取 7 个 .text-block 的 getBoundingClientRect()
       ├─ 每个 block 创建同尺寸 canvas，写 "Protecting content, please wait..."
       └─ 启动位置同步（ResizeObserver + setInterval 5s）

t = 0（同时排队）
  └─ setTimeout(fn, 2000)
       ├─ PC 浏览器？         → removeAll() + loadAds() 结束
       ├─ 非 FB 流量？        → removeAll() + loadAds() 结束
       ├─ 无法解析 IDs？      → removeAll() + loadAds() 结束
       └─ 全部满足 → fetchChapter(Supabase)
            ├─ 返回 < 7 段   → removeAll() + loadAds() 结束
            └─ 返回 ≥ 7 段   → redrawWithContent(paras)
                                  ├─ 7 canvas 各绘制分组内容
                                  ├─ 有溢出 → createOverflowCanvas()（第 8 个）
                                  └─ loadAds()  ← 广告在 canvas 全部完成后才加载
```

---

## 三、触发条件（双重判断）

```javascript
function isFBTraffic() {
  // 条件1：localStorage 有 fb_user = '1'（在小说详情页点击过任意按钮后注入）
  var hasFbUser = localStorage.getItem('fb_user') === '1';
  if (!hasFbUser) return false;

  // 条件2：URL 或 localStorage 有 FB 参数
  var p = new URLSearchParams(window.location.search);
  if (p.has('fbclid') || p.get('utm_source') === 'facebook') return true;
  try {
    var s = JSON.parse(localStorage.getItem('trackingParams') || '{}');
    if (s.fbclid || s.utm_source === 'facebook') return true;
  } catch (e) {}
  return false;
}

function isMobile() {
  var ua = navigator.userAgent.toLowerCase();
  return /mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini|webos/.test(ua)
    || 'ontouchstart' in window
    || navigator.maxTouchPoints > 0
    || window.screen.width < 1024;
}
```

### fb_user 注入逻辑（novel.html）

```javascript
// 用户在小说详情页点击任意按钮时注入
document.addEventListener('click', function () {
    localStorage.setItem('fb_user', '1');
}, { once: true });
```

- 覆盖：返回、首页、logo、图书馆、开始阅读、继续阅读、筛选按钮、所有章节链接
- 存储在 localStorage，同域名永久有效，URL 不显示

---

## 四、第一阶段：占位 canvas（立即执行）

DOMContentLoaded 触发后，**不等待任何条件**，立即在每个 `.text-block` 上盖一个同尺寸 canvas。

```javascript
function createPlaceholders() {
  var blocks = Array.from(document.querySelectorAll('.text-block'));
  _container = document.createElement('div');
  _container.id = 'fb-overlay-container';
  _container.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:50';
  document.body.appendChild(_container);

  var dpr = window.devicePixelRatio || 1;
  blocks.forEach(function (block) {
    var r = block.getBoundingClientRect();
    var cssW = r.width, cssH = r.height;
    if (cssW <= 0 || cssH <= 0) return;

    var cv = document.createElement('canvas');
    cv.width  = Math.ceil(cssW * dpr);
    cv.height = Math.ceil(cssH * dpr);
    // 定位：文档绝对坐标
    cv.style.top    = (r.top  + window.scrollY) + 'px';
    cv.style.left   = (r.left + window.scrollX) + 'px';
    cv.style.width  = cssW + 'px';
    cv.style.height = cssH + 'px';
    _container.appendChild(cv);

    // 绘制占位文字
    var ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = document.body.classList.contains('dark-mode') ? '#1C1C1E' : '#FFFFFF';
    ctx.fillRect(0, 0, cssW, cssH);
    ctx.fillStyle = '#999999';
    ctx.font = '15px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText('Protecting content, please wait...', cssW / 2, cssH / 2);

    _items.push({ block, canvas: cv, cssW, cssH });
  });
}
```

> **canvas 尺寸固定为 text-block 的原始高度，全程不再修改。**

---

## 五、Canvas 覆盖结构

### DOM 结构

```html
<body>
  <div id="fb-overlay-container">   <!-- position:absolute; top:0; left:0; 100%×100% -->
    <canvas class="fb-ov">          <!-- top = rect.top + scrollY（文档绝对坐标）-->
    <canvas class="fb-ov">
    ...（7个，对应7个 .text-block）
    <canvas class="fb-ov fb-ov-extra">  <!-- 第8个，仅溢出时创建，位于最后广告之后 -->
  </div>
```

### 关键属性

| 属性 | 值 | 说明 |
|------|-----|------|
| 容器 position | `absolute` | 随文档滚动，零延迟，不是 fixed |
| canvas top | `rect.top + window.scrollY` | 文档绝对坐标 |
| pointer-events | `none` | 不拦截广告点击 |
| z-index | `50` | 在正文之上，header(z=100) 之下 |
| 背景色 | `#FFFFFF` / `#1C1C1E` | 跟随浅色/深色模式 |
| **canvas 高度** | **锁定为 text-block 原始高度** | **不因 Supabase 内容多少而改变** |

### 位置同步机制

```javascript
function setupPositionSync() {
  function sync() {
    _items.forEach(function (item) {
      var r = item.block.getBoundingClientRect();
      item.canvas.style.top  = (r.top  + window.scrollY) + 'px';
      item.canvas.style.left = (r.left + window.scrollX) + 'px';
    });
    syncExtraCanvas();  // 同步第8个 canvas
  }
  // 广告加载撑高 .content 时立即同步
  var contentEl = document.querySelector('.content');
  if (contentEl) new ResizeObserver(sync).observe(contentEl);
  // 兜底：每5秒强制对齐一次
  setInterval(sync, 5000);
}
```

---

## 六、第二阶段：绘制 Supabase 内容（2秒后）

### 段落分组逻辑

Supabase 返回 ≥ 7 段时，将段落均分给 7 个 canvas，每个至少 1 段：

```javascript
// 返回 < 7 段 → 终止绘制，removeAll() 展示原始 HTML
if (!paras || paras.length < 7) { removeAll(); loadAds(); return; }

// 均分：base 段/组，前 rem 组多分 1 段
var base = Math.floor(paras.length / NUM);   // NUM = _items.length (7)
var rem  = paras.length % NUM;
var groups = [], s = 0;
for (var g = 0; g < NUM; g++) {
  var size = base + (g < rem ? 1 : 0);
  groups.push(paras.slice(s, s + size));
  s += size;
}
```

### canvas 绘制规则

- **字号、行高 1:1 还原**：从 `getComputedStyle(block)` 读取 `fontSize` / `lineHeight`，直接用于绘制，不缩放
- **canvas 高度不变**：内容不足时留白；内容超出时截断，超出部分交给第 8 个 canvas
- **文字对齐**：非段落末行两端对齐（justify）；段落末行左对齐
- **Retina 支持**：`ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)`

```javascript
function drawParasOnCanvas(cv, paras, cssW, cssH, blockEl) {
  var st    = window.getComputedStyle(blockEl);
  var fs    = parseFloat(st.fontSize);
  var lineH = st.lineHeight === 'normal' ? fs * 1.6 : parseFloat(st.lineHeight);
  var pGap  = 20;

  // ... 清除背景，逐行绘制 ...

  for (var pi = 0; pi < paras.length; pi++) {
    var lines = wrapPara(paras[pi], mCtx, cssW);

    // 第一行放不下 → 该段及之后全部返回为溢出
    if (y + lineH > cssH) return paras.slice(pi);

    for (var li = 0; li < lines.length; li++) {
      if (y + lineH > cssH) break;  // 段落中途截断，剩余留白
      // justify / left-align 绘制 ...
      y += lineH;
    }
    if (pi < paras.length - 1) y += pGap;
  }
  return [];  // 全部内容已绘制完毕
}
```

---

## 七、第 8 个 canvas（内容溢出时）

当 7 个 canvas 绘制完后仍有剩余段落，创建第 8 个 canvas：

- **位置**：最后一个 `ins.adsbygoogle` 元素底部 +10px
- **高度**：按实际剩余内容计算，向下自然延伸
- **spacer**：在 `<footer>` 之后插入同高 div，防止第 8 个 canvas 被裁剪
- **坐标不影响前 7 个**：第 8 个 canvas 完全独立追加在容器内

```javascript
function createOverflowCanvas(overflowParas) {
  // 计算所需高度
  var totalH = overflowParas 各段行数 × lineH + 段间距 + buffer;

  // 定位在最后广告底部
  var lastAd  = document.querySelectorAll('ins.adsbygoogle')[最后一个];
  var docTop  = lastAd.getBoundingClientRect().bottom + window.scrollY + 10;

  // 创建 canvas 并绘制
  // ...

  // 在 footer 后插入 spacer，撑开页面高度
  var spacer = document.createElement('div');
  spacer.style.height = (totalH + 20) + 'px';
  footer.parentNode.insertBefore(spacer, footer.nextSibling);
}
```

第 8 个 canvas 的位置也纳入 `syncExtraCanvas()` 在每次布局变化时更新。

---

## 八、广告加载时机

AdSense 在页面初始时被全局阻断：

```javascript
// <head> 中
(window.adsbygoogle = window.adsbygoogle || []).pauseAdRequests = 1;
```

`loadAds()` 在 **canvas 绘制全部完成（或绘制流程终止）后** 才调用：

```javascript
function loadAds() {
  (window.adsbygoogle = window.adsbygoogle || []).pauseAdRequests = 0;
  document.querySelectorAll('ins.adsbygoogle').forEach(function (ad) {
    if (!ad.hasAttribute('data-adsbygoogle-status')) {
      try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
    }
  });
}
```

这确保广告不会在 canvas 绘制期间加载并移动文字块位置。

---

## 九、Supabase 数据结构

| 字段 | 类型 | 说明 |
|------|------|------|
| novel_id | text | 5位零填充，如 `'00001'` |
| chapter_id | int | 章节编号 |
| title | text | 章节标题 |
| content | text | 内容，段落用 `\n\n` 分隔 |

URL 格式：`/novels/{novel_id}/{chapter_id}`（chapter_id 纯数字，支持 `chapter-1.html` 和 `1.html` 两种命名）

---

## 十、z-index 层级

| 元素 | z-index |
|------|---------|
| 正文 `<p>` | 默认 |
| canvas 覆盖层（7+1） | 50 |
| sticky header | 100 |
| AdGuide 浮层 | 9999+ |
| AdGuide tooltip | 20000 |

---

## 十一、关键配置

| 配置项 | 值 |
|--------|-----|
| Supabase URL | `https://czqmqnvqkugzpgwfmyth.supabase.co` |
| Supabase Key | `sb_publishable_FF8-Z6gbAyjvHK77w4QfGw_02nCOhaw` |
| AdSense ID | `ca-pub-5678834518894660` |
| FB Pixel | `9481513911889537` |
| GA4 | `G-YKK2QRZ5GC` |
| 文字块数量 | 7块（对应7段广告） |
| canvas z-index | 50 |
| Supabase 最少段落数 | 7（少于7段终止覆盖，展示原始内容） |
| setTimeout 延迟 | 2000ms |
