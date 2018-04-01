'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import {Uri} from 'vscode'
import diffs from './diff'
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "super-rename" is now active!');
    
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('extension.sayHello', async() => {
        diffs.forEach(({old: o, new: n}) => {
            vscode.commands.executeCommand('vscode.open', Uri.file(o.filePath))
                .then(() => {
                    // -1,+1 可能是因为babylon parser和vscode的index从0或1开始的区别，这里随便凑了一下
                    vscode.commands.executeCommand('vscode.executeDocumentRenameProvider',
                        Uri.file(o.filePath),
                        new vscode.Position(o.loc.start.line - 1, o.loc.start.column),
                    n.name)
                    .then(edit => {
                        if (!edit) {
                            return false;
                        }
                        return vscode.workspace.applyEdit(edit);
                    })
                })
        })
        vscode.window.showInformationMessage('Finished');
    });

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}