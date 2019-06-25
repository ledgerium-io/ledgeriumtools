const readlineSync = require('readline-sync');
const fs 		   = require('fs');
const readparams = require('./readparams');

var mnemonics = [];
var passwords = [];
var numberOfNodes;

if(readparams.modeFlag == "full") {
	var num = readlineSync.question('Number of Nodes : ');
	if(num < 4 || num > 10) {
		console.log("Number of nodes should not be less than 4 and more than 10 for full mode");
		process.exit(1);
	}
	numberOfNodes = parseInt(num) + readparams.faultynode;
	console.log("Total number of nodes ", numberOfNodes);
}
else if(readparams.modeFlag == "masternode") {
	if(num < 1 || num > 10) {
		console.log("Number of nodes should be 1 for masternode");
		process.exit(1);
	}
	numberOfNodes = 1 + readparams.faultynode; //There can be only one masternode
}

if(readparams.faultynode > 0) {
	console.log("Number of faulty nodes ", readparams.faultynode);
}

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