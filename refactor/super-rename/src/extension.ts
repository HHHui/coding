'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import {Uri} from 'vscode'
import * as fs from 'fs';
import * as path from 'path';
import actionCreatorNameDiff from './temp/actionCreatorNameDiff'
import actionCreatorNameDiffMap from './temp/actionCreatorNameDiffMap'
import actionCreatorCall from './temp/actionCreatorCall'

import stateDiff from './temp/stateDiff'
import stateNeedtoChange from './temp/collect'
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "super-rename" is now active!');
    
    let disposable = vscode.commands.registerCommand('extension.sayHello', async() => {
        // let i = 0;
        // function step() {
        //     if(i >= actionCreatorNameDiff.length) return;
        //     let {old: o, new: n} = actionCreatorNameDiff[i];
        //     vscode.commands.executeCommand('vscode.open', Uri.file(o.filePath))
        //     .then(() => {
        //         // -1,+1 可能是因为babylon parser和vscode的index从0或1开始的区别，这里随便凑了一下
        //         vscode.commands.executeCommand('vscode.executeDocumentRenameProvider',
        //             Uri.file(o.filePath),
        //             new vscode.Position(o.loc.start.line - 1, o.loc.start.column),
        //         n.name)
        //         .then(edit => {
        //             if (!edit) {
        //                 console.log('!edit return~');
        //                 return false;
        //             }
        //             return vscode.workspace.applyEdit(edit);
        //         })
        //         .then(() => {
        //             setTimeout(() => {
        //                 i++;
        //                 step()
        //             }, 200);
        //         })
        //     })
        // }
        // step();
        
        // let lastFile = '', lastline = -1, offset = 0;
        // let error = {};
        // function changeActionCreatorCall(i:number){
        //     if(i >= actionCreatorCall.length) {
        //         fs.writeFile(path.resolve("/Users/huizhang/actonCreatorError.json"), JSON.stringify(error));
        //         return 
        //     };
        //     let state = actionCreatorCall[i];
        //     if(state.loc.start.line !== lastline || state.filepath !== lastFile){
        //         offset = 0;
        //     }
        //     lastline = state.loc.start.line;
        //     lastFile = state.filepath;
        //     vscode.commands.executeCommand('vscode.open', Uri.file(state.filepath))
        //         .then(() => {
        //             let editor = vscode.window.activeTextEditor;
        //             if(editor){
        //                 editor.edit(function cb(edit){
        //                     if(!actionCreatorNameDiffMap[state.name]) {
        //                         if(error[state.name]){
        //                             error[state.name].push(actionCreatorCall[i])
        //                         } else {
        //                             error[state.name] = [actionCreatorCall[i]]
        //                         }
        //                         return;
        //                     }
        //                     edit.replace(new vscode.Range(
        //                         new vscode.Position(state.loc.start.line - 1, state.loc.start.column + offset),
        //                         new vscode.Position(state.loc.end.line - 1, state.loc.end.column + offset),
        //                     ), actionCreatorNameDiffMap[state.name]);
        //                     offset = offset + actionCreatorNameDiffMap[state.name].length - state.name.length;
        //                 })
        //             }
        //         })
        //         .then(() => {
        //             setTimeout(() => {
        //                 changeActionCreatorCall(++i)
        //             }, 300);
        //         })
        //         .catch((error) => {
        //             console.log(error)
        //         })
        // }
        // changeActionCreatorCall(0);
        
        let lastFile = '', lastline = -1, offset = 0;
        let error = {};
        function changeActionCreatorCall(i:number){
            if(i >= stateNeedtoChange.length){
                fs.writeFile(path.resolve("/Users/huizhang/stateError.json"), JSON.stringify(error));
                return;
            } 
            let state = stateNeedtoChange[i];
            if(state.loc.start.line !== lastline || state.filepath !== lastFile){
                offset = 0;
            }
            lastline = state.loc.start.line;
            lastFile = state.filepath;
            vscode.commands.executeCommand('vscode.open', Uri.file(state.filepath))
                .then(() => {
                    let editor = vscode.window.activeTextEditor;
                    if(editor){
                        editor.edit(function cb(edit){
                            if(!stateDiff[state.name]) {
                                if(error[state.name]){
                                    error[state.name].push(stateNeedtoChange[i])
                                } else {
                                    error[state.name] = [stateNeedtoChange[i]]
                                }
                                return;
                            }
                            edit.replace(new vscode.Range(
                                new vscode.Position(state.loc.start.line - 1, state.loc.start.column + offset),
                                new vscode.Position(state.loc.end.line - 1, state.loc.end.column + offset),
                            ), stateDiff[state.name]);
                            offset = offset + stateDiff[state.name].length - state.name.length;
                        })
                    }
                })
                .then(() => {
                    setTimeout(() => {
                        changeActionCreatorCall(++i)
                    }, 300);
                })
                .catch((error) => {
                    console.log(error)
                })
        }
        changeActionCreatorCall(0);
    });

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}