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
let mutationAmount = 0.5; // Mutación fuerte pero controlada
let frameCounter = 0; 
const MAX_FRAMES = 400; // --- NUEVO: Iteraciones al doble de velocidad ---

document.getElementById('gen-count').innerText = currentGeneration;

// 1. --- NUEVO: CALCULAR BORDES (AHORA SELLADOS) ---
if (trackPoints.length > 1) {
    const halfWidth = laneWidth / 2;
    let prevLeft = null;
    let prevRight = null;

    for (let i = 0; i < trackPoints.length - 1; i++) {
        const p1 = trackPoints[i];
        const p2 = trackPoints[i+1];
        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        const nx = Math.sin(angle) * halfWidth;
        const ny = Math.cos(angle) * halfWidth;
        
        const clStart = {x: p1.x + nx, y: p1.y - ny};
        const clEnd = {x: p2.x + nx, y: p2.y - ny};
        const crStart = {x: p1.x - nx, y: p1.y + ny};
        const crEnd = {x: p2.x - nx, y: p2.y + ny};

        roadBorders.push([clStart, clEnd]);
        roadBorders.push([crStart, crEnd]);

        // Este pedacito de código sella los huecos de las esquinas
        if (prevLeft) {
            roadBorders.push([prevLeft, clStart]);
            roadBorders.push([prevRight, crStart]);
        }
        prevLeft = clEnd;
        prevRight = crEnd;
    }
}

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

document.getElementById('resetBtn').onclick = () => {
    if (confirm("🚨 ¿Estás seguro de purgar el ADN? Esto te devuelve a la Generación 1.")) {
        localStorage.clear();
        location.reload();
    }
};

document.getElementById('nextGenBtn').onclick = () => {
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

    if (window.simulationRunning) {
        frameCounter++;
        
        cars.forEach(car => {
            car.update(roadBorders);

            // --- NUEVO: FITNESS SECUENCIAL (ADIÓS A LA TRAMPA) ---
            // Solo nos fijamos si alcanzó el siguiente punto que le toca
            const targetIndex = car.currentCheckpoint + 1;
            if (targetIndex < trackPoints.length) {
                const targetPoint = trackPoints[targetIndex];
                const d = Math.hypot(car.x - targetPoint.x, car.y - targetPoint.y);
                // Si pasa a menos de 50px de su próximo objetivo, avanza de nivel
                if (d < 50) {
                    car.currentCheckpoint = targetIndex;
                }
            }
            car.fitness = car.currentCheckpoint;
        });

        // Buscamos al mejor y actualizamos contadores
        bestCar = cars.reduce((prev, curr) => prev.fitness > curr.fitness ? prev : curr);
        const aliveCars = cars.filter(car => !car.damaged);

        document.getElementById('best-fitness').innerText = `CHECKPOINT: ${bestCar.fitness}`;
        document.getElementById('alive-count').innerText = aliveCars.length;

        cars.forEach(car => car.draw(ctx, car === bestCar));

        // REINICIO ULTRARRÁPIDO
        if (aliveCars.length === 0 || frameCounter > MAX_FRAMES) {
            localStorage.setItem('bestBrain', JSON.stringify(bestCar.brain));
            localStorage.setItem('genCount', currentGeneration + 1);
            localStorage.setItem('simulationRunning', 'true'); 
            location.reload();
        }

    } else {
        ctx.fillStyle = "white"; 
        ctx.font = "14px Arial";
        ctx.fillText(`BRANCH: MONACO - Waiting for START...`, 10, 20);
        cars.forEach(car => car.draw(ctx, car === cars[0]));
    }

    requestAnimationFrame(animate);
}

animate();