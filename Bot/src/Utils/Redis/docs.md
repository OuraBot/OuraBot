# EventManager Docs

The EventManager is a Redis pub/sub system that allows the Frontend to comminicate with the bot. All events are handled on the `obv3:events` channel.

Each message is a stringified JSON object with the following properties:

```jsonc
{
	"operation": "QUERY", // The operation to perform
	"topic": "Settings", // The topic of the event
	"uuid": "", // A random UUID generated to differentiate between events
	"auth": "", // JWT signed auth token. Must match userId
	"userId": "", // The userId of the user that sent the event. Must match auth
	"status": "", // Status codes for RESPONSE events
	"sender": "", // SERVER or CLIENT, used to differentiate between events
	"data": {
		// JSON data, depends on operation and topic
	}
}
```

All responses will omit the auth property for security as they are not needed.

## Operations

| Operation | Description                               |
| --------- | ----------------------------------------- |
| QUERY     | Query for data, essentially a GET request |
| UPDATE    | Update data                               |
| RESPONSE  | Server response to a query or update      |

## Topics

| Topic    | Description       |
| -------- | ----------------- |
| Settings | Channel Settings  |
| Commands | Channel Commands  |
| Join     | Bot Joins Channel |
| Admin    | Admin Info        |
| Modules  | Channel Modules   |

## Status Codes

| Code | Description                |
| ---- | -------------------------- |
| 200  | Success                    |
| 400  | Parsing message JSON error |
| 401  | Invalid auth token         |
| 403  | Permission (for managers)  |
| 429  | Rate limit exceeded        |
| 500  | Internal Server Error      |

## Sender

Since whenever you send a message to a Redis channel, the message is sent to all clients subscribed to that channel. This is used to differentiate between events sent by
the frontend `CLIENT` and the backend/bot `SERVER`

---

# Folder/File Structure

For organization, all events are in nested folders. For example, all QUERY events are in the ./Events/QUERY folder with their appropriate topic name. No operations are
handled in the `EventManager.ts` file.

Each event file must export a default `handler` function that takes in the Event object and returns a Promise that resolves with a new Event object. All events must have
documentation above the handler function. Be sure to spread the Event object before setting any other properties to prevent overwriting.

```ts
import { Event, StatusCodes } from '../../EventManager';

export default function handler(Event: Event): Promise<Event> {
	return new Promise(async (resolve, reject) => {
		resolve({
			...Event,
			status: StatusCodes.OK,
			data: {
				TriHard: 7,
			},
		});
	});
}
```

# Helpers

The `sendMessage` helper will automatically stringify an Event and send it to the `obv3:events` channel. The `sender`, `operation`, and `auth` properties are
automatically set. In an event handler you can use the spread operator to fill in the rest of the properties and prevent repetition (this is used in the example above).
