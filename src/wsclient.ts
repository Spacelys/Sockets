import WebSocket from 'isomorphic-ws';

/**
 * This client setups up some of the fancier functionality for you
 */
export class WsClient {
	protected ws: WebSocket;
	protected messageListener: (message: any) => void;
	protected onConnectListener: () => void;

	public constructor() {
		this.ws = undefined;
		this.messageListener = undefined;
	}

	public isConnected(): boolean {
		return this.ws && this.ws.readyState !== WebSocket.CLOSED;
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
	public onConnect(cb: () => void): void {
		this.onConnectListener = cb;
	}

	public async connect(address: string): Promise<WsClient> {
		this.ws = new WebSocket(address);
		return new Promise((resolve, reject) => {
			const timeoutInterval = setTimeout(() => {
				reject('Unable to connect to ' + address + ': Timeout 5s');
			}, 5000);

			this.ws.onopen = () => {
				clearTimeout(timeoutInterval);
				if (this.onConnectListener) {
					this.onConnectListener();
				}
				resolve(this);
			};

			this.ws.onmessage = (data: WebSocket.MessageEvent) => {
				try {
					const packet: Record<string, any> = JSON.parse(data.data.toString()) as Record<string, any>;
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
			};
		});
	}
}
