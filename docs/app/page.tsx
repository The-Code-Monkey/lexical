'use client'

import styles from "./page.module.css";

import EditorContainer from "@techstack/lexical";
import {useState} from "react";

import "@techstack/lexical/css"

export default function Home() {
  const [state, setState] = useState("testing")

  return (
    <main className={styles.main}>
        {typeof window !== "undefined" && (
            <EditorContainer name="test" onChange={setState} value={state} />
        )}
    </main>
  );
}
