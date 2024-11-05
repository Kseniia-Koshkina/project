<script>
  import GradingButton from "./GradingButton.svelte";
  import AssignmentInfo from "./AssignmentInfo.svelte";
  import AssignmentSolution from "./AssignmentSolution.svelte";
  import NextButton from "./NextButton.svelte";
  import PreviousButton from "./PreviousButton.svelte";
  import {onMount} from "svelte";
  import { userUuid } from "../stores/stores";

  let inputText = "";
  let ws;

  const buttonPressed = () => {
    console.log(inputText);
  }

  const getAssignment = async () => {
    const response = await fetch("/api/assignment", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    return await response.json();
  }

  onMount(() => {
    const host = window.location.hostname;
    ws = new WebSocket("ws://" + host + ":7800/api/connect?userUuid=" + $userUuid);

    ws.onmessage = (event) => {
      console.log(event.data);
    };

    // return () => {
    //   if (ws.readyState === 1) {
    //     ws.close();
    //   }
    // };
  });
  let assignmentPromise = getAssignment();
</script>

<div class="container mx-auto w-4/5 max-w-[664px] flow-root pl-4 pr-4"> 
  <NextButton buttonPressed = {buttonPressed}/>
  <PreviousButton />
</div>


{#await assignmentPromise}
  <div class="container mx-auto w-4/5 flex col-2 place-content-center">
    <AssignmentInfo text="Loading..."/>
    <AssignmentSolution />
  </div>
{:then assignment}
  {#if assignment}
    <div class="container mx-auto w-4/5 flex col-2 place-content-center">
      <AssignmentInfo text={assignment.handout} />
      <AssignmentSolution bind:inputText={inputText} />
    </div>
    <div class="container mx-auto w-4/5 max-w-[664px] flow-root pl-4 pr-4">
      <GradingButton programmingAssignmentId={assignment.id} code={inputText} client:only={"svelte"}/>
    </div>
  {/if}
{/await}



