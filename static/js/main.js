// main.js - Orchestrator & Track Engine
const canvas = document.getElementById('simulationCanvas');
const ctx = canvas.getContext('2d');

// Captured from global window.config defined in HTML
const trackName = window.config.trackName;
const populationSize = window.config.popSize;

// Track initialization with safety check
const safeData = typeof TRACKS_DATA !== 'undefined' ? TRACKS_DATA : {};
let trackPoints = safeData[trackName] || [];
const laneWidth = 45;

// Click listener for developer mode / tracing new tracks
canvas.addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    trackPoints.push({x, y});
    console.log(`Current Track (${trackName}):`, JSON.stringify(trackPoints));
});

function drawRoad() {
    if (trackPoints.length < 2) return;

    // 1. Asphalt Layer
    ctx.beginPath();
    ctx.strokeStyle = "#333"; 
    ctx.lineWidth = laneWidth;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    
    ctx.moveTo(trackPoints[0].x, trackPoints[0].y);
    for (let i = 1; i < trackPoints.length; i++) {
        ctx.lineTo(trackPoints[i].x, trackPoints[i].y);
    }
    ctx.stroke();

    // 2. White Boundaries
    ctx.strokeStyle = "#FFF";
    ctx.lineWidth = 2;
    ctx.stroke();
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawRoad();

    // Visual feedback for the current state
    if (!window.simulationRunning) {
        ctx.fillStyle = "white";
        ctx.font = "14px Arial";
        const msg = trackPoints.length > 0 
            ? `PRE-LOADED: ${trackName.toUpperCase()} GP - Click to edit` 
            : `NEW TRACK: ${trackName.toUpperCase()} - Click to trace`;
        ctx.fillText(msg, 10, 20);
    }

    requestAnimationFrame(animate);
}

animate();