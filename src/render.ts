import type { Scene } from "./types";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

function cX(x: number) {
	return x * canvas.height;
}

function cY(y: number) {
	return canvas.height - y * canvas.height;
}

export function render(scene: Scene) {
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	ctx.fillStyle = "#FF0000";
	const fluid = scene.fluid;
	const size = fluid.gridWith;

	const cellSize = fluid.cellSize;

	let minP = fluid.pressure[0];
	let maxP = fluid.pressure[0];

	for (let i = 0; i < fluid.totalCells; i++) {
		minP = Math.min(minP, fluid.pressure[i]);
		maxP = Math.max(maxP, fluid.pressure[i]);
	}

	const imgData = new ImageData(canvas.width, canvas.height);

	for (let i = 0; i < fluid.gridHeight; i++) {
		for (let j = 0; j < fluid.gridWith; j++) {
			const material = fluid.material[i * size + j];
			const color = [material * 255, material * 255, material * 255];

			const x = Math.floor(cX(i * cellSize));
			const y = Math.floor(cY((j + 1) * cellSize));
			const cx = Math.floor(canvas.height * cellSize) + 1;
			const cy = Math.floor(canvas.height * cellSize) + 1;

			for (let yi = y; yi < y + cy; yi++) {
				let p = 4 * (yi * canvas.width + x);

				for (let xi = 0; xi < cx; xi++) {
					imgData.data[p++] = color[0];
					imgData.data[p++] = color[1];
					imgData.data[p++] = color[2];
					imgData.data[p++] = 255;
				}
			}
		}
	}

	ctx.putImageData(imgData, 0, 0);

	const r = scene.obstacleRadius + fluid.cellSize;
	ctx.fillStyle = "#DDDDDD";

	ctx.beginPath();
	ctx.arc(
		cX(scene.obstacleX),
		cY(scene.obstacleY),
		canvas.height * r,
		0.0,
		2.0 * Math.PI,
	);
	ctx.closePath();
	ctx.fill();

	ctx.lineWidth = 3.0;
	ctx.strokeStyle = "#000000";
	ctx.beginPath();
	ctx.arc(
		cX(scene.obstacleX),
		cY(scene.obstacleY),
		canvas.height * r,
		0.0,
		2.0 * Math.PI,
	);
	ctx.closePath();
	ctx.stroke();
	ctx.lineWidth = 1.0;
}
