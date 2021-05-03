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

[Information about a subscription.](https://d-fischer.github.io/versions/4.5/twitch-chat-client/reference/interfaces/ChatSubInfo.html)

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


### onResub

[Information about a subscription.](https://d-fischer.github.io/versions/4.5/twitch-chat-client/reference/interfaces/ChatSubInfo.html)

#### onResub_prime

| replacement    | description    |
|----------------|----------------|
| ${displayName} | gifted user    |
| ${planName}    | type of plan   |
| ${months}      | months subbed  |

#### onResub_primeStreak

| replacement    | description    |
|----------------|----------------|
| ${displayName} | gifted user    |
| ${planName}    | type of plan   |
| ${months}      | months subbed  |
| ${streak}      | current streak |


#### onResub_one

| replacement    | description    |
|----------------|----------------|
| ${displayName} | gifted user    |
| ${planName}    | type of plan   |
| ${months}      | months subbed  |

#### onResub_oneStreak

| replacement    | description    |
|----------------|----------------|
| ${displayName} | gifted user    |
| ${planName}    | type of plan   |
| ${months}      | months subbed  |
| ${streak}      | current streak |


#### onResub_two

| replacement    | description    |
|----------------|----------------|
| ${displayName} | gifted user    |
| ${planName}    | type of plan   |
| ${months}      | months subbed  |

#### onResub_twoStreak

| replacement    | description    |
|----------------|----------------|
| ${displayName} | gifted user    |
| ${planName}    | type of plan   |
| ${months}      | months subbed  |
| ${streak}      | current streak |


#### onResub_three

| replacement    | description    |
|----------------|----------------|
| ${displayName} | gifted user    |
| ${planName}    | type of plan   |
| ${months}      | months subbed  |

#### onResub_threeStreak

| replacement    | description    |
|----------------|----------------|
| ${displayName} | gifted user    |
| ${planName}    | type of plan   |
| ${months}      | months subbed  |
| ${streak}      | current streak |


### onSubExtend

[Information about a subsription extension.](https://d-fischer.github.io/versions/4.5/twitch-chat-client/reference/interfaces/ChatSubExtendInfo.html)

#### onSubExtend

| replacement    | description   |
|----------------|---------------|
| ${displayName} | gifted user   |
| ${months}      | months subbed |

### onSubGift

[Information about a subscription that was gifted.](https://d-fischer.github.io/versions/4.5/twitch-chat-client/reference/interfaces/ChatSubGiftInfo.html)

#### onSubGift_gifted

| replacement    | description |
|----------------|-------------|
| ${displayName} | gifted user |
| ${planName}    | plan name   |
| ${gifterName}  | gifter name |
| ${months}      | months      |

#### onSubGift_gifted

| replacement    | description |
|----------------|-------------|
| ${displayName} | gifted user |
| ${planName}    | plan name   |
| ${months}      | months      |

### onGiftPaidUpgrade

[Information about a subscription that was upgraded from a gift.](https://d-fischer.github.io/versions/4.5/twitch-chat-client/reference/interfaces/ChatSubGiftUpgradeInfo.html)

#### onGiftPaidUpgrade_gifted

| replacement    | description |
|----------------|-------------|
| ${displayName} | gifted user |
| ${gifterName}  | gifter name |

#### onGiftPaidUpgrade_anon

| replacement    | description |
|----------------|-------------|
| ${displayName} | gifted user |
