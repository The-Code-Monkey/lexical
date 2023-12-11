import dts from "bun-plugin-dts";

await Bun.build({
    entrypoints: ['./src/index.tsx'],
    outdir: './dist/esm',
    target: 'browser',
    format: 'esm',
    plugins: [
        dts(),
    ],
    minify: true,
    externals: [
        'react'
    ]
});