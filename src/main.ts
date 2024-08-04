import "./app.scss";
import App from "./App.svelte";

const kitUrl = import.meta.env.VITE_FA_KIT;

if (kitUrl) {
  const script = document.createElement("script");
  script.src = kitUrl;
  script.async = true;
  document.head.appendChild(script);
}

const app = new App({
  target: document.getElementById("app")!,
});

export default app;
