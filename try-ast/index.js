let fs = require('fs')
let path = require('path')
let babylon = require('babylon')
let traverse = require("babel-traverse").default;

function diff(filename){
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
            
            let result = [];
        
            traverse(ast, {
                enter: function(path) {
                    if(path.node.name === 'makeActionCreator' && path.key === "callee"){
                        let pNode = path.context.parentPath.parent.id;
                        let actionCreatorName = pNode.name;
                        let method, url, key;
                        path.container.arguments[0].body.properties.forEach(prop => {
                            if(prop.type === 'SpreadProperty') return;
                            if(prop.key.name === 'method'){
                                method = prop.value.value;
                            } else if(prop.key.name === 'url') {
                                url = prop.value.value;
                            }
                        })
                        key = method + '/' + url;
                        result.push(key);
                    }
                }
            });
        
            resolve(result);
        })
    });
    return promise;
}

diff('new/Todo.js')
    .then(data => console.log(data))