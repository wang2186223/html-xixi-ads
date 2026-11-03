#!/bin/bash

set -eu

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
workspace_root="$(cd "$script_dir/../.." && pwd)"
template="$script_dir/chapter.html"
output_dir="${1:-$workspace_root/docs}"
ad_pattern='adsbygoogle|AdSense|AdClickGuide|googlesyndication|pagead|ca-pub-|doubleclick\.net'

if grep -Eiq "$ad_pattern" "$template"; then
    echo "失败：章节模板仍包含广告代码：$template"
    exit 1
fi

if [[ -d "$output_dir" ]]; then
    matches="$(find "$output_dir" -type f -name '*.html' -exec grep -nEi "$ad_pattern" {} + || true)"
    if [[ -n "$matches" ]]; then
        echo "失败：HTML 构建产物仍包含广告代码："
        printf '%s\n' "$matches"
        exit 1
    fi
fi

echo "通过：章节模板和 HTML 构建产物均未发现广告代码。"