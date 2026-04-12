// main.js - Orchestrator & Evolution Engine
const canvas = document.getElementById('simulationCanvas');
const ctx = canvas.getContext('2d');

const trackName = window.config.trackName;
const populationSize = window.config.popSize;

const safeData = typeof TRACKS_DATA !== 'undefined' ? TRACKS_DATA : {};
let trackPoints = safeData[trackName] || [];
const laneWidth = 45;

// --- EVOLUTION VARIABLES ---
const roadBorders = [];
let bestCar = null;
let currentGeneration = parseInt(localStorage.getItem('genCount')) || 1;
let mutationAmount = 0.2; 
let frameCounter = 0; 
const MAX_FRAMES = 800; // Tiempo límite por generación para evitar parálisis

document.getElementById('gen-count').innerText = currentGeneration;

// 1. Cálculo de bordes de la pista para colisiones
if (trackPoints.length > 1) {
    const halfWidth = laneWidth / 2;
    for (let i = 0; i < trackPoints.length - 1; i++) {
        const p1 = trackPoints[i];
        const p2 = trackPoints[i+1];
        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        const nx = Math.sin(angle) * halfWidth;
        const ny = Math.cos(angle) * halfWidth;
        roadBorders.push([{x: p1.x + nx, y: p1.y - ny}, {x: p2.x + nx, y: p2.y - ny}]);
        roadBorders.push([{x: p1.x - nx, y: p1.y + ny}, {x: p2.x - nx, y: p2.y + ny}]);
    }
}

// 2. Creación de la población con ángulo de salida corregido
const cars = [];
if (trackPoints.length > 1) {
    const dx = trackPoints[1].x - trackPoints[0].x;
    const dy = trackPoints[1].y - trackPoints[0].y;
    const initialAngle = Math.atan2(-dx, -dy); 

    for (let i = 0; i < populationSize; i++) {
        const car = new Car(trackPoints[0].x, trackPoints[0].y, 12, 12);
        car.angle = initialAngle; 
        cars.push(car);
    }
}

// 3. Carga del cerebro del ganador y mutación
bestCar = cars[0];
const savedBrain = localStorage.getItem('bestBrain');
if (savedBrain) {
    cars.forEach(car => {
        car.brain = JSON.parse(savedBrain); 
        if (car !== cars[0]) {
            NeuralNetwork.mutate(car.brain, mutationAmount);
        }
    });
}

function drawRoad() {
    if (trackPoints.length < 2) return;
    ctx.beginPath();
    ctx.strokeStyle = "#333"; ctx.lineWidth = laneWidth;
    ctx.lineJoin = "round"; ctx.lineCap = "round";
    ctx.moveTo(trackPoints[0].x, trackPoints[0].y);
    for (let i = 1; i < trackPoints.length; i++) { ctx.lineTo(trackPoints[i].x, trackPoints[i].y); }
    ctx.stroke();
    ctx.strokeStyle = "#FFF"; ctx.lineWidth = 2; ctx.stroke();
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawRoad();

    if (window.simulationRunning) {
        frameCounter++;
        const aliveCars = cars.filter(car => !car.damaged);
        
        cars.forEach(car => {
            car.update(roadBorders);

            // --- SEGURIDAD: Muerte por Off-Track ---
            // Si la partícula se aleja demasiado del trazado, se marca como dañada
            const isNearTrack = trackPoints.some(p => 
                Math.hypot(car.x - p.x, car.y - p.y) < laneWidth * 1.5
            );
            if (!isNearTrack) car.damaged = true;

            car.draw(ctx, car === bestCar); 
        });

        if (aliveCars.length > 0) {
            // Fitness: Premiamos el avance basándonos en la distancia al inicio
            bestCar = aliveCars.reduce((prev, curr) => {
                const dPrev = Math.hypot(prev.x - trackPoints[0].x, prev.y - trackPoints[0].y);
                const dCurr = Math.hypot(curr.x - trackPoints[0].x, curr.y - trackPoints[0].y);
                return dPrev > dCurr ? prev : curr;
            });
            
            const currentDist = Math.hypot(bestCar.x - trackPoints[0].x, bestCar.y - trackPoints[0].y);
            document.getElementById('best-fitness').innerText = currentDist.toFixed(2);
            document.getElementById('alive-count').innerText = aliveCars.length;
        }

        // --- REINICIO AUTOMÁTICO ---
        if (aliveCars.length === 0 || frameCounter > MAX_FRAMES) {
            localStorage.setItem('bestBrain', JSON.stringify(bestCar.brain));
            localStorage.setItem('genCount', currentGeneration + 1);
            // Avisamos al sistema que debe arrancar solo al recargar
            localStorage.setItem('simulationRunning', 'true'); 
            location.reload();
        }

    } else {
        ctx.fillStyle = "white"; ctx.font = "14px Arial";
        ctx.fillText(`BRANCH: MONACO - GEN: ${currentGeneration} - Selecting Best Brain`, 10, 20);
        cars.forEach(car => car.draw(ctx, car === cars[0]));
    }
    requestAnimationFrame(animate);
}

window.resetEvolution = () => {
    localStorage.clear();
    location.reload();
}
animate();