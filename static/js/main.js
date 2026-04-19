// main.js - Orchestrator & Evolution Engine
const canvas = document.getElementById('simulationCanvas');
const ctx = canvas.getContext('2d');

const trackName = window.config.trackName;
const populationSize = window.config.popSize;
const brainMode = window.config.brainMode;

const safeData = typeof TRACKS_DATA !== 'undefined' ? TRACKS_DATA : {};
let trackPoints = safeData[trackName] || [];
const laneWidth = 60; 
const roadBorders = [];
let bestCar = null;
let cars = [];

// TRACK-BASED STORAGE ISOLATION (Using specific keys for each circuit)
const KEY_GEN = `genCount_${trackName}`;
const KEY_SCORE = `bestScoreEver_${trackName}`;
const KEY_STAGNATION = `stagnationCounter_${trackName}`;
const KEY_BRAIN = `bestBrain_${trackName}`;
const KEY_RUNNING = `simulationRunning_${trackName}`;

// If the mode is "scratch", we clear the memory for this specific track before starting
if (brainMode === 'scratch' && localStorage.getItem(KEY_RUNNING) !== 'true') {
    localStorage.removeItem(KEY_GEN);
    localStorage.removeItem(KEY_SCORE);
    localStorage.removeItem(KEY_STAGNATION);
    localStorage.removeItem(KEY_BRAIN);
}

let currentGeneration = parseInt(localStorage.getItem(KEY_GEN)) || 1;
let bestScoreEver = parseFloat(localStorage.getItem(KEY_SCORE)) || 0;
let stagnationCounter = parseInt(localStorage.getItem(KEY_STAGNATION)) || 0;

let frameCounter = 0; 
const MAX_FRAMES = 400; 

document.getElementById('gen-count').innerText = currentGeneration;

// Generate track borders
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

// ASYNC INITIALIZATION (Allows loading external brain files)
async function initializeSimulation() {
    let initialAngle = 0;
    if (trackPoints.length > 1) {
        const dx = trackPoints[1].x - trackPoints[0].x;
        const dy = trackPoints[1].y - trackPoints[0].y;
        initialAngle = Math.atan2(-dx, -dy); 
    }

    for (let i = 0; i < populationSize; i++) {
        const car = new Car(trackPoints[0].x, trackPoints[0].y, 12, 12);
        car.angle = initialAngle; 
        cars.push(car);
    }
    bestCar = cars[0];

    let savedBrainStr = null;

    // Brain loading logic based on brainMode
    if (brainMode === 'file') {
        try {
            const response = await fetch(`/static/brains/${trackName}_best.json`);
            if (response.ok) {
                const data = await response.json();
                savedBrainStr = JSON.stringify(data);
                console.log(`[SUCCESS] Master brain for ${trackName} loaded from file.`);
            } else {
                console.warn(`[WARN] File /static/brains/${trackName}_best.json not found. Using local memory.`);
                savedBrainStr = localStorage.getItem(KEY_BRAIN);
            }
        } catch (e) {
            console.error("Error fetching brain file:", e);
            savedBrainStr = localStorage.getItem(KEY_BRAIN);
        }
    } else {
        savedBrainStr = localStorage.getItem(KEY_BRAIN);
    }

    if (savedBrainStr) {
        cars.forEach((car, index) => {
            car.brain = JSON.parse(savedBrainStr); 
            if (index !== 0) {
                let mutationRate = stagnationCounter >= 3 ? 0.7 : 0.1;
                NeuralNetwork.mutate(car.brain, mutationRate);
            }
        });
    }

    animate();
}

function nextGeneration() {
    if (bestCar.fitness > bestScoreEver + 50) {
        bestScoreEver = bestCar.fitness;
        stagnationCounter = 0;
    } else {
        stagnationCounter++;
    }

    if (stagnationCounter >= 8) {
        localStorage.removeItem(KEY_BRAIN);
        bestScoreEver = 0;
        stagnationCounter = 0;
    } else {
        localStorage.setItem(KEY_BRAIN, JSON.stringify(bestCar.brain));
    }

    localStorage.setItem(KEY_SCORE, bestScoreEver);
    localStorage.setItem(KEY_STAGNATION, stagnationCounter);

    currentGeneration++;
    localStorage.setItem(KEY_GEN, currentGeneration);
    
    location.reload(); 
}

// UI CONTROLS
document.getElementById('resetBtn').onclick = () => {
    if (confirm(`🚨 Purge DNA for ${trackName.toUpperCase()}? This resets Generation to 1.`)) {
        localStorage.removeItem(KEY_GEN);
        localStorage.removeItem(KEY_SCORE);
        localStorage.removeItem(KEY_STAGNATION);
        localStorage.removeItem(KEY_BRAIN);
        localStorage.setItem(KEY_RUNNING, 'true'); 
        location.reload(); 
    }
};

document.getElementById('nextGenBtn').onclick = () => {
    if (bestCar && bestCar.brain) {
        nextGeneration(); 
    }
};

// EXPORT BRAIN TO JSON
document.getElementById('exportBtn').onclick = () => {
    const brainToExport = bestCar && bestCar.fitness > 0 ? bestCar.brain : JSON.parse(localStorage.getItem(KEY_BRAIN));
    
    if (!brainToExport) {
        alert("No brain data available to export yet.");
        return;
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(brainToExport));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${trackName}_best.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
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

        let mutationStatus = stagnationCounter >= 3 ? "HIGH" : "NORM";
        document.getElementById('best-fitness').innerText = `SCORE: ${bestCar.fitness.toFixed(0)} | MUT: ${mutationStatus}`;
        document.getElementById('alive-count').innerText = aliveCars.length;

        cars.forEach(car => car.draw(ctx, car === bestCar));

        if (aliveCars.length === 0 || frameCounter > MAX_FRAMES) {
            nextGeneration();
        }

    } else {
        ctx.fillStyle = "white"; 
        ctx.font = "14px Arial";
        ctx.fillText(`TRACK: ${trackName.toUpperCase()} - Waiting for START...`, 10, 20);
        cars.forEach(car => car.draw(ctx, car === cars[0]));
    }

    requestAnimationFrame(animate);
}

// Start the process
initializeSimulation();