import * as programmingAssignmentService from "./services/programmingAssignmentService.js";
import { serve } from "./deps.js";
import { createClient } from "./deps.js";

const client = createClient({
  url: "redis://redis:6379",
  pingInterval: 1000,
});

await client.connect();
console.log("connected PROGRAMMING-API");

const handleGrading = async (request) => {
  try {
    const programmingAssignments = await programmingAssignmentService.findAll();

    const requestData = await request.json();
    const testCode = programmingAssignments[0]["test_code"];
    const data = {
      testCode: testCode,
      code: requestData.code,
    };

    const response = await fetch("http://grader-api:7000/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
  
    return response;
  } catch {

  }
};

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

    client.publish("submission-queue", JSON.stringify(submission));

    return Response.json(submission, { status: 200 });
  } catch {
    return new Response("Internal server error", { status: 500 });
  }
}

const handleGetRoot = async () => {
  return Response.json("hello")
}

const urlMapping = [
  {
    method: "POST",
    pattern: new URLPattern({ pathname: "/grade" }),
    fn: handleGrading,
  },
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
