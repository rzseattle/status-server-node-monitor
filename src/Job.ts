import { Monitor } from "./Monitor";

export interface IJobInitData {
    name: string;
    title?: string;
    description?: string;
}
interface IJobData extends IJobInitData {
    id: string;
}

export class Job {
    private client: Monitor;
    private progressFlag: { current: number; end: number } = { current: -1, end: -1 };
    private readonly id: string;
    private readonly title: string;
    private readonly description: string;
    private currentOperation: string = "";
    private logKindMessage: string[] = [];

    constructor(data: IJobData, client: Monitor) {
        this.client = client;
        this.id = data.id;
        this.description = data.description ?? "";
        this.title = data.title ?? "";
    }

    private requestSend() {
        const data = {
            title: this.title,
            description: this.description,
            progress: this.progressFlag,
            currentOperation: this.currentOperation,
            logsPart: this.logKindMessage,
        };
        // @ts-ignore couse throtling decorator
        this.client.requestUpdate(this.id, data, () => {
            this.logKindMessage = [];
        });
    }

    public progress = (current: number, end?: number) => {
        this.progressFlag = { current, end: end ? end : this.progressFlag.end };
        this.requestSend();
    };

    public log = (text: string) => {
        this.logKindMessage.push(text);
        this.requestSend();
    };

    public operation = (text: string) => {
        this.currentOperation = text;
        this.requestSend();
    };
}
