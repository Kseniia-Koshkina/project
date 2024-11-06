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
      try {
        ws = new WebSocket("ws://" + host + ":7800/api/connect?userUuid=" + $userUuid);

        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          updateSubmission(data);
          ws.close();
          activeToSubmit = true;
        };
      } catch(error) {
        console.error(error)
      }
    }
    addSubmission(jsonData);
  }
</script>

<button
  class="text-[#28c244] bg-[#222222] hover:bg-[#282828] w-[80px] font-bold p-2 rounded float-right"
  on:click={submit}
  disabled={!activeToSubmit}
>
  Submit
</button>