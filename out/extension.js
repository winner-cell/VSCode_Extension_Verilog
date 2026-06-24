"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const verilogParser_1 = require("./verilogParser");
const vInstance_Gen_1 = require("./vInstance_Gen");
const vTbgenerator_1 = require("./vTbgenerator");
function activate(context) {
    const instanceCmd = vscode.commands.registerCommand('extension.instance', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor');
            return;
        }
        try {
            const info = (0, verilogParser_1.parseModule)(editor.document.fileName);
            const code = (0, vInstance_Gen_1.generateInstance)(info);
            editor.edit(eb => {
                eb.insert(editor.selection.active, code);
            });
            vscode.window.showInformationMessage('Generate instance successfully!');
        }
        catch (e) {
            vscode.window.showErrorMessage(`Failed to generate instance: ${e}`);
        }
    });
    const testbenchCmd = vscode.commands.registerCommand('extension.testbench', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor');
            return;
        }
        try {
            const info = (0, verilogParser_1.parseModule)(editor.document.fileName);
            const code = (0, vTbgenerator_1.generateTestbench)(info);
            vscode.workspace.openTextDocument({ content: code, language: 'verilog' }).then(doc => {
                vscode.window.showTextDocument(doc);
            });
            vscode.window.showInformationMessage('Generate testbench successfully!');
        }
        catch (e) {
            vscode.window.showErrorMessage(`Failed to generate testbench: ${e}`);
        }
    });
    context.subscriptions.push(instanceCmd, testbenchCmd);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
