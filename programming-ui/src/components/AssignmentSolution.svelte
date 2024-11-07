<script>
  import  { onMount } from 'svelte';
  export let inputText;

  onMount(() => {
    const inputField = document.getElementById('editor');
    inputField.addEventListener("keydown", (e) => { 
      if (e.key == "Tab") {
        e.preventDefault();
        inputField.setRangeText(
          "\t",
          inputField.selectionStart,
          inputField.selectionEnd,
          "end"
        );
      }
    })
  })
</script>

<div class="m-4 w-1/2 max-w-[300px]">
  <textarea bind:value={inputText} class="resize-none w-full h-52 p-2 rounded bg-[#262626]" id="editor" data-testid="submission-area"/>
</div>