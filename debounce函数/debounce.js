// 关于debouncing和throttling的解释
// https://css-tricks.com/debouncing-throttling-explained-examples/

//simple debounce
function debounce1(fn, wait){
    //4.记得用闭包记录timer，否则timer一直是undefined
    var timer;
    //返回wrapper函数
    return function(){
        //1.将this和参数从wrapper函数传递给实际要调用函数fn
        var self = this
        var args = arguments
        //3.考虑到连续触发fn的时候，我们得确保在wait时间内只执行一次fn,
        clearTimeout(timer)
        //2.使用timeout在等待wait时间后执行我们的函数
        timer = setTimeout(function(){
            fn.apply(self, args)
        }, wait)
    }
}
//这个函数能work，但是比如一直快速触发的话就会造成fn永远也不会执行
//这个功能和lodash的debounce不传任何参数是一样的

//尝试实现leading形式的debounce函数，
//在一开始就触发fn,
function debounce2(fn, wait){
    var timer;
    var lock = false;
    //返回wrapper函数
    return function(){
        var self = this
        var args = arguments

        clearTimeout(timer)
        //2.然后在wait时间停止触发，所以加上lock参数，然后参照debounce1
        if(!lock) {
            //1.既然一开就触发，我就直接调用函数
            fn.apply(self, args)
            lock = true;
        }
        timer = setTimeout(function(){
            lock = false
            console.log('wait时间到，解锁')
        }, wait)
    }
}
//这个函数跟lodash的leading有一点区别, lodash的debounce函数还有一个参数trailing默认为true
//trailing在和leading一起作用时，
//如果指点一下，那么fn触发一次
//如果点夺下，leading会直接触发一次，然后后续fn在wait时间内不会触发，最后trailing触发一次
//说不清楚，在浏览器中直接试验比较好懂

//添加trailing功能
function debounce3(fn, wait, options){
    options = {
        trailing: options.trailing || true
    }
    var timer;
    var lock = false;
    var triggeredWhenLock = false;
    //返回wrapper函数
    return function(){
        var self = this
        var args = arguments

        clearTimeout(timer)
        //2.然后在wait时间停止触发，所以加上lock参数，然后参照debounce1
        if(!lock) {
            //1.既然一开就触发，我就直接调用函数
            fn.apply(self, args)
            lock = true;
        } else {
            triggeredWhenLock = true;
        }

        timer = setTimeout(function(){
            lock = false
            console.log('wait时间到，解锁')
            if(triggeredWhenLock) {
                fn.apply(self, args);
                triggeredWhenLock = false
            }
        }, wait)
    }
}

//let's implement all above functional in one function
//功能都ok，但是好像有点长
function debounceOld(fn, wait, options) {
    options = options || {}
    options = {
        leading: options.leading || false,
        trailing: options.trailing && true
    }
    var timer
    var lock = false
    var triggerDuringLock = false

    return function () {
        var self = this
        var args = arguments

        if(options.leading) {
            clearTimeout(timer)
            if(!lock) {
                fn.apply(self, args);
                lock = true
            } else {
                if(options.trailing) {
                    triggerDuringLock = true
                }
            }
            timer = setTimeout(function () {
                lock = false
                if(triggerDuringLock) {
                    fn.apply(self, args)
                    triggerDuringLock = false
                }
            }, wait)
        } else {
            clearTimeout(timer)

            timer = setTimeout(function () {
                fn.apply(self, args)
            }, wait)
        }
    }
}

function debounce(fn, wait, options) {
    options = options || {}
    options = {
        leading: options.leading || false,
        trailing: options.trailing && true
    }
    var timer
    var lock = false
    var triggerDuringLock = false

    return function () {
        var self = this
        var args = arguments

        clearTimeout(timer)
        if(options.leading) {
            if(!lock) {
                fn.apply(self, args);
                lock = true
            } else if(options.trailing){
                triggerDuringLock = true
            }
        }
        timer = setTimeout(function () {
            if(!options.leading || triggerDuringLock) {
                fn.apply(self, args)
            }
            lock = false
            triggerDuringLock = false
        }, wait)
    }
}
