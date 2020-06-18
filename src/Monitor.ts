import WebSocket, { OpenEvent } from "ws";
import { IJobInitData, Job } from "./Job";
import { nanoid } from "nanoid";
import { IJobMessage } from "./common-interface/IMessage";
import { throttle } from "./lib/throttle";
import { Connection } from "./Connection";

export class Monitor {
    private connection: Connection;
    private readonly id: string;
    private readonly description: string;
    private readonly title: string;
    private readonly name: string;
    private labels: string[] = [];
    private isMonitorDataSend: boolean = false;

    constructor(connection: Connection, name: string, title = "", description = "") {
        this.id = nanoid();
        this.connection = connection;
        this.name = name;
        this.description = description;
        this.title = title;
    }

    public addLabel = (label: string) => {
        this.labels.push(label);
        return this;
    };

    public createJob(name: string, title = "", description = ""): Job {
        return new Job(
            {
                id: nanoid(),
                name,
                title,
                description,
            },
            this,
        );
    }

    public requestUpdate = throttle(
        (
            jobId: string,
            data: {
                title: string;
                description: string;
                progress: { current: number; end: number };
                currentOperation: string;
                logsPart: string[];
                logsErrorPart: string[];
            },
            onSend: () => {},
        ) => {
            const message: IJobMessage = { type: "job", jobId, monitorId: this.id, ...data };
            if (!this.isMonitorDataSend) {
                message.monitorData = {
                    name: this.name,
                    description: this.description,
                    labels: this.labels,
                    title: this.title,
                };
                this.isMonitorDataSend = true;
            }
            console.log(message);
            this.connection.send(message);
            onSend();
        },
        30,
    );
}
