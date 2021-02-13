import { Client } from './client';
import { Config } from './config';

export const sendPingRequest = (to: Client): void => {
	to.meta.lastPingTimeStamp = new Date().getTime();
	to.reply(JSON.stringify({ type: 'PING', payload: { yourId: to.getUID() }}));
};

export const startDisconnectTimer = (forClient: Client, disconnectTime: number): void => {
	forClient.meta.disconnectTimer = setTimeout(() => {
		forClient.disconnect();
	}, disconnectTime);
};

const respondWithLatestPing = (to: Client) => {
	const timeNow = new Date().getTime();
	const ping = timeNow - to.meta.lastPingTimeStamp;
	to.meta.ping = ping;
	to.reply(JSON.stringify({ type: 'YOURPING', payload: ping }));
};

type MessageProcessor = (message: Record<string, unknown>) => void;
export const handleBuiltInEvents = (config: Config, client: Client): MessageProcessor => {
	const clearDisconnectTimer = () => {
		if (client.meta.disconnectTimer) {
			clearTimeout(client.meta.disconnectTimer);
		}
	};

	const setupEvents = () => {
		clearDisconnectTimer();

		// wait ${pingInterval}ms before sending out the ping request, this prevents us from sending
		// one immediately after every response to the ping request
		setTimeout(() => {
			// disconnect the client after ${disconnectTime}ms has passed
			if (config.autoDisconnect) {
				startDisconnectTimer(client, config.options.disconnectTime);
			}
			if (config.calculatePing) {
				sendPingRequest(client);
			}
		}, config.options.pingInterval);
	};

	const processEvents: MessageProcessor = (message: Record<string, unknown>) => {
		// anytime we get a message from the user we clear the disconnect timer since they are obviously still active
		clearDisconnectTimer();
		if (config.calculatePing) {
			if (message.type === 'PONG') {
				respondWithLatestPing(client);
				setTimeout(() => sendPingRequest(client), config.options.pingInterval);
			}
		}
	};

	setupEvents();
	return processEvents;
};
