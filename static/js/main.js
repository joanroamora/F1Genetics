// main.js - Orchestrator & Evolution Engine
const canvas = document.getElementById('simulationCanvas');
const ctx = canvas.getContext('2d');

const trackName = window.config.trackName;
const populationSize = window.config.popSize;

const safeData = typeof TRACKS_DATA !== 'undefined' ? TRACKS_DATA : {};
let trackPoints = safeData[trackName] || [];
const laneWidth = 60; 

const roadBorders = [];
let bestCar = null;

// LECTURA ESTRICTA DE MEMORIA
let currentGeneration = parseInt(localStorage.getItem('genCount')) || 1;
let bestScoreEver = parseFloat(localStorage.getItem('bestScoreEver')) || 0;
let stagnationCounter = parseInt(localStorage.getItem('stagnationCounter')) || 0;

let frameCounter = 0; 
const MAX_FRAMES = 400; 

document.getElementById('gen-count').innerText = currentGeneration;

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

        if (prevLeft) {
            roadBorders.push([prevLeft, clStart]);
            roadBorders.push([prevRight, crStart]);
        }
        prevLeft = clEnd;
        prevRight = crEnd;
    }
}

const cars = [];
let initialAngle = 0;
if (trackPoints.length > 1) {
    const dx = trackPoints[1].x - trackPoints[0].x;
    const dy = trackPoints[1].y - trackPoints[0].y;
    initialAngle = Math.atan2(-dx, -dy); 

    for (let i = 0; i < populationSize; i++) {
        const car = new Car(trackPoints[0].x, trackPoints[0].y, 12, 12);
        car.angle = initialAngle; 
        cars.push(car);
    }
}

bestCar = cars[0];
const savedBrain = localStorage.getItem('bestBrain');
if (savedBrain) {
    cars.forEach((car, index) => {
        car.brain = JSON.parse(savedBrain); 
        if (index !== 0) {
            // Si hay estancamiento, la mutación es violenta (0.7), si no, es suave de aprendizaje (0.1)
            let mutationRate = stagnationCounter >= 3 ? 0.7 : 0.1;
            NeuralNetwork.mutate(car.brain, mutationRate);
        }
    });
}

function nextGeneration() {
    // --- NUEVO: LÓGICA DE ESTANCAMIENTO ---
    if (bestCar.fitness > bestScoreEver + 50) {
        // Hubo progreso real
        bestScoreEver = bestCar.fitness;
        stagnationCounter = 0;
    } else {
        // Se quedaron atascados
        stagnationCounter++;
    }

    // Si se atascan más de 8 generaciones, borramos el cerebro porque no sirve
    if (stagnationCounter >= 8) {
        localStorage.removeItem('bestBrain');
        bestScoreEver = 0;
        stagnationCounter = 0;
    } else {
        localStorage.setItem('bestBrain', JSON.stringify(bestCar.brain));
    }

    localStorage.setItem('bestScoreEver', bestScoreEver);
    localStorage.setItem('stagnationCounter', stagnationCounter);

    currentGeneration++;
    localStorage.setItem('genCount', currentGeneration);
    
    // Recarga obligatoria para asegurar limpieza de memoria
    location.reload(); 
}

// --- RESET ABSOLUTO (Garantiza volver al estado 0) ---
document.getElementById('resetBtn').onclick = () => {
    if (confirm("🚨 ¿Purgar ADN? Esto borra la memoria y vuelve a la Generación 1.")) {
        localStorage.clear();
        // Seteamos explícitamente los valores base
        localStorage.setItem('genCount', '1'); 
        localStorage.setItem('bestScoreEver', '0');
        localStorage.setItem('stagnationCounter', '0');
        localStorage.setItem('simulationRunning', 'true'); 
        location.reload(); 
    }
};

document.getElementById('nextGenBtn').onclick = () => {
    if (bestCar && bestCar.brain) {
        nextGeneration(); 
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

            const targetIndex = car.currentCheckpoint + 1;
            if (targetIndex < trackPoints.length) {
                const targetPoint = trackPoints[targetIndex];
                const d = Math.hypot(car.x - targetPoint.x, car.y - targetPoint.y);
                
                if (d < 100) {
                    car.currentCheckpoint = targetIndex; 
                }
                
                car.fitness = (car.currentCheckpoint * 1000) - d;
            } else {
                car.fitness = car.currentCheckpoint * 1000;
            }
        });

        bestCar = cars.reduce((prev, curr) => prev.fitness > curr.fitness ? prev : curr);
        const aliveCars = cars.filter(car => !car.damaged);

        // Acortamos los textos para evitar que rompan el tamaño del contenedor
        let mutationStatus = stagnationCounter >= 3 ? "ALTA" : "NORM";
        document.getElementById('best-fitness').innerText = `SCORE: ${bestCar.fitness.toFixed(0)} | MUT: ${mutationStatus}`;
        document.getElementById('alive-count').innerText = aliveCars.length;

        cars.forEach(car => car.draw(ctx, car === bestCar));

        if (aliveCars.length === 0 || frameCounter > MAX_FRAMES) {
            nextGeneration();
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