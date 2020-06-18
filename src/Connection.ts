import WebSocket from "ws";
import { nanoid } from "nanoid";

export class Connection {
    private connection!: WebSocket;
    private readonly url: string;

    private reconnectTimeout: number = -1;

    constructor(url: string) {
        this.url = url;
    }

    public connect = async () => {
        return new Promise((resolve, reject) => {
            this.connection = new WebSocket(this.url);
            this.connection.on("open", () => {
                console.log("connection is opened");
                clearTimeout(this.reconnectTimeout);
                resolve();
            });

            this.connection.on("error", () => {
                console.log("Status server connection error");
            });

            this.connection.on("message", (e: WebSocket.MessageEvent) => {
                console.log("message: " + e.data);
            });

            this.connection.on("close", () => {
                console.log("--------------------");
                console.log("Status server connection is closed");
                console.log("Trying to open in 5 s");
                console.log("--------------------");

                // @ts-ignore
                this.reconnectTimeout = setTimeout(() => {
                    this.connect();
                }, 5000);
            });
        });
    };

    public send(message: any) {
        this.connection.send(JSON.stringify(message));
    }
}
