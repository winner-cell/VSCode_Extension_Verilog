# Verilog Testbench & Instance

Generate Verilog module instances and testbenches directly from your Verilog source — no external dependencies required.

> Forked from [truecrab/VSCode_Extension_Verilog](https://github.com/truecrab/VSCode_Extension_Verilog). Rewritten in pure TypeScript, removing the original Python dependency.

> **Minimum VS Code version: 1.23.0**

## Features

Two commands are available via `Ctrl+Shift+P`:

- **Testbench** — generates a complete testbench module from the active `.v` file and opens it in a new editor tab.
- **Instance** — generates a module instantiation template and inserts it at the cursor position in the active editor.

![command palette](https://github.com/truecrab/VSCode_Extension_Verilog/raw/master/images/fig1.png)

## Requirements

- **VS Code `>= 1.23.0`** (required — the extension will not install on older versions)
- No other external dependencies (Python is **not** required)

## Usage

1. Open a Verilog (`.v`) file in the editor.
2. Press `Ctrl+Shift+P` and select **Instance** or **Testbench**.
3. The generated code is inserted directly into your editor — no terminal interaction needed.

## Known Issues

- If installation fails, make sure your VS Code version is 1.23 or newer.

## Release Notes

### 1.0.6

Removed Python dependency. The extension is now self-contained (pure TypeScript). Instance command inserts code at cursor; Testbench command opens a new editor tab.

### 1.0.5

Fixed file encoding handling for Chinese (GBK) encoded Verilog files.

### 1.0.0

Initial release (2018/05/07). Generate testbench and instance for Verilog modules.

---

**Enjoy!**
