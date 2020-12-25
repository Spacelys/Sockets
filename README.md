# SpacelySocket

## Basic Overview

Manage your clients and websocket server with the use of Spaces.  These Spaces make it easy to organize clients and events in a compartmentalized manner.

## Installation and Usage

`npm install @spacelys/sockets --save`

### Spaces

Spaces are how we compartmentalized our websocket server.  All messages are processed by the same server.  We segment our server via Spaces to handle logical groupings of events. You might have a game server where you have a mainSpace, lobbySpace, gameSpace.  The mainSpace could be responsible for general events like private messages.  The lobbySpace would be responsible to group players together before starting the game.  The gameSpace would then be responsible for handling events that happen in the game as to not clutter the lobbySpace with server game logic.

---

#### Setting up a Simple Space Server

```typescript
import * as Spacely from '@spacelys/sockets'

const serverSpace = Spacely.listen<any>(4321);

serverSpace.onJoin((from: Spacely.Client) => {
    // do something when a client joines
});

serverSpace.onMessage((from: Spacely.Client, message: any) => {
    // do something when client sends a message
});

serverSpace.onLeave((from: Spacely.Client) => {
    // handle a client disconnecting from the space
});
```

---

#### Sub Spaces

You will create your main Space when starting up your server.  You can then create sub Spaces from any Spaces to handle different type of clients and events.

```typescript
interface LobbyState { messages: Array<string> };

const serverSpace = Spacely.listen<any>(4321);
const lobbySpace = serverSpace.createSpace<LobbyState>(
    "mainLobby",
    (): LobbyState => ({ messages: [] })
);

serverSpace.onJoin((from: Spacely.Client) => {
    if (from.getUID() !== "dont-let-this-guy-in") {
        lobbySpace.addClient(from);
    }
});

lobbySpace.onJoin((from: Spacely.Client) => {
    from.reply("Welcome! Glad you arent that guy we dont like");
});

```

---

#### Space State

Each space is assigned its own state object to manage.  The type of the state is defined when you create a new Space.  Any sub Space is automatically given the same state type as its parent but with its own copy to manage.

```typescript
interface MyStateObject = { valuesGiven: Array<number> };
const serverSpace = Spacely.listen<MyStateObject>(
    4321, // port to listen on
    () => ({ valuesGiven: [] }) // when supplied, this will create the initial state of your Space
);

serverSpace.onJoin((from: Spacely.Client) => {
    const {valuesGiven} = serverSpace.getState();
    const lastValue = valuesGiven.length > 0 ? valuesGiven.slice(-1)[0] : -1;
    const value = Math.random() * 100;
    from.reply(`You were assigned ${value} points!, last person got ${lastValue}`);
    valuesGiven.push(value);
    serverSpace.setState({
        valuesGiven
    });
});
```

---

#### Responding to Client

Outside of the reply method which we will go more into depth on in the Client section of this readme, we can also broadcast to all or some connected clients.

```typescript
const serverSpace = Spacely.listen<any>(4321);

setTimeout(() => {
    serverSpace.broadcast("server is shutting down!") // server is shutting down in 4 hours
}, 1000 * 60 * 60 * 4);

serverSpace.onMessage((from: Spacely.Client, message: any) => {
    from.reply('message received');
    // broadcast to all the connected users, except the one that actually sent the message, what that user wrote
    serverSpace.broadcast(`A user wrote ${message}`, [from]);
});
```

### Clients

Connected clients will only receive messages from the Spaces they are connected to.

---

#### UUID

When a client joins the server they will get assigned a unique id.  This id will be the same regardless of what space they are on.  However if the client disconnected from the server and rejoins, a new id will be generated.

```typescript
...
lobbySpace.onMessage((from: Spacely.Client, message: any) => {
    const lobbyState = lobbySpace.getState();
    if (message.type === "chat" ) {
        const id = from.getUID();
        lobbyState[id].messages.push(message.payload);
    }
});
gameSpace.onMessage((from: Spacely.Client, message: any) => {
    const gameState = lobbySpace.getState();
    if (message.type === "move" ) {
        const id = from.getUID();
        gameState[id].pos = message.newPosition;
    }
});
```

---

#### Replying

We can send a message directly to a client by using the reply method.  Internally all communication is actually handled by this reply method.

```typescript
luckyNumber = ...;
gameSpace.onMessage((from: Spacely.Client, message: any) => {
    if (message === luckyNumber) {
        from.reply("you got it!");
    } else {
        from.reply("try again");
    }
});
```

---

### Disconnecting

```typescript
mainSpace.onMessage((from: Spacely.Client, message: any) => {
    if (message === "exit-server") {
        // Removes from ALL spaces and terminates their websocket connection (onLeave gets called for all the Spaces they were in)
        from.disconnect();
    }
});

gameSpace.onMessage((from: Spacely.Client, message: any) => {
    if (message === "leave-game") {
        // Removes client from gameSpace, their websocket connection is still active on the server (onLeave gets called for gameSpace)
        gameSpace.removeClient(from);
    }
});

gameSpace.onLeave((from: Spacely.Client) => {
    gameSpace.broadcast(`${from.getUID()} has left`);
});
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

[MIT](https://choosealicense.com/licenses/mit/)
