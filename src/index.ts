import { IncomingMessage } from 'http';
import {v4 as uuid } from 'uuid';
import * as WebSocket from 'ws';
import { Space } from './space';
import { Client } from './client';
import { Config, defaultConfig } from './config';
import * as events from './events';

export const listen = <T>(port: number, initState?: () => T, _config?: Config): Space<T> => {
	const config = {...defaultConfig, ..._config};
	const wss = new WebSocket.Server({ port });

	const createClient = (uid: string, ws: WebSocket) => {
		const client: Client = new Client(uid, ws);
		if (config.calculatePing) {
			events.sendPingRequest(client);
		}
		return client;
	};

	let iState = {} as T;
	if (initState) {
		iState = initState();
	}

	const mainSpace = new Space<T>(iState, { name: 'main', clients: [] });
	wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
		const uid = uuid();
		const from: Client = createClient(uid, ws);
		mainSpace.addClient(from);
		const builtInEventProcessor = events.handleBuiltInEvents(config, from);
		ws.on('message', (message: string) => {
			try {
				const packet = config.messageDecoder(message); // defaults to JSON.parse(message)
				builtInEventProcessor(packet);
				const spaces = from.getSpaces();
				spaces.forEach(space => space.handleMessage(from, packet));
			} catch (error) {
				console.error(error);
			}
		});
	});
	return mainSpace;
};

export { Config } from './config';
export { Client } from './client';
