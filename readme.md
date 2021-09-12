# How to run locally:
Needs:
- Twitch OAuth Token (get one from https://twitchtokengenerator.com/ - idk which scopes so just get all 4HEad)
- Node & Yarn Installed
- Twitch App Secret & App ID
- MongoDB Atlas URL (free tier works fine)
- Discord Webhook for error logging
- Wolfram Alpha API Key (but this command is disabled rn because im too lazy to fix it)
- Redis
- Youtube API Key
- Last.fm API Key (get here => https://www.last.fm/api/account/create)

Clone the repo and install all the node modules
`yarn install`

Create a .env with the following:
```
APP_CLIENTID=twitch client id
APP_SECRET=twitch client secret
MONGO_URL=mongodb atlas url with pw
DEBUG=true, doesnt join all channels in DB
CLIENT_USERNAME=bot username
YOUTUBE_KEY=youtube api key
PORT=port the github commit log runs on
DISCORD_WEBHOOK=yk
LASTFMKEY=lastfm api key
```

Fill out owner and prefix of config.json. The other fields were there because i used them previously but was too lazy to remove them

Create a tokens.json with:
```
{
    "accessToken": "ACCESS TOKEN",
    "refreshToken": "REFRESH TOKEN",
    "expiryTimestamp": 0
}
``` 

If you need help setting this up lmk, i didnt intend for this to be ran anywhere else besides my machine KKona

## Subscription:

### onStandardPayForward

[Information about a "forward payment" to a specific user.](https://d-fischer.github.io/twitch-chat-client/reference/interfaces/ChatStandardPayForwardInfo.html)

#### onStandardPayForward_gifted

| replacement    | description       |
| -------------- | ----------------- |
| ${displayName} | gifted user       |
| ${gifterName}  | person who gifted |

#### onStandardPayForward_anon

| replacement    | description |
| -------------- | ----------- |
| ${displayName} | gifted user |

### onSub

[Information about a subscription.](https://d-fischer.github.io/versions/4.5/twitch-chat-client/reference/interfaces/ChatSubInfo.html)

#### onSub_primeNew

| replacement    | description  |
| -------------- | ------------ |
| ${displayName} | gifted user  |
| ${planName}    | type of plan |

#### onSub_tierOneNew

| replacement    | description  |
| -------------- | ------------ |
| ${displayName} | gifted user  |
| ${planName}    | type of plan |

#### onSub_tierTwoNew

| replacement    | description  |
| -------------- | ------------ |
| ${displayName} | gifted user  |
| ${planName}    | type of plan |

#### onSub_tierThreeNew

| replacement    | description  |
| -------------- | ------------ |
| ${displayName} | gifted user  |
| ${planName}    | type of plan |

### onResub

[Information about a subscription.](https://d-fischer.github.io/versions/4.5/twitch-chat-client/reference/interfaces/ChatSubInfo.html)

#### onResub_prime

| replacement    | description   |
| -------------- | ------------- |
| ${displayName} | gifted user   |
| ${planName}    | type of plan  |
| ${months}      | months subbed |

#### onResub_primeStreak

| replacement    | description    |
| -------------- | -------------- |
| ${displayName} | gifted user    |
| ${planName}    | type of plan   |
| ${months}      | months subbed  |
| ${streak}      | current streak |

#### onResub_one

| replacement    | description   |
| -------------- | ------------- |
| ${displayName} | gifted user   |
| ${planName}    | type of plan  |
| ${months}      | months subbed |

#### onResub_oneStreak

| replacement    | description    |
| -------------- | -------------- |
| ${displayName} | gifted user    |
| ${planName}    | type of plan   |
| ${months}      | months subbed  |
| ${streak}      | current streak |

#### onResub_two

| replacement    | description   |
| -------------- | ------------- |
| ${displayName} | gifted user   |
| ${planName}    | type of plan  |
| ${months}      | months subbed |

#### onResub_twoStreak

| replacement    | description    |
| -------------- | -------------- |
| ${displayName} | gifted user    |
| ${planName}    | type of plan   |
| ${months}      | months subbed  |
| ${streak}      | current streak |

#### onResub_three

| replacement    | description   |
| -------------- | ------------- |
| ${displayName} | gifted user   |
| ${planName}    | type of plan  |
| ${months}      | months subbed |

#### onResub_threeStreak

| replacement    | description    |
| -------------- | -------------- |
| ${displayName} | gifted user    |
| ${planName}    | type of plan   |
| ${months}      | months subbed  |
| ${streak}      | current streak |

### onSubExtend

[Information about a subsription extension.](https://d-fischer.github.io/versions/4.5/twitch-chat-client/reference/interfaces/ChatSubExtendInfo.html)

#### onSubExtend

| replacement    | description   |
| -------------- | ------------- |
| ${displayName} | gifted user   |
| ${months}      | months subbed |

### onSubGift

[Information about a subscription that was gifted.](https://d-fischer.github.io/versions/4.5/twitch-chat-client/reference/interfaces/ChatSubGiftInfo.html)
****`${displayName}` and `${gifterName}` values are incorrect, swap them for the correct usage**:**

-   gifterName returns the username for who was gifted

#### onSubGift_gifted

| replacement    | description |
| -------------- | ----------- |
| ${displayName} | gifted user |
| ${planName}    | plan name   |
| ${gifterName}  | gifter name |
| ${months}      | months      |

#### onSubGift_gifted

| replacement    | description |
| -------------- | ----------- |
| ${displayName} | gifted user |
| ${planName}    | plan name   |
| ${months}      | months      |

### onGiftPaidUpgrade

[Information about a subscription that was upgraded from a gift.](https://d-fischer.github.io/versions/4.5/twitch-chat-client/reference/interfaces/ChatSubGiftUpgradeInfo.html)

#### onGiftPaidUpgrade_gifted

| replacement    | description |
| -------------- | ----------- |
| ${displayName} | gifted user |
| ${gifterName}  | gifter name |

#### onGiftPaidUpgrade_anon

| replacement    | description |
| -------------- | ----------- |
| ${displayName} | gifted user |

### onPrimePaidUpgrade

[Information about a subscription that was upgraded from a Prime subscription.](https://d-fischer.github.io/versions/4.5/twitch-chat-client/reference/interfaces/ChatSubUpgradeInfo.html)

#### onPrimePaidUpgrade

| replacement    | description |
| -------------- | ----------- |
| ${displayName} | gifted user |
