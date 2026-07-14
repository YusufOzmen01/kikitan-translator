import React from "react"
import ReactDOM from "react-dom/client";
import App from "./page";

import "@fontsource/inter";
import "./globals.css";
import {init} from "./util/photino.ts";

// To get rid of TS compilation errors
(() => { return React.StrictMode })();

init();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <App />
);
