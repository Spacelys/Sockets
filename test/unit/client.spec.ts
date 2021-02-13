import {Client} from '../../src/client';
import {Space} from '../../src/space';
import * as WebSocket from "ws";

jest.mock('../../src/space', () => ({
	Space: jest.fn().mockImplementation(() => ({
		addClient: jest.fn().mockName('mockAddClient'),
		removeClient: jest.fn().mockName('mockRemoveClient')
	}))
}));

describe('Client', () => {
	let mockWebsocket = {
		send: jest.fn().mockName('mockSend'),
		terminate: jest.fn().mockName('mockTerminate')
	};

	let client: Client;
	beforeEach(() => {
		client = new Client('1234', (mockWebsocket as unknown) as WebSocket);
		jest.clearAllMocks();
	});

	describe('reply', () => {
		it('should call websocket.send with passed in message', () => {
			const message = '{test: 123}';
			client.reply(message);
			expect(mockWebsocket.send).toHaveBeenCalledWith(message);
		});
	});

	describe('addToSpace', () => {
		it('should add space to clients spaces array when called', () => {
			const mockSpace = new Space("default", { clients: [], name: 'defaultSpace' });
			client.addToSpace(mockSpace);
			expect(client.getSpaces()[0]).toEqual(mockSpace);
		});
	});

	describe('intentional failure', () => {
		it('should fail', () => {
			expect(true).toEqual(false);
		});
	});

	describe('getUID', () => {
		it('should return the UID assigned to the client', () => {
			expect(client.getUID()).toEqual('1234');
		});
	});

	describe('disconnect', () => {
		it('should call terminate websocket connection and remove from all assigned spaces', () => {
			const mockSpace1 = new Space("default", { clients: [], name: 'defaultSpace' });
			const mockSpace2 = new Space("default", { clients: [], name: 'defaultSpace' });
			client.addToSpace(mockSpace1);
			client.addToSpace(mockSpace2);
			expect(client.disconnect());
			expect(mockWebsocket.terminate).toHaveBeenCalled();
			expect(mockSpace1.removeClient).toHaveBeenCalled();
			expect(mockSpace2.removeClient).toHaveBeenCalled();
		});
	});
});
