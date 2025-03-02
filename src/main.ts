import { Fluid } from "./fluid";
import { drag, endDrag, setObstacle, startDrag } from "./interact";
import { render } from "./render";
import type { Scene } from "./types";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
canvas.width = 800;
canvas.height = 600;

const aspectRatio = canvas.width / canvas.height;

function setupScene(): Scene {
	const res = 200;

	const h = 1 / res;

	const numX = Math.floor(aspectRatio / h);
	const numY = Math.floor(1 / h);

	const density = 1000.0;

	const fluid = new Fluid(density, numX, numY, h);

	const n = fluid.gridWith;

	let inVel = 2.0;
	for (let i = 0; i < fluid.gridHeight; i++) {
		for (let j = 0; j < fluid.gridWith; j++) {
			let s = 1.0; // fluid
			if (i == 0 || j == 0 || j == fluid.gridWith - 1) s = 0.0; // solid
			fluid.scalar[i * n + j] = s;

			if (i == 1) {
				fluid.velocityX[i * n + j] = inVel;
			}
		}
	}

	const pipeH = 0.1 * fluid.gridWith;
	const minJ = Math.floor(0.5 * fluid.gridWith - 0.5 * pipeH);
	const maxJ = Math.floor(0.5 * fluid.gridWith + 0.5 * pipeH);

	for (let j = minJ; j < maxJ; j++) fluid.material[j] = 0.0;

	const scene = {
		fluid,
		obstacleX: 0.4,
		obstacleY: 0.5,
		obstacleRadius: 0.1,
		dt: 0.01,
		numIters: 10,
		frameNr: 0,
		paused: false,
		gravity: 0.0,
	};

	setObstacle(scene, 0.4, 0.5, true);

	return scene;
}

const scene = setupScene();

function simulate() {
	if (scene.paused) return;

	scene.fluid.simulate(scene.dt, scene.gravity, scene.numIters);
	scene.frameNr++;
}

function update() {
	simulate();
	render(scene);
	requestAnimationFrame(update);
}

update();

canvas.addEventListener("mousedown", (event) => {
	startDrag(scene, event.x, event.y);
});

canvas.addEventListener("mouseup", () => {
	endDrag();
});

canvas.addEventListener("mousemove", (event) => {
	drag(scene, event.x, event.y);
});

canvas.addEventListener("touchstart", (event) => {
	startDrag(scene, event.touches[0].clientX, event.touches[0].clientY);
});

canvas.addEventListener("touchend", () => {
	endDrag();
});

canvas.addEventListener(
	"touchmove",
	(event) => {
		event.preventDefault();
		event.stopImmediatePropagation();
		drag(scene, event.touches[0].clientX, event.touches[0].clientY);
	},
	{ passive: false },
);

document.addEventListener("keydown", (event) => {
	switch (event.key) {
		case "p":
			scene.paused = !scene.paused;
			break;
		case "m":
			scene.paused = false;
			simulate();
			scene.paused = true;
			break;
	}
});
