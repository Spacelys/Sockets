import * as jsocket from "../../src";
import {client} from "./client";

const server = jsocket.listen(9091);
const lobbySpace = server.createSpace<any>("Lobby", () => ({}));
lobbySpace.onMessage((from: any, packet: any) => {
    if (packet.type === "LOBBY_MESSAGE") {
        lobbySpace.broadcast({type: "lobby-message", payload: packet.payload});
        console.log(`[LOBBY SPACE] ${from.uid}: ${packet.payload}`);
    }
});

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

// This represents what we would see on the client side
const InLobby = client("InLobby");
const NotInitiallyInLobby = client("NotInitiallyInLobby");
const NeverInLobby = client("NeverInLobby");
const LeavesLobby  = client("LeavesLobby");

InLobby.connect("ws://localhost:9091").then((ws:any) => {
    const dataToSend = [
        {type: "JOIN_LOBBY"},
        {type: "GENERAL_CHAT", payload: "InLobby: Hello General Chat"},
        {type: "LOBBY_MESSAGE", payload: "InLobby: Hi"}
    ];
    let messageIndex = 0;
    let interval = setInterval(() => {
        if (dataToSend[messageIndex]) {
            ws.send(dataToSend[messageIndex]);
            messageIndex++;
        } else {
            clearTimeout(interval);
        }
    }, 1000);

    setTimeout(() => {
        const messages = ws.getMessages();
        console.log(``);
        console.log(`************* User [InLobby] Messages ***************`);
        messages.forEach((msg: string) => {
            const json = JSON.parse(msg);
            if (json.type === "general-message") {
                console.log(`[GENERAL] ${json.payload}`);
            } else {
                console.log(`[LOBBY] ${json.payload}`);
            }
        });
    }, 8000);
});

NotInitiallyInLobby.connect("ws://localhost:9091").then((ws: any) => {
    const dataToSend = [
        {type: "GENERAL_CHAT", payload: "NotInitiallyInLobby: Hello General Chat"},
        {type: "LOBBY_MESSAGE", payload: "NotInitiallyInLobby: No one should see this"},
        {type: "JOIN_LOBBY"},
        {type: "LOBBY_MESSAGE", payload: "NotInitiallyInLobby: Hello"},
        {type: "LOBBY_MESSAGE", payload: "NotInitiallyInLobby: Did LeavesLobby Leave?"}
    ];
    let messageIndex = 0;
    let interval = setInterval(() => {
        if (dataToSend[messageIndex]) {
            ws.send(dataToSend[messageIndex]);
            messageIndex++;
        } else {
            clearTimeout(interval);
        }
    }, 1000);

    setTimeout(() => {
        const messages = ws.getMessages();
        console.log(``);
        console.log(`************* User [NotInitiallyInLobby] Messages ***************`);
        messages.forEach((msg: string) => {
            const json = JSON.parse(msg);
            if (json.type === "general-message") {
                console.log(`[GENERAL] ${json.payload}`);
            } else {
                console.log(`[LOBBY] ${json.payload}`);
            }
        });
    }, 8000);
});

// change these to async and awaits
NeverInLobby.connect("ws://localhost:9091").then((ws: any) => {
    const dataToSend = [
        {type: "GENERAL_CHAT", payload: "NeverInLobby: Hello General Chat"},
        {type: "LOBBY_MESSAGE", payload: "NeverInLobby: No one should see this"},
        {type: "LOBBY_MESSAGE", payload: "NeverInLobby: No one should see this either..."}
    ];
    let messageIndex = 0;
    let interval = setInterval(() => {
        if (dataToSend[messageIndex]) {
            ws.send(dataToSend[messageIndex]);
            messageIndex++;
        } else {
            clearTimeout(interval);
        }
    }, 1000);

    setTimeout(() => {
        const messages = ws.getMessages();
        console.log(``);
        console.log(`************* User [NeverInLobby] Messages ***************`);
        messages.forEach((msg: string) => {
            const json = JSON.parse(msg);
            if (json.type === "general-message") {
                console.log(`[GENERAL] ${json.payload}`);
            } else {
                console.log(`[LOBBY] ${json.payload}`);
            }
        });
    }, 8000);
});

LeavesLobby.connect("ws://localhost:9091").then((ws: any) => {
    const dataToSend = [
        {type: "JOIN_LOBBY", payload: "LeavesLobby: Hello General Chat"},
        {type: "LOBBY_MESSAGE", payload: "LeavesLobby: You should see this"},
        {type: "LEAVE_LOBBY", payload: "LeavesLobby: Hello General Chat"},
        {type: "LOBBY_MESSAGE", payload: "LeavesLobby: Nobody should see this..."}
    ];
    let messageIndex = 0;
    let interval = setInterval(() => {
        if (dataToSend[messageIndex]) {
            ws.send(dataToSend[messageIndex]);
            messageIndex++;
        } else {
            clearTimeout(interval);
        }
    }, 1000);

    setTimeout(() => {
        const messages = ws.getMessages();
        console.log(``);
        console.log(`************* User [LeavesLobby] Messages ***************`);
        messages.forEach((msg: string) => {
            const json = JSON.parse(msg);
            if (json.type === "general-message") {
                console.log(`[GENERAL] ${json.payload}`);
            } else {
                console.log(`[LOBBY] ${json.payload}`);
            }
        });
    }, 8000);
});

    //stevendikowitz@fb.com 