1. 先试了一下vscode的F2重构，发现只要路径引用可以识别，会进行全局的重构，那只要解决了import alias就可以手工实现重构
2. 于是搜vscode resolve alias找到下面这篇文章。
https://medium.com/@justintulk/solve-module-import-aliasing-for-webpack-jest-and-vscode-74007ce4adc9
发现可以设置jsconfig.json文件的paths属性来告诉vscode如何resolve alias，
测试配置是否成功，配置后直接在import处Ctrl+click看看能不能跳转过去
3. 路径问题解决后，已经可以F2完成重构，但是问题是我们有几百个action creator,一个个手动操作好愚蠢。
我需要一个自动化的方案。

目前思路:
<!-- 如何生成下面这个obj -->
var obj = {
    getBankAccount: getAccount 
}

obj.keys().foreach(key => 'getBankAccount'.F2('getAccount'))

Abstract syntax trees on Javascript
https://medium.com/@jotadeveloper/abstract-syntax-trees-on-javascript-534e33361fc7

4. 通过脚本自动化完成这个任务，我们需要通过脚本来跑rename symbol, 我们需要找到这个api, 搜vscode rename symbol extension，找到了https://stackoverflow.com/questions/46839773/vscode-extension-rename-symbols。

5. 试着跑了以前stackoverflow上的代码，直接用node跑是不行滴，想到了昨天看的vscode extension里也import了vscode，所以跟着教程生成了一个extension，复制黏贴代码，稍微修改了一下，成功！

所以目前使用代码完成F2的动作已经完成。下一个问题，如何生成obj。
6. 考虑用前面看过的那篇ast的文章，parse一下生成ast，然后遍历找到函数定义，还可以顺便得到函数的位置，在后面用的到。但是esprima只支持到es2017，但是SwaggerGen生成的文件使用了{...rest},Object Spread Syntax,根据https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax所显示，这个是es2018的内容，所以会报错。又看到网上有问babel底层用的是esprima吗？回答不是的，babel用的叫babylon，默认也是支持到es2017，但是应该可以通过插件来支持stage-0.
7.使用babylon解析成功了。下一步就是遍历AST找到我们想要的action creator名字
8.用了babel-traverse遍历了一下，主要是每个像样的文档，我也不了解AST的结构，所以只能debug模式来回找，难度不大，就是挺烦的，然后想了一下obj的正确结构，然后就是搜API写，没什么难度
{
    [method + "/" + url]: {
        new: NodeInfo,
        old: NodeInfo
    }
}
9，下一步就是将obj导入extension，开始测试了~
10, 测试中遇到一个问题,“rejected promise not handled within 1 second”， extension里的promise默认1s内没有完成就会被强制reject掉。

<!-- 11. 发现一个问题，发现虽然rename调用成功了，但是并没有进行全局重构，发现加上jsconfig就好了。 -->
10.5 完善了index.js，已经可以成功生成所有文件的diff了。 
11. rename symbol很不稳定，比如刚打开编辑器直接跑，一般都会失败，或者action creator的名字改了，但是引用的名字没有改。但是打开浏览器等一会再跑(demo)，就可以成功全局修改。似乎VScode的IntellSense插件读取项目有关？（有点没头绪)
12. All finished~ 可以通过settimeout来让async变成sync来解决异步IO错误！！！我真是他妈的天才
13. 才发现mapStateToProps也是绑定的方法名，改成了和actionCreator name一样。
14. 用AST生成相应的meta data，没什么技术含量，而且依赖于Object.keys()生成的key是有顺序的，（虽然理论上是没顺序的）
15. 还剩最后的迭代，因为前段后端一直在update，所以常常发现冲突。不过想了一下可以迭代一下方法来搞定
假设后台没改方法名，我们重新SwaggerGEN，然后将新生成的gen文件复制进redux目录，理论上npm start启动应该是没问题的。（如果有问题，说明前端或者后端又有人改出问题了）。然后使用新的template重新生成SwaggerGEN目录，然后生成meta，跑extension，这一步如果出问题，那就是state name有问题，action creator前一次已经测试过了。
16. 开始实际操作，老template生成新后端的SwaggerGen，复制到redux下，两个问题，1. 嵌套目录path加上../ 2. 老的SwaggerGen/index.js PropertyBySwaggerGenV2是错误的，但是不影响后续操作，所以将错就错，将生成的SwaggerGen的index.js中的PropertyContractsv2BySwaggerGen改成PropertyBySwaggerGenV2。这样能启动，但是跑起来console里有不少error.比如刚登陆 `Property `columns` of component `Connect(Table)` has invalid PropType notation inside arrayOf`.