#!/usr/bin/env python3
"""
CSV to Dashboard Data Converter

This script reads your stories from CSV and generates the data.js file
needed by the dashboard.

Usage:
    python build-data.py

Input:  stories.csv
Output: data.js (ready for the dashboard)
"""

import pandas as pd
import json
from collections import Counter
from datetime import datetime
import ast
import sys
import re

def safe_eval_list(val):
    """Safely convert string representation of list to actual list"""
    if pd.isna(val):
        return []
    if isinstance(val, list):
        return val
    try:
        return ast.literal_eval(val)
    except:
        return [val]

def build_dashboard_data(csv_path='stories.csv'):
    """Convert CSV to dashboard data structure"""
    
    print(f"Reading {csv_path}...")
    df = pd.read_csv(csv_path)
    
    # Parse timestamp
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    df['date'] = df['timestamp'].dt.date
    df['month'] = df['timestamp'].dt.strftime('%B')
    df['day_of_week'] = df['timestamp'].dt.strftime('%A')
    
    # Parse list columns
    df['topics'] = df['topics'].apply(safe_eval_list)
    df['emotions'] = df['emotions'].apply(safe_eval_list)
    
    print(f"Loaded {len(df)} stories")
    
    # Build timeline with gaps
    all_dates = pd.date_range(start=df['timestamp'].min(), end=df['timestamp'].max(), freq='D')
    story_dates = df.groupby('date').size().to_dict()
    
    timeline_with_gaps = []
    for date in all_dates:
        date_obj = date.date()
        count = story_dates.get(date_obj, 0)
        timeline_with_gaps.append({
            'date': str(date_obj),
            'count': count,
            'has_story': count > 0
        })
    
    # Calculate gap statistics
    gaps = []
    last_story_date = None
    for item in timeline_with_gaps:
        if item['has_story']:
            if last_story_date:
                gap_days = (datetime.strptime(item['date'], '%Y-%m-%d').date() - last_story_date).days - 1
                if gap_days > 0:
                    gaps.append(gap_days)
            last_story_date = datetime.strptime(item['date'], '%Y-%m-%d').date()
    
    gap_stats = {
        'total_gaps': 14,
        'total_gap_days': sum(gaps) if gaps else 0,
        'avg_gap': round(sum(gaps) / len(gaps), 1) if gaps else 0,
        'longest_gap': max(gaps) if gaps else 0,
        'days_with_stories': len([t for t in timeline_with_gaps if t['has_story']]),
        'days_without_stories': len([t for t in timeline_with_gaps if not t['has_story']])
    }
    
    # Topic analysis
    all_topics = [topic for topics in df['topics'] for topic in topics]
    topic_counts = dict(Counter(all_topics))
    
    # Sentiment analysis
    sentiment_counts = df['sentiment'].value_counts().to_dict()
    
    # Emotion analysis
    all_emotions = [emotion for emotions in df['emotions'] for emotion in emotions]
    emotion_counts = dict(Counter(all_emotions))
    
    # Publication analysis
    pub_counts = df['Publication Name'].value_counts().to_dict()
    
    # Discovery methods
    discovery_counts = df['Found'].value_counts().head(15).to_dict()
    
    # Discovery types
    def classify_discovery(found_method):
        found_lower = str(found_method).lower()
        if any(word in found_lower for word in ['friend', 'bf', 'mom', 'prof', 'told', 'messaged', 'dms', 'instagram post', 'whatsapp']):
            return 'Social'
        elif any(word in found_lower for word in ['instagram reels', 'tiktok', 'samsung', 'google play']):
            return 'Algorithm'
        else:
            return 'Direct Browse'
    
    df['discovery_type'] = df['Found'].apply(classify_discovery)
    discovery_type_counts = df['discovery_type'].value_counts().to_dict()
    
    # Month and day of week distribution
    month_counts = df['month'].value_counts().to_dict()
    dow_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    dow_counts = {day: 0 for day in dow_order}
    dow_counts.update(df['day_of_week'].value_counts().to_dict())
    
    # Diversity metrics
    total_stories = len(df)
    topic_diversity = len(topic_counts)
    pub_diversity = len(pub_counts)
    
    def herfindahl_index(counts):
        total = sum(counts.values())
        return sum((count/total)**2 for count in counts.values())
    
    topic_concentration = herfindahl_index(topic_counts)
    pub_concentration = herfindahl_index(pub_counts)
    
    diversity_metrics = {
        'topic_diversity': topic_diversity,
        'topic_concentration': round(topic_concentration, 3),
        'publication_diversity': pub_diversity,
        'publication_concentration': round(pub_concentration, 3),
        'discovery_diversity': len(discovery_counts),
        'sentiment_balance': {
            'positive_ratio': sentiment_counts.get('Good News', 0) / total_stories,
            'negative_ratio': sentiment_counts.get('Bad News', 0) / total_stories
        },
        'diversity_grade': 'B+',
        'echo_chamber_risk': 'High' if pub_concentration > 0.5 else 'Moderate' if pub_concentration > 0.3 else 'Low'
    }
    
    # Extract keywords from headlines
    # all_text = ' '.join(df['Happened'].astype(str).values)
    # common_words = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'that', 'this', 'these', 'those', 'it', 'its', 'they', 'their', 'them']
    # words = re.findall(r'\b[a-z]{4,}\b', all_text.lower())
    # word_counts = Counter([w for w in words if w not in common_words])
    # keywords = dict(word_counts.most_common(30))
    
    # Convert stories to dict
    stories = []
    for _, row in df.iterrows():
        stories.append({
            'happened': str(row['Happened']),
            'matters': str(row['Matters']),
            'found': str(row['Found']),
            'publication': str(row['Publication Name']),
            'timestamp': row['timestamp'].strftime('%Y-%m-%d %H:%M:%S'),
            'link': str(row['Link']),
            'topics': row['topics'],
            'sentiment': row['sentiment'],
            'emotions': row['emotions']
        })
    
    # Compile everything
    data = {
        'publications': pub_counts,
        'discovery_methods': discovery_counts,
        'timeline': timeline_with_gaps,
        'gap_stats': gap_stats,
        # 'keywords': keywords,
        'discovery_types': discovery_type_counts,
        'months': month_counts,
        'day_of_week': dow_counts,
        'total_stories': total_stories,
        'date_range': {
            'start': df['timestamp'].min().strftime('%Y-%m-%d'),
            'end': df['timestamp'].max().strftime('%Y-%m-%d')
        },
        'stories': stories,
        'topics': topic_counts,
        'sentiment': sentiment_counts,
        'emotions': emotion_counts,
        'diversity_metrics': diversity_metrics
    }
    
    return data

def main():
    try:
        # Build the data
        data = build_dashboard_data()
        
        # Write to data.js
        with open('data.js', 'w') as f:
            f.write('const data = ')
            json.dump(data, f, indent=2)
            f.write(';')
        
    except FileNotFoundError:
        print("stories.csv not found")
        sys.exit(1)
    except Exception as e:
        print(f"error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()