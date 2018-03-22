//前几天看了generator,今天又看了async/await
//感觉generator+co = async/await 疑惑so google之找到了阮一峰的关于异步的几篇blog,
// http://www.ruanyifeng.com/blog/2015/05/thunk.html
// 因为这里的thunkify和后面的run函数比较绕，就尝试自己写了一下。

var fs = require('fs');
/*
* thunkify函数的作用？
* 如现在的fs.readFile('path/to/file', function(err, data){xxx})
*
* var gen = function* (){
      var r1 = yield readFile('/etc/fstab');
      console.log(r1.toString());
      var r2 = yield readFile('/etc/shells');
      console.log(r2.toString());
  };
*
* generator函数写起来很顺溜，但是跑起来有个问题，我们需要在generator外部调用next()函数，将JS的执行权转回generator里
* var iterator = gen();
* var result = iterator.next();
* result.value(function(err,data)).....
*
* 如果每次都要这样跑，那就很傻逼了，我们需要的是像co那样，自动帮我们跑，那就很优秀了。
* 如何让他自动跑：
* 1. 如果我们yield返回的是Promise,注意：接收到Promise的地方就是在外部,也就是iterator所在的环境
* ,我们可以传一个function给Promise.then, 在函数中可以调用iterator.next(), 然后又收到一个Promise这样就循环了
* ,循环了我们就可以写一个函数自动跑。
* 总结一下自动跑的条件：
* 1. yield 返回的内容得是像Promise这样接受一个fn(fn在外部),我们在这个fn里调用iterator.next
*
*
*
* */

//就像柯里化，延迟了一步执行，看起来没什么卵用，但是这延迟却是能否实现自动跑的关键。
//xxx(foo,bar,callback)
//xxx(foo,bar)(callback)

//不考虑ctx,不考虑callback是否会被fn多次调用问题
function thunkify(fn){
    return function (...args) {
        return function(callback){
            fn.apply(null, args.push(callback))
        }
    }
}

//tj版thunkify
function thunkify(fn){
    return function(){
        var args = new Array(arguments.length);
        var ctx = this;

        for(var i = 0; i < args.length; ++i) {
            args[i] = arguments[i];
        }

        return function(done){
            var called;

            //这个传入的匿名函数原本就是我们的callback函数
            //是会被fn调用的，或者像下面这样出错了我们传入err调用
            //这里因为再一次包装是为了防止callback被fn多次调用, 因为我们在fn里要调用itrator.next,
            //所以多次调用会造成未知的后果。
            args.push(function niming(){
                if (called) return;
                called = true;
                done.apply(null, arguments);
            });

            try {
                fn.apply(ctx, args);
            } catch (err) {
                done(err);
            }
        }
    }
};

let readFile = thunkify(fs.readFile);
//写一个run函数，run(gen), 自动跑完gen
var gen = function* (){
    var r1 = yield readFile('./text', "utf8");
    console.log(r1);
    var r2 = yield readFile('./other', "utf8");
    console.log(r2);
};

function run(gen) {
    var iterator = gen();

    // 我写的错误版本
    // function next(data) {
    //     var result = iterator.next(data)
    //     if(result.done) return;
    //     else
    //         result.value(function(err, data){
    //             console.log(err, data)
    //         })

    // function next(data) {
    function next(err, data) {
        var result = iterator.next(data)
        if(result.done) return;
        else
        //    错误点：console.log相当于使用data的业务代码，generator中的同步代码已经使用了，在这里只需要搬运一下data，然后next
        //     result.value(function(err, data){
        //         console.log(err, data)
        //     })
            result.value(next)
    }

    next();
}
run(gen)