import { Monitor } from "./Monitor";
import { Connection } from "./Connection";

console.log("test");

const connection = new Connection("ws://localhost:3011");

connection
    .connect()
    .then(() => {
        const logClient = new Monitor(connection, "Test klient 1", "To jest opis taska ").addLabel("my-test-client");
        const job = logClient.createJob("MyTestJob");

        for (let i = 0; i <= 1000; i++) {
            setTimeout(() => {
                job.progress(i, 1000);
                job.operation("this is the " + Math.random())
                job.log("What the fuck");
                job.log("this is it " + i + " / " + 1000);
                console.log("-------");
            }, i * 10);
        }
    })
    .catch((e) => {
        console.log(e);
    });
