"use client";

import "@techstack/lexical/css";

import EditorContainer from "@techstack/lexical";
import { useState } from "react";

import styles from "./page.module.css";

export default function Home() {
  const [state, setState] = useState("testing");

  return (
    <main className={styles.main}>
      {typeof window !== "undefined" && (
        <EditorContainer
          name="test"
          onChange={setState}
          placeholder="Test"
          value={state}
        />
      )}
    </main>
  );
}
