import { grade } from "./services/gradingService.js";
import { createClient } from "./deps.js";

const messageQueue = [];

const clientPublish = createClient({
  url: "redis://redis:6379",
  pingInterval: 1000,
});
const clientSubscribe = createClient({
  url: "redis://redis:6379",
  pingInterval: 1000,
});

await clientPublish.connect();
await clientSubscribe.connect();

await clientSubscribe.subscribe(
  "submission-queue",
  (message, channel) => {
    console.log(message, channel);
    const data = JSON.parse(message);
    console.log(data);
    messageQueue.push(data);

    processQueue();
  }
);

const processQueue = async () => {
  if (messageQueue.length > 0) {
    const { submissionId, userUuid, code, testCode } = messageQueue.shift();
    const result = await grade(code, testCode);
    const correct = result.includes("\n\nOK");

    clientPublish.publish("grading-results", JSON.stringify({
      submissionId: submissionId,
      userUuid: userUuid,
      graderFeedback: result,
      correct: correct
    }));
  }
}