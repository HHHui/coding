//文章作者发现的bug，但是我没看懂。
//应该是边界情况的问题
var _ = require('lodash');

var limit = function (func, wait, debounce) {
    var timeout;
    return function () {
        var context = this, args = arguments;
        var throttler = function () {
            timeout = null;
            func.apply(context, args);
        };
        if (debounce) clearTimeout(timeout);
        if (debounce || !timeout) timeout = setTimeout(throttler, wait);
    };
};

// Returns a function, that, when invoked, will only be triggered at most once
// during a given window of time.
throttle = function (func, wait) {
    return limit(func, wait, false);
};

// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds.
debounce = function (func, wait) {
    return limit(func, wait, true);
};

var now = new Date();
var test = function(a){ console.log(a + (new Date() - now)); }
throttled_test = _.throttle(test, 20);
setTimeout(function(){ throttled_test('Hi.');},20);
setTimeout(function(){ throttled_test('Hi.');},20);
setTimeout(function(){ throttled_test('You should see me only once.');},40);
setTimeout(function(){ throttled_test('You should see me only once.');},40);