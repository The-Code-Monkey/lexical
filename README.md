# lexical

This is a wrapper around the meta lexical library. below is how you install and use it. PRs are welcome.

```bash
npm i -S @techstack/lexical
```

There are two ways to use it the all included solution or the composable way.

All included

```jsx
import Editor from "@techstack/lexical";

import "@techstack/lexical/css";

<Editor name="editor" onChange={fn} placeholder="" value="" />
