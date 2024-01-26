# Interal Bot Documentation

This holds all of the documentation for creating features for the bot

## Setup

You will need the following:

`.env`

```
TWITCH_CLIENT_ID=twitch_client_id
TWITCH_CLIENT_SECRET=twitch_client_secret
MONGO_URI=mongodb_url
DEBUG=true
SEVENTV_AUTH=seventv_auth_token
HASTE_KEY=haste_key
HASTE_URL=https://i.mrauro.dev/
JWT_SECRET=twitch_client_secret
LAST_FM_TOKEN=last.fm token
```

You can get the 7TV auth token by opening up the network tab and viewing the headers of any 7tv request

`/src/config.json`

```jsonc
{
	"channels": [
		{
			"login": "auror6s",
			"id": "94568374",
		},
	],
	"owner": "auror6s",
	"prefix": "!",
	"bot_twitch_id": 652867592,
	"debugprefix": "?", // not used yet
	"admins": ["mmattbtw"],
	"ambassadors": ["liptongod"],
	"redisPrefix": "obv3", // optional
	"spamClients": 10, // optional
	"sqlitePath": "./sqlite.db", // optional
}
```

`tokens.json`

```jsonc
{
	"accessToken": "asdfasdf", // get this from twitchtokengenerator.com and selecting all the scopes - input your client id and secret
	"refreshToken": "asdfasdfasdfasdfasdf", // ^
	"scope": [], // these will be autofilled when the bot starts
	"expiresIn": 13631, // ^
	"obtainmentTimestamp": 1644721502460, // ^
}
```

Install the dependencies:

`yarn install`

And start the bot:

`yarn start`

## Creating a command

To create a command, go into the `/src/events/Commands` directory and create a new file with the name of the command you want to create. There is a vscode snippet that
will set up the boilerplate called "\_command". You can tab through each placeholder and fill in the information.

#### Usage

Use <>'s to denote a required field and <?>'s to denote an optional field.

## Using the native OuraBot API to fetch data

Use `ob.api.get<T>(url, cache, options)` to fetch data. This will handle caching for you. Be sure to add a type in the `src/Typings/API.ts` file. If you are using a url
multiple times across files add a constant to the `src/Utils/API/constants.ts` file.
