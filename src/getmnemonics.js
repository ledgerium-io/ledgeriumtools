const readlineSync = require('readline-sync');
const fs 		   = require('fs');
const readparams = require('./readparams');

var num = readlineSync.question('Number of Nodes : ');
if(readparams.faultynode > 0) {
	console.log("Number of faulty nodes ", readparams.faultynode);
}
var mnemonics = [];
var passwords = [];
var ipAddress = [];
if(readparams.modeFlag == "full") {
	if(num < 4 || num > 10) {
		console.log("Number of nodes should not be less than 4 and more than 10 for full mode");
		process.exit(1);
	}
}
else if(readparams.modeFlag == "addon") {
	if(num < 1 || num > 10) {
		console.log("Number of nodes should be atleast 1 and not more than 10 for addon mode");
		process.exit(1);
	}
}

console.log("Total number of nodes ", parseInt(num) + readparams.faultynode);

var numberOfNodes = parseInt(num) + readparams.faultynode;
for (var i = 0; i < numberOfNodes; i++) {
	
	if(readparams.modeFlag == "full") {
		var ip = readlineSync.question('Enter IP Address '+i+" : ", {
			hideEchoBack: false
		});

		if(!validateIPaddress(ip)) {
			console.log("Invalid IP address");
			process.exit(1);
		}
	}

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

	ipAddress.push(ip);
	mnemonics.push(menmonic);
	passwords.push(password);
}
for (var i = 0; i < mnemonics.length; i++) {
	for (var j = i+1; j < mnemonics.length; j++) {
		if(mnemonics[i] == mnemonics[j])
			throw "two mnemonics cannot be the same";
	}
}

function validateIPaddress(ip) {  
	if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip)) {
	  return true;  
	}  
	return false;
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
global.ipAddress = ipAddress;
