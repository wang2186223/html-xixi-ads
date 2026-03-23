#!/bin/bash
# 日报统计快速运行脚本
# 用法: ./run_daily_stats.sh <CSV文件路径>

# 检查参数
if [ $# -eq 0 ]; then
    echo "使用方法: ./run_daily_stats.sh <CSV文件路径>"
    echo "示例: ./run_daily_stats.sh '../ads-recan - 详细-2025-10-11.csv'"
    exit 1
fi

CSV_FILE="$1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 检查CSV文件是否存在
if [ ! -f "$CSV_FILE" ]; then
    echo "错误: 文件不存在 '$CSV_FILE'"
    exit 1
fi

# 提取文件名（不包含路径）
FILENAME=$(basename "$CSV_FILE")
BASE_NAME="${FILENAME%.*}"

# 设置输出文件名
OUTPUT_FILE="${SCRIPT_DIR}/日报-${BASE_NAME}.csv"

echo "📊 开始生成日报统计..."
echo "输入文件: $CSV_FILE"
echo "输出文件: $OUTPUT_FILE"
echo "----------------------------------------"

# 运行Python脚本
python3 "${SCRIPT_DIR}/statistics_analyzer.py" "$CSV_FILE" -o "$OUTPUT_FILE"

if [ $? -eq 0 ]; then
    echo "✅ 日报统计完成！"
    echo "📄 统计文件: $OUTPUT_FILE"
    
    # 如果是macOS，可以选择性打开文件
    if [[ "$OSTYPE" == "darwin"* ]]; then
        read -p "是否打开统计文件？(y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            open "$OUTPUT_FILE"
        fi
    fi
else
    echo "❌ 统计过程中出现错误"
    exit 1
fi