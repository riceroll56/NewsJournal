# News Journal Analytics Dashboard

## File Structure

```
news-dashboard/
├── index.html          # Main HTML file
├── styles.css          # All CSS styling
├── app.js              # Dashboard logic and interactivity
├── data.js             # Your news data
└── README.md           # This file
```

## File Responsibilities

### index.html
- Page structure
- All content containers
- Links to CSS and JavaScript files
- No inline styles or scripts

### styles.css
- All visual styling
- Responsive design
- Colors, fonts, spacing
- Animations and transitions
- CSS variables for easy theming

### app.js
- Dashboard initialization
- Data rendering
- User interactions (tabs, filters, search)
- Chart generation
- Event handlers

### data.js
- Your news consumption data
- Stories with topics, sentiment, emotions
- Timeline and statistics
- Can be updated by adding more stories to the data object

## Adding New Stories

In `data.js`, add to the `stories` array:
```javascript
{
    happened: "Your story headline",
    matters: "Why it matters to you",
    found: "How you discovered it",
    publication: "Source name",
    timestamp: "2026-05-01 10:00:00",
    link: "https://...",
    topics: ["Technology", "Culture"],
    sentiment: "Neutral",
    emotions: ["Curious", "Hopeful"]
}
```