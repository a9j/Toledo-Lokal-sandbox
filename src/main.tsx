import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

window.addEventListener("error", (event) => {
  if (event.error && App.isStaleChunkError?.(event.error)) {
    event.preventDefault();
    App.recoverFromStaleChunk?.();
  }
});

window.addEventListener("unhandledrejection", (event) => {
  if (App.isStaleChunkError?.(event.reason)) {
    event.preventDefault();
    App.recoverFromStaleChunk?.();
  }
});

createRoot(document.getElementById("root")!).render(<App />);
