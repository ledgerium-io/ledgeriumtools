const readlineSync = require('readline-sync');

var num = readlineSync.question('Number of Mnemonics : ');
var menmonics = [];
var passwords = [];
num = parseInt(num)
for (var i = 0; i < num; i++) {
	var menmonic = readlineSync.question('Enter Mnemonic '+i+" : ", {
		hideEchoBack: true
	});
	var password = readlineSync.question('Enter Password '+i+" : ", {
		hideEchoBack: true
	});
	if(password == "" || menmonic == ""){
		i--;
		continue;
	}
	menmonics.push(menmonic);
	passwords.push(password);
}
var template = {
	"mode": 0,
	"mnemonic":[],
	"keys":[
	],
	"istanbul":{
		"vanity":"",
		"seal":""
	}
}
template.mnemonic = menmonics;
exports.template  = template;
exports.passwords = passwords;