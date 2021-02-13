import * as WebSocket from 'ws';
import {Space} from './space';

export class Client {
	public meta: {
		ping: number;
		lastPingTimeStamp: number;
		disconnectTimer: NodeJS.Timeout;
	};
	private uid: string;
	private ws: WebSocket;
	private spaces: Array<Space<any>>;

	public constructor(uid: string, ws: WebSocket) {
		this.uid = uid;
		this.ws = ws;
		this.spaces = [];
		this.meta = { ping: 0, lastPingTimeStamp: 0, disconnectTimer: null };
	}

	/**
	 * Send packet of data to the client
	 *
	 * @param {string} encodedPacket
	 * @memberof Client
	 */
	public reply(encodedPacket: string): void {
		this.ws.send(encodedPacket);
	}

	/**
	 * Add user to the space supplied
	 *
	 * @template Type
	 * @param {Space<Type>} space
	 * @memberof Client
	 */
	public addToSpace<Type>(space: Space<Type>): void {
		this.spaces.push(space);
	}

	/**
	 * Get array of all spaces that the client is connected to
	 *
	 * @returns {Array<Space<any>>}
	 * @memberof Client
	 */
	public getSpaces(): Array<Space<any>> {
		return this.spaces;
	}

	/**
	 * Get the UID assigned to the user when they connected to our server
	 *
	 * @returns {string}
	 * @memberof Client
	 */
	public getUID(): string {
		return this.uid;
	}

	/**
	 * disconnect the client from all their associated spaces, and then
	 * terminate the websocket connection between the server.
	 *
	 * @memberof Client
	 */
	public disconnect(): void {
		this.spaces.forEach((space) => {
			space.removeClient(this);
		});
		this.ws.terminate();
	}
}
