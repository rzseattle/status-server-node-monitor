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
    private logKindErrorMessage: string[] = [];
    private name: string;

    constructor(data: IJobData, client: Monitor) {
        this.client = client;
        this.id = data.id;
        this.description = data.description ?? "";
        this.title = data.title ?? "";
        this.name = data.name;
    }

    private requestSend() {
        const data  = {
            name: this.name,
            title: this.title,
            description: this.description,
            progress: this.progressFlag,
            currentOperation: this.currentOperation,
            logsPart: this.logKindMessage,
            logsErrorPart: this.logKindErrorMessage,
        };
        // @ts-ignore couse throtling decorator
        this.client.requestUpdate(this.id, data, () => {
            this.logKindMessage = [];
            this.logKindErrorMessage = [];
        });
    }

    public progress = (current: number, end?: number) => {
        this.progressFlag = { current, end: end ? end : this.progressFlag.end };
        this.requestSend();
    };

    public log = (text: string | string[]) => {
        if(Array.isArray(text)){
            this.logKindMessage = [...this.logKindMessage, ...text];
        }else {
            this.logKindMessage.push(text);
        }
        this.requestSend();
    };

    public error = (text: string | string[]) => {
        if(Array.isArray(text)){
            this.logKindErrorMessage = [...this.logKindErrorMessage, ...text];
        }else {
            this.logKindErrorMessage.push(text);
        }
        this.requestSend();
    };

    public operation = (text: string) => {
        this.currentOperation = text;
        this.requestSend();
    };
}
