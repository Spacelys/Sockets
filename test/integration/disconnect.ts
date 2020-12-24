import WebSocket from 'ws'
import {listen, Client} from '../../src';

const setupServer = () => {
	const mainSpace = listen<any>(8088, () => ({}), { calculatePing: true, autoDisconnect: true });
	mainSpace.onJoin((from: Client) => {
		console.log("[Server] Client Joined", from.getUID());
	});

	mainSpace.onMessage((from: Client, message: string) => {
		const packet = JSON.parse(message);
		if (packet.type === 'message') {
			console.log('[Server]', from.getUID(), packet);
			mainSpace.broadcast(message, [from]);
		} else {
			// console.log('[Server]', from.getUID(), packet);
		}
	});
}

setupServer();

const socketClient = (name: string | number) => {
	const connection = new Promise((resolve: (packet: any) => void) => {
		const send = (packet: any) => {
			const message = JSON.stringify(packet);
			ws.send(message);
		};
		const ws = new WebSocket('ws://localhost:8088', {
			perMessageDeflate: false
		});
		
		ws.on('open', () => {
			resolve(send);
		});
	
		ws.on('message', (data: WebSocket.Data) => {
			const packet = JSON.parse(<string>data);
			// console.log(packet);
			if (packet.type === 'PING') {
				if (name != 3) {
					send({type: 'PONG'});
				}
			}
		});
	});

	return connection;
};

socketClient(1).then((send) => {
	setInterval(() => {
		send({type: 'message', payload: 'hello1'});
	}, 5000);
});
socketClient(2).then((send) => {
	setInterval(() => {
		send({type: 'message', payload: 'hello2'});
	}, 5000);
});
socketClient(3).then((send) => {
	setInterval(() => {
		send({type: 'message', payload: 'hello3'});
	}, 20000);
});