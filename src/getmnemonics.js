const readlineSync = require('readline-sync');
const fs 		   = require('fs');
const os		   = require('os');
const readparams = require('./readparams');
const execSync = require('child_process').execSync;

var mnemonics = [];
var passwords = [];
let ipAddress = [];
let validatorNames = [];
let domainNames = [];
var numberOfNodes;
let menmonic;
let password;

var currentIp = String(execSync('curl -s https://api.ipify.org'));

if(readparams.modeFlag == "full") {
	var num = readlineSync.question('Number of nodes : ');
	if(num < 4 || num > 10) {
		console.log("Number of nodes should not be less than 4 and more than 10 for full mode");
		process.exit(1);
	}
	numberOfNodes = parseInt(num) + readparams.faultynode;
	console.log("Total number of nodes ", numberOfNodes);
}
else if(readparams.modeFlag == "blockproducer") {
	console.log("There will only be one blockproducer per setup.");

	//Update distributed flag to true for flinders and false for toorak
	if(readparams.network === 'flinders'){
		readparams.distributed = true
	} else {
		readparams.distributed = false
	}
	
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
	if (readparams.modeFlag === "blockproducer") {
		console.log(`Your public IP address is ${currentIp}, if you want to change, provide it else ignore and hit Enter.`)
		let ip = readlineSync.question('Enter the IP address : ', {
			hideEchoBack: false
		});

		if(ip === "") {
			ip = currentIp;
		}

		if(!validateIPaddress(ip)) {
			console.log("Invalid IP address");
			process.exit(1);
		}
		
		console.log("If you have the domain name ready, provide it else ignore and hit Enter.")
		let domainName = readlineSync.question('Enter domain name : ', {
			hideEchoBack : false
		});
		
		if(domainName === "") {
			domainName = ip;
		}

		let hostname = os.hostname();
		console.log(`If you want to use hostname (${hostname}) as validator name, ignore and hit Enter. Else provide validator name`)
		let validatorName = readlineSync.question('Enter validator name : ', {
			hideEchoBack : false
		});

		ipAddress.push(ip);
		validatorNames.push(validatorName);
		domainNames.push(domainName);
		
		menmonic = readlineSync.question('Enter mnemonic (Refer docs to know more about mnemonics): ', {
			hideEchoBack: true
		});
		password = readlineSync.question('Enter password (Refer docs to know more about password): ', {
			hideEchoBack: true
		});
	} else if(readparams.modeFlag === "full" && readparams.distributed) {
		let ip = readlineSync.question('Enter the IP address '+i+" : ", {
			hideEchoBack: false
		});

		if(!validateIPaddress(ip)) {
			console.log("Invalid IP address");
			process.exit(1);
		}
		
		console.log("If you have the domain name ready, provide it else ignore and hit Enter.")
		let domainName = readlineSync.question('Enter domain name : ', {
			hideEchoBack : false
		});
		
		if(domainName === "") {
			domainName = ip;
		}

		let validatorName = readlineSync.question('Enter validator name '+i+ ' : ', {
			hideEchoBack : false
		});

		ipAddress.push(ip);
		validatorNames.push(validatorName);
		domainNames.push(domainName);
		
		menmonic = readlineSync.question('Enter mnemonic '+i+" : ", {
			hideEchoBack: true
		});
		password = readlineSync.question('Enter password '+i+" : ", {
			hideEchoBack: true
		});
	} else if (readparams.modeFlag === "full" && !readparams.distributed){
		menmonic = readlineSync.question('Enter mnemonic '+i+" : ", {
			hideEchoBack: true
		});
		password = readlineSync.question('Enter password '+i+" : ", {
			hideEchoBack: true
		});
	}

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
			throw "two mnemonics cannot be the same.";
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