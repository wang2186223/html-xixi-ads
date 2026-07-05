#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
统计非纯数字小说的每章节平均段落数
"""

import os
import re
from pathlib import Path

def is_numeric_folder(folder_name):
    """判断文件夹名是否为纯数字"""
    return folder_name.isdigit()

def count_paragraphs_per_chapter(content):
    """
    统计每个章节的段落数
    返回：章节列表，每个元素为 (章节号, 段落数)
    """
    # 按章节分割
    chapters = re.split(r'###chapter\d+', content)
    # 移除第一个空元素（如果有）
    chapters = [ch.strip() for ch in chapters if ch.strip()]
    
    chapter_stats = []
    for idx, chapter in enumerate(chapters, 1):
        # 统计段落数：每个非空行就是一个段落
        lines = chapter.split('\n')
        paragraphs = [line.strip() for line in lines if line.strip()]
        
        para_count = len(paragraphs)
        chapter_stats.append((idx, para_count))
    
    return chapter_stats

def analyze_novel(novel_path):
    """分析单本小说"""
    text_file = novel_path / '书籍正文.txt'
    
    if not text_file.exists():
        return None
    
    try:
        with open(text_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        chapter_stats = count_paragraphs_per_chapter(content)
        
        if not chapter_stats:
            return None
        
        total_chapters = len(chapter_stats)
        total_paragraphs = sum(para_count for _, para_count in chapter_stats)
        avg_paragraphs = total_paragraphs / total_chapters if total_chapters > 0 else 0
        
        return {
            'novel_name': novel_path.name,
            'total_chapters': total_chapters,
            'total_paragraphs': total_paragraphs,
            'avg_paragraphs': avg_paragraphs,
            'chapter_details': chapter_stats
        }
    
    except Exception as e:
        print(f"Error processing {novel_path.name}: {e}")
        return None

def main():
    source_dir = Path('/Volumes/WBK/novel-free-my/html-ads-xixi/source')
    
    # 获取所有非纯数字的小说文件夹
    novel_folders = [
        folder for folder in source_dir.iterdir()
        if folder.is_dir() and not is_numeric_folder(folder.name) and folder.name != '.DS_Store'
    ]
    
    print(f"找到 {len(novel_folders)} 本非纯数字小说\n")
    print("=" * 100)
    
    results = []
    
    for novel_folder in sorted(novel_folders):
        result = analyze_novel(novel_folder)
        if result:
            results.append(result)
            print(f"\n小说: {result['novel_name']}")
            print(f"  总章节数: {result['total_chapters']}")
            print(f"  总段落数: {result['total_paragraphs']}")
            print(f"  每章平均段落数: {result['avg_paragraphs']:.2f}")
            print("-" * 100)
    
    # 总体统计
    if results:
        print("\n" + "=" * 100)
        print("总体统计:")
        print("=" * 100)
        
        total_novels = len(results)
        overall_avg = sum(r['avg_paragraphs'] for r in results) / total_novels
        
        print(f"\n统计的小说总数: {total_novels}")
        print(f"所有小说的平均段落数（每章）: {overall_avg:.2f}")
        
        # 按平均段落数排序
        print("\n按每章平均段落数排序（从高到低）:")
        print("-" * 100)
        sorted_results = sorted(results, key=lambda x: x['avg_paragraphs'], reverse=True)
        for idx, r in enumerate(sorted_results, 1):
            print(f"{idx:2d}. {r['novel_name']:<60} {r['avg_paragraphs']:6.2f} 段/章 ({r['total_chapters']} 章)")

if __name__ == '__main__':
    main()
