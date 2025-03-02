import type { Fluid } from "./fluid";

export type Scene = {
	gravity: number;
	dt: number;
	numIters: number;
	frameNr: number;
	obstacleX: number;
	obstacleY: number;
	obstacleRadius: number;
	paused: boolean;
	fluid: Fluid;
};
