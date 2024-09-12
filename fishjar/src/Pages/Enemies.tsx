import p5 from 'p5';
import React from 'react';

class Enemies {
    position: p5.Vector;
    velocity: p5.Vector;
    acceleration: p5.Vector;
    maxForce: number;
    maxSpeed: number;
    isEating: boolean;
    life: number;
    color: p5.Color;
    p: p5;

    constructor(x:number, y:number, p: p5, color: p5.Color) {
        this.position = p.createVector(x,y);
        this.velocity = p5.Vector.random2D();
        this.velocity.setMag(p.random(2,3));
        this.acceleration = p.createVector(0,0);
        this.maxForce = 0.5;
        this.maxSpeed = 6;
        this.isEating = false;
        this.color = color;
        this.life = 100;
        this.p = p;
    }

    show() {
        this.p.fill(this.color);
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

    update() {
        this.position.add(this.velocity);
        this.velocity.add(this.acceleration);
        this.velocity.limit(this.maxSpeed);
        this.acceleration.mult(0);
    }

    drawVector() {
        let endX = this.position.x + this.velocity.x * 10;
        let endY = this.position.y + this.velocity.y * 10; 
    
        this.p.stroke(150, 120, 100);
        this.p.line(this.position.x, this.position.y, endX, endY);

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

}

export default Enemies;