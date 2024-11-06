<script>
  export let submission;
  let isCollapsed = true;
  const toggleCollapse = () =>{
    isCollapsed = !isCollapsed;
  }
</script>

<div class="w-full text-left">
  <button
    on:click={toggleCollapse}
  >
    {isCollapsed ? ">" : "<"} {submission.last_updated.slice(0, 16)} {submission.status}
  </button>

  <div class="text-left" class:hidden={isCollapsed}>
    <p>{submission.correct ? "Correct" : "Error"}</p>
    <p class="whitespace-pre-wrap">{submission.code}</p>
    <p class="whitespace-pre-wrap">{submission.grader_feedback}</p>
  </div>
</div>