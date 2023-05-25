import express from 'express';
import ob from '../..';

export class Server {
	public app: express.Application;
	public port: number;

	constructor(port: number) {
		this.app = express();
		this.port = port;

		this.start();
	}

	public async start(): Promise<void> {
		return new Promise((resolve, reject) => {
			this.app.get('/grafana', (req, res) => {
				return res.json('OK');
			});

			this.app.listen(this.port, () => {
				ob.logger.info(`Internal API server listening on port ${this.port}`, 'ob.server');
				resolve();
			});
		});
	}
}
