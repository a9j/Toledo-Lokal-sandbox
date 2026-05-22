import { createRoot } from "react-dom/client";
import App, { isStaleChunkError, recoverFromStaleChunk } from "./App.tsx";
import "./index.css";

window.addEventListener("error", (event) => {
  if (event.error && isStaleChunkError(event.error)) {
    event.preventDefault();
    recoverFromStaleChunk();
  }
});

window.addEventListener("unhandledrejection", (event) => {
  if (isStaleChunkError(event.reason)) {
    event.preventDefault();
    recoverFromStaleChunk();
  }
});

createRoot(document.getElementById("root")!).render(<App />);
