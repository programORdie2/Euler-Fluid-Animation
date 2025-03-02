const overRelaxation = 1.85;

const FIELD_U = 0;
const FIELD_V = 1;
const FIELD_SCALAR = 2;

export class Fluid {
	readonly gridHeight: number;
	readonly gridWith: number;
	readonly totalCells: number;
	readonly density: number;
	readonly cellSize: number;
	readonly velocityX: Float32Array;
	readonly velocityY: Float32Array;
	readonly newVelocityX: Float32Array;
	readonly newVelocityY: Float32Array;
	readonly pressure: Float32Array;
	readonly scalar: Float32Array;
	readonly material: Float32Array;
	readonly newMaterial: Float32Array;

	constructor(
		density: number,
		gridWidth: number,
		gridHeight: number,
		cellSize: number,
	) {
		this.density = density;
		this.gridHeight = gridWidth;
		this.gridWith = gridHeight;
		this.totalCells = this.gridHeight * this.gridWith;
		this.cellSize = cellSize;
		this.velocityX = new Float32Array(this.totalCells);
		this.velocityY = new Float32Array(this.totalCells);
		this.newVelocityX = new Float32Array(this.totalCells);
		this.newVelocityY = new Float32Array(this.totalCells);
		this.pressure = new Float32Array(this.totalCells);
		this.scalar = new Float32Array(this.totalCells);
		this.material = new Float32Array(this.totalCells);
		this.newMaterial = new Float32Array(this.totalCells);
		this.material.fill(1.0);
	}

	integrate(dt: number, gravity: number) {
		const height = this.gridWith;
		for (let i = 1; i < this.gridHeight; i++) {
			for (let j = 1; j < this.gridWith - 1; j++) {
				if (
					this.scalar[i * height + j] != 0.0 &&
					this.scalar[i * height + j - 1] != 0.0
				)
					this.velocityY[i * height + j] += gravity * dt;
			}
		}
	}

	solveIncompressibility(numIters: number, dt: number) {
		const height = this.gridWith;
		const pressureFactor = (this.density * this.cellSize) / dt;

		for (let iter = 0; iter < numIters; iter++) {
			for (let x = 1; x < this.gridHeight - 1; x++) {
				for (let y = 1; y < this.gridWith - 1; y++) {
					if (this.scalar[x * height + y] == 0.0) continue;

					let surroundingSum =
						this.scalar[(x - 1) * height + y] +
						this.scalar[(x + 1) * height + y] +
						this.scalar[x * height + y - 1] +
						this.scalar[x * height + y + 1];
					if (surroundingSum === 0.0) continue;

					let divergence =
						this.velocityX[(x + 1) * height + y] -
						this.velocityX[x * height + y] +
						this.velocityY[x * height + y + 1] -
						this.velocityY[x * height + y];

					let pressureChange = (-divergence / surroundingSum) * overRelaxation;
					this.pressure[x * height + y] += pressureFactor * pressureChange;

					this.velocityX[x * height + y] -=
						this.scalar[(x - 1) * height + y] * pressureChange;
					this.velocityX[(x + 1) * height + y] +=
						this.scalar[(x + 1) * height + y] * pressureChange;
					this.velocityY[x * height + y] -=
						this.scalar[x * height + y - 1] * pressureChange;
					this.velocityY[x * height + y + 1] +=
						this.scalar[x * height + y + 1] * pressureChange;
				}
			}
		}
	}

	extrapolate() {
		const height = this.gridWith;
		for (let i = 0; i < this.gridHeight; i++) {
			this.velocityX[i * height + 0] = this.velocityX[i * height + 1];
			this.velocityX[i * height + this.gridWith - 1] =
				this.velocityX[i * height + this.gridWith - 2];
		}
		for (let j = 0; j < this.gridWith; j++) {
			this.velocityY[0 * height + j] = this.velocityY[1 * height + j];
			this.velocityY[(this.gridHeight - 1) * height + j] =
				this.velocityY[(this.gridHeight - 2) * height + j];
		}
	}

	sampleField(
		x: number,
		y: number,
		field: typeof FIELD_U | typeof FIELD_V | typeof FIELD_SCALAR,
	) {
		const height = this.gridWith;
		const cellSize = this.cellSize;
		const h1 = 1.0 / cellSize;
		const h2 = 0.5 * cellSize;

		x = Math.max(Math.min(x, this.gridHeight * cellSize), cellSize);
		y = Math.max(Math.min(y, this.gridWith * cellSize), cellSize);

		let dx = 0.0;
		let dy = 0.0;

		let f;

		switch (field) {
			case FIELD_U:
				f = this.velocityX;
				dy = h2;
				break;
			case FIELD_V:
				f = this.velocityY;
				dx = h2;
				break;
			case FIELD_SCALAR:
				f = this.material;
				dx = h2;
				dy = h2;
				break;
			default:
				throw new Error("Unknown field");
		}

		const x0 = Math.min(Math.floor((x - dx) * h1), this.gridHeight - 1);
		const tx = (x - dx - x0 * cellSize) * h1;
		const x1 = Math.min(x0 + 1, this.gridHeight - 1);

		const y0 = Math.min(Math.floor((y - dy) * h1), this.gridWith - 1);
		const ty = (y - dy - y0 * cellSize) * h1;
		const y1 = Math.min(y0 + 1, this.gridWith - 1);

		const sx = 1.0 - tx;
		const sy = 1.0 - ty;

		const val =
			sx * sy * f[x0 * height + y0] +
			tx * sy * f[x1 * height + y0] +
			tx * ty * f[x1 * height + y1] +
			sx * ty * f[x0 * height + y1];

		return val;
	}

	avgX(x: number, y: number) {
		const height = this.gridWith;
		return (
			(this.velocityX[x * height + y - 1] +
				this.velocityX[x * height + y] +
				this.velocityX[(x + 1) * height + y - 1] +
				this.velocityX[(x + 1) * height + y]) *
			0.25
		);
	}

	avgY(x: number, y: number) {
		const height = this.gridWith;
		return (
			(this.velocityY[(x - 1) * height + y] +
				this.velocityY[x * height + y] +
				this.velocityY[(x - 1) * height + y + 1] +
				this.velocityY[x * height + y + 1]) *
			0.25
		);
	}

	advectVel(dt: number) {
		this.newVelocityX.set(this.velocityX);
		this.newVelocityY.set(this.velocityY);

		const height = this.gridWith;
		const cellSize = this.cellSize;
		const h2 = 0.5 * cellSize;

		for (let i = 1; i < this.gridHeight; i++) {
			for (let j = 1; j < this.gridWith; j++) {
				// x component
				if (
					this.scalar[i * height + j] != 0.0 &&
					this.scalar[(i - 1) * height + j] != 0.0 &&
					j < this.gridWith - 1
				) {
					let x = i * cellSize;
					let y = j * cellSize + h2;
					let u = this.velocityX[i * height + j];
					let v = this.avgY(i, j);
					x = x - dt * u;
					y = y - dt * v;
					u = this.sampleField(x, y, FIELD_U);
					this.newVelocityX[i * height + j] = u;
				}
				// y component
				if (
					this.scalar[i * height + j] != 0.0 &&
					this.scalar[i * height + j - 1] != 0.0 &&
					i < this.gridHeight - 1
				) {
					let x = i * cellSize + h2;
					let y = j * cellSize;
					let u = this.avgX(i, j);
					let v = this.velocityY[i * height + j];
					x = x - dt * u;
					y = y - dt * v;
					v = this.sampleField(x, y, FIELD_V);
					this.newVelocityY[i * height + j] = v;
				}
			}
		}

		this.velocityX.set(this.newVelocityX);
		this.velocityY.set(this.newVelocityY);
	}

	advectSmoke(dt: number) {
		this.newMaterial.set(this.material);

		const height = this.gridWith;
		const cellSize = this.cellSize;
		const h2 = 0.5 * cellSize;

		for (let i = 1; i < this.gridHeight - 1; i++) {
			for (let j = 1; j < this.gridWith - 1; j++) {
				if (this.scalar[i * height + j] != 0.0) {
					const u =
						(this.velocityX[i * height + j] +
							this.velocityX[(i + 1) * height + j]) *
						0.5;
					const v =
						(this.velocityY[i * height + j] +
							this.velocityY[i * height + j + 1]) *
						0.5;
					const x = i * cellSize + h2 - dt * u;
					const y = j * cellSize + h2 - dt * v;

					this.newMaterial[i * height + j] = this.sampleField(
						x,
						y,
						FIELD_SCALAR,
					);
				}
			}
		}
		this.material.set(this.newMaterial);
	}

	simulate(dt: number, gravity: number, numIters: number) {
		this.integrate(dt, gravity);

		this.pressure.fill(0.0);
		this.solveIncompressibility(numIters, dt);

		this.extrapolate();
		this.advectVel(dt);
		this.advectSmoke(dt);
	}
}
