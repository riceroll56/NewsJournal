// Global variables
let filteredStories = data.stories;

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', function() {
    init();
});

// Main initialization function
function init() {
    renderStatsHero();
    renderTimeline();
    renderTopics();
    renderDiversity();
    renderStories();
    setupTabs();
}

// Render stats hero section
function renderStatsHero() {
    const html = `
        <div class="card">
            <div class="label">total stories</div>
            <div class="value">${data.total_stories}</div>
        </div>
        <div class="card">
            <div class="label">Most Active Day</div>
            <div class="value">Tuesday</div>
        </div>
        <div class="card">
            <div class="label">areas of interest</div>
            <div class="value">${Object.keys(data.topics).length}</div>
        </div>
        <div class="card">
            <div class="label">publications</div>
            <div class="value">${Object.keys(data.publications).length}</div>
        </div>

    `;
    document.getElementById('statsHero').innerHTML = html;
}

// Render timeline panel
function renderTimeline() {

    // Topics chart
    const sortedTopics = Object.entries(data.topics).sort((a,b) => b[1] - a[1]);
    const maxTopic = sortedTopics[0][1];
    const topicsHtml = sortedTopics.map(([topic, count]) => {
        const width = (count / maxTopic) * 100;
        return `
            <div class="bar-row">
                <div class="label">${topic}</div>
                <div class="bar-track">
                    <div class="bar-fill" style="width: ${width}%">${count}</div>
                </div>
            </div>
        `;
    }).join('');
    document.getElementById('topicsChart').innerHTML = topicsHtml;

    const html = data.timeline.map(day => {
        const className = day.count === 0 ? 'timeline-day' : 'timeline-day has-story';
        const tooltip = day.count === 0 ? 
            `<span class="tooltip">${day.date}: No stories</span>` :
            `<span class="tooltip">${day.date}: ${day.count} ${day.count === 1 ? 'story' : 'stories'}</span>`;
        return `<div class="${className}">${tooltip}</div>`;
    }).join('');
    document.getElementById('timelineGaps').innerHTML = html;
    document.getElementById('longestGap').textContent = data.gap_stats.longest_gap;
    document.getElementById('avgGap').textContent = data.gap_stats.avg_gap;
    document.getElementById('totalGaps').textContent = 14;
}

// Render topics and sentiment
function renderTopics() {
    // Sentiment chart
    const sentimentData = [
        ['Good News', data.sentiment['Good News'] || 0, 'var(--accent-dim)'],
        ['Bad News', data.sentiment['Bad News'] || 0, 'var(--gray)']
    ];
    const maxSent = Math.max(...sentimentData.map(d => d[1]));
    const sentimentHtml = sentimentData.map(([label, count, color]) => {
        const width = (count / maxSent) * 100;
        return `
            <div class="bar-row">
                <div class="label">${label}</div>
                <div class="bar-track">
                    <div class="bar-fill" style="width: ${width}%; background: ${color}">${count} (${Math.round(count/data.total_stories*100)}%)</div>
                </div>
            </div>
        `;
    }).join('');
    document.getElementById('sentimentChart').innerHTML = sentimentHtml;

    // Emotion cloud
    const sortedEmotions = Object.entries(data.emotions).sort((a,b) => b[1] - a[1]);
    const emotionHtml = sortedEmotions.map(([emotion, count]) => 
        `<span class="tag">${emotion} (${count})</span>`
    ).join('');
    document.getElementById('emotionCloud').innerHTML = emotionHtml;
}

// Render diversity metrics
function renderDiversity() {
    const metrics = data.diversity_metrics;
    const html = `
        <div class="card yellow">
            <div class="label">Perspective Balance</div>
            <div class="title">Skews Left & Left-Center</div>
        </div>
        <div class="card yellow">
            <div class="label">Source Concentration</div>
            <div class="title">78% From NYT</div>
        </div>
        <div class="card yellow">
            <div class="label">Echo Chamber Risk</div>
            <div class="title">${metrics.echo_chamber_risk}</div>
        </div>
    `;
    document.getElementById('diversityDashboard').innerHTML = html;

    // Pie Chart
    renderPieChart();

    // Publication chart
    const sortedPubs = Object.entries(data.publications).sort((a,b) => b[1] - a[1]);
    const maxPub = sortedPubs[0][1];
    const pubHtml = sortedPubs.map(([pub, count]) => {
        const width = (count / maxPub) * 100;
        return `
            <div class="bar-row">
                <div class="label">${pub}</div>
                <div class="bar-track">
                    <div class="bar-fill" style="width: ${width}%">${count}</div>
                </div>
            </div>
        `;
    }).join('');
    document.getElementById('publicationChart').innerHTML = pubHtml;
}

// Render pie chart
function renderPieChart() {
    const colors = ['#ff3b30', '#0a0a0a', '#666666'];
    const total = Object.values(data.discovery_types).reduce((a, b) => a + b, 0);
    
    let currentAngle = 0;
    let svgPaths = '';
    let legendHtml = '';

    Object.entries(data.discovery_types).forEach(([type, count], i) => {
        const percentage = count / total;
        const angle = percentage * 2 * Math.PI;
        
        const x1 = 125 + 100 * Math.cos(currentAngle - Math.PI / 2);
        const y1 = 125 + 100 * Math.sin(currentAngle - Math.PI / 2);
        const x2 = 125 + 100 * Math.cos(currentAngle + angle - Math.PI / 2);
        const y2 = 125 + 100 * Math.sin(currentAngle + angle - Math.PI / 2);
        
        const largeArc = angle > Math.PI ? 1 : 0;
        
        svgPaths += `
            <path d="M 125 125 L ${x1} ${y1} A 100 100 0 ${largeArc} 1 ${x2} ${y2} Z" 
                  fill="${colors[i]}" stroke="#0a0a0a" stroke-width="2"/>
        `;
        
        legendHtml += `
            <div class="legend-item">
                <div class="legend-color" style="background: ${colors[i]}"></div>
                <div>${type}: ${count} (${Math.round(percentage * 100)}%)</div>
            </div>
        `;
        
        currentAngle += angle;
    });

    document.getElementById('pieChart').innerHTML = svgPaths;
    document.getElementById('pieLegend').innerHTML = legendHtml;
}

// Render stories grid
function renderStories(stories = data.stories) {
    const html = stories.map(story => {
        const sentimentClass = story.sentiment === 'Good News' ? 'good' : 'bad';
        return `
            <div class="card white">
                <div class="story-meta-top">
                    <span class="story-date">${new Date(story.timestamp).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}</span>
                    <span class="story-tag ${sentimentClass}">${story.sentiment}</span>
                </div>
                <h3 class="story-headline">${story.happened}</h3>
                <p class="story-reflection">${story.matters}</p>
                <div class="story-tags">
                    ${story.topics.map(t => `<span class="story-tag topic">${t}</span>`).join('')}
                    ${story.emotions.map(e => `<span class="story-tag emotion">${e}</span>`).join('')}
                </div>
                <div style="font-family: 'IBM Plex Mono', monospace; font-size: 0.875rem; color: var(--gray);">
                    ${story.publication} • ${story.found.substring(0, 50)}${story.found.length > 50 ? '...' : ''}
                    ${story.link && story.link !== 'nan' ? ` • <a href="${story.link}" target="_blank" style="color: var(--ink)">Read →</a>` : ''}
                </div>
            </div>
        `;
    }).join('');
    document.getElementById('storyGrid').innerHTML = html || '<p style="text-align: center; color: var(--gray); padding: 3rem;">No stories match your filters</p>';
}

// Setup tab navigation and filters
function setupTabs() {
    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
            this.classList.add('active');
            document.getElementById(this.dataset.panel).classList.add('active');
        });
    });

    // Setup filters
    const allTopics = [...new Set(data.stories.flatMap(s => s.topics))].sort();
    const filterHtml = allTopics.map(topic => 
        `<button class="tag" data-filter="${topic}">${topic}</button>`
    ).join('') + '<button class="tag active" data-filter="all">All Stories</button>';
    document.getElementById('filterPills').innerHTML = filterHtml;

    // Filter button click handlers
    document.querySelectorAll('.tag').forEach(pill => {
        pill.addEventListener('click', function() {
            document.querySelectorAll('.tag').forEach(p => p.classList.remove('active'));
            this.classList.add('active');
            
            const filter = this.dataset.filter;
            if (filter === 'all') {
                filteredStories = data.stories;
            } else {
                filteredStories = data.stories.filter(s => s.topics.includes(filter));
            }
            
            const searchTerm = document.getElementById('searchBox').value.toLowerCase();
            if (searchTerm) {
                filteredStories = filteredStories.filter(s => 
                    s.happened.toLowerCase().includes(searchTerm) ||
                    s.matters.toLowerCase().includes(searchTerm)
                );
            }
            
            renderStories(filteredStories);
        });
    });

    // Search box handler
    document.getElementById('searchBox').addEventListener('input', function() {
        const term = this.value.toLowerCase();
        const filtered = filteredStories.filter(s => 
            s.happened.toLowerCase().includes(term) ||
            s.matters.toLowerCase().includes(term)
        );
        renderStories(filtered);
    });
}