import { Client } from './client';
import { Config } from './config';

const getAndSetLatestPing = (to: Client) => {
	const timeNow = new Date().getTime();
	const ping = timeNow - to.meta.lastPingTimeStamp;
	to.meta.ping = ping;
	return ping;
};

export const sendPingRequest = (to: Client): void => {
	to.meta.lastPingTimeStamp = new Date().getTime();
	to.reply(JSON.stringify({ type: 'PING', payload: to.meta.ping}));
};

export const startDisconnectTimer = (forClient: Client, disconnectTime: number): void => {
	// only one disconnect timer should be going on at any given time
	if (forClient.meta.disconnectTimer) {
		clearTimeout(forClient.meta.disconnectTimer);
	}

	forClient.meta.disconnectTimer = setTimeout(() => {
		forClient.disconnect();
	}, disconnectTime);
};

type MessageProcessor = (message: Record<string, unknown>) => void;
export const handleBuiltInEvents = (config: Config, client: Client): MessageProcessor => {
	const clearDisconnectTimer = () => {
		if (client.meta.disconnectTimer) {
			clearTimeout(client.meta.disconnectTimer);
		}
	};

	const livelinessCheck = () => {
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

	const setupEvents = () => {
		// wait ${pingInterval}ms before sending out the ping request, this prevents us from sending
		// one immediately after every response to the ping request
		livelinessCheck();
	};

	const processEvents: MessageProcessor = (message: Record<string, unknown>) => {
		// anytime we get a message from the user we clear the disconnect timer since they are obviously still active
		clearDisconnectTimer();
		if (config.calculatePing) {
			if (message.type === 'PONG') {
				getAndSetLatestPing(client);
				livelinessCheck();
			}
		}
	};

	setupEvents();
	return processEvents;
};
