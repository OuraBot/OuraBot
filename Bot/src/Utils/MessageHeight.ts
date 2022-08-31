import { ParsedMessagePart } from '@twurple/common/lib';
import fs from 'fs';
import ob from '..';
import puppeteer from 'puppeteer';
import { Emote } from '../Typings/ThirdPartyEmotes';

export class MessageHeight {
	//

	public async calculateMessageHeight(
		message: string,
		displayName: string,
		numberOfBadges: number,
		parsedEmotes: ParsedMessagePart[],
		channelEmotes: Emote[]
	): Promise<number> {
		let formattedMessage = message;

		parsedEmotes.forEach((emote) => {
			if (emote.type == 'emote') {
				// we should be using the position and length values here but that would be too much work and this works good enough
				formattedMessage = formattedMessage.replace(
					new RegExp(`\\${emote.name}`, 'g'),
					`<img src="https://static-cdn.jtvnw.net/emoticons/v2/${emote.id}/default/dark/1.0" />`
				);
			}
		});

		const channelEmotesMap = new Map(channelEmotes.map((emote) => [emote.name, emote]));

		formattedMessage.split(' ').forEach((word) => {
			if (channelEmotesMap.has(word)) {
				const emote = channelEmotesMap.get(word);
				switch (emote.provider) {
					case '7TV':
						formattedMessage = formattedMessage.replace(word, `<img src="https://cdn.7tv.app/emote/${emote.id}/1x" />`);
						break;

					case 'BTTV':
						formattedMessage = formattedMessage.replace(word, `<img src="https://cdn.betterttv.net/emote/${emote.id}/1x" />`);
						break;

					case 'FFZ':
						formattedMessage = formattedMessage.replace(word, `<img src="https://cdn.frankerfacez.com/emote/${emote.id}/1" />`);
						break;
				}
			}
		});

		let html = DOMText;

		// all badges are the same width so it doesnt matter what image we use
		html = html.replace(
			'%badges%',
			new Array(numberOfBadges).fill('<img src="https://static-cdn.jtvnw.net/badges/v1/5d9f2208-5dd8-11e7-8513-2ff4adfae661/1">').join(' ')
		);
		html = html.replace('%displayName%', displayName);
		html = html.replace('%message%', formattedMessage);

		const browser = await puppeteer.launch({
			args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-accelerated-2d-canvas', '--disable-gpu', '--window-size=1920x1080'],
		});
		const page = await browser.newPage();
		await page.setViewport({ width: 1920, height: 1080 });
		await page.setContent(html);
		const messageDiv = await page.$('#message');
		return (await messageDiv.boundingBox()).height;
	}
}

const DOMText = `
<html>
	<script src="https://twemoji.maxcdn.com/v/latest/twemoji.min.js" crossorigin="anonymous"></script>
	<body onload="load()">
		<p id="message">%badges%<strong> %displayName%:</strong> %message%</p>
	</body>
</html>

<style>
	#message {
		font-family: Inter, Roobert, 'Helvetica Neue', Helvetica, Arial, sans-serif;
		font-size: 13px;
		font-style: normal;
		font-variant-ligatures: normal;
		font-variant-caps: normal;
		font-weight: 400;
		letter-spacing: normal;
		orphans: 2;
		text-align: start;
		text-indent: 0px;
		text-transform: none;
		white-space: normal;
		inline-size: 340px;
		word-wrap: break-word;
		line-height: 20px;
		widows: 2;
		color: rgb(239, 239, 241);
		word-spacing: 0px;
		-webkit-text-stroke-width: 0px;
		background-color: rgb(24, 24, 27);
a		float: none;
	}

	#message:hover {
		border: 1px solid red;
		background-color: #9e9e9e;
	}

	img {
		max-width: 100%;
		max-height: 100%;
		text-size-adjust: 100%;
		vertical-align: middle;
	}

	body {
		background-color: rgb(24, 24, 27);
	}
</style>
<script>
	function load() {
		var message = document.getElementById('message');
		message.innerHTML = twemoji.parse(message.innerHTML);

		// scale twemojis to 20px
		var twemojis = document.getElementsByClassName('emoji');
		for (var i = 0; i < twemojis.length; i++) {
			twemojis[i].style.width = '20px';
			twemojis[i].style.height = '20px';
		}
	}

	// displays the height of the element
	function displayHeight() {
		var message = document.getElementById('message');
		var height = message.clientHeight;
		console.log(height);
	}
</script>
`;
