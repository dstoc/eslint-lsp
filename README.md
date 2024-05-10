# eslint-lsp

## What is this?

A fast language server that invokes eslint on file changes and reports the results as diagnostics. It works with [helix](https://helix-editor.com), it may or may not work with other editors.

## Why?

I couldn't get mattn/efm-langserver working properly, and even if I did I'd still need something like mantoni/eslint_d.js to make it fast.

## Caveats

* It only seems to find the eslint config if it's in the editor's root_dir. This could probably be fixed, in the worst case the LSP can search for the root marker (.git).

## Use

* [Install pnpm](https://pnpm.io/installation)
* clone this repo
* `pnpm i`

### Helix

`~/.config/helix/languages.toml`

```toml
[language-server.eslint]
command = "~/eslint-lsp/run"

[[language]]
name = "typescript"
language-servers = [
  { name = "eslint", only-features = [ "diagnostics" ] },
  { name = "typescript-language-server", except-features = [ "format" ] }
]
```
