# Documentation

## Terms:

| replacement | description           |
|-------------|-----------------------|
| ${user}     | sender of the command |
| ${ag}       | term title            |
| $(newline)  | splits message        |

## Custom Commands:

| replacement | description                        |
|-------------|------------------------------------|
| $\<sender>   | sender of the command             |
| $\<channel>  | channel the command took place in |
| $\<args1>    | first argument                    |
| $\<args2>    | second argument                   |
| $\<sArgs1>   | first argument or sender          |
| $fetchURL() | fetches url                        |

## Automated Messages:

| replacement | description           |
|-------------|-----------------------|
| $fetchURL() | fetches url           |

## Follow:

| replacement | description |
|---------|-----------------|
| %user% | fetches url      |

## Subscription:

### onStandardPayForward

[Information about a "forward payment" to a specific user.](https://d-fischer.github.io/twitch-chat-client/reference/interfaces/ChatStandardPayForwardInfo.html)

#### onStandardPayForward_gifted

| replacement    | description       |
|----------------|-------------------|
| ${displayName} | gifted user       |
| ${gifterName}  | person who gifted |

#### onStandardPayForward_anon

| replacement    | description       |
|----------------|-------------------|
| ${displayName} | gifted user       |

### onSub

#### onSub_primeNew

| replacement    | description  |
|----------------|--------------|
| ${displayName} | gifted user  |
| ${planName}    | type of plan |

#### onSub_tierOneNew

| replacement    | description  |
|----------------|--------------|
| ${displayName} | gifted user  |
| ${planName}    | type of plan |

#### onSub_tierTwoNew

| replacement    | description  |
|----------------|--------------|
| ${displayName} | gifted user  |
| ${planName}    | type of plan |


#### onSub_tierThreeNew

| replacement    | description  |
|----------------|--------------|
| ${displayName} | gifted user  |
| ${planName}    | type of plan |





