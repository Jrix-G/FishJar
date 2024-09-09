self.onmessage = function(event) {
    const { boidData, gridSize } = event.data;
    const boid = new Boid(boidData.x, boidData.y, boidData.p);
    boid.update();
    boid.edges();
    const neighbors = getNeighbors(boid, gridSize);
    boid.flock(neighbors);
    boid.link(neighbors);
    self.postMessage(boid);
};

class Boid {
    constructor(x, y, p) {
        this.position = p.createVector(x, y);
        this.velocity = p5.Vector.random2D();
        this.velocity.setMag(p.random(2, 4));
        this.acceleration = p.createVector(0, 0);
        this.maxForce = 0.5;
        this.maxSpeed = 6;
        this.p = p;
    }

    show() {
        this.p.fill(100, 50, 0);
        this.p.stroke(200);
        this.p.strokeWeight(2);
        this.p.ellipse(this.position.x, this.position.y, 50, 50);
    }

    edges() {
    if (this.position.x > this.p.width || this.position.x < 0) {
        this.velocity.x *= -1;
    }
    if (this.position.y > this.p.height || this.position.y < 0) {
        this.velocity.y *= -1;
    }
    }

    link(neighbors) {
        const visionDistance = 100;
        for (let other of neighbors) {
            let distance = this.p.dist(this.position.x, this.position.y, other.position.x, other.position.y);
            if (distance < visionDistance) {
            this.p.stroke(255, 100);
            this.p.line(this.position.x, this.position.y, other.position.x, other.position.y);
            }
        }
    }

    flock(boids) {
        let alignment = this.align(boids);
        let cohesion = this.cohesion(boids);
        let separation = this.separation(boids);

        alignment.mult(1.0);
        cohesion.mult(1.0);
        separation.mult(1.5);

        this.acceleration.add(alignment);
        this.acceleration.add(cohesion);
        this.acceleration.add(separation);
    }

    align(boids) {
        let perceptionRadius = 100;
        let steering = this.p.createVector(0, 0);
        let total = 0;
        for (let other of boids) {
            let d = this.p.dist(this.position.x, this.position.y, other.position.x, other.position.y);
            if (d < perceptionRadius) {
            steering.add(other.velocity);
            total++;
            }
        }
        if (total > 0) {
            steering.div(total);
            steering.setMag(this.maxSpeed);
            steering.sub(this.velocity);
            steering.limit(this.maxForce);
        }
        return steering;
    }

    cohesion(boids) {
        let perceptionRadius = 50;
        let steering = this.p.createVector(0, 0);
        let total = 0;
        for (let other of boids) {
            let d = this.p.dist(this.position.x, this.position.y, other.position.x, other.position.y);
            if (d < perceptionRadius) {
            steering.add(other.position);
            total++;
            }
        }
        if (total > 0) {
            steering.div(total);
            steering.sub(this.position);
            steering.setMag(this.maxSpeed);
            steering.sub(this.velocity);
            steering.limit(this.maxForce);
        }
        return steering;
    }

    separation(boids) {
        let perceptionRadius = 50;
        let steering = this.p.createVector(0, 0);
        let total = 0;
        for (let other of boids) {
            let d = this.p.dist(this.position.x, this.position.y, other.position.x, other.position.y);
            if (d < perceptionRadius && d > 0) {
            let diff = p5.Vector.sub(this.position, other.position);
            diff.div(d * d);
            steering.add(diff);
            total++;
            }
        }
        if (total > 0) {
            steering.div(total);
            steering.setMag(this.maxSpeed);
            steering.sub(this.velocity);
            steering.limit(this.maxForce);
        }
        return steering;
    }

    update() {
        this.position.add(this.velocity);
        this.velocity.add(this.acceleration);
        this.velocity.limit(this.maxSpeed);
        this.acceleration.mult(0);
    }

    getGridKey(gridSize) {
        let col = Math.floor(this.position.x / gridSize);
        let row = Math.floor(this.position.y / gridSize);
        return `${col},${row}`;
    }

    getNeighborKeys(gridSize) {
        let col = Math.floor(this.position.x / gridSize);
        let row = Math.floor(this.position.y / gridSize);
        let neighbors = [];
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
            neighbors.push(`${col + i},${row + j}`);
            }
        }
        return neighbors;
    }
}

function getNeighbors(boid, gridSize) {
    let neighbors = [];
    let gridKey = boid.getGridKey(gridSize);
    let keysToCheck = boid.getNeighborKeys(gridSize);
    for (let key of keysToCheck) {
        if (grid.has(key)) {
            neighbors.push(...grid.get(key));
        }
    }
    return neighbors;
}