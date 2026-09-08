import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App.tsx";
import "./app/styles/globals.css";

const rootElement = document.getElementById("root");

if (rootElement === null) {
  throw new Error('Elemento raíz "#root" no encontrado');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
