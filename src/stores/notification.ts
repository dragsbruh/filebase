import { writable } from "svelte/store";

export const notification = writable({
  level: "",
  content: null,
} as {
  level: string;
  content: string | null;
});

export function notify(content: string, level: string) {
  notification.set({
    level,
    content: content
  });
}

export default notify;
