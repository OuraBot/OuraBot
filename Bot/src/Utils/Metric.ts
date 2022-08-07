export class Metric {
	public count = 0;
	public ms: number;

	constructor(ms: number = 1000) {
		this.ms = ms;
	}

	public trigger() {
		this.count++;
		setTimeout(() => {
			this.count--;
		}, this.ms);
	}

	public getRate(): number {
		return this.count / (this.ms / 1000);
	}
}
