let fs = require('fs-extra');
let path = require('path');
let babylon = require('babylon');
let traverse = require("babel-traverse").default;
let klaw = require("klaw");

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
                        // let actionCreatorName = pNode.name;
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

// getActionCreatorNames('new/Todo.js')
    // .then(data => console.log(data))

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

    Promise.all([
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
        console.log(JSON.stringify(result))
    })
}

diff('old', 'new')