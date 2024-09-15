import React, { useEffect, useRef } from 'react';
import p5 from 'p5';
import * as tf from '@tensorflow/tfjs';
import Enemies from './Enemies.tsx';
import Boid from './Boids.tsx';

const Sketch: React.FC = () => {
  const sketchRef = useRef<HTMLDivElement>(null);
  let model: tf.Sequential;
  let isTraining = false;
  let frameCount = 0;

  useEffect(() => {
    const sketch = (p: p5) => {
      let flock: Boid[] = [];
      let enemies: Enemies[] = [];
      let gridSize = 30;
      let grid: Map<string, Boid[]> = new Map();
      let eatingPoints: p5.Vector[] = [];

      async function loadOrCreateModel() {
        try {
          model = await tf.loadLayersModel('localstorage://my-model') as tf.Sequential;
          console.log('Modèle chargé avec succès');
        } catch (error) {
          console.log('Aucun modèle trouvé, création d\'un nouveau modèle');
          model = tf.sequential();
          model.add(tf.layers.dense({ units: 24, inputShape: [5], activation: 'relu' }));
          model.add(tf.layers.dense({ units: 24, activation: 'relu' }));
          model.add(tf.layers.dense({ units: 4, activation: 'linear' }));
          model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });
        }
      }

      loadOrCreateModel();

      p.setup = () => {
        p.createCanvas(1920, 900);
        for (let i = 0; i < 2; i++) {
          let color = p.color(100, 100, 100);
          flock.push(new Boid(p.random(p.width), p.random(p.height), p, color));
        }
        
        createEatingPoints(10);
        startEatingPointsInterval(2000, 10);

        for (let i = 0; i < 2; i++) { 
          let color = p.color(100, 100, 255);
          enemies.push(new Enemies(p.random(p.width), p.random(p.height), p, color));
        }

        setInterval(() => {
          for (let boid of flock) {
            boid.decreaseLife();
          }
          flock = flock.filter(boid => !boid.isDead());
        }, 5000);
      };

      p.draw = () => {
        frameCount++;
        p.background(0, 0, 0);

        grid.clear();

        for (let boid of flock) {
          let gridKey = boid.getGridKey(gridSize);
          if (!grid.has(gridKey)) grid.set(gridKey, []);
          grid.get(gridKey)?.push(boid);
        }

        drawGrid();
        drawEatingPoints();

        if (frameCount % 10 === 0) { 
          for (let boid of flock) {
            let state = getState(boid);
            let action = chooseAction(state);
            performAction(boid, action);
            let reward = getReward(boid);
            let nextState = getState(boid);
            trainModel(state, action, reward, nextState);
          }
        }

        for (let boid of flock) {
          boid.update();
          boid.show();
          noContact();
          checkEatingPoints(boid);
          boid.edges();
        }

        for (let enemie of enemies) {
          enemie.update();
          enemie.show();
          enemie.edges();
          randomizeMovementsEnemies();
          enemie.drawVector();
        }
      };

      function getState(boid: Boid): number[] {
        return [boid.position.x, boid.position.y, boid.velocity.x, boid.velocity.y, getClosestFoodDistance(boid)];
      }

      function chooseAction(state: number[]): number {
        return tf.tidy(() => {
          const input = tf.tensor2d([state]);
          const prediction = model.predict(input) as tf.Tensor;
          return prediction.argMax(1).dataSync()[0];
        });
      }

      function performAction(boid: Boid, action: number) {
        switch(action) {
          case 0: boid.velocity.add(p.createVector(1, 0)); break;
          case 1: boid.velocity.add(p.createVector(-1, 0)); break;
          case 2: boid.velocity.add(p.createVector(0, 1)); break;
          case 3: boid.velocity.add(p.createVector(0, -1)); break;
        }
      }

      function getReward(boid: Boid): number {
        if (boid.isEating) return 1;
        if (boid.isDead()) return -1;
        return 0;
      }

      function trainModel(state: number[], action: number, reward: number, nextState: number[]) {
        if (isTraining) return;

        tf.tidy(() => {
          const target = reward + 0.95 * (model.predict(tf.tensor2d([nextState])) as tf.Tensor).max(1).dataSync()[0];
          const targetVec = (model.predict(tf.tensor2d([state])) as tf.Tensor).dataSync();
          targetVec[action] = target;

          isTraining = true;
          model.fit(tf.tensor2d([state]), tf.tensor2d([Uint8Array.from(targetVec)]), { epochs: 1 }).then(() => {
            isTraining = false;
            // Sauvegarder le modèle après chaque entraînement
            model.save('localstorage://my-model');
          }).catch((error) => {
            console.error(error);
            isTraining = false;
          });
        });
      }

      function getClosestFoodDistance(boid: Boid): number {
        let closestDistance = Infinity;
        for (let point of eatingPoints) {
          let distance = p.dist(boid.position.x, boid.position.y, point.x, point.y);
          if (distance < closestDistance) {
            closestDistance = distance;
          }
        }
        return closestDistance;
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

      function randomizeMovementsEnemies() {
        for (let enemie of enemies) {
          enemie.velocity.add(p5.Vector.random2D().mult(p.random(0.3, 0.5)));
        }
      }

      function createEatingPoints(numPoints: number = 10) {
        for (let i = 0; i < numPoints; i++) {
          let x = p.random(p.width);
          let y = p.random(p.height);
          eatingPoints.push(p.createVector(x, y));
        }
      }

      function startEatingPointsInterval(interval: number = 2000, numPoints: number = 5) {
        setInterval(() => {
          createEatingPoints(numPoints);
        }, interval);
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
        let closestDistance = 100;
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