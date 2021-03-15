# Backend Documentation

## Routes

### /command/



#### POST /command/add
Request Body:
| property | type   | use                     |
|----------|--------|-------------------------|
| command  | String | command name            |
| response | String | response of the command |
| channel  | String | channel for the command |
| cooldown | Number | cooldown (in seconds)   |
Response:

200: "Command Added!"

#### GET /command/:id
Response:

200: ```
{ 
    command: "ping", 
    response: "pong", 
    channel: "auror6s", 
    cooldown: 5
}
    ```

#### DELETE /command/:id
Response:

200: "Command deleted."

### /eventsub/

#### POST /eventsub/follow/add
Request Body:
| property | type   | use                     |
|----------|--------|-------------------------|
| response | String | response of the follow  |
| channel  | String | channel for the follow  |
| channelID| String |channel ID for the follow|
Response:

200: "Follow Added!"

#### GET /eventsub/follow/:id
Response:

200: ```
{ 
    response: "auror6s has just followed PogChamp", 
    channel: "auror6s", 
}
    ```

#### DELETE /eventsub/follow/:id
Response:

200: "Follow deleted."

#### POST /eventsub/subscribe/add
Request Body:
| property | type   | use                     |
|----------|--------|-------------------------|
| response | String | response of the sub     |
| channel  | String | channel for the sub     |
| channelID| String |channel ID for the sub   |
Response:

200: "Subscribe Added!"

#### GET /eventsub/subscribe/:id
Response:

200: ```
{ 
    response: "auror6s has just subscribed PogChamp", 
    channel: "auror6s", 
}
    ```

#### DELETE /eventsub/subscribe/:id
Response:

200: "subscribe deleted."


### /follownuke/

#### POST /follownuke/add
Request Body:
| property | type   | use                     |
|----------|--------|-------------------------|
| user     | String | user who followed       |
| channel  | String | channel for the follow  |
| channelID| String |channel ID for the follow|
Response:

200: "Follow Added!"

#### GET /follownuke/:id
Response:
200: ```
{ 
    user: "auror6s", 
    channel: "xqcow",
    channelID: "5919691" 
}
    ```
### DELETE /follownuke/:id
Response:

200: "Follow deleted."

### /listen/

#### POST /listen/add
Request Body:
| property | type   | use                     |
|----------|--------|-------------------------|
| channel  | String | channel to listen in    |
Response:

200: "Channel Added!"

#### GET /listen/:id
Response:
200: ```
{ 
    channel: "xqcow"
}
    ```
### DELETE /listen/:id
Response:

200: "Follow deleted."

### /clip/

#### POST /clip/add
Request Body:
| property | type   | use                     |
|----------|--------|-------------------------|
| channel  | String | channel to listen in    |
| whID     | String | discord webhook id      |
| whToken  | String | discord webhook token   |
Response:

200: "Channel Added!"

#### GET /clip/:id
Response:
200: ```
{ 
    channel: "xqcow"
}
    ```
### DELETE /clip/:id
Response:

200: "Follow deleted."