export interface Config {
	calculatePing?: boolean;
	autoDisconnect?: boolean;
	messageDecoder?: (message: string) => any;
	messageEncoder?: (encodedMessage: any) => string;
	options?: {
		pingInterval?: number;
		disconnectTime?: number;
	};
}

export const defaultConfig: Config = {
	calculatePing: false,
	autoDisconnect: false,
	messageDecoder: (message: string) => JSON.parse(message) as Record<string, unknown>,
	messageEncoder: (encodedMessage: string) => JSON.stringify(encodedMessage),
	options: {
		pingInterval: 3000, // request a new ping every 3 seconds
		disconnectTime: 15000, // 15 seconds
	},
};
