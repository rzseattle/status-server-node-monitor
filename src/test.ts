import { Monitor } from "./Monitor";
import { Connection } from "./Connection";

(async () => {
    // const connection = new Connection("ws://localhost:3011");
    // await connection.connect();
    //
    //
    // const logClient = new Monitor(connection, "Test klient 1", "To jest opis taska ").addLabel("my-test-client");
    // const job = logClient.createJob("MyTestJob", "title of job", "description of job");
    //
    // for (let i = 0; i <= 1000; i++) {
    //     setTimeout(() => {
    //         job.progress(i, 1000);
    //         job.operation("this is the " + Math.random());
    //         job.error("What the fuck");
    //         job.log("this is it " + i + " / " + 1000);
    //         console.log("-------");
    //     }, i * 10);
    // }
})();
