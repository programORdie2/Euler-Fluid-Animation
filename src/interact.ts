import type { Scene } from "./types";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
let mouseDown = false;

export function setObstacle(
	scene: Scene,
	x: number,
	y: number,
	reset: boolean,
) {
	let vx = 0.0;
	let vy = 0.0;

	if (!reset) {
		vx = (x - scene.obstacleX) / scene.dt;
		vy = (y - scene.obstacleY) / scene.dt;
	}

	scene.obstacleX = x;
	scene.obstacleY = y;
	const radius = scene.obstacleRadius;
	const fluid = scene.fluid;
	const gridSize = fluid.gridWith;

	for (let i = 1; i < fluid.gridHeight - 2; i++) {
		for (let j = 1; j < fluid.gridWith - 2; j++) {
			fluid.scalar[i * gridSize + j] = 1.0;

			let dx = (i + 0.5) * fluid.cellSize - x;
			let dy = (j + 0.5) * fluid.cellSize - y;

			if (dx * dx + dy * dy < radius * radius) {
				fluid.scalar[i * gridSize + j] = 0.0;
				fluid.material[i * gridSize + j] = 1.0;
				fluid.velocityX[i * gridSize + j] = vx;
				fluid.velocityX[(i + 1) * gridSize + j] = vx;
				fluid.velocityY[i * gridSize + j] = vy;
				fluid.velocityY[i * gridSize + j + 1] = vy;
			}
		}
	}
}

export function startDrag(scene: Scene, x: number, y: number) {
	mouseDown = true;

	const bounds = canvas.getBoundingClientRect();

	const mx = x - bounds.left - canvas.clientLeft;
	const my = y - bounds.top - canvas.clientTop;

	x = mx / canvas.height;
	y = (canvas.height - my) / canvas.height;

	setObstacle(scene, x, y, true);
}

export function drag(scene: Scene, x: number, y: number) {
	if (!mouseDown) return;
	const bounds = canvas.getBoundingClientRect();
	const mx = x - bounds.left - canvas.clientLeft;
	const my = y - bounds.top - canvas.clientTop;
	x = mx / canvas.height;
	y = (canvas.height - my) / canvas.height;
	setObstacle(scene, x, y, false);
}

export function endDrag() {
	mouseDown = false;
}
