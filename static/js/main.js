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
let mutationAmount = 0.7; // Mutación agresiva
let frameCounter = 0; 
const MAX_FRAMES = 800; // Máximo de tiempo por iteración

document.getElementById('gen-count').innerText = currentGeneration;

// 1. Calcular Bordes (Visuales y de colisión)
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

// 2. Crear población alineada a la pista
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

// 3. Cargar el ADN ganador si existe
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

// --- CONTROLES DE LA INTERFAZ MEJORADOS ---
document.getElementById('resetBtn').onclick = () => {
    if (confirm("🚨 ¿Estás seguro de purgar el ADN? Esto te devuelve a la Generación 1.")) {
        localStorage.clear();
        location.reload();
    }
};

document.getElementById('nextGenBtn').onclick = () => {
    // Verificamos que exista un carro antes de intentar guardar su cerebro
    if (bestCar && bestCar.brain) {
        localStorage.setItem('bestBrain', JSON.stringify(bestCar.brain));
        localStorage.setItem('genCount', currentGeneration + 1);
        localStorage.setItem('simulationRunning', 'true'); 
        location.reload();
    }
};

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

    // SOLO AVANZA SI LA SIMULACIÓN ESTÁ ACTIVA (Respeta el botón START)
    if (window.simulationRunning) {
        frameCounter++;
        
        cars.forEach(car => {
            car.update(roadBorders);

            // --- ARREGLO DEL HUECO EN LA CURVA ---
            let minDistance = Infinity;
            for(let i=0; i<trackPoints.length; i++){
                const d = Math.hypot(car.x - trackPoints[i].x, car.y - trackPoints[i].y);
                if(d < minDistance) minDistance = d;
            }
            if (minDistance > 32) car.damaged = true; // Kill switch estricto

            // Cálculo de Fitness (Puntos superados)
            car.fitness = 0;
            let closestIndex = 0;
            let minDistFit = Infinity;
            for (let i = 0; i < trackPoints.length; i++) {
                const d = Math.hypot(car.x - trackPoints[i].x, car.y - trackPoints[i].y);
                if (d < minDistFit) {
                    minDistFit = d;
                    closestIndex = i;
                }
            }
            car.fitness = closestIndex;
        });

        // Encontrar el mejor para guardarlo
        bestCar = cars.reduce((prev, curr) => prev.fitness > curr.fitness ? prev : curr);
        const aliveCars = cars.filter(car => !car.damaged);

        // Actualizar Panel
        document.getElementById('best-fitness').innerText = `CHECKPOINT: ${bestCar.fitness}`;
        document.getElementById('alive-count').innerText = aliveCars.length;

        // Dibujar los carros y el sensor del líder
        cars.forEach(car => car.draw(ctx, car === bestCar));

        // REINICIO AUTOMÁTICO SI TODOS MUEREN O EL TIEMPO EXPIRA
        if (aliveCars.length === 0 || frameCounter > MAX_FRAMES) {
            localStorage.setItem('bestBrain', JSON.stringify(bestCar.brain));
            localStorage.setItem('genCount', currentGeneration + 1);
            localStorage.setItem('simulationRunning', 'true'); 
            location.reload();
        }

    } else {
        // MODO DE ESPERA: Muestra los carros pero no los mueve
        ctx.fillStyle = "white"; 
        ctx.font = "14px Arial";
        ctx.fillText(`BRANCH: MONACO - Waiting for START...`, 10, 20);
        cars.forEach(car => car.draw(ctx, car === cars[0]));
    }

    requestAnimationFrame(animate);
}

// Inicia el bucle visual
animate();