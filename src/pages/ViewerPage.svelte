<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-missing-attribute -->
<script lang="ts">
  import { onMount } from "svelte";
  import { MemoryFS } from "../lib/memfs";
  import {
    Path,
    type StatItem,
    File,
    Directory,
  } from "../lib/filestore/filestore";

  export let params;

  let systemname = params.name;
  let systempath = params["*"] ? params["*"] : ""; // Access wildcard parameter

  let system: MemoryFS;
  let files: StatItem[] = [];

  let path: Path;
  let comps: string[] = [];

  async function loadPath(newpath: string | Path) {
    path = newpath instanceof Path ? newpath : new Path(newpath);
    comps = path.components;
    let item = await system.nestedItem(path.raw);

    if (item instanceof File) {
      console.log(new TextDecoder().decode(await item.read()))
      loadPath(path.parent);
    } else if (item instanceof Directory) {
      files = await item.liststat();
    } else {
      console.error("File not found"); // TODO: Add file not found component
      path = path.parent;
      loadPath(path);
    }
  }

  async function openAtDistance(distance: number) {
    path = Path.fromComponents(comps.slice(0, distance));

    loadPath(path);
  }

  function openCurrentItem(name: string) {
    loadPath(path.join(name));
  }

  onMount(async () => {
    system = new MemoryFS();
    await system.init();

    loadPath(systempath);
  });
</script>

<!-- Breadcrumb navigation -->
<section class="section">
  <nav class="breadcrumb" aria-label="breadcrumbs">
    <ul class="buttons">
      <li>
        <a
          on:click={() => {
            loadPath("/");
          }}>-root-</a
        >
      </li>
      {#each comps as comp, distance}
        <li>
          <a
            on:click={() => {
              openAtDistance(distance);
            }}>{comp}</a
          >
        </li>
      {/each}
    </ul>
  </nav>
</section>

<!-- Actual files showing part -->
<section class="section">
  {#each files as file}
    <button
      class="button"
      on:click={() => {
        openCurrentItem(file.name);
      }}>{file.name}</button
    >
  {/each}
</section>
