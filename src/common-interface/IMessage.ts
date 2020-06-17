export interface IMessage {
    type: "log" | "job" ;
    monitorId: string;
}

export interface ILogMessage extends IMessage {
    type: "log";
}
export interface IJobMessage extends IMessage {
    type: "job";
    jobId: string;
    title: string;
    description: string;
    progress: { current: number; end: number };
    currentOperation: string;
    logsPart: string[];
    monitorData?: {
        name: string;
        title: string;
        description: string;
        labels: string[];

    };
}
