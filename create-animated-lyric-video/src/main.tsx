import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/noto-sans-jp";
import "./index.css";
import App from "./App";
import RenderApp from "./RenderApp";

// This private-looking route is still ordinary frontend code: it is only used by
// the server's headless browser, and does not render or encode in the user's browser.
const isServerRenderer = new URLSearchParams(window.location.search).get("__render") === "1";
createRoot(document.getElementById("root")!).render(
  <StrictMode>{isServerRenderer ? <RenderApp /> : <App />}</StrictMode>
);
