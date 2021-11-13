import axios from 'axios';
import { Client, Intents, MessageActionRow, MessageButton, MessageEmbed, TextChannel } from 'discord.js';
import dotenv from 'dotenv';
import { chatClient } from '..';
import { Channel } from '../models/channel.model';
import { getBttvChannelEmotes, getFfzChannelEmotes, getStvChannelEmotes } from './channelEmotes';
dotenv.config();

const channelIds = {
    joinRequests: '908913516642189392',
    errors: '908914129757147157',
    mirroring: '908914196543066182',
};

export class Discord {
    static client: Client;

    constructor() {
        Discord.client = new Client({
            intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS],
        });

        Discord.client.on('ready', () => {
            console.log('Discord Bot Ready!');
        });

        Discord.client.on('interactionCreate', (interaction) => {
            if (!interaction.isButton()) return;

            switch (interaction.channelId) {
                case channelIds.joinRequests:
                    switch (interaction.customId) {
                        case 'accept':
                            let clientUsername = process.env.CLIENT_USERNAME;

                            if (!interaction.message.nonce) {
                                const message = (Discord.client.channels.cache.get(channelIds.joinRequests) as TextChannel).messages.cache.get(interaction.message.id);

                                message.embeds[0].setColor('#000000').setFooter(`Missing message nonce. Please use !joinchannel command in Twitch`);
                                for (let button of message.components[0].components) {
                                    button.setDisabled(true);
                                }

                                message.edit({
                                    embeds: [message.embeds[0]],
                                    components: [message.components[0]],
                                });

                                interaction.deferUpdate();
                            } else {
                                const newChannel = new Channel({
                                    channel: interaction.message.nonce,
                                    bot: clientUsername,
                                });

                                newChannel.save();

                                chatClient.join(`${interaction.message.nonce}`);
                                chatClient.say(`${interaction.message.nonce}`, `MrDestructoid 👋 Joined channel!`);
                                const message = (Discord.client.channels.cache.get(channelIds.joinRequests) as TextChannel).messages.cache.get(interaction.message.id);

                                message.embeds[0].setColor('#00ff00').setFooter(`Accepted by ${interaction.user.username}`);
                                for (let button of message.components[0].components) {
                                    button.setDisabled(true);
                                }

                                message.edit({
                                    embeds: [message.embeds[0]],
                                    components: [message.components[0]],
                                });

                                interaction.deferUpdate();
                                break;
                            }

                        case 'decline':
                            const message = (Discord.client.channels.cache.get(channelIds.joinRequests) as TextChannel).messages.cache.get(interaction.message.id);

                            message.embeds[0].setColor('#ff0000').setFooter(`Declined by ${interaction.user.username}`);
                            message.components[0].components[1].setDisabled(true);
                            message.edit({
                                embeds: [message.embeds[0]],
                                components: [message.components[0]],
                            });

                            interaction.deferUpdate();
                            break;
                    }

                    break;
            }
        });

        Discord.client.login(process.env.DISCORD_TOKEN);
    }

    async postJoinRequest(user: string, userId: string) {
        const channel = Discord.client.channels.cache.get(channelIds.joinRequests);
        if (!channel) {
            console.log('Could not find join requests channel');
            return;
        }

        const ffzEmoteCount = ((await getFfzChannelEmotes(user))?.split(' ') ?? []).length;
        const bttvEmoteCount = ((await getBttvChannelEmotes(user))?.split(' ') ?? []).length;
        const sevenTvEmoteCount = (await getStvChannelEmotes(user))?.length ?? 0;

        let recentMessagesCount = 0;
        axios
            .get(`https://recent-messages.robotty.de/api/v2/recent-messages/${user}`)
            .then((res) => {
                recentMessagesCount = res.data.messages.length;
            })
            .catch((err) => {
                recentMessagesCount = 0;
            });

        const embed = new MessageEmbed()
            .setTitle(`${user}`)
            .setColor('#0099ff')
            .setAuthor('New Join Request')
            .addFields([
                { name: 'FFZ Emotes', value: `${ffzEmoteCount}`, inline: true },
                { name: 'BTTV Emotes', value: `${bttvEmoteCount}`, inline: true },
                { name: '7TV Emotes', value: `${sevenTvEmoteCount}`, inline: true },
                { name: 'Recent Messages', value: `${recentMessagesCount}`, inline: true },
            ])
            .setTimestamp();

        const buttons = new MessageActionRow().addComponents([
            new MessageButton().setLabel('Accept').setStyle('SUCCESS').setCustomId('accept'),
            new MessageButton().setLabel('Decline').setStyle('DANGER').setCustomId('decline'),
        ]);

        await (channel as TextChannel).send({
            nonce: user,
            embeds: [embed],
            components: [buttons],
        });
    }

    async postError(embed: MessageEmbed) {
        const channel = Discord.client.channels.cache.get(channelIds.errors);
        if (!channel) {
            console.log('Could not find errors channel');
            return;
        }

        return (channel as TextChannel).send({
            embeds: [embed],
        });
    }

    async mirrorUsage(_channel: string, user: string, command: string, args: string[], response: string, success: boolean) {
        const embed = new MessageEmbed()
            .setAuthor(_channel)
            .setColor(success ? 0x00ff00 : 0xff0000)
            .setTimestamp()
            .addFields([
                { name: `${user}:`, value: `${command} ${args.join(' ')}` },
                { name: 'Response:', value: response },
            ]);

        const channel = Discord.client.channels.cache.get(channelIds.mirroring);
        if (!channel) {
            console.log('Could not find mirror channel');
            return;
        }

        return (channel as TextChannel).send({
            embeds: [embed],
        });
    }
}
