import {Client} from '../../src/client';
import {Space} from '../../src/space';
import * as WebSocket from "ws";

jest.mock('../../src/client', () => ({
	Client: (uid: string) => ({
		getUID: jest.fn().mockName('mockGetUID').mockReturnValue(uid),
		reply: jest.fn().mockName('mockReply'),
		addToSpace: jest.fn().mockName('mockAddToSpace')
	})
}));


describe('Space', () => {
	let client1: Client, client2: Client, client3: Client, space: Space<any>;
	beforeEach(() => {
		client1 = new Client('1234', {} as unknown as WebSocket);
		client2 = new Client('2345', {} as unknown as WebSocket);
		client3 = new Client('3456', {} as unknown as WebSocket);
		space = new Space<any>({}, {
			clients: [],
			name: 'testSpace'
		});
		space.addClient(client1);
		space.addClient(client2);
		space.addClient(client3);
		jest.clearAllMocks();
	});

	describe('instance', () => {
		it('should create a copy of the space with the current state and its new name', () => {
			const myState = { floop: 'glorp' };
			space.setState(myState);
			const instance = space.instance('testSpace2');
			expect(JSON.stringify(instance.getState())).toEqual(JSON.stringify(space.getState()));
			expect(instance.getName()).toEqual('testSpace2');
		});
	});

	describe('handleMessage', () => {
		const messageHandler = jest.fn().mockName('mockMessageHandler');
		beforeEach(() => {
			space.onMessage(messageHandler);
		});

		it('should call messageHandler when receiving a message', () => {
			const message = { type: 'test', payload: 123 };
			space.handleMessage(client1, message);
			expect(messageHandler).toHaveBeenCalledWith(client1, message);
		});

		it('should not call messageHandler if onMessage was never set', () => {
			space.onMessage(null);
			const message = { type: 'test', payload: 123 };
			space.handleMessage(client1, message);
			expect(messageHandler).not.toHaveBeenCalled();
		});
	});

	describe('(get|remove|add)Client(s)', () => {
		const joinHandler = jest.fn().mockName('mockJoinHandler');
		const leaveHandler = jest.fn().mockName('mockLeaveHandler');
		const newClient = new Client('9876', {} as unknown as WebSocket);
		beforeEach(() => {
			space.onJoin(joinHandler);
			space.onLeave(leaveHandler);
		});

		it('addClient should add client to space and call join handler', () => {
			space.addClient(newClient);
			expect(joinHandler).toHaveBeenCalled();
			expect(space.getClients().includes(newClient)).toEqual(true);
		});

		it('addClient should handle elegantly adding the same client twice', () => {
			space.addClient(newClient);
			space.addClient(newClient);
			expect(joinHandler).toHaveBeenCalledTimes(1);
			expect(space.getClients().includes(newClient)).toEqual(true);
		});

		it('removeClient should remove client and call leave Handler', () => {
			space.removeClient(client3);
			expect(leaveHandler).toHaveBeenCalled();
			expect(space.getClients().includes(client3)).toEqual(false);
		});

		it('leaveHandler should not be called if onLeave was never set', () => {
			space.onLeave(null);
			space.removeClient(client3);
			expect(leaveHandler).not.toHaveBeenCalled();
		});

		it('removeClient shouldnt do anything if client isnt in the space', () => {
			space.removeClient(newClient);
			expect(leaveHandler).not.toHaveBeenCalled();
		});

		it('getClients should return array of all clients', () => {
			expect(space.getClients()).toEqual([client1, client2, client3]);
		});
	});
	
	describe('(get|set)State', () => {
		it('should return the current state of the space', () => {
			const myState = { floop: 'fleep' };
			space.setState(myState);
			expect(space.getState()).toEqual(myState);
		});
	});
	
	describe('getName', () => {
		it('should return the name set to the space when created', () => {
			expect(space.getName()).toEqual('testSpace');
		});
	});

	describe('broadcast', () => {
		it('should reply to all connected clients', () => {
			const message = 'message';
			space.broadcast(message);
			expect(client1.reply).toHaveBeenCalledWith(`"${message}"`);
			expect(client2.reply).toHaveBeenCalledWith(`"${message}"`);
			expect(client3.reply).toHaveBeenCalledWith(`"${message}"`);
		});

		it('should reply to all connected clients minus ones in exclude list', () => {
			const message = 'message';
			space.broadcast(message, [client3]);
			expect(client1.reply).toHaveBeenCalledWith(`"${message}"`);
			expect(client2.reply).toHaveBeenCalledWith(`"${message}"`);
			expect(client3.reply).not.toHaveBeenCalled();
		});
	});
});
