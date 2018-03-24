//不要直接修改函数的参数
//https://spin.atomicobject.com/2011/04/10/javascript-don-t-reassign-your-function-arguments/
var makePerson = function(favoriteColor, name, age) {
    if (arguments.length < 3) {
        favoriteColor = "green";
        name = arguments[0];
        age = arguments[1];
    }

    return {
        name: name,
        age: age,
        favoriteColor: favoriteColor
    };
};

var person = makePerson("Joe", 18);
console.log(JSON.stringify(person));
// => {"name":"green","age":"green","favoriteColor":"green"}