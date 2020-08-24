# status-server-node-monitor
```js 
const conn = new Connection("ws://localhost:3011");
await conn.connect();
const monitor = new Monitor(conn, "My test job monitor");
const job = monitor.createJob("new job");
job.log("test log");
job.isDone = true;
```
