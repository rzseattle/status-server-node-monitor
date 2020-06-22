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
    private readonly name: string;

    private _isError: boolean = false;
    get isError(): boolean {
        return this._isError;
    }
    set isError(value: boolean) {
        this._isError = value;
        this.requestSend();
    }

    private _isDone: boolean = false;
    get isDone(): boolean {
        return this._isDone;
    }
    set isDone(value: boolean) {
        this._isDone = value;
        this.requestSend();
    }


    private _isLoggingToConsole: boolean = false;
    get isLoggingToConsole(): boolean {
        return this._isLoggingToConsole;
    }
    set isLoggingToConsole(value: boolean) {
        this._isLoggingToConsole = value;
    }

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
            done: this.isDone,
            error: this._isError
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
            if(this.isLoggingToConsole){
                text.forEach(line => console.log(line));
            }
            this.logKindMessage = [...this.logKindMessage, ...text];
        }else {
            console.log(text)
            this.logKindMessage.push(text);
        }
        this.requestSend();
    };

    public error = (text: string | string[]) => {
        if(Array.isArray(text)){
            text.forEach(line => console.log(line));
            this.logKindErrorMessage = [...this.logKindErrorMessage, ...text];
        }else {
            console.log(text)
            this.logKindErrorMessage.push(text);
        }
        this.requestSend();
    };

    public operation = (text: string) => {
        this.currentOperation = text;
        this.requestSend();
    };
}
