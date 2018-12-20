const readlineSync = require('readline-sync');
const fs 		   = require('fs');

/*if(!fs.existsSync(process.argv[2]))
	throw "Provide path for output";*/

var num = readlineSync.question('Number of Mnemonics : ');
var mnemonics = [];
var passwords = [];
var numberOfNodes = parseInt(num)
for (var i = 0; i < numberOfNodes; i++) {
	var menmonic = readlineSync.question('Enter Mnemonic '+i+" : ", {
		hideEchoBack: true
	});
	var password = readlineSync.question('Enter Password '+i+" : ", {
		hideEchoBack: true
	});
	if(menmonic == ""){
		i--;
		continue;
	}
	mnemonics.push(menmonic);
	passwords.push(password);
}
for (var i = 0; i < mnemonics.length; i++) {
	for (var j = i+1; j < mnemonics.length; j++) {
		if(mnemonics[i] == mnemonics[j])
			throw "two mnemonics cannot be the same";
	}
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
template.mnemonic = mnemonics;
exports.template  = template;
exports.passwords = passwords;

global.numberOfNodes = numberOfNodes;
