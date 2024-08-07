<script lang="ts">
  import { onMount } from "svelte";
  import { File } from "../lib/filestore/filestore";

  export let file: File;

  const mimeTypes: { [key: string]: string } = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".bmp": "image/bmp",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
    ".pdf": "application/pdf",
    ".txt": "text/plain",
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".json": "application/json",
    ".xml": "application/xml",
    ".csv": "text/csv",
    ".zip": "application/zip",
    ".tar": "application/x-tar",
    ".gz": "application/gzip",
    ".bz2": "application/x-bzip2",
    ".xz": "application/x-xz",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".ogg": "audio/ogg",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".avi": "video/x-msvideo",
    ".mov": "video/quicktime",
    ".mkv": "video/x-matroska",
  };

  function getMimeType(filename: string): string | undefined {
    const extension = filename
      .slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2)
      .toLowerCase();
    return mimeTypes["." + extension];
  }

  const mimeType = getMimeType(file.name);

  const isImageFun = (filename: string): boolean => {
    const mimeType = getMimeType(filename);
    return mimeType ? mimeType.startsWith("image/") : false;
  };

  const isArchiveFun = (filename: string): boolean => {
    const mimeType = getMimeType(filename);
    return mimeType
      ? mimeType.startsWith("application/zip") ||
          mimeType.startsWith("application/x-tar") ||
          mimeType.startsWith("application/gzip") ||
          mimeType.startsWith("application/x-bzip2") ||
          mimeType.startsWith("application/x-xz")
      : false;
  };

  const isPdfFun = (filename: string): boolean => {
    const mimeType = getMimeType(filename);
    return mimeType === "application/pdf";
  };

  const isVideoFun = (filename: string): boolean => {
    const mimeType = getMimeType(filename);
    return mimeType ? mimeType.startsWith("video/") : false;
  };

  const isPlainTextFun = (filename: string): boolean => {
    const mimeType = getMimeType(filename);
    return mimeType
      ? mimeType.startsWith("text/") ||
          mimeType.startsWith("application/j") ||
          mimeType === "application/xml"
      : false;
  };

  $: isPlainText = isPlainTextFun(file.name);
  $: isPdf = isPdfFun(file.name);
  $: isArchive = isArchiveFun(file.name);
  $: isImage = isImageFun(file.name);
  $: isVideo = isVideoFun(file.name);

  let plaintextContents: string;

  async function reload() {
    if (isPlainText) {
      plaintextContents = new TextDecoder().decode(await file.read());
    }
  }

  onMount(async () => {
    await reload();
  });
</script>

{#if isPlainText}
  {plaintextContents}
{/if}
