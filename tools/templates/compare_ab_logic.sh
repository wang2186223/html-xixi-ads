#!/bin/bash

echo "=== 对比AB检测逻辑 ==="
echo ""

echo "跟踪参数列表（应该一致）:"
echo "chapter.html:"
grep "TRACKING_PARAMS" chapter.html | head -1 | sed 's/^/  /'

echo ""
echo "过期时间（应该是720小时=30天）:"
grep "EXPIRY_HOURS" chapter.html | head -1 | sed 's/^/  /'

echo ""
echo "重定向函数关键逻辑（检查-clean.html后缀）:"
grep -A 2 "cleanPath = currentPath.replace" chapter.html | sed 's/^/  /'

echo ""
echo "=== 对比完成 ==="
