const basicConfig = require('./basicconfig');
const readparams = require('./readparams');
const fs = require('fs'); 
var exec = require('child_process').exec;
const dockerTemplate = require('../templates/dockertemplate');
const yaml = require('js-yaml');

var dockerComposeSplit  = dockerTemplate.splitTemplate;
var dockerCompose  = dockerTemplate.template;
var dockerComposefull  = dockerTemplate.templatefull;

if(readparams.modeFlag == "full") {
	dockerCompose.services["ledgeriumstats"] = dockerTemplate.services['ledgeriumstats']();
}	

if(!dockerTemplate.networks.Externalflag) {
	dockerCompose['networks'] = dockerTemplate.networks['internal']();
	dockerComposefull['networks'] = dockerTemplate.networks['internal']();
} else {
	dockerCompose['networks'] = dockerTemplate.networks['external']();
	dockerComposefull['networks'] = dockerTemplate.networks['external']();
	dockerComposeSplit['networks'] = dockerTemplate.networks['external']();
}

const type = dockerTemplate.tesseraFlag;
if(readparams.modeFlag == "full") {
	// dockerCompose.volumes["quorum-maker"] = null;
	let YMLFileSplit;
	let volumes;
	for (var i = 0; i < numberOfNodes - readparams.faultynode; i++) {
		if(readparams.distributed) {
			//Clear services for every yml file
			dockerComposeSplit.services = {};
			dockerComposeSplit.volumes = {};
			let trimmedPubKey = basicConfig.publicKeys[i].slice(0,5);
			let validatorName = validatorNames[i] + '-' + trimmedPubKey;
			let governanceServerName = 'governance-server-' + trimmedPubKey;
			let governanceClientName = 'governance-client-' + trimmedPubKey;
			
			dockerCompose.services[validatorName] = dockerTemplate.services.validator(i);
			dockerComposeSplit.services[validatorName] = dockerTemplate.services.validator(i);
			
			if(!type) {
				dockerCompose.services["constellation-"+ipAddress[i]] = dockerTemplate.services.constellation(i);
				dockerComposeSplit.services["constellation-"+ipAddress[i]] = dockerTemplate.services.constellation(i);
			} else {
				dockerCompose.services["tessera-"+trimmedPubKey] = dockerTemplate.services.tessera(i);		
				dockerComposeSplit.services["tessera-"+trimmedPubKey] = dockerTemplate.services.tessera(i);		
			}
			// dockerCompose.services["governance-ui-"+trimmedPubKey] = dockerTemplate.services.governanceapp(i);
			// dockerComposeSplit.services["governance-ui-"+trimmedPubKey] = dockerTemplate.services.governanceapp(i);
			dockerCompose.services[governanceServerName] = dockerTemplate.services.governanceappserver(i);
			dockerCompose.services[governanceClientName] = dockerTemplate.services.governanceappclient(i);
			dockerComposeSplit.services[governanceServerName] = dockerTemplate.services.governanceappserver(i);
			dockerComposeSplit.services[governanceClientName] = dockerTemplate.services.governanceappclient(i);

			//Add ledgeriumstats,blockexplorerclient,blockexplorerserver to first yml file
			if(i == 0) {
				dockerComposeSplit.services["ledgeriumstats"] = dockerTemplate.services['ledgeriumstats']();
				dockerComposeSplit.services["redis"] = dockerTemplate.services['redis']();
				dockerComposeSplit.services["ledgeriumfaucet"] = dockerTemplate.services['ledgeriumfaucet']();
				//if(readparams.env === "testnet") {
					dockerComposeSplit.services["mongodb"] = dockerTemplate.services['mongodb']();
					dockerComposeSplit.services["blockexplorerclient"] = dockerTemplate.services['blockexplorerclient']();
					dockerComposeSplit.services["blockexplorerserver"] = dockerTemplate.services['blockexplorerserver']();
				//}
			}
			volumes = dockerCompose.services[validatorName].volumes;
			YMLFileSplit = "./output/fullnode/docker-compose_" + i +".yml";

			for (var j = volumes.length - 1; j >= 0; j--) {
				if(volumes[j].slice(0,1) != ".")
					dockerCompose.volumes[volumes[j].split(":")[0]] = null;
					// dockerComposeSplit.volumes[volumes[j].split(":")[0]] = null;
			}
			
			//Final output to the fullnode yml
			fs.writeFileSync(YMLFileSplit, yaml.dump(dockerComposeSplit, {
				styles: {
					'!!null' : 'canonical'
				}
			}));
		
		} else {
			// dockerCompose.services["ledgeriumstats"] = dockerTemplate.services['ledgeriumstats']();
			// dockerCompose["services"]["quorum-maker"] = dockerTemplate.services["quorum-maker"]();

			dockerCompose.services["validator-"+readparams.nodeName + i] = dockerTemplate.services.validator(i);
			//dockerComposeSplit.services["validator-"+readparams.nodeName + i] = dockerTemplate.services.validator(i);
			
			if(!type) {
				dockerCompose.services["constellation-"+readparams.nodeName + i] = dockerTemplate.services.constellation(i);
				//dockerComposeSplit.services["constellation-"+readparams.nodeName + i] = dockerTemplate.services.constellation(i);
			} else {
				dockerCompose.services["tessera-"+readparams.nodeName + i] = dockerTemplate.services.tessera(i);		
				//dockerComposeSplit.services["tessera-"+readparams.nodeName + i] = dockerTemplate.services.tessera(i);		
			}
			// dockerCompose.services["governance-ui-"+readparams.nodeName + i] = dockerTemplate.services.governanceapp(i);
			dockerCompose.services["governance-server-" + readparams.nodeName + i] = dockerTemplate.services.governanceappserver(i);
			dockerCompose.services["governance-client-" + readparams.nodeName + i] = dockerTemplate.services.governanceappclient(i);
			//dockerComposeSplit.services["governance-ui-"+readparams.nodeName + i] = dockerTemplate.services.governanceapp(i);
	
			if(i == numberOfNodes -1) {
				dockerCompose.services["redis"] = dockerTemplate.services['redis']();
				dockerCompose.services["ledgeriumfaucet"] = dockerTemplate.services['ledgeriumfaucet']();
				//if(readparams.env === "testnet"){
					dockerCompose.services["mongodb"] = dockerTemplate.services['mongodb']();
					dockerCompose.services["blockexplorerclient"] = dockerTemplate.services['blockexplorerclient']();
					dockerCompose.services["blockexplorerserver"] = dockerTemplate.services['blockexplorerserver']();
				//}
			}

			volumes = dockerCompose.services["validator-"+readparams.nodeName + i].volumes;
			//YMLFileSplit = "./output/fullnode/docker-compose_" + i + "_" + readparams.nodeName +".yml";

			for (var j = volumes.length - 1; j >= 0; j--) {
				if(volumes[j].slice(0,1) != ".")
					dockerCompose.volumes[volumes[j].split(":")[0]] = null;
					// dockerComposeSplit.volumes[volumes[j].split(":")[0]] = null;
			}
		}
	}
	if( readparams.faultynode > 0 ) {
		for (var i = numberOfNodes - readparams.faultynode; i < numberOfNodes; i++) {
			dockerCompose.services["validator-test-"+readparams.nodeName + i] = dockerTemplate.services.validator(i,true);
			if(!type) {
				dockerCompose.services["constellation-test-"+readparams.nodeName + i] = dockerTemplate.services.constellation(i,true);
			} else {
				dockerCompose.services["tessera-test-"+readparams.nodeName + i] = dockerTemplate.services.tessera(i,true);		
			}
			dockerCompose.services["governance-ui-test-"+readparams.nodeName + i] = dockerTemplate.services.governanceapp(i,true);
			let volumes = dockerCompose.services["validator-test-"+readparams.nodeName + i].volumes;
			for (var j = volumes.length - 1; j >= 0; j--) {
				if(volumes[j].slice(0,1) != ".")
					dockerCompose.volumes[volumes[j].split(":")[0]] = null;
			}
		}	
	}
	// const YMLFileFull = "./output/fullnode/docker-compose.yml";
	// //Final output to the fullnode yml
	// fs.writeFileSync(YMLFileFull, yaml.dump(dockerComposefull, {
	// 	styles: {
	// 		'!!null' : 'canonical'
	// 	}
	// }));

	// var replace = "sed -i -e 's/~//g' " + YMLFileFull;
	// exec(replace, function(error, stdout, stderr) {
	// 	if (error) {
	// 		console.log(error.code);
	// 	}
	// });

	// sleep(1000, function() {
	// 	// executes after one second, and blocks the thread
	// 	//Remove the -e file on MAC platform
	// 	if (process.platform == "darwin") {
	// 			if(fs.existsSync(YMLFileFull+"-e"))
	// 				fs.unlinkSync(YMLFileFull+"-e");
	// 	}
	// });
}
else if(readparams.modeFlag == "blockproducer") {
	for (var i = 0; i < numberOfNodes - readparams.faultynode ; i++) {
		
		let trimmedPubKey = basicConfig.publicKeys[i].slice(0,5);
		let validatorName, tesseraName, governanceName, governanceClientName, governanceServerName;
		
		validatorName = validatorNames[i] + '-' + trimmedPubKey;
		tesseraName = 'tessera-' + trimmedPubKey;
		governanceName = 'governance-ui-' + trimmedPubKey;
		governanceServerName = 'governance-server-' + trimmedPubKey;
		governanceClientName = 'governance-client-' + trimmedPubKey;

		dockerCompose.services[validatorName] = dockerTemplate.services.validator(i);
		if(!type){
			dockerCompose.services["constellation-" + readparams.nodeName] = dockerTemplate.services.constellation(i);
		}else{
			dockerCompose.services[tesseraName] = dockerTemplate.services.tessera(i);		
		}
		// dockerCompose.services[governanceName] = dockerTemplate.services.governanceapp(i);
		dockerCompose.services[governanceServerName] = dockerTemplate.services.governanceappserver(i);
		dockerCompose.services[governanceClientName] = dockerTemplate.services.governanceappclient(i);
		let volumes = dockerCompose.services[validatorName].volumes;
		for (var j = volumes.length - 1; j >= 0; j--) {
			if(volumes[j].slice(0,1) != ".")
				dockerCompose.volumes[volumes[j].split(":")[0]] = null;
		}
	}
	if( readparams.faultynode > 0 ) {
		for (var i = numberOfNodes - readparams.faultynode; i < numberOfNodes; i++) {
			dockerCompose.services["validator-test-"+ readparams.nodeName + i] = dockerTemplate.services.validator(i,true);
			if(!type) {
				dockerCompose.services["constellation-test-"+ readparams.nodeName + i] = dockerTemplate.services.constellation(i,true);
			} else {
				dockerCompose.services["tessera-test-"+ readparams.nodeName + i] = dockerTemplate.services.tessera(i,true);		
			}
			dockerCompose.services["governance-ui-test-"+ readparams.nodeName + i] = dockerTemplate.services.governanceapp(i,true);
			let volumes = dockerCompose.services["validator-test-"+ readparams.nodeName + i].volumes;
			for (var j = volumes.length - 1; j >= 0; j--) {
				if(volumes[j].slice(0,1) != ".")
					dockerCompose.volumes[volumes[j].split(":")[0]] = null;
			}
		}	
	}
}

const YMLFile = "./output/docker-compose.yml";
//Final output to the yml
fs.writeFileSync(YMLFile, yaml.dump(dockerCompose, {
	styles: {
		'!!null' : 'canonical'
	}
}));

var replace = "sed -i -e 's/~//g' " + YMLFile;
exec(replace, function(error, stdout, stderr) {
	if (error) {
	  console.log(error.code);
	}
});

sleep(1000, function() {
	// executes after one second, and blocks the thread
	//Remove the -e file on MAC platform
	if (process.platform == "darwin") {
		if(fs.existsSync(YMLFile+"-e")) {
			fs.unlinkSync(YMLFile+"-e");
		}	
		// if(readparams.modeFlag == "full") {
		// 	if(fs.existsSync(YMLFileFull+"-e"))
		// 		fs.unlinkSync(YMLFileFull+"-e");
		// }
	}
});

function sleep(time, callback) {
    var stop = new Date().getTime();
    while(new Date().getTime() < stop + time) {
        ;
    }
    callback();
}
