## File Structure
```
news-dashboard/
├── index.html          # Main HTML file
├── styles.css          # All CSS styling
├── app.js              # Dashboard logic and interactivity
├── data.js             # Your news data
└── README.md           # This file
```
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
