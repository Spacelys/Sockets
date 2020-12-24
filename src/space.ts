import { Client } from './client';

export class Space<Type> {
	private name: string;
	private state: Type;
	private clients: Array<Client>;

	private joinHandler: (from: Client) => void;
	private leaveHandler: (from: Client) => void;
	private messageHandler: (from: Client, message: any) => void;

	constructor(state: Type, args: {
		clients: Array<Client>,
		name: string,
	}) {
		const {clients, name} = args;
		this.state = state;
		this.name = name;
		this.clients = clients;

		this.messageHandler = null;
		this.joinHandler = null;
		this.leaveHandler = null;
	}

	createSpace<T>(name: string, initState: () => T): Space<T> {
		const space = new Space<T>(initState(), {
			clients: [],
			name
		});
		return space;
	}

	public addClient(client: Client) {
		this.clients.push(client);
		client.addToSpace(this);

		if (this.joinHandler) {
			this.joinHandler(client);
		}
	}

	public removeClient(client: Client) {
        const i = this.clients.indexOf(client);
        if(i !== -1) {
            this.clients.splice(i, 1);
			if (this.leaveHandler) {
				this.leaveHandler(client);
			}
		}
	}

	public instance(name: string): Space<Type> {
		return this.createSpace(
			name,
			() => JSON.parse(JSON.stringify(this.state)),
		);
	}

	public onJoin(joinHandler: (from: Client) => void) {
		this.joinHandler = joinHandler;
	}

	public onLeave(leaveHandler: (from: Client) => void) {
		this.leaveHandler = leaveHandler;
	}

	public onMessage(messageHandler: (from: Client, message: any) => void) {
		this.messageHandler = messageHandler;
	}

	public handleMessage(from: Client, message: any) {
		if (this.messageHandler) {
			this.messageHandler(from, message);
		}
	}
	/**
	 * Get all clients currently connected to the Space
	 *
	 * @returns
	 * @memberof Space
	 */
	public getClients() {
		return this.clients;
	}

	/**
	 * Get the state associated with the Space
	 * @returns
	 * @memberof Space
	 */
	public getState() {
		return this.state;
	}

	/**
	 * Set the state associated with the Space
	 * @returns State
	 * @memberof Space
	 */
	public setState(state: Type) {
		this.state = state;
		return state;
	}

	/**
	 * Get the name assigned to the space when it was createdf
	 * @returns {string}
	 * @memberof Space
	 */
	public getName(): string {
		return this.name;
	}

	/**
	 * Send a message to all clients connected to this space excluding any specified in the exclude array
	 * @param {any} message - Message to send to clients
	 * @param {Array<Client>} [exclude] - Array of clients to exclude in broadcasting message
	 * @memberof Space
	 */
	public broadcast(message: any, exclude?: Array<Client>) {
		let clientsToMessage = this.clients;
		if (exclude) {
			clientsToMessage = this.clients.filter(client => !exclude.includes(client));
		}

		const encodedMessage = JSON.stringify(message);
		clientsToMessage.forEach(client => {
			client.reply(encodedMessage);			
		});
	}
};
