import chalk from 'chalk';
import consoleStamp from 'console-stamp';
import OuraBot from './Client';
import * as fs from 'fs';

consoleStamp(console, {
	format: ':date(yyyy/mm/dd HH:MM:ss.l).blue :smartLabel(7)',
	tokens: {
		smartLabel: (arg) => {
			const { method, defaultTokens } = arg;
			let label = defaultTokens.label(arg);
			switch (method) {
				case 'error':
					label = chalk`{bold.red ${label}}`;
					break;

				case 'warn':
					label = chalk`{bold.yellow ${label}}`;
					break;

				default:
					label = chalk`{green ${label}}`;
			}
			return label;
		},
	},
});

const ob = new OuraBot();

ob.init();

export default ob;

process.on('SIGINT', async () => {
	await ob.shutdown();
	process.exit(0);
});
