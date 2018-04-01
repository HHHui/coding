let fs = require('fs-extra');
let path = require('path');
let babylon = require('babylon');
let traverse = require("babel-traverse").default;
let klaw = require("klaw");
let _ = require('lodash');

// { 'get/todo':
//    Node {
//      type: 'Identifier',
//      start: 389,
//      end: 397,
//      loc: SourceLocation { start: [Object], end: [Object], identifierName: 'getTodo1' },
//      name: 'getTodo1',
//      filePath: 'new/Todo.js' },
//   'post/todo':
//    Node {
//      type: 'Identifier',
//      start: 550,
//      end: 557,
//      loc: SourceLocation { start: [Object], end: [Object], identifierName: 'addTodo' },
//      name: 'addTodo',
//      filePath: 'new/Todo.js' } 
// }
// getActionCreatorNodes，输入swagger生成的文件，输出其中的actionCreatorNode
function getActionCreatorNodes(filename){
    let promise = new Promise(function(resolve, reject){
        fs.readFile(path.resolve(filename), "utf8", (error, content) => {
            if(error) {
                console.log(error)
            }
        
            let ast = babylon.parse(content, {
                sourceType: 'module',
                plugins: [
                    'objectRestSpread'
                ]
            })
            
            let ret = {};
        
            traverse(ast, {
                enter: function(path) {
                    if(path.node.name === 'makeActionCreator' && path.key === "callee"){
                        let pNode = path.context.parentPath.parent.id;
                        pNode.filePath = filename;
                        let method, url;
                        path.container.arguments[0].body.properties.forEach(prop => {
                            if(prop.type === 'SpreadProperty') return;
                            if(prop.key.name === 'method'){
                                method = prop.value.value;
                            } else if(prop.key.name === 'url') {
                                url = prop.value.value;
                            }
                        })
                        ret[method + '/' + url] = pNode;
                    }
                }
            });
        
            resolve(ret);
        })
    });
    return promise;
}
// getActionCreatorNodes('new/Todo.js')
    // .then(data => console.log(data))

// diff函数, 输入旧目录，新目录，输出为以下格式。
// [
//     {
//         "old": {
//             "type": "Identifier",
//             "start": 389,
//             "end": 396,
//             "loc": {},
//             "name": "getTodo",
//             "filePath": "C:\\Users\\Cabage\\Desktop\\Code\\demos\\try-ast\\old\\Todo.js"
//         },
//         "new": {
//             "type": "Identifier",
//             "start": 389,
//             "end": 397,
//             "loc": {},
//             "name": "getTodo1",
//             "filePath": "C:\\Users\\Cabage\\Desktop\\Code\\demos\\try-ast\\new\\Todo.js"
//         }
//     },
// ]
function diff(oldDir, newDir){
    function getAllFiles(dir){
        return new Promise((resolve, reject) => {
            let items = [];
            klaw(path.resolve(dir))
                .on('data', (item) => {
                    if(item.stats.isFile()){
                        items.push(item.path)
                    }
                })
                .on('end', () => resolve(items)) // => [ ... array of files]
        })
    }
    function filesToActionCreators(files) {
        let promises = [];
        files.forEach(file => promises.push(getActionCreatorNodes(file)))

        return Promise.all(promises)
            .then(items => {
                return items.reduce((prev, curr) => Object.assign(prev,curr), {}) 
            })
    }

    return Promise.all([
        getAllFiles(oldDir),
        getAllFiles(newDir)
    ]).then(dirs => {
        let [oldFiles, newFiles] = dirs;
        return Promise.all([
            filesToActionCreators(oldFiles),
            filesToActionCreators(newFiles)
        ])
    }).then(values => {
        let [o, n] = values;
        let result = {};
        Object.keys(o).forEach(key => result[key] = { old: o[key]})
        Object.keys(n).forEach(key => {
            if(result[key]){
                Object.assign(result[key], { new: n[key] })   
            } else {
                result[key] = { new: n[key] }
            }
        })
        return result;
    }).then(result => _.filter(result, (endpoint) => {
        // 这里可以找出新增，删除，还有修改的接口，但是新增和修改暂时不考虑
        // !endpoint.old || !endpoint.new ||
        return endpoint.old && endpoint.new && (endpoint.old.name !== endpoint.new.name)
    }))
}

diff('old', 'new')
    .then(res => fs.writeFile(path.resolve('result.json'), JSON.stringify(res)))