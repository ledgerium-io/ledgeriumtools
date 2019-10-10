const readlineSync = require('readline-sync');
const fs 		   = require('fs');
const readparams = require('./readparams');
const execSync = require('child_process').execSync;

var mnemonics = [];
var passwords = [];
let ipAddress = [];
let validatorNames = [];
let domainNames = [];
var numberOfNodes;

let currentIp = String(execSync('curl -s https://api.ipify.org'));

if(readparams.modeFlag == "full") {
	var num = readlineSync.question('Number of Nodes : ');
	if(num < 4 || num > 10) {
		console.log("Number of nodes should not be less than 4 and more than 10 for full mode");
		process.exit(1);
	}
	numberOfNodes = parseInt(num) + readparams.faultynode;
	console.log("Total number of nodes ", numberOfNodes);
}
else if(readparams.modeFlag == "blockproducer") {
	console.log("There will only be one blockproducer per setup.");
	
	// if(num < 1 || num > 10) {
	// 	console.log("Number of nodes should be 1 for blockproducer");
	// 	process.exit(1);
	// }
	numberOfNodes = 1;// + readparams.faultynode; //There can be only one blockproducer
}

if(readparams.faultynode > 0) {
	console.log("Number of faulty nodes ", readparams.faultynode);
}

for (var i = 0; i < numberOfNodes; i++) {

	/** IP Addresses for distributed setup */
	if(readparams.distributed) {
		let ip = readlineSync.question('Enter IP Address '+i+" : ", {
			hideEchoBack: false
		});

		if(!validateIPaddress(ip)) {
			console.log("Invalid IP address");
			process.exit(1);
		}
		
		let validatorName = readlineSync.question('Enter validator name '+i+ ' : ', {
			hideEchoBack : false
		});

		let domainName = readlineSync.question('Enter DNS '+i+ ' : ', {
			hideEchoBack : false
		}); 

		ipAddress.push(ip);
		validatorNames.push(validatorName);
		domainNames.push(domainName);
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
global.ipAddress = ipAddress;
global.validatorNames = validatorNames;
global.domainNames = domainNames;
global.numberOfNodes = numberOfNodes;
global.currentIp = currentIp;