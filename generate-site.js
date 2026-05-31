const fs = require('fs');
const path = require('path');

const talksData = require('./talks-data.json');

const EVENT_START_HOUR = 10;
const EVENT_START_MINUTE = 0;
const TALK_DURATION_MINUTES = 60;
const TRANSITION_MINUTES = 10;
const LUNCH_DURATION_MINUTES = 60;

function addMinutes(date, minutes) {
    const newDate = new Date(date);
    newDate.setMinutes(date.getMinutes() + minutes);
    return newDate;
}

function formatTime(date) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function generateSchedule() {
    let currentTime = new Date();
    currentTime.setHours(EVENT_START_HOUR, EVENT_START_MINUTE, 0, 0); // Set to 10:00 AM today

    const fullSchedule = [];
    let talkIndex = 0;

    for (let i = 0; i < 6; i++) {
        // Add talk
        const talkStartTime = new Date(currentTime);
        const talkEndTime = addMinutes(talkStartTime, TALK_DURATION_MINUTES);

        const talk = {
            ...talksData[talkIndex],
            startTime: formatTime(talkStartTime),
            endTime: formatTime(talkEndTime)
        };
        fullSchedule.push(talk);
        talkIndex++;

        currentTime = new Date(talkEndTime);

        // Add transition, unless it's the last talk
        if (i < 5) {
            currentTime = addMinutes(currentTime, TRANSITION_MINUTES);
        }

        // Add lunch after the 3rd talk
        if (i === 2) {
            const lunchStartTime = new Date(currentTime);
            const lunchEndTime = addMinutes(lunchStartTime, LUNCH_DURATION_MINUTES);
            fullSchedule.push({
                title: "Lunch Break",
                isBreak: true,
                startTime: formatTime(lunchStartTime),
                endTime: formatTime(lunchEndTime),
                description: "Enjoy a delicious lunch!"
            });
            currentTime = new Date(lunchEndTime);
            currentTime = addMinutes(currentTime, TRANSITION_MINUTES); // Transition after lunch
        }
    }
    return fullSchedule;
}

const scheduleWithTimes = generateSchedule();

const css = `
body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    margin: 0;
    padding: 0;
    background-color: #f4f7f6;
    color: #333;
    line-height: 1.6;
}

header {
    background-color: #2c3e50;
    color: #ecf0f1;
    padding: 20px 0;
    text-align: center;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

h1 {
    margin: 0;
    font-size: 2.5em;
}

main {
    max-width: 1000px;
    margin: 20px auto;
    padding: 0 20px;
}

.search-container {
    margin-bottom: 30px;
    text-align: center;
}

#categorySearch {
    padding: 12px 15px;
    width: 100%;
    max-width: 400px;
    border: 1px solid #ccc;
    border-radius: 5px;
    font-size: 1em;
    box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);
}

#categorySearch::placeholder {
    color: #aaa;
}

.schedule-container {
    background-color: #ffffff;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.05);
    overflow: hidden;
}

.talk-item, .break-item {
    padding: 20px;
    border-bottom: 1px solid #eee;
    display: flex;
    align-items: flex-start;
    transition: background-color 0.2s ease;
}

.talk-item:last-child, .break-item:last-child {
    border-bottom: none;
}

.talk-item:hover:not(.filtered-out) {
    background-color: #f9f9f9;
}

.talk-time {
    flex: 0 0 120px;
    font-weight: bold;
    color: #3498db;
    font-size: 1.1em;
}

.talk-details {
    flex: 1;
}

.talk-details h2 {
    margin-top: 0;
    color: #2c3e50;
    font-size: 1.5em;
    margin-bottom: 5px;
}

.talk-details .speakers {
    font-style: italic;
    color: #7f8c8d;
    margin-bottom: 10px;
}

.talk-details .categories {
    margin-top: 10px;
}

.talk-details .category-tag {
    display: inline-block;
    background-color: #e0e6ea;
    color: #555;
    padding: 5px 10px;
    border-radius: 3px;
    font-size: 0.85em;
    margin-right: 5px;
    margin-bottom: 5px;
}

.talk-details p {
    margin-bottom: 0;
    color: #666;
}

.break-item {
    background-color: #ecf0f1;
    color: #2c3e50;
}

.break-item .break-title {
    font-size: 1.5em;
    font-weight: bold;
    flex: 1;
    text-align: center;
}

.break-item .talk-time {
    color: #2c3e50;
}

.filtered-out {
    display: none;
}

footer {
    text-align: center;
    padding: 20px;
    margin-top: 30px;
    background-color: #2c3e50;
    color: #ecf0f1;
    font-size: 0.9em;
}

@media (max-width: 600px) {
    .talk-item, .break-item {
        flex-direction: column;
        align-items: center;
        text-align: center;
    }
    .talk-time {
        margin-bottom: 10px;
        flex: none;
        width: 100%;
    }
    .break-item .break-title {
        text-align: center;
    }
}
`;

const js = `
document.addEventListener('DOMContentLoaded', () => {
    const talksData = window.fullSchedule; // Access the globally defined data
    const scheduleContainer = document.getElementById('schedule');
    const categorySearchInput = document.getElementById('categorySearch');

    function renderSchedule(talksToRender) {
        scheduleContainer.innerHTML = ''; // Clear previous schedule

        talksToRender.forEach(item => {
            const itemElement = document.createElement('div');
            if (item.isBreak) {
                itemElement.classList.add('break-item');
                itemElement.innerHTML = '<div class="talk-time">' + item.startTime + ' - ' + item.endTime + '</div>' +
                                        '<div class="break-title">' + item.title + '</div>';
            } else {
                itemElement.classList.add('talk-item');
                const speakersHtml = item.speakers.map(speaker => '<span>' + speaker + '</span>').join(', ');
                const categoriesHtml = item.categories.map(category => '<span class="category-tag">' + category + '</span>').join('');
                itemElement.innerHTML = '<div class="talk-time">' + item.startTime + ' - ' + item.endTime + '</div>' +
                                        '<div class="talk-details">' +
                                            '<h2>' + item.title + '</h2>' +
                                            '<div class="speakers">' + speakersHtml + '</div>' +
                                            '<p>' + item.description + '</p>' +
                                            '<div class="categories">' + categoriesHtml + '</div>' +
                                        '</div>';
            }
            scheduleContainer.appendChild(itemElement);
        });
    }

    // Initial render
    renderSchedule(talksData);

    // Search functionality
    categorySearchInput.addEventListener('input', (event) => {
        const searchTerm = event.target.value.toLowerCase().trim();
        const filteredSchedule = talksData.filter(item => {
            if (item.isBreak) return true; // Always show breaks
            return item.categories.some(category => category.toLowerCase().includes(searchTerm));
        });
        renderSchedule(filteredSchedule);
    });
});
`;

const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Technical Talks Event Schedule</title>
    <style>
        ${css}
    </style>
</head>
<body>
    <header>
        <h1>Technical Talks Event</h1>
        <p>A day full of insightful talks</p>
    </header>

    <main>
        <div class="search-container">
            <input type="text" id="categorySearch" placeholder="Search talks by category...">
        </div>

        <div id="schedule" class="schedule-container">
            <!-- Schedule items will be dynamically loaded here by JavaScript -->
        </div>
    </main>

    <footer>
        <p>&copy; 2026 Technical Talks Event. All rights reserved.</p>
    </footer>

    <script>
        window.fullSchedule = ${JSON.stringify(scheduleWithTimes, null, 2)};
        ${js}
    </script>
</body>
</html>
`;

fs.writeFileSync(path.join(__dirname, 'index.html'), htmlContent);
console.log('index.html generated successfully!');
