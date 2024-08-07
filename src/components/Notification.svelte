<script lang="ts">
  import { onMount } from "svelte";
  import notify, { notification } from "../stores/notification";

  let content: string | null = null;
  let level: string = "info";

  onMount(() => {
    notification.subscribe((notif) => {
      ({ content, level } = notif);
    });
  });
</script>

{#if content !== null}
  <div class="notification is-{level}">
    <button
      class="delete"
      on:click={() => {
        content = null;
        level = "";
      }}
    ></button>
    {#each content.split("\n") as block, index}
      {block}
      {#if content.split("\n").length !== index + 1}
        <br />
      {/if}
    {/each}
  </div>
{/if}
