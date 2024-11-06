import * as programmingAssignmentService from "./services/programmingAssignmentService.js";
import { serve } from "./deps.js";
import { createClient } from "./deps.js";
import { connect } from "./deps.js";

const sockets = new Map();
let redis;
let clientPublish;
let clientSubscribe;

try {
  redis = await connect({
    hostname: "redis",
    port: 6379,
  });

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

  await clientSubscribe.subscribe(
    "grading-results", 
    (message) => {
      try {      
        const data = JSON.parse(message);
        programmingAssignmentService.updateSubmission(
          data.submissionId, 
          data.graderFeedback, 
          data.correct
        );
        sockets.get(data.userUuid).send(message);
      } catch(error) {
        console.error(error)
      }
    }
  );
} catch(error) {
  console.error("Failed to set up Redis connections:", error);
}

const handleGetSubmissions = async (request) => {
  try {
    const url = new URL(request.url);
    const userUuid = url.searchParams.get('userUuid');
    const programmingAssignmentId = url.searchParams.get('programmingAssignmentId');

    if (userUuid && programmingAssignmentId) {
      const submissions = await programmingAssignmentService.getUserAssignmentSubmissions(userUuid, programmingAssignmentId);
      return Response.json(submissions);
    }

    const submissions = await programmingAssignmentService.getAllSubmissions();
    return Response.json(submissions);
  } catch(error) {
    return Response.json(`Internal server error: ${error}`, { status: 500 });
  }
}

const addLastVisitAssignment = async (request) => {
  try {
    if (!redis)
      return Response.json("Service unavailable - Redis not connected", { status: 503 });
    const { userUuid, programmingAssignment } = await request.json();
    if (!userUuid && !programmingAssignment) 
      return Response.json("Missing body", { status: 400 });
    await redis.set(`${userUuid}-last-visited`, JSON.stringify(programmingAssignment));
    return Response.json({ status: 200 });
  } catch(error) {
    return Response.json(`Internal server error: ${error}`, { status: 500 });
  }
}

const handleGetAssignment = async (request) => {
  try {
    if (!redis) 
      return Response.json("Service unavailable - Redis not connected", { status: 503 });
    const url =  new URL(request.url);
    const userUuid = url.searchParams.get('userUuid');
    if (!userUuid) {
      return Response.json("Missing required parameter: userUuid", { status: 400 });
    }

    const cachedAssignment = await redis.get(`${userUuid}-last-visited`);
    if (cachedAssignment) 
      return new Response(cachedAssignment);

    const uncompletedAssignments = await programmingAssignmentService.findUncompletedAssignment(userUuid);
    if (uncompletedAssignments.length != 0) {
      await redis.set(`${userUuid}-last-visited`, JSON.stringify(uncompletedAssignments[0]));
      return Response.json(uncompletedAssignments[0]);
    }
    const allAssignments = programmingAssignmentService.getAllAssignments();
    if (allAssignments.length != 0) {
      await redis.set(`${userUuid}-last-visited`, JSON.stringify(allAssignments[0]));
      return Response.json(allAssignments[0]);
    }

    return Response.json("No assignments found", {status: 400});
  } catch(error) {
    return Response.json(`Internal server error: ${error}`, { status: 500 });
  }
}

const handleGetAllAssignments = async () => {
  try {
    if (!redis) {
      return Response.json("Service unavailable - Redis not connected", { status: 503 });
    }
    const cachedAssignments = await redis.get('all-assignments');
    if (cachedAssignments)
      return new Response(cachedAssignments, { status: 200 });

    const allAssignments = await programmingAssignmentService.getAllAssignments();
    await redis.set('all-assignments', JSON.stringify(allAssignments));
    return Response.json(allAssignments, { status: 200 });
  } catch(error) {
    return Response.json(`Internal server error: ${error}`, { status: 500 });
  }
}

const handleSubmission = async (request) => {
  try {
    if (!clientPublish || !clientSubscribe) 
      return Response.json("Service unavailable - Redis not connected", { status: 503 });
    const { userUuid, programmingAssignmentId, code } = await request.json();
    if (!userUuid || !programmingAssignmentId || !code) {
      return Response.json("Missing parameters", { status: 400 });
    }

    const submissionFound = await programmingAssignmentService.getSubmission(
      programmingAssignmentId,
      code,
      "processed"
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

    if (submissionFound.length == 0) {
      const testCode = await programmingAssignmentService.getTestCode(programmingAssignmentId);
      if (testCode.length != 0) {
        const message = {
          submissionId: submission[0].id,
          userUuid: userUuid,
          code: code,
          testCode: testCode[0].test_code
        }
        clientPublish.publish("submission-queue", JSON.stringify(message));
      }
    }

    return Response.json(submission[0], { status: 200 });
  } catch(error) {
    return Response.json(`Internal server error: ${error}`, { status: 500 });
  }
}

const handleConnect = async (request) => {
  try {
    const url = new URL(request.url);
    const userUuid = url.searchParams.get('userUuid');
    const { socket, response } = Deno.upgradeWebSocket(request);

    sockets.set(userUuid, socket);

    socket.onclose = () => {
      sockets.delete(socket);
    };

    return response;
  } catch(error) {
    console.error(error);
  }
}

const urlMapping = [
  {
    method: "GET",
    pattern: new URLPattern({ pathname: "/assignment" }),
    fn: handleGetAssignment
  },
  {
    method: "GET",
    pattern: new URLPattern({ pathname: "/assignments" }),
    fn: handleGetAllAssignments
  },
  {
    method: "POST",
    pattern: new URLPattern({ pathname: "/assignment/last-visit" }),
    fn: addLastVisitAssignment
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
    pattern: new URLPattern({ pathname: "/connect" }),
    fn: handleConnect  
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
