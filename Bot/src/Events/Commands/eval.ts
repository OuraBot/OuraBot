import OuraBot from '../../Client';
// import * as _ob from '../../index';
import { Command, CommandReturn, Channel, CategoryEnum, Permission, PlatformEnum } from '../../Typings/Twitch';

export const cmd = new (class command implements Command {
	name = 'eval';
	description = 'Evaluate a code snippet';
	usage = 'eval <code>';
	permissions = [Permission.Owner];
	ownerOnly = true;
	hidden = true;
	userCooldown = 0;
	channelCooldown = 0;
	category = CategoryEnum.Utility;
	platforms = [PlatformEnum.Twitch];
	execute = async (_ob: OuraBot, user: string, Channel: Channel, args: string[]): Promise<CommandReturn> => {
		const ob = _ob;
		let code = args.join(' ');
		if (!code)
			return {
				success: false,
				message: 'No code provided',
			};

		try {
			if (code.includes('await')) {
				code = `(async () => { ${code} })()`;
				const result = await eval(code);
				return {
					success: true,
					message: `${result}`,
				};
			} else {
				const result = eval(code);
				return {
					success: true,
					message: `${result}`,
				};
			}
		} catch (err) {
			return {
				success: false,
				message: err.message,
			};
		}
	};
})();
