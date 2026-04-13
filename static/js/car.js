// static/js/car.js - Agent Logic
class Car {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        this.sensor = new Sensor(this);
        // Brain: 5 inputs, 6 hidden, 4 outputs
        this.brain = new NeuralNetwork([this.sensor.rayCount, 6, 4]); 

        this.speed = 0;
        this.angle = 0;
        this.damaged = false;
        
        // --- NUEVO: SISTEMA ANTIPEREZA ---
        this.idleTime = 0;       // Cronómetro de inactividad
        this.maxIdleTime = 60;   // 60 fotogramas = 1 segundo de tolerancia antes de morir

        this.acceleration = 0.2;
        this.maxSpeed = 2;
        this.friction = 0.05;

        this.controls = {
            forward: true,
            left: false,
            right: false,
            reverse: false
        };
        this.polygon = []; // Para detectar colisiones
    }

    update(roadBorders) {
        if (!this.damaged) {
            this.#move();

            // --- NUEVO: LÓGICA DE MUERTE POR INACTIVIDAD ---
            // Si la velocidad es ridículamente baja, sumamos tiempo al cronómetro
            if (Math.abs(this.speed) < 0.1) {
                this.idleTime++;
            } else {
                this.idleTime = 0; // Si se mueve rápido, reseteamos el cronómetro
            }

            // Si el carro lleva más de 1 segundo quieto, le apagamos el motor
            if (this.idleTime >= this.maxIdleTime) {
                this.damaged = true;
            }

            // 1. Detectar Colisión contra paredes
            this.polygon = this.#createPolygon();
            // Solo evaluamos el choque si no ha muerto por pereza primero
            if (!this.damaged) {
                this.damaged = this.#assessDamage(roadBorders);
            }
            
            // 2. Alimentar al Cerebro (Inputs)
            this.sensor.update(roadBorders);
            const offsets = this.sensor.readings.map(
                s => s == null ? 0 : 1 - s.offset
            );
            
            // 3. El Cerebro Decide (Outputs)
            const outputs = NeuralNetwork.feedForward(offsets, this.brain);
            this.controls.forward = outputs[0];
            this.controls.left = outputs[1];
            this.controls.right = outputs[2];
            this.controls.reverse = outputs[3];
        }
    }

    #assessDamage(roadBorders) {
        for (let i = 0; i < roadBorders.length; i++) {
            if (polysIntersect(this.polygon, roadBorders[i])) {
                return true;
            }
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
        if (this.controls.reverse) { this.speed -= this.acceleration; }

        if (this.speed > this.maxSpeed) { this.speed = this.maxSpeed; }
        if (this.speed < -this.maxSpeed / 2) { this.speed = -this.maxSpeed / 2; }

        if (this.speed > 0) { this.speed -= this.friction; }
        if (this.speed < 0) { this.speed += this.friction; }
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
        if (this.sensor && drawSensor) {
            this.sensor.draw(ctx);
        }

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