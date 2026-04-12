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

// Create the population of cars
const cars = [];
if (trackPoints.length > 0) {
    for (let i = 0; i < populationSize; i++) {
        // We start all cars at the first point of the track
        cars.push(new Car(trackPoints[0].x, trackPoints[0].y, 10, 20));
    }
}

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

    if (window.simulationRunning) {
        cars.forEach(car => {
            car.update();
            car.draw(ctx);
        });
    } else {
        ctx.fillStyle = "white";
        ctx.font = "14px Arial";
        // Mensaje actualizado para la rama monaco
        const msg = trackPoints.length > 0 
            ? `BRANCH: MONACO - ${trackName.toUpperCase()} GP - Ready to Race` 
            : `NEW TRACK: ${trackName.toUpperCase()} - Click to trace`;
        ctx.fillText(msg, 10, 20);
        
        // Dibujamos los carros estáticos en la línea de salida
        cars.forEach(car => car.draw(ctx));
    }

    requestAnimationFrame(animate);
}

animate();