import * as spacelys from "../../src";

// server side
console.log('starting up server');
const server = spacelys.listen(9091, undefined, {
	calculatePing: true,
	autoDisconnect: true,
	options: {
		disconnectTime: 6000, //disconnect after 6s of no messages
		pingInterval: 2000, // ping every 2s
	}
});
const lobbySpace = server.createSpace<any>("Lobby", () => ({}));
lobbySpace.onMessage((from: any, packet: any) => {
    if (packet.type === "LOBBY_MESSAGE") {
        lobbySpace.broadcast({type: "lobby-message", payload: packet.payload});
        console.log(`[LOBBY SPACE] ${from.uid}: ${packet.payload}`);
    }
});

server.onJoin((from: spacelys.Client) => {
	console.log("[Server] client joined");
	from.reply(JSON.stringify("Howdy"));
})

server.onLeave((from: spacelys.Client) => {
	console.log("[Server] client left");
})
server.onMessage(
    (from: any, packet: any) => {
        if (packet.type === "GENERAL_CHAT") {
            server.broadcast({type: "general-message", payload: packet.payload});
            console.log(`[SERVER SPACE] ${from.uid}: ${packet.payload}`);
        } else if (packet.type === "JOIN_LOBBY") {
            lobbySpace.addClient(from.uid);
            console.log(`[SERVER SPACE] adding ${from.uid} to [LOBBY SPACE]`);
        } else if (packet.type === "LEAVE_LOBBY") {
            lobbySpace.removeClient(from.uid);
        }
    }
);

// client side
const client = new spacelys.WsClient();
client.onMessage((message: any) => {
	// console.log("[Client]", message);

	if (message.type === "YOURPING") {
		console.log('[Client] my ping is', message.payload);
	}
})
client.connect('ws://localhost:9091');
setTimeout(() => {
	client.disconnect();
}, 5000);
