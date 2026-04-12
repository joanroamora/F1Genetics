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
// Mutation amount: 0.2 means 20% randomness is added to the winner's brain
let mutationAmount = 0.2; 

document.getElementById('gen-count').innerText = currentGeneration;

// Calculate the borders once at the start
if (trackPoints.length > 1) {
    const halfWidth = laneWidth / 2;
    for (let i = 0; i < trackPoints.length - 1; i++) {
        const p1 = trackPoints[i];
        const p2 = trackPoints[i+1];
        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        const nx = Math.sin(angle) * halfWidth;
        const ny = Math.cos(angle) * halfWidth;
        roadBorders.push([
            {x: p1.x + nx, y: p1.y - ny},
            {x: p2.x + nx, y: p2.y - ny}
        ]);
        roadBorders.push([
            {x: p1.x - nx, y: p1.y + ny},
            {x: p2.x - nx, y: p2.y + ny}
        ]);
    }
}

// Create the population of cars
const cars = [];
if (trackPoints.length > 1) {
    // Calculamos el ángulo hacia el segundo punto del trazado
    const dx = trackPoints[1].x - trackPoints[0].x;
    const dy = trackPoints[1].y - trackPoints[0].y;
    // Usamos atan2 para obtener el ángulo en radianes
    const initialAngle = -Math.atan2(dx, dy); 

    for (let i = 0; i < populationSize; i++) {
        const car = new Car(trackPoints[0].x, trackPoints[0].y, 12, 12);
        car.angle = initialAngle; // ¡Ahora nacen mirando a la pista!
        cars.push(car);
    }
}

// --- EVOLUTION LOGIC ---
bestCar = cars[0]; // Assume first car is best to start
const savedBrain = localStorage.getItem('bestBrain');
if (savedBrain) {
    const brainData = JSON.stringify(savedBrain); // Assuming network.js handles loading
    // In our simplified setup, we directly use NeuralNetwork.mutate from network.js
    cars.forEach(car => {
        car.brain = JSON.parse(savedBrain); // Load winner's brain
        if (car !== cars[0]) {
            // Every car EXCEPT the very best one is slightly mutated
            NeuralNetwork.mutate(car.brain, mutationAmount);
        }
    });
}

function drawRoad() {
    if (trackPoints.length < 2) return;
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
    ctx.strokeStyle = "#FFF";
    ctx.lineWidth = 2;
    ctx.stroke();
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawRoad();

    // main.js - Inside animate()
    if (window.simulationRunning) {
        const aliveCars = cars.filter(car => !car.damaged);
        if (aliveCars.length > 0) {
            // Buscamos al mejor basándonos en la distancia recorrida total o puntos alcanzados
            // Por ahora, usemos una versión que premie alejarse del punto de inicio
            bestCar = aliveCars.reduce((prev, current) => {
                const distPrev = Math.hypot(prev.x - trackPoints[0].x, prev.y - trackPoints[0].y);
                const distCurr = Math.hypot(current.x - trackPoints[0].x, current.y - trackPoints[0].y);
                return distPrev > distCurr ? prev : current;
            });
        }
    
        // Actualizamos el tablero con la distancia (Fitness)
        const currentDist = Math.hypot(bestCar.x - trackPoints[0].x, bestCar.y - trackPoints[0].y);
        document.getElementById('best-fitness').innerText = currentDist.toFixed(2);
        document.getElementById('alive-count').innerText = aliveCars.length;

        cars.forEach(car => {
            car.update(roadBorders);
            // We only tell the best car to draw its sensor lines (fixes Symptom 1)
            car.draw(ctx, car === bestCar); 
        });

        // Evolution Check: If everyone is crashed or time runs out, start next generation
        if (aliveCars.length === 0) {
            // Save the brain of the winner
            localStorage.setItem('bestBrain', JSON.stringify(bestCar.brain));
            // Save the brain of the winner
            localStorage.setItem('genCount', currentGeneration + 1);
            // Reload page to start new generation
            location.reload();
        }

    } else {
        ctx.fillStyle = "white";
        ctx.font = "14px Arial";
        ctx.fillText(`BRANCH: MONACO - GEN: ${currentGeneration} - Selecting Best Brain`, 10, 20);
        cars.forEach(car => car.draw(ctx, car === cars[0]));
    }

    requestAnimationFrame(animate);
}

// Visual helpers to clear the storage if needed (useful for development)
window.resetEvolution = () => {
    localStorage.removeItem('bestBrain');
    localStorage.removeItem('genCount');
    location.reload();
}

animate();