import React, { useEffect, useRef } from 'react';
import p5 from 'p5';

const Sketch: React.FC = () => {
  const sketchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sketch = (p: p5) => {
      let flock: Boid[] = [];
      let gridSize = 50;

      let grid: Map<string, Boid[]> = new Map();

      p.setup = () => {
        p.createCanvas(1920, 800);
        for (let i = 0; i < 300; i++) {
          flock.push(new Boid(p.random(p.width), p.random(p.height), p));
        }
      };

      p.draw = () => {
        p.background(0, 0, 0);

        grid.clear();

        for (let boid of flock) {
          let gridKey = boid.getGridKey(gridSize);
          if (!grid.has(gridKey)) grid.set(gridKey, []);
          grid.get(gridKey)?.push(boid);
        }

        for (let boid of flock) {
          boid.edges();
          boid.flock(getNeighbors(boid));
          boid.update();
          boid.show();
          boid.link(getNeighbors(boid));
        }
      };

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

      class Boid {
        position: p5.Vector;
        velocity: p5.Vector;
        acceleration: p5.Vector;
        maxForce: number;
        maxSpeed: number;
        p: p5;

        constructor(x: number, y: number, p: p5) {
          this.position = p.createVector(x, y);
          this.velocity = p5.Vector.random2D();
          this.velocity.setMag(p.random(2, 4));
          this.acceleration = p.createVector(0, 0);
          this.maxForce = 0.5;
          this.maxSpeed = 6;
          this.p = p;
        }

        show() {
          this.p.fill(105, 150, 200);
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
