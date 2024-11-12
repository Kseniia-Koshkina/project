### Project Implementation

The goal of this project was to apply the knowledge gained from the course to build a web application where users can practice Python programming through simple assignments, submit their solutions for grading, and receive real-time feedback.

#### Programming-UI

First, I started by designing the layout and planning the flow of the application. I arranged the main components, including two text areas, Submit/Next/Previous buttons, a score display, and a list of submissions. For styling, I used TailwindCSS to keep the design consistent. Styling is not my strong suit, so I used LeetCode as a reference to create a similar theme, aiming to make the app feel familiar to users.

#### Programming-API

Next, I moved to back-end development, creating several endpoints and corresponding handlers. My API structure includes the following endpoints:

-   **GET**  `/assignments`: List all assignments.
-   **GET**  `/assignment`: Retrieve the last visited assignment.
-   **POST** `/assignment/last-visit`: Update the last visited assignment.
-   **POST** `/submission`: Add a user submission.
-   **GET** `/submissions`: Retrieve all user submissions or all correct solutions for a specific assignment.
-   **WebSocket** /connect`: Handle WebSocket connections.

#### Application Flow

When the user loads the page, the application fetches all assignments, retrieves the last visited assignment, and displays its handout in the text area. Loading all assignments initially allows for faster navigation between them. Assignments are ordered by  `order_number`, and users can navigate with the Next and Previous buttons.

When a navigation button is pressed, the application sends a POST request to update the last visited assignment, which is stored in Redis cache. If no cached record exists for the user, `programming-api` searches for the uncompleted assignment with the lowest order number. If all assignments are completed or none exist, it defaults to the first assignment in the order.

Upon receiving an assignment, the app fetches all user submissions for it, as well as all correctly submitted assignments (one correct submission per assignment) to calculate the total score. This is done by counting the correct submissions and multiplying by 100.

The submission process begins when the user presses the Submit button. A POST request with the submission data is sent to `programming-api`. If a record with identical code already exists, the backend returns the existing submission with a "processed" status and any recorded feedback. For new code submissions, `programming-api` saves the new submission to the database and returns it to the client. The UI then establishes a WebSocket connection with `programming-api` (adding the new connection to a map with the user UUID as the key) and proceeds with grading.

#### Grading Process and Real-Time Feedback

Both `grader-api` and `programming-api` use two Redis clients — one for sending messages and another for listening to incoming ones. `Programming-api` adds messages to the Redis Stream `'submission-queue'`, and these messages are distributed among the two instances of `grader-api` using a stream group. Each instance is uniquely identified using `crypto.randomUUID()`.

During grading, `grader-api` checks the correctness of the submission and parses any error message (I used a regular expression, `/(.*?)Error: (.*?)(?:$|\n)/`, to capture error types and descriptions). Once grading is complete, `grader-api` sends a message through the Pub/Sub system via the `'grading-results'` channel. `Programming-api` receives the graded result and sends it back to the client via the WebSocket connection. The UI then updates the submission list and adjusts the score if necessary.