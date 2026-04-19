// static/js/car.js - Agent Logic
class Car {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        this.sensor = new Sensor(this);
        // --- ARREGLO: 7 sensores (visión 180°), 6 neuronas ocultas, 3 salidas (Acelerar, Izq, Der) ---
        this.brain = new NeuralNetwork([this.sensor.rayCount, 6, 3]); 

        this.speed = 0;
        this.angle = 0;
        this.damaged = false;
        
        this.idleTime = 0;
        this.lastX = x;
        this.lastY = y;
        this.currentCheckpoint = 0; 

        this.acceleration = 0.2;
        this.maxSpeed = 2; 
        this.friction = 0.05;

        // Quitamos la reversa de los controles
        this.controls = { forward: false, left: false, right: false };
        this.polygon = []; 
    }

    update(roadBorders) {
        if (!this.damaged) {
            this.#move();

            // Muerte por inactividad
            this.idleTime++;
            if (this.idleTime % 30 === 0) {
                const distMoved = Math.hypot(this.x - this.lastX, this.y - this.lastY);
                if (distMoved < 3) { 
                    this.damaged = true;
                }
                this.lastX = this.x;
                this.lastY = this.y;
            }

            this.polygon = this.#createPolygon();
            
            if (!this.damaged) {
                this.damaged = this.#assessDamage(roadBorders);
            }
            
            this.sensor.update(roadBorders);
            const offsets = this.sensor.readings.map(
                s => s == null ? 0 : 1 - s.offset
            );
            
            const outputs = NeuralNetwork.feedForward(offsets, this.brain);
            
            // --- ARREGLO: Mapeo de 3 salidas. No hay reversa ---
            this.controls.forward = outputs[0];
            this.controls.left = outputs[1];
            this.controls.right = outputs[2];
        }
    }

    #assessDamage(roadBorders) {
        for (let i = 0; i < roadBorders.length; i++) {
            if (polysIntersect(this.polygon, roadBorders[i])) { return true; }
        }
        return false;
    }

    #createPolygon() {
        const points = [];
        const rad = Math.hypot(this.width, this.height) / 2;
        const alpha = Math.atan2(this.width, this.height);
        points.push({ x: this.x - Math.sin(this.angle - alpha) * rad, y: this.y - Math.cos(this.angle - alpha) * rad });
        points.push({ x: this.x - Math.sin(this.angle + alpha) * rad, y: this.y - Math.cos(this.angle + alpha) * rad });
        points.push({ x: this.x - Math.sin(Math.PI + this.angle - alpha) * rad, y: this.y - Math.cos(Math.PI + this.angle - alpha) * rad });
        points.push({ x: this.x - Math.sin(Math.PI + this.angle + alpha) * rad, y: this.y - Math.cos(Math.PI + this.angle + alpha) * rad });
        return points;
    }

    #move() {
        if (this.controls.forward) { this.speed += this.acceleration; }
        if (this.speed > this.maxSpeed) { this.speed = this.maxSpeed; }
        if (this.speed > 0) { this.speed -= this.friction; }
        if (Math.abs(this.speed) < this.friction) { this.speed = 0; }

        if (this.speed !== 0) {
            const flip = this.speed > 0 ? 1 : -1;
            if (this.controls.left) { this.angle += 0.03 * flip; }
            if (this.controls.right) { this.angle -= 0.03 * flip; }
        }

        this.x -= Math.sin(this.angle) * this.speed;
        this.y -= Math.cos(this.angle) * this.speed;
    }

    draw(ctx, drawSensor) {
        if (this.sensor && drawSensor) { this.sensor.draw(ctx); }
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(-this.angle);

        const radius = this.width / 2; 
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2); 
        ctx.fillStyle = this.damaged ? "#555" : "#FF0000"; 
        ctx.fill();
        ctx.closePath();

        if (!this.damaged) {
            ctx.beginPath();
            ctx.moveTo(0, -radius - 5); 
            ctx.lineTo(-4, 0);          
            ctx.lineTo(4, 0);           
            ctx.closePath();
            ctx.fillStyle = "white";
            ctx.fill();
        }
        ctx.restore();
    }
}