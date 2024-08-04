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
  import { formatBytes } from "../utils";

  export let params;

  let systemname = params.name;
  let systempath = params["*"] ? params["*"] : ""; // Access wildcard parameter

  let system: MemoryFS;
  let files: StatItem[] = [];

  let path: Path;
  let comps: string[] = [];

  let activefile: string | null = null;
  let selectedfiles: string[] = [];

  // -------- General Navigation
  async function loadPath(newpath: string | Path) {
    path = newpath instanceof Path ? newpath : new Path(newpath);
    comps = path.components;
    let item = await system.nestedItem(path.raw);

    if (item instanceof File) {
      console.log(new TextDecoder().decode(await item.read()));
      await loadPath(path.parent);
      activefile = item.name;
    } else if (item instanceof Directory) {
      files = await item.liststat();
      selectedfiles = [];
    } else {
      console.error("File not found"); // TODO: Add file not found component
      path = path.parent;
      await loadPath(path);
    }
  }

  async function openAtDistance(distance: number) {
    path = Path.fromComponents(comps.slice(0, distance));
    activefile = null;
    await loadPath(path);
  }

  async function openCurrentItem(name: string) {
    await loadPath(path.join(name));
  }

  async function handleFileItemClick(file: StatItem, e: MouseEvent) {
    const isShift = e.shiftKey;
    if (isShift) {
      if (selectedfiles.includes(file.name)) {
        selectedfiles = selectedfiles.filter((item) => item !== file.name);
      } else {
        selectedfiles = [...selectedfiles, file.name];
      }
      activefile = null;
      console.log(selectedfiles);
    } else {
      await openCurrentItem(file.name);
    }
  }

  onMount(async () => {
    system = new MemoryFS();
    await system.init();

    const l = (await system.nestedItem("/openme")) as Directory;
    await l.mkdir("twofold");
    const k = (await system.nestedItem("/openme/twofold/")) as Directory;
    await k.touch("test.png");
    await l.touch("test.txt");
    await l.touch("yomama.txt");
    loadPath(systempath);
  });
</script>

<div class="container explorer">
  <!-- Navigation -->
  <nav class="breadcrumb navigation p-4" aria-label="breadcrumbs">
    <ul class="buttons">
      <li>
        <a
          class="popover"
          on:click={() => {
            loadPath("/");
          }}>-root-</a
        >
      </li>
      {#each comps as comp, distance}
        <li>
          <a
            class="popover"
            on:click={() => {
              openAtDistance(distance + 1);
            }}>{comp}</a
          >
        </li>
      {/each}
    </ul>
  </nav>

  <!-- File display -->
  <div class="container filelist p-2">
    {#each files as file}
      <a
        on:click={(e) => {
          handleFileItemClick(file, e);
        }}
      >
        <div
          class="container popover fileitem p-2 {activefile === file.name ||
          selectedfiles.includes(file.name)
            ? 'active'
            : ''}"
        >
          <div class="is-flex is-justify-content-center is-align-items-center">
            <i
              class=" {file.type === 'directory'
                ? 'fa-solid fa-folder'
                : 'fa-regular fa-file'} pr-2"
            ></i>
            <p>{file.name}</p>
          </div>
          <p>
            {file.type === "file"
              ? formatBytes(file.size)
              : `${file.size} items`}
          </p>
        </div>
      </a>
    {/each}
  </div>
</div>

<div class="container mt-5">
  <!-- Action Menu -->
  <div class="buttons">
    <!-- TODO -->
  </div>

  <!-- Action preview -->
  <div></div>
</div>

<style>
  .explorer {
    border: 1px solid white;
    border-radius: 3px;
    border-radius: 0.2rem;
  }

  .navigation {
    padding-bottom: 0 !important;
  }

  .filelist {
    border-top: 1px solid white;
    display: block;
  }
  .fileitem {
    display: flex;
    justify-content: space-between;
    border-radius: 0.2rem;
    transition:
      background 0.3s ease,
      filter 0.3s ease;
    color: white;
    user-select: none;
  }

  .popover {
    transition: transform 0.3s ease;
  }

  .popover:hover {
    transform: translateY(-1px) scale(1.005);
  }

  .fileitem:hover {
    filter: brightness(1.5);
    background: var(--bulma-link);
  }

  .active {
    background: var(--bulma-link);
  }
</style>
