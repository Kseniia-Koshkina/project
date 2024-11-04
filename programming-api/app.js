import * as programmingAssignmentService from "./services/programmingAssignmentService.js";
import { serve } from "./deps.js";
import { createClient } from "./deps.js";

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
  "grading-results", 
  (message, channel) => {
    console.log(message);
    const data = JSON.parse(message);
    programmingAssignmentService.updateSubmission(
      data.submissionId, 
      data.graderFeedback, 
      data.correct
    );
  }
);

const handleGetSubmissions = async (request) => {
  const url = new URL(request.url);
  const userUuid = url.searchParams.get('userUuid');
  const programmingAssignmentId = url.searchParams.get('programmingAssignmentId');

  if (userUuid && programmingAssignmentId) {
    const submissions = await programmingAssignmentService.getUserAssignmentSubmissions(userUuid, programmingAssignmentId);
    return Response.json(submissions);
  }

  const submissions = await programmingAssignmentService.getAllSubmissions();
  return Response.json(submissions)
}

const handleGetAssignment = async (request) => {
  try {
    const programmingAssignments = await programmingAssignmentService.findAssignment(1);
    if (programmingAssignments.length == 0) return Response.json("Not found", { status: 404 });
    return Response.json(programmingAssignments[0]);
  } catch {
    return new Response("Internal server error", { status: 500 });
  }
}

const handleSubmission = async (request) => {
  try {
    const { userUuid, programmingAssignmentId, code } = await request.json();
    if (!userUuid || !programmingAssignmentId || !code) {
      return Response.json("Missing parameters", { status: 400 });
    }

    const submissionFound = await programmingAssignmentService.getSubmission(
      programmingAssignmentId,
      code
    );

    const { status, correct, grader_feedback } = submissionFound.length != 0 
    ? submissionFound[0] 
    : {
      status: 'pending',
      correct: false,
      grader_feedback: ""
    };

    const submission = await programmingAssignmentService.addSubmission(
      userUuid,
      programmingAssignmentId,
      code,
      status,
      correct,
      grader_feedback
    );
    console.log(submission);
    // if (submissionFound.length == 0) {
    const testCode = await programmingAssignmentService.getTestCode(programmingAssignmentId);
    if (testCode.length != 0){
      const message = {
        submissionId: submission[0].id,
        code: code,
        testCode: testCode[0].test_code
      }
      clientPublish.publish("submission-queue", JSON.stringify(message));
    }
    // }

    return Response.json({id: submission[0].id}, { status: 200 });
  } catch {
    return Response.json("Internal server error", { status: 500 });
  }
}

const handleGetRoot = async () => {
  return Response.json("hello")
}

const urlMapping = [
  {
    method: "GET",
    pattern: new URLPattern({ pathname: "/assignment" }),
    fn: handleGetAssignment
  },
  {
    method: "POST",
    pattern: new URLPattern({ pathname: "/submission" }),
    fn: handleSubmission
  },
  {
    method: "GET",
    pattern: new URLPattern({ pathname: "/submissions" }),
    fn: handleGetSubmissions
  },
  {
    method: "GET",
    pattern: new URLPattern({ pathname: "/" }),
    fn: handleGetRoot  
  }
];

const handleRequest = async (request) => {
  const mapping = urlMapping.find(
    (um) => um.method === request.method && um.pattern.test(request.url)
  );

  if (!mapping) {
    return new Response("Not found", { status: 404 });
  }

  const mappingResult = mapping.pattern.exec(request.url);
  return await mapping.fn(request, mappingResult);
};

const portConfig = { port: 7777, hostname: "0.0.0.0" };
serve(handleRequest, portConfig);
