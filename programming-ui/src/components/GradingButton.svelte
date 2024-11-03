<script>
  import { userUuid } from "../stores/stores.js";
  export let programmingAssignmentId;
  export let code;

  const doSimpleGradingDemo = async () => {
    const data = {
      user: $userUuid,
      code: `def hello():
  return "helo world!"
`,
    };
    console.log("called");
    const response = await fetch("/api/grade", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    console.log(response)
    const jsonData = await response.json();
    console.log(jsonData);
    alert(JSON.stringify(jsonData));
  };

  const submit = async () => {
    const data = {
      userUuid: $userUuid,
      programmingAssignmentId: programmingAssignmentId,
      code: code
    };
    console.log(data)

    const response = await fetch("/api/submission", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    const jsonData = await response.json();
    console.log(jsonData); 
  }
</script>


<button
  class="bg-blue-500 hover:bg-blue-700 text-white font-bold p-2 rounded float-right"
  on:click={submit}
>
  Submit
</button>