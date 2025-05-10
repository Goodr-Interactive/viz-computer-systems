# Viz-Computer-Systems
A collection of interactive visualizations for Operating Systems and Computer Architecture concepts

### Development Environment Setup

1. Install [bun](https://bun.sh/docs/installation)
2. Install dependencies:
```sh
bun install
```

### Development Mode

To run the app in development mode, use the following command:

```sh
bun run dev
```

### Build

To build a production version of the app, run the following command:

```sh
bun run build
```

### CI

A CI script can be found under `.github/workflows/ci.yaml`, in order to pass CI the following commands must run without error:

```sh
bun run check-types
bun run check-lint
bun run check-format
bun run build
```

CI runs on all non-draft PRs pointed at `dev` or `main`

### Useful Links

- [ShadCN](https://ui.shadcn.com/docs)
- [ESLint](https://eslint.org/docs/latest/)
- [Vite](https://vite.dev/guide/)
- [Tailwind](https://tailwindcss.com/docs/installation/using-vite)
- [Bun](https://bun.sh/docs)
- [OSTEP](https://pages.cs.wisc.edu/~remzi/OSTEP/)
