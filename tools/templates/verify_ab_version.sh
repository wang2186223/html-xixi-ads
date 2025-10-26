#!/bin/bash

echo "=== AB版本验证报告 ==="
echo ""

echo "1. 检查chapter.html是否包含AB检测脚本:"
if grep -q "AB Version Detection & Redirect System" chapter.html; then
    echo "   ✓ 包含AB检测脚本"
else
    echo "   ✗ 缺少AB检测脚本"
fi

echo ""
echo "2. 检查chapter.html是否包含广告引导系统:"
if grep -q "AdClickGuideSystem" chapter.html; then
    echo "   ✓ 包含广告引导系统"
else
    echo "   ✗ 缺少广告引导系统"
fi

echo ""
echo "3. 检查chapter-clean.html是否不包含AB检测脚本:"
if ! grep -q "AB Version Detection" chapter-clean.html; then
    echo "   ✓ 不包含AB检测脚本（正确）"
else
    echo "   ✗ 包含AB检测脚本（错误）"
fi

echo ""
echo "4. 检查chapter-clean.html是否不包含广告引导系统:"
if ! grep -q "AdClickGuideSystem" chapter-clean.html; then
    echo "   ✓ 不包含广告引导系统（正确）"
else
    echo "   ✗ 包含广告引导系统（错误）"
fi

echo ""
echo "5. 文件大小对比:"
echo "   chapter.html:       $(wc -l < chapter.html) 行"
echo "   chapter-clean.html: $(wc -l < chapter-clean.html) 行"

echo ""
echo "6. 核心功能检查:"
echo "   - 跟踪参数列表:"
grep -A 1 "TRACKING_PARAMS = \[" chapter.html | head -1 | sed 's/^/     /'

echo "   - 过期时间设置:"
grep "EXPIRY_HOURS" chapter.html | head -1 | sed 's/^/     /'

echo ""
echo "=== 验证完成 ==="
