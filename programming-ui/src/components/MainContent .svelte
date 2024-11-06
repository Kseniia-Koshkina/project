<script>
  import GradingButton from "./GradingButton.svelte";
  import AssignmentInfo from "./AssignmentInfo.svelte";
  import AssignmentSolution from "./AssignmentSolution.svelte";
  import NextButton from "./NextButton.svelte";
  import PreviousButton from "./PreviousButton.svelte";
  import Submission from "./Submission.svelte";
  import { onMount } from "svelte";
  import { userUuid } from "../stores/stores";

  let inputText = "";
  let submissions = [];
  let assignments;
  let assignment;
  let scoreSubmissions = 0;

  const setLastVisitAssignment = async (userUuid, programmingAssignment) => {
    const data = {
      userUuid: userUuid,
      programmingAssignment: programmingAssignment
    }
    await fetch(`/api/assignment/last-visit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data)
    })
  }

  const nextAssignment = async () => {
    const currentIndex = assignments.findIndex(assignmentIndexing => assignmentIndexing.id == assignment.id);
    if (currentIndex + 1 < assignments.length) {
      assignment = assignments[currentIndex+1];
      await setLastVisitAssignment($userUuid, assignment);
    }
  }

  const previousAssignment = async () => {
    const currentIndex = assignments.findIndex(assignmentIndexing => assignmentIndexing.id == assignment.id);
    if (currentIndex - 1 >= 0) {
      assignment = assignments[currentIndex-1];
      await setLastVisitAssignment($userUuid, assignment);
    }
  }

  const addSubmission = (submission) => {
    if (submission.correct) addScore(submission);
    submissions = [submission, ...submissions];
  }

  const addScore = (newSubmission) => {
    const correctSubmissionExists = scoreSubmissions.find(submission => 
      submission.programming_assignment_id == newSubmission.programming_assignment_id);
    if (!correctSubmissionExists) {
      scoreSubmissions = [...scoreSubmissions, newSubmission];
    }
  }

  const updateSubmission = (data) => {
    const copySubmissions = submissions;
    const index = submissions.findIndex(submission => submission.id == data.submissionId);
    copySubmissions[index].status = 'processed';
    copySubmissions[index].grader_feedback = data.graderFeedback;
    copySubmissions[index].correct = data.correct;
    submissions = copySubmissions;
    if (copySubmissions[index].correct) addScore(copySubmissions[index]);
  }

  const loadPageContent = async () => {
    const responseAssignments = await fetch("/api/assignments", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      }
    }); 

    const responseAssignment = await fetch(`/api/assignment?userUuid=${$userUuid}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      }
    });

    const responseScore = await fetch(`/api/submissions?userUuid=${$userUuid}&correctUnique=true`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      }
    })
    assignments = await responseAssignments.json();
    assignment = await responseAssignment.json();
    scoreSubmissions = await responseScore.json();
  }

  const getSubmissions = async (userUuid, programmingAssignmentId) => {
    if (programmingAssignmentId) {
      const response = await fetch(`/api/submissions?userUuid=${userUuid}&programmingAssignmentId=${programmingAssignmentId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      submissions = await response.json();
    }
  }
</script>

<div class="container mx-auto w-4/5 max-w-[664px] flow-root pl-4 pr-4"> 
  <NextButton nextAssignment={nextAssignment}/>
  <PreviousButton previousAssignment={previousAssignment}/> <p>Total score: {scoreSubmissions.length * 100}</p>
</div>

{#await loadPageContent()}
  <div class="container mx-auto w-4/5 flex col-2 place-content-center">
    <AssignmentInfo text="Loading..."/>
    <AssignmentSolution />
  </div>
{:then}
  {#if assignment}
    <div class="container mx-auto w-4/5 flex col-2 place-content-center">
      <AssignmentInfo text={assignment.handout} />
      <AssignmentSolution bind:inputText={inputText} />
    </div>

    <div class="container mx-auto flex w-4/5 max-w-[664px] flow-root pl-4 pr-4">
      <div class="w-2/5 max-w-[332px] float-left">
        {#await getSubmissions($userUuid, assignment.id)}
          <p>Loading...</p>
        {:then} 
          {#each submissions as submission}
            <Submission submission={submission}/>
          {/each}
        {/await}
      </div>
      <GradingButton 
        programmingAssignmentId={assignment.id} 
        addSubmission={addSubmission} 
        updateSubmission={updateSubmission} 
        addScore={addScore}
        code={inputText} 
      />
    </div>
  {/if}
{/await}



