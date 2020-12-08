import NodeWS from "ws";
import { nanoid } from "nanoid";
import { Monitor, MonitorOverwrite } from "./Monitor";
import { IJobData } from "./Job";

interface IPendingRequest {
    elementType: "monitor" | "job";
    monitorId: string | null;
    controlKey1: string;
    controlKey2: string;
    time: number;
    resolve: (result: any) => any;
}

export class Connection {
    private connection!: NodeWS;
    private browserConnection!: WebSocket;

    private readonly url: string;

    private reconnectTimeout: number = -1;

    private idRequestsPending: IPendingRequest[] = [];
    private onReconnectCallback: (() => any) | null = null;

    constructor(url: string) {
        this.url = url;
    }

    onReconnect = (callback: () => any) => {
        this.onReconnectCallback = callback;
    };

    public connect = async () => {
        if (typeof window === "undefined") {
            return this.connectInNode();
        } else {
            return this.connectInBrowser();
        }
    };

    public send = (message: any) => {
        try {
            const str = JSON.stringify(message);

            if (typeof window === "undefined") {
                this.connection.send(str);
            } else {
                this.browserConnection.send(JSON.stringify(str));
            }
        } catch (er) {
            console.error("---------------------------------");
            console.error("Can't send message");
            console.log(message);
            console.trace();
            console.error("---------------------------------");
        }
    };

    public requestId = async (
        type: "monitor" | "job",
        monitor: Monitor | null = null,
        job: IJobData | null = null,
    ): Promise<string> => {
        let monitorId: string | null = null;
        if (monitor && type === "job") {
            monitorId = await monitor.getId();
        }
        return new Promise((resolve) => {
            const request = {
                elementType: type,
                monitorId,
                controlKey1: nanoid(),
                controlKey2: nanoid(),
                time: new Date().getMilliseconds(),
                resolve,
            };
            this.idRequestsPending.push(request);
            this.send({
                type: "id-request",
                overwriteStrategy: monitor?.overwriteStrategy || MonitorOverwrite.CreateNew,
                monitorLabels: monitor?.labels,
                jobLabels: job?.labels || [],
                elementType: request.elementType,
                monitorId: request.monitorId,
                controlKey1: request.controlKey1,
                controlKey2: request.controlKey2,
                time: request.time,
                data: {
                    monitor: {
                        title: monitor?.title || "",
                        description: monitor?.description || "",
                    },
                    job,
                },
            });
        });
    };

    private onMessage = (input: string) => {
        try {
            const data = JSON.parse(input);

            if (data.type !== undefined && data.type === "id-response") {
                const index = this.idRequestsPending.findIndex((el) => {
                    if (
                        el.controlKey1 === data.controlKey1 &&
                        el.controlKey2 === data.controlKey2 &&
                        el.time === data.time &&
                        el.elementType === data.elementType
                    ) {
                        return true;
                    }
                    return false;
                });
                if (index !== -1) {
                    console.log("Znalazłem i wykonuje");
                    this.idRequestsPending[index].resolve(data.id);
                    this.idRequestsPending.splice(index, 1);
                } else {
                    console.error({
                        msg: "Not found data to connect key",
                    });
                }
            }
        } catch (ex) {
            console.log("Unexpected message: " + input);
            console.log(ex);
        }
    };

    private connectInNode = async () => {
        return new Promise((resolve, reject) => {
            this.connection = new NodeWS(this.url);
            this.connection.on("open", () => {
                console.log("connection is opened");
                if (this.onReconnectCallback !== null) {
                    this.onReconnectCallback();
                }
                clearTimeout(this.reconnectTimeout);
                resolve(null);
            });

            this.connection.on("error", () => {
                console.log("Status server connection error");
            });

            this.connection.on("message", (messageEvent: NodeWS.MessageEvent) => {
                // @ts-ignore
                this.onMessage(messageEvent as string);
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
    private connectInBrowser = async () => {
        return new Promise((resolve, reject) => {
            this.browserConnection = new window.WebSocket(this.url);
            this.browserConnection.addEventListener("open", () => {
                console.log("connection is opened");
                if (this.onReconnectCallback !== null) {
                    this.onReconnectCallback();
                }
                clearTimeout(this.reconnectTimeout);
                resolve(null);
            });

            this.browserConnection.addEventListener("error", () => {
                console.log("Status server connection error");
            });

            this.browserConnection.addEventListener("message", (e) => {
                this.onMessage(e.data);
            });

            this.browserConnection.addEventListener("close", () => {
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
}
