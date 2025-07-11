// https://github.com/KingOKarma/TwitchBotTemplate/blob/main/src/events/message.ts

import { ChatClient } from '@twurple/chat';
import { EventEmitter } from 'events';

export type ChatClientEvents =
	| 'ready'
	| 'command'
	| 'anyMessage'
	| 'authFail'
	| 'ban'
	| 'bitBadgeUpgrade'
	| 'chatClear'
	| 'communityPayForward'
	| 'communitySub'
	| 'emoteOnly'
	| 'followersOnly'
	| 'giftPaidUpgrade'
	| 'host'
	| 'hosted'
	| 'hostsRemaining'
	| 'join'
	| 'message'
	| 'messageFailed'
	| 'messageRateLimit'
	| 'messageRemoved'
	| 'nickChange'
	| 'noPermission'
	| 'part'
	| 'primeCommunityGift'
	| 'primePaidUpgrade'
	| 'uniqueChat'
	| 'raid'
	| 'raidCancel'
	| 'reSub'
	| 'rewardGift'
	| 'ritual'
	| 'slowmode'
	| 'standardPayForward'
	| 'sub'
	| 'subExtend'
	| 'subGift'
	| 'subOnly'
	| 'timeout'
	| 'unHost'
	| 'whisper';

export const clientEvent = new EventEmitter();

/**
 * Used to bind events from twitch.js/d-fischer into an EventEmitter
 * @param {ChatClient} client The twitch.js ChatClient instance (already authorised)
 * @returns {EventEmitter} EventEmitter for each twitch event
 * @example
 * const clientEvents = eventBinder(chatClient);
 *
 * clientEvents.on("message", (channel, user, message, msg) => {
 * console.log(message)
 *
 *    if (message.toLowerCase() === "hello") {
 *        return chatClient.say(channel, `Heya! ${user}`);
 *    }
 *
 * })
 */
export function eventBinder(client: ChatClient): EventEmitter {
	client.onAuthenticationSuccess(() => {
		clientEvent.emit('ready');
	});

	client.onAction((channel, user, message, msg) => {
		clientEvent.emit('command', channel, user, message, msg);
	});

	client.irc.onAnyMessage((msg) => {
		clientEvent.emit('anyMessage', msg);
	});

	client.onAuthenticationFailure((message) => {
		clientEvent.emit('authFail', message);
	});

	client.onBan((channel, user) => {
		clientEvent.emit('ban', channel, user);
	});

	client.onBitsBadgeUpgrade((channel, user, upgradeInfo, msg) => {
		clientEvent.emit('bitBadgeUpgrade', channel, user, upgradeInfo, msg);
	});

	client.onChatClear((channel) => {
		clientEvent.emit('chatClear', channel);
	});

	client.onCommunityPayForward((channel, user, forwardInfo, msg) => {
		clientEvent.emit('communityPayForward', channel, user, forwardInfo, msg);
	});

	client.onCommunitySub((channel, user, subInfo, msg) => {
		clientEvent.emit('communitySub', channel, user, subInfo, msg);
	});

	client.onEmoteOnly((channel, enabled) => {
		clientEvent.emit('emoteOnly', channel, enabled);
	});

	client.onFollowersOnly((channel, enabled, delay) => {
		clientEvent.emit('followersOnly', channel, enabled, delay);
	});

	client.onGiftPaidUpgrade((channel, user, subInfo, msg) => {
		clientEvent.emit('giftPaidUpgrade', channel, user, subInfo, msg);
	});

	client.onMessage((channel, user, message, msg) => {
		clientEvent.emit('message', channel, user, message, msg);
	});

	client.onMessageFailed((channel, reason) => {
		clientEvent.emit('messageFailed', channel, reason);
	});

	client.onMessageRatelimit((channel, message) => {
		clientEvent.emit('messageRateLimit', channel, message);
	});

	client.onMessageRemove((channel, messageId, msg) => {
		clientEvent.emit('messageRemoved', channel, messageId, msg);
	});

	client.onNoPermission((channel, message) => {
		clientEvent.emit('noPermission', channel, message);
	});

	client.onPart((channel, user) => {
		clientEvent.emit('part', channel, user);
	});

	client.onUniqueChat((channel, enabled) => {
		clientEvent.emit('onUniqueChat', channel, enabled);
	});

	client.onRaid((channel, user, raidInfo, msg) => {
		clientEvent.emit('raid', channel, user, raidInfo, msg);
	});

	client.onRaidCancel((channel, msg) => {
		clientEvent.emit('raidCancel', channel, msg);
	});

	client.onResub((channel, user, subInfo, msg) => {
		clientEvent.emit('reSub', channel, user, subInfo, msg);
	});

	client.onRewardGift((channel, user, rewardGiftInfo, msg) => {
		clientEvent.emit('rewardGift', channel, user, rewardGiftInfo, msg);
	});

	client.onRitual((channel, user, ritualInfo, msg) => {
		clientEvent.emit('ritual', channel, user, ritualInfo, msg);
	});

	client.onSlow((channel, enabled, delay) => {
		clientEvent.emit('slowmode', channel, enabled, delay);
	});

	client.onStandardPayForward((channel, user, forwardInfo, msg) => {
		clientEvent.emit('standardPayForward', channel, user, forwardInfo, msg);
	});

	client.onSub((channel, user, subInfo, msg) => {
		clientEvent.emit('sub', channel, user, subInfo, msg);
	});

	client.onSubExtend((channel, user, subInfo, msg) => {
		clientEvent.emit('subExtend', channel, user, subInfo, msg);
	});

	client.onSubGift((channel, user, subInfo, msg) => {
		clientEvent.emit('subGift', channel, user, subInfo, msg);
	});

	client.onSubsOnly((channel, enabled) => {
		clientEvent.emit('subOnly', channel, enabled);
	});

	client.onTimeout((channel, user, duration) => {
		clientEvent.emit('timeout', channel, user, duration);
	});

	client.onWhisper((user, message, msg) => {
		clientEvent.emit('whisper', user, message, msg);
	});

	return clientEvent;
}
