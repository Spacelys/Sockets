import * as WebSocket from "ws";

export class Space<Type> {
    name: string;
    state: Type;
    server: any;
    connected: Array<WebSocket>;
    parent: any;
    _messageHandler: any;
    _joinHandler: (from: any, config?: any) => any;
    _leaveHandler: (from: any, config?: any) => any;

    constructor(name: string, server: any, parent: any, initialState: any = {}) {
        this.name = name;
        this.state = initialState;
        this.server = server;
        this.parent = parent;
        this.connected = [];
    }

    // public
    getState() {
        return this.state;
    }

    // public
    broadcast(packet: any, exclude?: Array<WebSocket>) {
        this.connected.forEach((ws: WebSocket) => {
            const shouldSend = !exclude || !exclude.includes(ws);

            if (shouldSend) {
                ws.send(JSON.stringify(packet));
            }
        });
    }

    // private
    messageHandler(from: any, packet: any) {
        if (this._messageHandler) {
            this._messageHandler(from, packet);
        }
    }

    // private
    joinHandler(from: any, config?: any) { // @todo this is probably not needed, unnecessary abstraction
        if (this._joinHandler) {
            this._joinHandler(from, config);
        }
    }

    // public
    onMessage(callback : (from: any, packet: any) => any) {
        this._messageHandler = callback;
    }

    // public
    onJoin(callback: (from: any, config?: any) => any) {
        this._joinHandler = callback;
    }

    // public
    onLeave(callback: (from: any) => any) {
        this._leaveHandler = callback;
    }

    // public
    broadcasting(callback: () => any, updateInterval: number) {
        setInterval(callback, updateInterval);
    }

    // public
    addClient(uid: string, config?: any) {
        this.parent.addClientToSpace(uid, this, config);
    }

    // private
    addConnection(socket: WebSocket) {
        this.connected.push(socket);
    }

    // private
    removeConnection(socket: WebSocket) {
        const index = this.connected.indexOf(socket);
        if (index >= 0) {
            this.connected.splice(index, 1);
        }
    }

    // public @todo should this be private
    // removeClient(uid: string) {
    removeClient(from: {uid: string, ws: WebSocket, reply: (packet: any) => void}) {
        this.parent.removeClientFromSpace(from.uid, this);
        if (this._leaveHandler) {
            this._leaveHandler(from);
        }
    }

    // public
    instance(name: string) {
        const instance = new Space(name, this.server, this.parent);
        return instance;
    }
};
