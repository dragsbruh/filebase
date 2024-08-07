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
  import notify from "../stores/notification";

  export let params;

  let systemname = params.name;
  let systempath = params["*"] ? params["*"] : ""; // Access wildcard parameter

  let system: MemoryFS;
  let files: StatItem[] = [];

  let path: Path;
  let comps: string[] = [];

  let activefile: File | null = null;
  let selectedfiles: string[] = [];

  let copiedfiles: Path[] = [];

  // -------- General Navigation
  async function reloadListing() {
    comps = path.components;
    let item = await system.nestedItem(path.raw);

    if (item instanceof Directory) {
      files = await item.liststat();
      selectedfiles = [];
      activefile = null;
    }
  }

  async function loadPath(newpath: string | Path) {
    path = newpath instanceof Path ? newpath : new Path(newpath);
    comps = path.components;
    let item = await system.nestedItem(path.raw);

    if (item instanceof File) {
      await loadPath(path.parent);
      activefile = item;
      console.log(item);
    } else if (item instanceof Directory) {
      files = await item.liststat();
      selectedfiles = [];
      activefile = null;
    } else {
      notify(`File ${path.raw} not found`, "danger");

      path = path.parent;
      await loadPath(path);
    }
  }

  async function openAtDistance(distance: number) {
    path = Path.fromComponents(comps.slice(0, distance));
    await reloadListing();
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
    } else {
      await openCurrentItem(file.name);
    }
  }

  // -------- File operations
  async function copySelected() {
    copiedfiles = [];
    selectedfiles.forEach((file) => {
      const fullpath = path.join(file);
      copiedfiles = [...copiedfiles, fullpath];
    });
  }

  async function pasteSelectedHere() {
    let failed: {
      detail: string;
      path: Path;
    }[] = [];

    for (let file of copiedfiles) {
      let parent = await system.nestedItem(file.parent.raw);
      let destination = await system.nestedItem(path.raw);

      if (parent === null || parent instanceof File) {
        console.error("error");
        failed.push({
          detail: `Error copying '${file.raw}' - Invalid file parent`,
          path: file,
        });
      } else if (destination === null || destination instanceof File) {
        console.error("error");

        failed.push({
          detail: `Error copying '${file.raw}' - Invalid destination`,
          path: path,
        });
      } else {
        let item = await system.nestedItem(file.raw);

        if (item instanceof File) {
          destination.children.set(file.basename, item);
        } else if (item instanceof Directory) {
          if (await destination.exists(file.basename)) {
            failed.push({
              detail: `Error copying directory '${file.raw}' - An item with same name exists`,
              path: file,
            });
          } else {
            destination.children.set(file.basename, item);
          }
        }
      }
    }

    if (failed.length !== 0) {
      let text = "A few copy operations failed:\n";
      failed.forEach((fail) => {
        text += fail.detail + "\n";
      });
      notify(text, "danger");
    } else {
      notify("Pasted files successfully", "success");
    }

    await reloadListing();
  }

  async function deleteSelected() {
    let tbd = [...selectedfiles];
    if (activefile) {
      tbd.push(activefile.name);
    }
    for (let file of tbd) {
      const fullpath = path.join(file);
      const parent = await system.nestedItem(fullpath.dirname);
      if (!parent || parent instanceof File) {
        notify(`Error getting parent for ${file} while deleting`, "danger");
        return;
      }
      await parent.removeforce(fullpath.basename); // FIXME: Scary!
    }

    await reloadListing();
  }

  async function handleDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!e.dataTransfer) {
      return;
    }

    let file = e.dataTransfer.files[0];
    if (file) {
      const reader = new FileReader();

      (reader as any).file = file.name;

      reader.onload = async (event) => {
        if (!event.target) {
          throw new Error("FIXME: Event target not found");
        }
        const arrayBuffer = event.target.result;
        if (!arrayBuffer) {
          throw new Error("FIXME: Array buffer not found");
        }
        const filecontent = new Uint8Array(
          arrayBuffer instanceof ArrayBuffer
            ? arrayBuffer
            : new TextEncoder().encode(arrayBuffer)
        );
        const curdir = await system.nestedItem(path.raw);
        if (!curdir || curdir instanceof File) {
          throw new Error("Error getting current directory");
        }

        const filename = (reader as any).file as string;
        const file = await curdir.open(filename, true);
        file.write(filecontent);

        await reloadListing();
      };

      reader.readAsArrayBuffer(file);
    }
  }

  async function renameSelected(e: Event) {
    let tbr: File | Directory | null = null;
    if (selectedfiles.length === 1) {
      let file = await system.nestedItem(selectedfiles[0]);
      if (!file) {
        notify("Error getting selected file", "danger");
        return;
      }
      tbr = file;
    } else if (activefile) {
      tbr = activefile;
    } else {
      return;
    }

    const newname = prompt(`New name for ${tbr.name}:`);
    if (newname) {
      let parent = await system.nestedItem(path.raw);
      
      if (!(parent instanceof Directory)) {
        notify(`Error getting parent`, "danger");
        return;
      }

      if (await parent.exists(newname)) {
        notify(`File already exists: ${newname}`, "danger");
        return;
      }

      await parent.rename(tbr.name, newname);
      await reloadListing();
    }
  }

  document.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.stopPropagation();
  });
  document.addEventListener("drop", handleDrop);

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

<div class="container is-flex is-justify-content-space-between mb-3">
  <!-- Action preview -->
  <div class="container">
    {#if copiedfiles.length !== 0}
      <p class="help">
        {copiedfiles.length} file{copiedfiles.length === 1 ? "" : "s"} copied
      </p>
    {/if}
  </div>

  <!-- Action Menu -->
  <!-- FIXME: Lot of hacky code -->
  <div class="container is-flex is-justify-content-space-between">
    <!-- bad practice! FIXME -->
    <div></div>
    <div class="buttons is-flex">
      <button
        class="button is-info"
        disabled={activefile === null && selectedfiles.length !== 1}
        on:click={renameSelected}
        title="Edit"
      >
        <i class="fa-solid fa-pen"></i>
      </button>
      <button
        class="button is-link"
        disabled={activefile === null && selectedfiles.length === 0}
        on:click={copySelected}
        title="Copy"
      >
        <i class="fa-solid fa-copy"></i>
      </button>
      <button
        class="button is-success"
        disabled={copiedfiles.length === 0}
        on:click={pasteSelectedHere}
        title="Paste"
      >
        <i class="fa-solid fa-paste"></i>
      </button>
      <button
        class="button is-danger"
        disabled={selectedfiles.length === 0 && activefile === null}
        on:click={deleteSelected}
        title="Delete"
      >
        <i class="fa-solid fa-trash"></i>
      </button>
    </div>
  </div>
</div>

<div class="container explorer">
  <!-- Navigation -->
  <nav class="breadcrumb navigation p-4" aria-label="breadcrumbs">
    <ul class="buttons">
      <li>
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <!-- svelte-ignore a11y-missing-attribute -->
        <a
          class="popover"
          on:click={() => {
            loadPath("/");
          }}>-root-</a
        >
      </li>
      {#each comps as comp, distance}
        <li>
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <!-- svelte-ignore a11y-missing-attribute -->
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
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <!-- svelte-ignore a11y-missing-attribute -->
      <a
        on:click={(e) => {
          handleFileItemClick(file, e);
        }}
      >
        <div
          class="container popover fileitem p-2 {(activefile &&
            activefile.name === file.name) ||
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

<div class="mb-5">
  <!-- FIXME: For dev only -->
</div>

{#if activefile}
  <div class="container mt-5">
    {activefile.name}
  </div>
{/if}

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
