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
    {content}
  </div>
{/if}
