import http from "k6/http";

export const options = {
  duration: "10s",
  vus: 10,
  summaryTrendStats: ["med", "p(99)"],
};

export default function () {
  const data = {
    userUuid: "test-user",
    programmingAssignmentId: "1",
    code: "def test():\n\tprint('Hello world')"
  }
  http.post(
    "http://localhost:7800/api/submission",
    JSON.stringify(data)
  );
}