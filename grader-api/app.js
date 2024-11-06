import { grade } from "./services/gradingService.js";
import { createClient } from "./deps.js";

const GRADER_ID = crypto.randomUUID();
const streamKey = "submission-queue";
const groupName = "grader-group";
const consumerName = `grader-${GRADER_ID}`;

let clientPublish;
let clientSubscribe;

try {
  clientPublish = createClient({
    url: "redis://redis:6379",
    pingInterval: 1000,
  });
  clientSubscribe = createClient({
    url: "redis://redis:6379",
    pingInterval: 1000,
  });

  await clientPublish.connect();
  await clientSubscribe.connect();
} catch(error) {
  console.error(error);
}

try {
  await clientSubscribe.xGroupCreate(streamKey, groupName, "$", { MKSTREAM: true });
} catch(error) {
  console.error(error);
}


const processQueue = async () => {
  while(true) {
    const message = await clientSubscribe.xReadGroup(
      groupName,
      consumerName,
      [{key: streamKey,
        id: '>'
      }], {
        COUNT: 1,
        BLOCK: 4000
      }
    )
    if (message) {
      try {
        const id = message[0].messages[0].id;
        const { submissionId, userUuid, code, testCode } = JSON.parse(message[0].messages[0].message.message);
        const result = await grade(code, testCode);
        const correct = result.includes("\n\nOK");
        const feedBackMessage = correct ? "OK" : result.match(/(.*?)Error: (.*?)(?:$|\n)/)[0];

        clientPublish.publish("grading-results", JSON.stringify({
          submissionId: submissionId,
          userUuid: userUuid,
          graderFeedback: feedBackMessage,
          correct: correct,
          gradedBy: consumerName
        }));
        await clientSubscribe.xAck(streamKey, groupName, id);
      } catch(error) {
        console.error(error);
      }
    }
  }
}

processQueue();