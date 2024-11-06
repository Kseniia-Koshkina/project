import { sql } from "../database/database.js";

const getAllAssignments = async () => {
  return await sql`SELECT * FROM programming_assignments;`;
};

const findUncompletedAssignment = async (userUuid) => {
  return await sql`SELECT * FROM programming_assignments 
  WHERE id NOT IN 
  (SELECT programming_assignment_id FROM programming_assignment_submissions 
  WHERE user_uuid = ${userUuid} AND correct = TRUE) ORDER BY assignment_order;`;
}

const addSubmission = async (
  userUuid, 
  programmingAssignmentId, 
  code, 
  status, 
  correct, 
  grader_feedback
) => {
  return await sql`
  INSERT INTO programming_assignment_submissions 
    (programming_assignment_id, code, user_uuid, status, correct, grader_feedback, last_updated)
  VALUES 
    (${programmingAssignmentId}, ${code}, ${userUuid}, ${status}, ${correct}, ${grader_feedback}, NOW())
  RETURNING *;`
}

const getAllSubmissions = async () => {
  return await sql`SELECT * FROM programming_assignment_submissions;`
}

const getSubmission = async (programmingAssignmentId, code, status) => {
  return await sql`
    SELECT * FROM programming_assignment_submissions
    WHERE programming_assignment_id = ${programmingAssignmentId} AND code = ${code} AND status=${status};`
}

const getUserAssignmentSubmissions = async (userUuid, programmingAssignmentId) => {
  return await sql`
    SELECT * FROM programming_assignment_submissions
    WHERE programming_assignment_id = ${programmingAssignmentId} AND user_uuid = ${userUuid}
    ORDER BY last_updated DESC;`;
}

const getUniqueCorrectAssignmentSubmissions = async (userUuid) => {
  return await sql`
    SELECT DISTINCT ON (programming_assignment_id) * FROM programming_assignment_submissions
    WHERE correct=TRUE AND user_uuid = ${userUuid};`;
}

const updateSubmission = async (submissionId, graderFeedback, correct) => {
  return await sql`
    UPDATE programming_assignment_submissions
    SET status='processed', grader_feedback=${graderFeedback}, correct = ${correct}
    WHERE id = ${submissionId};`
}

const getTestCode = async (programmingAssignmentId) => {
  return await sql`SELECT test_code FROM programming_assignments
    WHERE id = ${programmingAssignmentId};`
}

export { getAllAssignments, findUncompletedAssignment, addSubmission, getSubmission, getUniqueCorrectAssignmentSubmissions, getTestCode, updateSubmission, getAllSubmissions, getUserAssignmentSubmissions };
