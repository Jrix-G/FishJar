import React, { useEffect, useRef } from 'react';
import p5 from 'p5';

const Sketch: React.FC = () => {
  const sketchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sketch = (p: p5) => {
      let flock: Boid[] = [];
      let gridSize = 30;
      let grid: Map<string, Boid[]> = new Map();
      let eatingPoints: p5.Vector[] = [];

      p.setup = () => {
        p.createCanvas(1200, 600);
        for (let i = 0; i < 10; i++) {
          let color = p.color(100, 100, 100);
          flock.push(new Boid(p.random(p.width), p.random(p.height), p, color));
        }
        createEatingPoints(10);
      };

      p.draw = () => {
        p.background(0, 0, 0);

        grid.clear();

        for (let boid of flock) {
          let gridKey = boid.getGridKey(gridSize);
          if (!grid.has(gridKey)) grid.set(gridKey, []);
          grid.get(gridKey)?.push(boid);
        }

        drawGrid();
        drawEatingPoints();

        for (let boid of flock) {
          boid.update();
          boid.show();
          noContact();
          randomizeMovements();
          checkEatingPoints(boid);

          boid.edges();
        }
      };

      function drawVectors() {
        for (let boid of flock) {
          let endX = boid.position.x + boid.velocity.x * 10;
          let endY = boid.position.y + boid.velocity.y * 10; 
      
          p.stroke(150, 120, 100);
          p.line(boid.position.x, boid.position.y, endX, endY);
        }
      }

      function noContact() {
        for (let boid of flock) {
          let neighbors = getNeighbors(boid);
          for (let neighbor of neighbors) {
            let distance = p.dist(boid.position.x, boid.position.y, neighbor.position.x, neighbor.position.y);
            if (distance < 100) {
              let diff = p5.Vector.sub(boid.position, neighbor.position);
              diff.normalize();
              diff.div(distance);
              boid.velocity.add(diff);
            }
          }
        }
      }

      function randomizeMovements() {
        for (let boid of flock) {
          boid.velocity.add(p5.Vector.random2D().mult(p.random(0.3, 0.5)));
        }
      }

      function createEatingPoints(numPoints: number=10) {
        setInterval(() => {
          for (let i = 0; i < numPoints; i++) {
            let x = p.random(p.width);
            let y = p.random(p.height);
            eatingPoints.push(p.createVector(x, y));
          }
        }, 2000);
      }

      function drawEatingPoints() {
        p.fill(255, 0, 0);
        for (let point of eatingPoints) {
          p.ellipse(point.x, point.y, 10, 10);
        }
      }

      function drawGrid() {
        p.stroke(255, 50);
        for (let x = 0; x < p.width; x += gridSize) {
          p.line(x, 0, x, p.height);
        }
        for (let y = 0; y < p.height; y += gridSize) {
          p.line(0, y, p.width, y);
        }
      }

      function getNeighbors(boid: Boid): Boid[] {
        let neighbors: Boid[] = [];
        let gridKey = boid.getGridKey(gridSize);
        let keysToCheck = boid.getNeighborKeys(gridSize);
        for (let key of keysToCheck) {
          if (grid.has(key)) {
            neighbors.push(...grid.get(key)!);
          }
        }
        return neighbors;
      }

      function checkEatingPoints(boid: Boid) {
        if (eatingPoints.length === 0) return;

        let closestPoint: p5.Vector | null = null;
        let closestDistance = Infinity;
        for (let point of eatingPoints) {
          let distance = p.dist(boid.position.x, boid.position.y, point.x, point.y);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestPoint = point;
          }
        }

        if (closestDistance < 10) {
          boid.eat();
          if (closestPoint) {
            eatingPoints.splice(eatingPoints.indexOf(closestPoint), 1);
          }
        } else if (closestPoint) {
          boid.seek(closestPoint);
        }
      }

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
            this.color = p.color(100, currentColor+10, 100)
            this.life += 10;
          }
        }
      }
    };

    const p5Instance = new p5(sketch, sketchRef.current as HTMLElement);

    return () => {
      p5Instance.remove();
    };
  }, []);

  return <div ref={sketchRef}></div>;
};

const Home: React.FC = () => {
  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: 'black' }}>
      <Sketch />
    </div>
  );
};

export default Home;