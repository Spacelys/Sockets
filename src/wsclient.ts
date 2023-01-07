import WebSocket from 'isomorphic-ws';

/**
 * This client setups up some of the fancier functionality for you
 */
export class WsClient {
	protected ws: WebSocket;
	protected messageListener: (message: any) => void;

	public constructor() {
		this.ws = undefined;
		this.messageListener = undefined;
	}

	public isConnected(): boolean {
		return this.ws !== undefined;
	}

	public send(data: any): void {
		if (this.ws) {
			this.ws.send(JSON.stringify(data));
		}
	}

	public disconnect(): void {
		if (this.ws) {
			this.ws.close();
		}
	}
	public onMessage(cb: (message: any) => void): void {
		this.messageListener = cb;
	}

	public async connect(address: string): Promise<string> {
		this.ws = new WebSocket(address);
		return new Promise((resolve, reject) => {
			const timeoutInterval = setTimeout(() => {
				reject('Unable to connect to ' + address + ': Timeout 5s');
			}, 5000);

			this.ws.on('open', () => {
				clearTimeout(timeoutInterval);
				resolve('connected to ' + address);
			});

			this.ws.on('message', (data: WebSocket.Data) => {
				try {
					const packet: Record<string, any> = JSON.parse(data as string) as Record<string, any>;
					if (packet.type === 'PING') {
						this.send({type: 'PONG'});
					}
					if (this.messageListener) {
						this.messageListener(packet);
					}
				} catch (error) {
					// @TODO should use a logger
					console.log('Spacelys/Socket: received malformed data');
				}
			});
		});
	}
}
