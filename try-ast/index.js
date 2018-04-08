let fs = require("fs-extra");
let path = require("path");
let babylon = require("babylon");
let traverse = require("babel-traverse").default;
let klaw = require("klaw");
let _ = require("lodash");

function getAllFiles(dir) {
  return new Promise((resolve, reject) => {
    if (fs.lstatSync(path.resolve(dir)).isFile()) {
      resolve([path.resolve(dir)]);
    }
    let items = [];
    klaw(path.resolve(dir))
      .on("data", item => {
        // 去除index.js, babylon会报错
        if (item.stats.isFile() && path.basename(item.path) !== "index.js") {
          items.push(item.path);
        }
      })
      .on("end", () => resolve(items)); // => [ ... array of files]
  });
}

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
function getActionCreatorNodes(filename) {
  function resolveTemplateLiteralToString(Node) {
    let str = "";
    for (let i = 0, j = 0; i < Node.quasis.length; i++) {
      let k = Node.quasis[i];
      str += k.value.raw ? k.value.raw : Node.expressions[j++].name;
    }
    return str;
  }

  let promise = new Promise(function(resolve, reject) {
    fs.readFile(path.resolve(filename), "utf8", (error, content) => {
      if (error) {
        console.log(error);
      }

      let ast = babylon.parse(content, {
        sourceType: "module",
        plugins: ["objectRestSpread"]
      });

      let ret = {};

      traverse(ast, {
        enter: function(path) {
          if (path.node.name === "makeActionCreator" && path.key === "callee") {
            let pNode = path.context.parentPath.parent.id;
            // 为什么debug访问不了pNode?
            pNode.filePath = filename;
            let method, url;
            path.container.arguments[0].body.properties.forEach(prop => {
              if (prop.type === "SpreadProperty") return;
              if (prop.key.name === "method") {
                method = prop.value.value;
              } else if (prop.key.name === "url") {
                // url: 'account'
                // url: queryToUrl('account', query)
                if (prop.value.type === "StringLiteral") {
                  url = prop.value.value;
                } else if (prop.value.type === "CallExpression") {
                  let arg0 = prop.value.arguments[0]; //queryToUrl('xxx' = StringLiteral, query)  queryToUrl(${} = TemplateLiteral, query)
                  if (arg0.type === "StringLiteral") {
                    url = arg0.value;
                  } else if (arg0.type === "TemplateLiteral") {
                    url = resolveTemplateLiteralToString(arg0);
                  }
                } else if (prop.value.type === "TemplateLiteral") {
                  url = resolveTemplateLiteralToString(prop.value);
                }
              }
            });
            ret[method + "/" + url] = pNode;
          }
        }
      });

      resolve(ret);
    });
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
function diff(oldDir, newDir) {
  function filesToActionCreators(files) {
    let promises = [];
    files.forEach(file => promises.push(getActionCreatorNodes(file)));

    return Promise.all(promises).then(items => {
      return items.reduce((prev, curr) => Object.assign(prev, curr), {});
    });
  }

  return Promise.all([
    getAllFiles(path.resolve(oldDir)),
    getAllFiles(path.resolve(newDir))
  ])
    .then(dirs => {
      let [oldFiles, newFiles] = dirs;
      return Promise.all([
        filesToActionCreators(oldFiles),
        filesToActionCreators(newFiles)
      ]);
    })
    .then(values => {
      let [o, n] = values;
      let result = {};
      Object.keys(o).forEach(key => (result[key] = { old: o[key] }));
      Object.keys(n).forEach(key => {
        if (result[key]) {
          Object.assign(result[key], { new: n[key] });
        } else {
          result[key] = { new: n[key] };
        }
      });
      return result;
    })
    .then(result =>
      _.filter(result, endpoint => {
        // 这里可以找出新增，删除，还有修改的接口，但是新增和修改暂时不考虑
        // !endpoint.old || !endpoint.new ||
        return (
          endpoint.old &&
          endpoint.new &&
          endpoint.old.name !== endpoint.new.name
        );
      })
    );
}

// 上面是处理actionCreator name的
// 下面是为了处理state name的
function extractAllState(filename) {
  let promise = new Promise(function(resolve, reject) {
    fs.readFile(path.resolve(filename), "utf8", (error, content) => {
      if (error) {
        console.log(error);
      }

      let ast = babylon.parse(content, {
        sourceType: "module",
        plugins: ["objectRestSpread"]
      });

      let ret = [];

      traverse(ast, {
        enter: function(path) {
          if (path.node.name === "buildAsyncState" && path.key === "callee") {
            ret.push(path.container.arguments[1].properties[0].key.name);
          }
        }
      });

      resolve(ret);
    });
  });
  return promise;
}

//玄学 return [],我堵他order是相同的
function getStateDiff(oldDir, newDir) {
  let oldState = [];
  let newState = [];

  let fileIterateOrder = [];
  let a, b;

  getAllFiles(path.resolve(oldDir))
    .then(filePaths => {
      let promises = [];
      filePaths.forEach(filepath => {
        promises.push(extractAllState(filepath));
        let relapath = filepath.substr(oldDir.length);
        fileIterateOrder.push(newDir + relapath);
      });

      a = Promise.all(promises).then(arrs => {
        arrs.forEach((arr, index) => {
          oldState = oldState.concat(arr);
          // console.log(fileIterateOrder[index])
          // console.log("old", arr.length)
        });
        return oldState;
      });

      let newPromise = [];
      fileIterateOrder.forEach(path => {
        newPromise.push(extractAllState(path));
      });

      b = Promise.all(newPromise).then(arrs => {
        arrs.forEach(arr => {
          newState = newState.concat(arr);
          // console.log("new", arr.length)
        });
        return newState;
      });

      return [a, b];
    })
    .then(promiseArr => {
      Promise.all(promiseArr).then(() => {
        console.log(oldState.length, newState.length);
        let ret = {};
        for (let i = 0; i < oldState.length; i++) {
          ret[oldState[i]] = newState[i];
        }
        fs.writeFile(path.resolve("stateDiff.json"), JSON.stringify(ret));
      });
    });
}

// 找出所有@connect的mapStateToProps
function collectConnectInfos(dir) {
  return getAllFiles(path.resolve(dir))
    .then(filepaths => {
      return filepaths.filter(filepath => path.extname(filepath) === ".jsx");
    })
    .then(jsxes => {
      let promises = [];
      jsxes.forEach(jsx => {
        let promise = 
        fs
          .readFile(jsx, "utf8")
          .then(content => {
            try {
              let collectInfo = [];
              let ast = babylon.parse(content, {
                sourceType: "module",
                plugins: [
                  "jsx",
                  "objectRestSpread",
                  "decorators",
                  "classProperties"
                  // 'exportDefaultFrom', 这个插件不起作用~
                ]
              });
              traverse(ast, {
                enter: function(path) {
                  if (
                    path.node.type === "Decorator" &&
                    path.node.expression.callee &&
                    path.node.expression.callee.name === "connect"
                  ) {
                    //@connect(mapStateToProps, mapActionToProps)
                    // get first argument
                    let mapStateToProps = path.node.expression.arguments[0];
                    if (mapStateToProps.type === "ArrowFunctionExpression") {
                      // @connect( state => ({a: state.ui.showsidebar }))
                      mapStateToProps.body.properties.forEach(prop => {
                        let v = prop.value;
                        if (
                          v.type === "MemberExpression" &&
                          v.object.object &&
                          !v.object.object.object &&
                          v.object.property.name.indexOf("BySwaggerGen") !== -1
                        ) {
                          let level3Node = v.property;
                          level3Node.filepath = jsx;
                          collectInfo.push(level3Node);
                        }
                      });
                    }
                  }
                }
              });
              return collectInfo;
            } catch (error) {
              //export default from 插件会报错，但是都是一些index用到，所以忽略算了。
              return [];
            }
          });
        promises.push(promise);
      });
      return promises;
    })
    .then(promises => {
      return Promise.all(promises)
        .then(infos => {
          let allInfo = [];
          infos.forEach(info => allInfo = allInfo.concat(info));
          return allInfo;
        })
    });
}

function collectActionCreatorCall(dir) {
  return getAllFiles(path.resolve(dir))
  .then(filepaths => {
    return filepaths.filter(filepath => path.extname(filepath) === ".jsx");
  })
  .then(jsxes => {
    let promises = [];
    jsxes.forEach(jsx => {
      let promise = 
      fs
        .readFile(jsx, "utf8")
        .then(content => {
          try {
            let importedActionCreator = [];
            let actionCreatorCallNode = [];
            let ast = babylon.parse(content, {
              sourceType: "module",
              plugins: [
                "jsx",
                "objectRestSpread",
                "decorators",
                "classProperties"
                // 'exportDefaultFrom', 这个插件不起作用~
              ]
            });
            
            traverse(ast, {
              enter: function(path) {
                if (
                  path.node.type === 'ImportDeclaration' && 
                  path.node.source.value.indexOf('swaggerGen/') !== -1
                ) {
                  path.node.specifiers.forEach(specifier => {
                    importedActionCreator.push(specifier.imported.name);
                  })
                }

                if (
                  path.node.type === 'ExpressionStatement' &&
                  path.node.expression.type === 'CallExpression' &&
                  path.node.expression.callee.type === 'MemberExpression' &&
                  importedActionCreator.indexOf(path.node.expression.callee.property.name) !== -1
                ) {
                  let node = path.node.expression.callee.property;
                  node.filepath = jsx;
                  actionCreatorCallNode.push(node);
                }
              }
            });
            
            return actionCreatorCallNode;
          } catch (error) {
            console.log(`${jsx} 解析出错`)
            //export default from 插件会报错，但是都是一些index用到，所以忽略算了。
            return [];
          }
        });
      promises.push(promise);
    });
    return promises;
  })
  .then(promises => {
    return Promise.all(promises)
      .then(infos => {
        let allInfo = [];
        infos.forEach(info => allInfo = allInfo.concat(info));
        return allInfo;
      })
  });
}

function actionCreatorNameDiffToMap() {
  let result = {};
  return fs
    .readFile('./actionCreatorNameDiff.json', "utf8")
    .then(JSON.parse)
    .then(arr => {
      arr.forEach(change => {
        if(result[change.old.name]) {console.log("actionCreatorName有重复")}
        result[change.old.name] = change.new.name;
      })
      return result;
    })
}

// get action creator diff
// diff('/Users/huizhang/Code/creams-web2/app/redux/modules/swaggerGen', '/Users/huizhang/Code/creams-web2/genCode/swaggerGenNew')
  // .then(res => fs.writeFile(path.resolve('actionCreatorNameDiff.json'), JSON.stringify(res)))

// actionCreatorNameDiffToMap()
  // .then((ret) => fs.writeFile(path.resolve("actionCreatorNameDiffMap.json"), JSON.stringify(ret)));

// need to change this.props.getxxx() getxxx一样需要改。
// collectActionCreatorCall('/Users/huizhang/Code/creams-web2/app')
  // .then((ret) => fs.writeFile(path.resolve("actionCreatorCall.json"), JSON.stringify(ret)));


// getStateDiff('/Users/huizhang/Code/creams-web2/genCode/swaggerGen', '/Users/huizhang/Code/creams-web2/genCode/swaggerGenNew')

// collectConnectInfos(`/Users/huizhang/Code/creams-web2/app`)
collectConnectInfos(`/Users/huizhang/Code/coding/try-ast/mapStateToProps`)
  .then((ret) => fs.writeFile(path.resolve("collect.json"), JSON.stringify(ret)));