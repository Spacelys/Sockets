import * as WebSocket from "ws";
import {v4 as uuid } from 'uuid';
import { IncomingMessage } from "http";
import { Space } from "./space";

export const listen = (port: number, config?: { calculatePing: boolean }) => {
    const wss = new WebSocket.Server({ port });

    const spaces: Array<Space<any>> = [];
    const userSpaces: { [key: string]: Array<Space<any>> } = {};
    const clients: Array<WebSocket> = [];
    const clientAndIds: { 
        [key: string]: {
            ws: WebSocket,
            ping?: number,
            pingTimeStamp?: number,
            disconnectTimer?: NodeJS.Timeout
        }
    } = {};
    const messageHandlers: Array<(packet: any, reply: (data: any) => void) => void> = [];
    
    const calculatePing = (uid: string) => {
        const associatedClient = clientAndIds[uid];
        const {ws} = associatedClient;
        // clear out the old disconnectTimer if it exist
        if (associatedClient.disconnectTimer) {
            clearTimeout(associatedClient.disconnectTimer);
        }

        // wait 1 second before sending out the ping request, this prevents us from sending one immediately after every response to the ping request
        setTimeout(() => {
            associatedClient.disconnectTimer = setTimeout(() => {
                const spaces = userSpaces[uid];
                spaces.forEach(space => {
                    space.removeClient({uid, ws, reply: message([ws])});
                });
            }, 3000); // disconnect the user if they haven't sent us a pong response after 3 seconds
    
            associatedClient.pingTimeStamp = new Date().getTime();
            message([associatedClient.ws])({
                type: "PING",
                payload: {
                    yourId: uid
                }
            });
        }, 1000);
    };

    const addClient = (socket: WebSocket, uid: string) => {
        const client: {ws: WebSocket, ping?: number, pingTimeStamp?: number, disconnectTimer?: NodeJS.Timeout} = {ws: socket};

        clientAndIds[uid] = client;
        clients.push(socket);
        if (config.calculatePing) {
            client.ping = 0;
            calculatePing(uid);
        }

        return client;
    };

    const removeClient = (socket: WebSocket, uid: string) => {
        // remove the edge that connects the client id with its websocket connection
        delete clientAndIds[uid];

        // remove the edges that connect the client id to the spaces its in
        delete userSpaces[uid];

        // remove reference to the actual socket as well
        const socketAt = clients.indexOf(socket);
        if (socketAt >= 0) {
            clients.splice(socketAt, 1);
        }
    };

    const addClientToSpace = <Type>(uid: string, space: Space<Type>, config?: any) => {
        const associatedSocket = clientAndIds[uid].ws;
        // add the space to the list of spaces that user is in via the userSpace look up hash
        if (userSpaces[uid]) {
            userSpaces[uid].push(space);
        } else {
            userSpaces[uid] = [space];
        }

        space.addConnection(associatedSocket);
        const from = {uid: uid, ws: associatedSocket, reply: message([associatedSocket])};
        space.joinHandler(from, config);
    };

    const removeClientFromSpace = <Type>(uid: string, space: Space<Type>) => {
        const associatedSocket = clientAndIds[uid].ws;

        const clientSpaces = userSpaces[uid];
        if (clientSpaces) {
            const spaceIndex = clientSpaces.indexOf(space);
            if (spaceIndex >= 0) {
                clientSpaces.splice(spaceIndex, 1);
            }
        }

        space.removeConnection(associatedSocket);
    };

    const message = (to: Array<WebSocket>) => {
        return (packet: any) => {
            to.forEach((ws: WebSocket) => {
                ws.send(JSON.stringify(packet));
            });
        };
    };

    wss.on(`connection`, (ws: WebSocket, req: IncomingMessage) => {
        const uid = uuid();
        const client = addClient(ws, uid);
        const from = {uid: uid, ws: ws, reply: message([ws])};

        ws.on(`message`, (message: string) => {
            let packet: any;
            const mySpaces = userSpaces[uid];
            try {
                packet = JSON.parse(message);
                if (config.calculatePing) {
                    const timeNow = new Date().getTime();
                    if (packet.type === "PONG") {
                        const ping = timeNow - client.pingTimeStamp;
                        client.ping = ping;
                        from.reply({
                            type: "YOURPING",
                            payload: ping
                        });
                        calculatePing(uid);
                    }
                }

                messageHandlers.forEach(messageHandler => {
                    messageHandler(from, packet);
                });

                if (mySpaces) {
                    mySpaces.forEach((space: Space<any>) => {
                        space.messageHandler(from, packet);
                    });
                }
            } catch (error) {
                console.log(error);
            }
        });
    });

    const self = this;

    return {
        broadcast: (packet: any) => {
            message(clients)(packet);
        },
        removeClient: removeClient,
        createSpace: function createSpace<Type>(name: string, factoryMethod: () => Type) : Space<Type> {
            const initialSpaceData = factoryMethod();
            const space = new Space<Type>(name, self, {
                    addClientToSpace,
                    removeClientFromSpace
                },
                initialSpaceData
            );
            spaces.push(space);
            return space;
        },
        removeSpace: <Type>(space: Space<Type>) => {
            const index = spaces.indexOf(space);

            if (index >= 0) {
                spaces.splice(index, 1);
            }
        },
        onMessage: (callback: (from: {uid: string, ws: WebSocket, reply: (data:any) => void}, packet: any) => void) => {
            messageHandlers.push(callback);
        },
    }
};
