const readlineSync = require('readline-sync');
const fs 		   = require('fs');
const readparams = require('./readparams');
var num = readlineSync.question('Number of Mnemonics : ');
var mnemonics = [];
var passwords = [];
if(num < 4 || num > 10) {
	console.log("Number of nodes should not be less than 4 and more than 10");
	process.exit(1);
}

var numberOfNodes = parseInt(num) + readparams.faultynode;
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
