const RATE_INTERVAL = 1000 * 60 * 10; // 10 minutes

export class Metric {
	public count = 0;
	public ms: number;

	constructor(ms: number = RATE_INTERVAL) {
		this.ms = ms;
	}

	public trigger() {
		this.count++;
		setTimeout(() => {
			this.count--;
		}, this.ms);
	}

	public getRate(): number {
		return this.count / (this.ms / RATE_INTERVAL);
	}
}
