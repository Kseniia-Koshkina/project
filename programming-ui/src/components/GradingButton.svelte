<script>
  import { userUuid } from "../stores/stores.js";
  export let programmingAssignmentId;
  export let addSubmission;
  export let updateSubmission;
  export let code;

  let ws;
  let activeToSubmit = true;
  const submit = async () => {
    activeToSubmit = false;
    const host = window.location.hostname;
    const data = {
      userUuid: $userUuid,
      programmingAssignmentId: programmingAssignmentId,
      code: code
    };

    const response = await fetch("/api/submission", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    const jsonData = await response.json();
    if (jsonData.status == "processed") {
      activeToSubmit = true;
    } else {
      ws = new WebSocket("ws://" + host + ":7800/api/connect?userUuid=" + $userUuid);

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        updateSubmission(data);
        ws.close();
        activeToSubmit = true;
      };
    }
    addSubmission(jsonData);
  }
</script>

<button
  class="bg-blue-500 hover:bg-blue-700 text-white font-bold p-2 rounded float-right"
  on:click={submit}
  disabled={!activeToSubmit}
>
  Submit
</button>