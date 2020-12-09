import { IJobData, Job } from "./Job";
import { IJobMessage } from "./common-interface/IMessage";
import { throttle } from "./lib/throttle";
import { Connection } from "./Connection";

export enum MonitorOverwrite {
    CreateNew = "new",
    Join = "join",
    Replace = "replace",
}

const throttleTimeout = 30;

interface IMonitorOptions {
    title?: string;
    description?: string;
    labels?: string[];
    authKey?: string;
    overwriteStrategy?: MonitorOverwrite;
    logRotation?: number;
    lifeTime?: number;
    throttle?: number;
}

export const monitorWithThrottle = (connection: Connection, options: IMonitorOptions, newThrottleTimeout: number) => {
    // tslint:disable-next-line:no-shadowed-variable
    const throttleTimeout = newThrottleTimeout;
    return new Monitor(connection, options);
};

export class Monitor {
    private connection: Connection;
    private id: string | null = null;
    public readonly description: string;
    public readonly title: string;
    public readonly authKey: string;
    public readonly lifeTime: number;
    public readonly logRotation: number;
    public labels: string[] = [];
    private isMonitorDataSend: boolean = false;
    public readonly overwriteStrategy: MonitorOverwrite;
    private throttle: number;

    constructor(connection: Connection, options: IMonitorOptions) {
        this.connection = connection;
        this.description = options.description || "";
        this.title = options.title || "";
        this.labels = options.labels || [];
        this.authKey = options.authKey || "";
        this.logRotation = options.logRotation || 200;
        this.lifeTime = options.lifeTime || 3600;
        this.overwriteStrategy = options.overwriteStrategy || MonitorOverwrite.CreateNew;
        this.throttle = options.throttle ?? 30;

        connection.requestId("monitor", this).then((id) => {
            this.id = id as string;
        });

        connection.onReconnect(() => {
            this.isMonitorDataSend = false;
        });
    }

    public async getId() {
        return new Promise<string>((resolve, reject) => {
            if (this.id !== null) {
                resolve(this.id);
            } else {
                let interval: number = 0;
                let counter: number = 0;
                // @ts-ignore
                interval = setInterval(() => {
                    if (this.id !== null) {
                        resolve(this.id);
                        clearInterval(interval);
                    }
                    counter++;
                    if (counter === 10) {
                        clearInterval(interval);
                        reject("Cannot get id");
                    }
                }, 10);
            }
        });
    }

    public async createJob(data: IJobData): Promise<Job> {
        // waiting for monitor id
        await this.getId();
        const jobId = await this.connection.requestId("job", this, data);
        return new Job(
            {
                id: jobId,
                ...data,
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
                error: boolean;
                done: boolean;
                data: any;
            },
            onSend: () => {},
        ) => {
            const message: IJobMessage = { type: "job", jobId, monitorId: this.id as string, ...data };
            if (!this.isMonitorDataSend) {
                message.monitorData = {
                    description: this.description,
                    labels: this.labels,
                    title: this.title,
                    overwriteStrategy: this.overwriteStrategy,
                    authKey: this.authKey,
                    lifeTime: this.lifeTime,
                    logRotation: this.logRotation,
                };
                this.isMonitorDataSend = true;
            }
            this.connection.send(message);
            onSend();
        },
        throttleTimeout,
    );

    public requestAction = async (subjectType: "monitor" | "job", subjectId: string, action: "cleanup" | "remove") => {
        const message = {
            type: "action",
            monitorId: await this.getId(),
            subjectType,
            subjectId,
            action,
        };

        this.connection.send(message);
    };

    public cleanup = async () => {
        this.requestAction("monitor", await this.getId(), "cleanup");
    };

    public remove = async () => {
        this.requestAction("monitor", await this.getId(), "remove");
    };
}
