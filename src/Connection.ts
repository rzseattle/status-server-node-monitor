import WebSocket from "ws";
import { nanoid } from "nanoid";

export class Connection {
    private connection!: WebSocket;
    private readonly url: string;
    constructor(url: string) {
        this.url = url;
    }

    public connect = async () => {
        return new Promise((resolve, reject) => {
            this.connection = new WebSocket(this.url);
            this.connection.on("open", () => {
                console.log("connection is opened");
                resolve();
            });

            this.connection.on("error", () => {
                console.log("connection error");
                reject();
            });

            this.connection.on("message", (e: WebSocket.MessageEvent) => {
                console.log("message: " + e.data);
            });
        });
    };

    public send(message: any) {
        this.connection.send(JSON.stringify(message));
    }
}
