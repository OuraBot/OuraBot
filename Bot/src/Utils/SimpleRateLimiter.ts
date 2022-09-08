export class SimpleRateLimiter {
	public MAX_LIMIT: number;
	public REFILL_TIME: number;

	public BUCKET: number;

	constructor(maxLimit: number, refillTime: number) {
		this.MAX_LIMIT = maxLimit;
		this.REFILL_TIME = refillTime;

		this.BUCKET = this.MAX_LIMIT;

		setInterval(() => {
			this.BUCKET = this.MAX_LIMIT;
		}, this.REFILL_TIME * 1000);
	}

	take(): boolean {
		if (this.BUCKET > 0) {
			this.BUCKET--;
			return true;
		} else {
			return false;
		}
	}
}
