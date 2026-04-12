// main.js - Orchestrator & Track Engine
const canvas = document.getElementById('simulationCanvas');
const ctx = canvas.getContext('2d');

const trackName = window.config.trackName;
const populationSize = window.config.popSize;

const safeData = typeof TRACKS_DATA !== 'undefined' ? TRACKS_DATA : {};
let trackPoints = safeData[trackName] || [];
const laneWidth = 45;

// --- NUEVA LÓGICA: Cálculo de Bordes para el Sensor ---
const roadBorders = [];
if (trackPoints.length > 1) {
    const halfWidth = laneWidth / 2;
    for (let i = 0; i < trackPoints.length - 1; i++) {
        const p1 = trackPoints[i];
        const p2 = trackPoints[i+1];
        
        // Calculamos el ángulo del segmento para sacar las paredes paralelas
        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        const nx = Math.sin(angle) * halfWidth;
        const ny = Math.cos(angle) * halfWidth;

        // Pared Izquierda
        roadBorders.push([
            {x: p1.x + nx, y: p1.y - ny},
            {x: p2.x + nx, y: p2.y - ny}
        ]);
        // Pared Derecha
        roadBorders.push([
            {x: p1.x - nx, y: p1.y + ny},
            {x: p2.x - nx, y: p2.y + ny}
        ]);
    }
}

// Create the population of cars
const cars = [];
if (trackPoints.length > 0) {
    for (let i = 0; i < populationSize; i++) {
        cars.push(new Car(trackPoints[0].x, trackPoints[0].y, 10, 20));
    }
}

function drawRoad() {
    if (trackPoints.length < 2) return;

    // 1. Dibujar el Asfalto
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

    // 2. Dibujar las Paredes (Bordes Blancos)
    ctx.strokeStyle = "#FFF";
    ctx.lineWidth = 2;
    ctx.stroke();
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawRoad();

    if (window.simulationRunning) {
        cars.forEach(car => {
            // CRÍTICO: Ahora sí le pasamos los roadBorders al carro
            car.update(roadBorders); 
            car.draw(ctx); 
        });
    } else {
        ctx.fillStyle = "white";
        ctx.font = "14px Arial";
        ctx.fillText(`BRANCH: MONACO - Ready to Race`, 10, 20);
        cars.forEach(car => car.draw(ctx));
    }

    requestAnimationFrame(animate);
}

animate();