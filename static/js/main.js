// main.js - Orchestrator & Evolution Engine
const canvas = document.getElementById('simulationCanvas');
const ctx = canvas.getContext('2d');

const trackName = window.config.trackName;
const populationSize = window.config.popSize;

const safeData = typeof TRACKS_DATA !== 'undefined' ? TRACKS_DATA : {};
let trackPoints = safeData[trackName] || [];
const laneWidth = 45;

const roadBorders = [];
let bestCar = null;
let currentGeneration = parseInt(localStorage.getItem('genCount')) || 1;
let mutationAmount = 0.2; 
let frameCounter = 0; 
const MAX_FRAMES = 800; // Limite de tiempo

document.getElementById('gen-count').innerText = currentGeneration;

// Calcular Bordes
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

// Crear población con ángulo inicial
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

// Cargar Cerebro
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
        
        // --- NUEVO: SISTEMA DE FITNESS POR CHECKPOINTS ---
        cars.forEach(car => {
            car.update(roadBorders);

            // Muerte por salir de la pista
            const isNearTrack = trackPoints.some(p => 
                Math.hypot(car.x - p.x, car.y - p.y) < laneWidth * 1.5
            );
            if (!isNearTrack) car.damaged = true;

            // Calculamos en qué punto de la pista va (Fitness)
            let closestIndex = 0;
            let minDist = Infinity;
            for (let i = 0; i < trackPoints.length; i++) {
                const d = Math.hypot(car.x - trackPoints[i].x, car.y - trackPoints[i].y);
                if (d < minDist) {
                    minDist = d;
                    closestIndex = i;
                }
            }
            car.fitness = closestIndex; // El puntaje es el índice del trazado!
        });

        // Buscamos al mejor entre TODOS (vivos o muertos) para evitar la paradoja del perezoso
        bestCar = cars.reduce((prev, curr) => prev.fitness > curr.fitness ? prev : curr);
        
        const aliveCars = cars.filter(car => !car.damaged);

        // Actualizamos UI
        document.getElementById('best-fitness').innerText = `CHECKPOINT: ${bestCar.fitness}`;
        document.getElementById('alive-count').innerText = aliveCars.length;

        // Dibujamos
        cars.forEach(car => car.draw(ctx, car === bestCar));

        // REINICIO
        if (aliveCars.length === 0 || frameCounter > MAX_FRAMES) {
            localStorage.setItem('bestBrain', JSON.stringify(bestCar.brain));
            localStorage.setItem('genCount', currentGeneration + 1);
            localStorage.setItem('simulationRunning', 'true'); 
            location.reload();
        }

    } else {
        ctx.fillStyle = "white"; ctx.font = "14px Arial";
        ctx.fillText(`BRANCH: MONACO - GEN: ${currentGeneration} - Waiting for Engines...`, 10, 20);
        cars.forEach(car => car.draw(ctx, car === cars[0]));
    }
    requestAnimationFrame(animate);
}

window.resetEvolution = () => {
    localStorage.clear(); // Borra cerebro, generación y estado de simulación
    console.log("🧬 Evolución reseteada. Reiniciando desde Gen 1...");
    location.reload();    // Recarga la página
}
animate();