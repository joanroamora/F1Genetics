// car.js - Agent Logic
class Car {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.brain = new NeuralNetwork([this.sensor.rayCount, 6, 4]); // 5 inputs, 6 hidden, 4 outputs
        
        // Movimos estas variables arriba para que el sensor las encuentre
        this.speed = 0;
        this.angle = 0;
        this.damaged = false;

        this.sensor = new Sensor(this); // Ahora sí el sensor tiene ángulo 0 listo
        
        this.acceleration = 0.2;
        this.maxSpeed = 3;
        this.friction = 0.05;

        this.controls = {
            forward: true, // Saldrán disparados al dar START
            left: false,
            right: false,
            reverse: false
        };
    }

    update(roadBorders) {
    if (!this.damaged) {
        this.#move();
        this.polygon = this.#createPolygon(); // Para detectar choques
        this.damaged = this.#assessDamage(roadBorders);
        this.sensor.update(roadBorders);
        
        // El cerebro toma las lecturas (0 si está lejos, 1-offset si está cerca)
        const offsets = this.sensor.readings.map(
            s => s == null ? 0 : 1 - s.offset
        );
        const outputs = NeuralNetwork.feedForward(offsets, this.brain);

        // Mapeamos las salidas de la red a los controles
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
    points.push({
        x: this.x - Math.sin(this.angle - alpha) * rad,
        y: this.y - Math.cos(this.angle - alpha) * rad
    });
    points.push({
        x: this.x - Math.sin(this.angle + alpha) * rad,
        y: this.y - Math.cos(this.angle + alpha) * rad
    });
    points.push({
        x: this.x - Math.sin(Math.PI + this.angle - alpha) * rad,
        y: this.y - Math.cos(Math.PI + this.angle - alpha) * rad
    });
    points.push({
        x: this.x - Math.sin(Math.PI + this.angle + alpha) * rad,
        y: this.y - Math.cos(Math.PI + this.angle + alpha) * rad
    });
    return points;
    }

    #move() {
        if (this.controls.forward) {
            this.speed += this.acceleration;
        }
        if (this.controls.reverse) {
            this.speed -= this.acceleration;
        }

        if (this.speed > this.maxSpeed) {
            this.speed = this.maxSpeed;
        }
        if (this.speed < -this.maxSpeed / 2) {
            this.speed = -this.maxSpeed / 2;
        }

        if (this.speed > 0) {
            this.speed -= this.friction;
        }
        if (this.speed < 0) {
            this.speed += this.friction;
        }
        if (Math.abs(this.speed) < this.friction) {
            this.speed = 0;
        }

        if (this.speed !== 0) {
            const flip = this.speed > 0 ? 1 : -1;
            if (this.controls.left) {
                this.angle += 0.03 * flip;
            }
            if (this.controls.right) {
                this.angle -= 0.03 * flip;
            }
        }

        this.x -= Math.sin(this.angle) * this.speed;
        this.y -= Math.cos(this.angle) * this.speed;
    }

    draw(ctx) {
        // Primero dibujamos los sensores (siempre y cuando existan)
        if (this.sensor) {
            this.sensor.draw(ctx);
        }

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(-this.angle);

        const radius = this.width / 2; 

        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2); 
        
        // Color rojo neón para que resalte en el asfalto oscuro
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