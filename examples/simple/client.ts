import WebSocket from "ws";

export const client : (name: string) => any = (name: string) => {
    const connect: (address: string) => void = (address: string) => {
        const ws = new WebSocket(address);
        const messagesRecieved: Array<any> = [];
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                reject("timeout");
            }, 2000); // if we can't connect in 2 second lets just call reject

            ws.on("open", () => {
                const operations = {
                    send: (packet: any) => {
                        ws.send(JSON.stringify(packet));
                    },
                    getMessages: () => {
                        return messagesRecieved;
                    }
                };
                resolve(operations);
            });

            ws.on("message", (data: string) => {
                messagesRecieved.push(data);
            });
        });
    };

    return {
        connect
    };
};