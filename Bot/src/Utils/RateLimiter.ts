export class RateLimiter {
	public MAX_LIMIT = 7400;
	public REFILL_TIME = 30 * 1000;
	public queue = new Array<() => void>();

	public BUCKET = 0;

	constructor() {
		this.BUCKET = this.MAX_LIMIT;

		setInterval(() => {
			this.BUCKET = this.MAX_LIMIT;
			this.release();
		}, this.REFILL_TIME);
	}

	take(priority: boolean = false): Promise<boolean> {
		if (priority) {
			if (this.BUCKET > 100) {
				this.BUCKET--;
				return Promise.resolve(true);
			} else {
				return new Promise((resolve) => {
					this.queue.push(() => resolve(true));
				});
			}
		} else {
			if (this.BUCKET > 300) {
				this.BUCKET--;
				return Promise.resolve(true);
			} else {
				return new Promise((resolve) => {
					this.queue.push(() => resolve(true));
				});
			}
		}
	}

	release() {
		let toBeReleased = this.queue.splice(0, this.BUCKET);
		toBeReleased.forEach((fn) => fn());
	}
}
