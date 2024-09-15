import p5 from 'p5';
import React from 'react';

class Boid {
    position: p5.Vector;
    velocity: p5.Vector;
    acceleration: p5.Vector;
    maxForce: number;
    maxSpeed: number;
    isEating: boolean;
    life: number;
    color: p5.Color;
    p: p5;

    constructor(x: number, y: number, p: p5, color: p5.Color) {
        this.position = p.createVector(x, y);
        this.velocity = p5.Vector.random2D();
        this.velocity.setMag(p.random(2, 4));
        this.acceleration = p.createVector(0, 0);
        this.maxForce = 0.5;
        this.maxSpeed = 6;
        this.isEating = false;
        this.color = color;
        this.life = 100;
        this.p = p;
    }

    decreaseLife() {
        this.life -= 10;
        let currentColor = this.p.green(this.color);
        if (currentColor > 0) {
            this.color = this.p.color(100, currentColor-30, 100)
            this.life += 10;
        }
    }

    isDead(): boolean {
        return this.life <= 0;
    }

    show() {
        this.p.fill(this.color);
        this.p.stroke(200);
        this.p.strokeWeight(2);
        this.p.ellipse(this.position.x, this.position.y, 50, 50);
    }

    edges() {
        if (this.position.x+50 > this.p.width || this.position.x < 50) {
            this.velocity.x *= -1;
        }
        if (this.position.y+50 > this.p.height || this.position.y < 50) {
            this.velocity.y *= -1;
        }
    }

    link(neighbors: Boid[]) {
        const visionDistance = 100;
        for (let other of neighbors) {
        let distance = this.p.dist(this.position.x, this.position.y, other.position.x, other.position.y);
        if (distance < visionDistance) {
            this.p.stroke(255, 100);
            this.p.line(this.position.x, this.position.y, other.position.x, other.position.y);
        }
        }
    }

    flock(boids: Boid[]) {
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

    align(boids: Boid[]) {
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

    cohesion(boids: Boid[]) {
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

    separation(boids: Boid[]) {
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

    getGridKey(gridSize: number): string {
        let col = Math.floor(this.position.x / gridSize);
        let row = Math.floor(this.position.y / gridSize);
        return `${col},${row}`;
    }

    getNeighborKeys(gridSize: number): string[] {
        let col = Math.floor(this.position.x / gridSize);
        let row = Math.floor(this.position.y / gridSize);
        let neighbors: string[] = []; 
        for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            neighbors.push(`${col + i},${row + j}`);
        }
        }
        return neighbors;
    }

    seek(target: p5.Vector) {
        let desired = p5.Vector.sub(target, this.position);
        desired.setMag(this.maxSpeed);
        let steer = p5.Vector.sub(desired, this.velocity);
        steer.limit(this.maxForce);
        this.acceleration.add(steer);
    }

    eat() {
        this.isEating = true;
        let currentColor = this.p.green(this.color);
        if (currentColor < 245) {
            this.color = this.p.color(100, currentColor+10, 100)
            this.life += 10;
        }
    }
    }

export default Boid;