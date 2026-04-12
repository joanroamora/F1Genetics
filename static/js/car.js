// car.js - Agent Logic
class Car {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.sensor = new Sensor(this);

        this.speed = 0;
        this.acceleration = 0.2;
        this.maxSpeed = 3;
        this.friction = 0.05;
        this.angle = 0;
        this.damaged = false; // Becomes true if it hits a wall

        // Controls (To be replaced by the AI later)
        this.controls = {
            forward: true,
            left: false,
            right: false,
            reverse: false
        };
    }

    update(roadBorders) { // Ahora recibe los bordes de la pista
        if (!this.damaged) {
            this.#move();
            this.sensor.update(roadBorders);
        }
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
        this.sensor.draw(ctx);
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(-this.angle);

        // Usamos el width existente como diámetro para la partícula redonda
        const radius = this.width / 2; 

        // 1. Dibujar el cuerpo redondo de la partícula
        ctx.beginPath();
        // Dibujamos centrado en 0,0 porque ya usamos translate y rotate
        ctx.arc(0, 0, radius, 0, Math.PI * 2); 
        
        // Color F1 Red si está bien, gris oscuro si chocó
        ctx.fillStyle = this.damaged ? "#555" : "#FF1E1E"; 
        ctx.fill();
        ctx.closePath();

        // 2. Indicador de Dirección (Puntero blanco en la punta)
        // CRÍTICO para ver hacia dónde está mirando el agente mientras aprende
        if (!this.damaged) {
            ctx.beginPath();
            // Asumiendo que ángulo 0 significa mirando hacia ARRIBA (Y negativo)
            ctx.moveTo(0, -radius - 4); // Punta sobresale un poco
            ctx.lineTo(-4, 0);          // Esquina trasera izquierda
            ctx.lineTo(4, 0);           // Esquina trasera derecha
            ctx.closePath();
            ctx.fillStyle = "white";
            ctx.fill();
        }

        ctx.restore();
    }
}