import chalk from 'chalk';
import OuraBot from './Client';

const ob = new OuraBot();

ob.init();

export default ob;

process.on('SIGINT', async () => {
	await ob.shutdown();
	process.exit(0);
});

process
	.on('unhandledRejection', (reason, p) => {
		ob.logger.error(`Unhandled Rejection at: Promise ${p}, reason: ${reason}`, 'ob.unhandledRejection');
		process.exit(1);
	})
	.on('uncaughtException', (err) => {
		ob.logger.error(`Uncaught Exception: ${err}`, 'ob.uncaughtException');
		process.exit(1);
	});
