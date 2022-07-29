import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage';
import OuraBot from '../../Client';
import { Command, CommandReturn, Channel, getCommands, CategoryEnum, Permission } from '../../Typings/Twitch';

export const cmd = new (class command implements Command {
	name = 'reload';
	description = 'Reload all commands';
	usage = 'reload';
	permissions = [Permission.Owner];
	ownerOnly = true;
	userCooldown = 0;
	channelCooldown = 0;
	category = CategoryEnum.Utility;
	execute = async (ob: OuraBot, user: string, Channel: Channel, args: string[], _message: string, msg: TwitchPrivateMessage, alias: string): Promise<CommandReturn> => {
		try {
			if (ob.debug) {
				ob.twitch.say(Channel, `dankCircle tsc`);
				ob.exec('tsc', async (err, stdout, stderr) => {
					if (err) throw err;
					ob.commands = await getCommands();
					ob.twitch.say(Channel, `SeemsGood reloaded commands`);
				});
			} else {
				ob.twitch.say(Channel, 'dankCircle git pull origin');
				ob.exec('git pull origin', async (err, stdout, stderr) => {
					if (err) throw err;
					ob.twitch.say(Channel, `dankTalk ${stdout}`);
					ob.twitch.say(Channel, `dankCircle yarn install`);
					ob.exec('yarn install', async (err, stdout, stderr) => {
						if (err) throw err;
						ob.twitch.say(Channel, `DankTalk  ${stdout}`);
						ob.twitch.say(Channel, `dankCircle tsc`);
						ob.exec('tsc', async (err, stdout, stderr) => {
							if (err) throw err;
							ob.commands = await getCommands();
							ob.twitch.say(Channel, `SeemsGood reloaded commands`);
						});
					});
				});
			}
		} catch (err) {
			throw err;
		}
		return {
			success: true,
			message: null,
		};
	};
})();
