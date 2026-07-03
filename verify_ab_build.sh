#!/bin/bash

# AB版本构建验证脚本
# 用于验证build-website.py是否正确生成AB版本文件

echo "================================"
echo "   AB版本构建验证"
echo "================================"
echo ""

# 计数器
total_chapters=0
total_ads=0
total_clean=0
novels_checked=0

# 遍历所有小说
for novel_dir in docs/novels/*/; do
    if [ -d "$novel_dir" ]; then
        novels_checked=$((novels_checked + 1))
        novel_name=$(basename "$novel_dir")
        
        # 计算章节数
        chapter_count=$(ls "$novel_dir"chapter-*.html 2>/dev/null | grep -v "clean" | wc -l | tr -d ' ')
        clean_count=$(ls "$novel_dir"chapter-*-clean.html 2>/dev/null | wc -l | tr -d ' ')
        
        total_chapters=$((total_chapters + chapter_count))
        total_ads=$((total_ads + chapter_count))
        total_clean=$((total_clean + clean_count))
        
        # 检查是否匹配
        if [ "$chapter_count" -eq "$clean_count" ]; then
            status="✅"
        else
            status="❌"
        fi
        
        echo "$status $novel_name"
        echo "   广告版: $chapter_count 个"
        echo "   纯净版: $clean_count 个"
        echo ""
    fi
done

echo "================================"
echo "📊 总计统计"
echo "================================"
echo "小说数量: $novels_checked 本"
echo "章节总数: $total_chapters 章"
echo "广告版本: $total_ads 个文件"
echo "纯净版本: $total_clean 个文件"
echo "文件总数: $((total_ads + total_clean)) 个"
echo ""

# 验证匹配
if [ "$total_ads" -eq "$total_clean" ]; then
    echo "✅ 验证通过: 广告版和纯净版数量匹配"
else
    echo "❌ 验证失败: 广告版($total_ads) 和纯净版($total_clean) 数量不匹配"
    exit 1
fi

echo ""
echo "================================"
echo "🔍 随机抽样验证"
echo "================================"

# 随机抽取一个小说的第1章进行验证
sample_novel=$(ls -d docs/novels/*/ | head -1)
sample_novel_name=$(basename "$sample_novel")

echo "抽样小说: $sample_novel_name"
echo ""

# 检查chapter-1.html
ads_file="${sample_novel}chapter-1.html"
clean_file="${sample_novel}chapter-1-clean.html"

if [ -f "$ads_file" ] && [ -f "$clean_file" ]; then
    echo "✅ 文件存在检查通过"
    echo ""
    
    # 检查AB检测脚本
    ads_has_ab=$(grep -c "AB Version Detection" "$ads_file")
    clean_has_ab=$(grep -c "AB Version Detection" "$clean_file")
    
    echo "AB检测脚本:"
    if [ "$ads_has_ab" -gt 0 ]; then
        echo "  ✅ 广告版包含AB检测脚本"
    else
        echo "  ❌ 广告版缺少AB检测脚本"
    fi
    
    if [ "$clean_has_ab" -eq 0 ]; then
        echo "  ✅ 纯净版不包含AB检测脚本"
    else
        echo "  ❌ 纯净版错误包含AB检测脚本"
    fi
    echo ""
    
    # 检查广告引导系统
    ads_has_guide=$(grep -c "AdClickGuideSystem" "$ads_file")
    clean_has_guide=$(grep -c "AdClickGuideSystem" "$clean_file")
    
    echo "广告引导系统:"
    if [ "$ads_has_guide" -gt 0 ]; then
        echo "  ✅ 广告版包含广告引导系统"
    else
        echo "  ❌ 广告版缺少广告引导系统"
    fi
    
    if [ "$clean_has_guide" -eq 0 ]; then
        echo "  ✅ 纯净版不包含广告引导系统"
    else
        echo "  ❌ 纯净版错误包含广告引导系统"
    fi
    echo ""
    
    # 文件大小对比
    ads_size=$(wc -c < "$ads_file" | tr -d ' ')
    clean_size=$(wc -c < "$clean_file" | tr -d ' ')
    size_diff=$((ads_size - clean_size))
    size_percent=$((size_diff * 100 / ads_size))
    
    echo "文件大小对比:"
    echo "  广告版: $ads_size 字节"
    echo "  纯净版: $clean_size 字节"
    echo "  差异: -$size_diff 字节 (-$size_percent%)"
    echo ""
    
    # 行数对比
    ads_lines=$(wc -l < "$ads_file" | tr -d ' ')
    clean_lines=$(wc -l < "$clean_file" | tr -d ' ')
    lines_diff=$((ads_lines - clean_lines))
    
    echo "代码行数对比:"
    echo "  广告版: $ads_lines 行"
    echo "  纯净版: $clean_lines 行"
    echo "  差异: -$lines_diff 行"
else
    echo "❌ 文件不存在"
    exit 1
fi

echo ""
echo "================================"
echo "✅ 验证完成"
echo "================================"
