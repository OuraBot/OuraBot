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
	.on('unhandledRejection', async (reason, p) => {
		ob.logger.error(`Unhandled Rejection at: Promise ${p}, reason: ${reason}`, 'ob.unhandledRejection');
		await ob.api.get('https://status.mrauro.dev/api/push/VEqUco8a47?status=down&msg=Unhandled%20Rejection', 0);
		process.exit(1);
	})
	.on('uncaughtException', async (err) => {
		ob.logger.error(`Uncaught Exception: ${err}`, 'ob.uncaughtException');
		await ob.api.get('https://status.mrauro.dev/api/push/VEqUco8a47?status=down&msg=Uncaught%20Exception', 0);
		process.exit(1);
	});
