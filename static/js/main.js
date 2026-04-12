// main.js - Orchestrator
const canvas = document.getElementById('simulationCanvas');
const ctx = canvas.getContext('2d');

function animate() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Placeholder for Track & Cars
    ctx.fillStyle = '#444';
    ctx.font = '18px Courier New';
    ctx.fillText('System Ready. Waiting for Engine Start...', 180, 300);

    requestAnimationFrame(animate);
}

animate();