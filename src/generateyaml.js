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
	dockerCompose.services["blockexplorerclient"] = dockerTemplate.services['blockexplorerclient']();
	dockerCompose.services["blockexplorerserver"] = dockerTemplate.services['blockexplorerserver']();
	dockerCompose.services["ledgeriumstats"] = dockerTemplate.services['ledgeriumstats']();
	dockerCompose["services"]["quorum-maker"] = dockerTemplate.services["quorum-maker"]();
	switch (readparams.env) {
		case "testnet":
		case "devnet":
		dockerComposefull.services["redis"] = dockerTemplate.services['redis']();
		dockerComposefull.services["ledgeriumfaucet"] = dockerTemplate.services['ledgeriumfaucet']();
		dockerComposefull.services["docusaurus"] = dockerTemplate.services['docusaurus']();
		dockerComposefull.services["ledgeriumdocs"] = dockerTemplate.services["ledgeriumdocs"]();
		break;
		case "mainnet":
			// dockerComposefull.services["blockexplorer"] = dockerTemplate.services['blockexplorer']();
			// dockerComposefull.services["mongodb"] = dockerTemplate.services['mongodb']();
			// dockerComposefull.services["web"] = dockerTemplate.services['web']();
			break;
		default:
			break;
	}
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
	dockerCompose.volumes["quorum-maker"] = null;
	let YMLFileSplit;
	let volumes;
	for (var i = 0; i < numberOfNodes - readparams.faultynode; i++) {
		if(readparams.distributed) {
			//Clear services for every yml file
			dockerComposeSplit.services = {};
			dockerComposeSplit.volumes = {};
			let validatorName = validatorNames[i] + '-' + basicConfig.publicKeys[i].slice(0,5);
			//Add ledgeriumstats,blockexplorerclient,blockexplorerserver to first yml file
			if(i == 0) {
				dockerComposeSplit.services["blockexplorerclient"] = dockerTemplate.services['blockexplorerclient']();
				dockerComposeSplit.services["blockexplorerserver"] = dockerTemplate.services['blockexplorerserver']();
				dockerComposeSplit.services["ledgeriumstats"] = dockerTemplate.services['ledgeriumstats']();
				dockerComposeSplit["services"]["quorum-maker"] = dockerTemplate.services["quorum-maker"]();
				dockerComposeSplit.volumes["quorum-maker"] = null;
			}
			dockerCompose.services[validatorName] = dockerTemplate.services.validator(i);
			dockerComposeSplit.services[validatorName] = dockerTemplate.services.validator(i);
			
			if(!type) {
				dockerCompose.services["constellation-"+ipAddress[i]] = dockerTemplate.services.constellation(i);
				dockerComposeSplit.services["constellation-"+ipAddress[i]] = dockerTemplate.services.constellation(i);
			} else {
				dockerCompose.services["tessera-"+ipAddress[i]] = dockerTemplate.services.tessera(i);		
				dockerComposeSplit.services["tessera-"+ipAddress[i]] = dockerTemplate.services.tessera(i);		
			}
			dockerCompose.services["governance-ui-"+ipAddress[i]] = dockerTemplate.services.governanceapp(i);
			dockerComposeSplit.services["governance-ui-"+ipAddress[i]] = dockerTemplate.services.governanceapp(i);

			volumes = dockerCompose.services[validatorName].volumes;
			YMLFileSplit = "./output/fullnode/docker-compose_" + i + "_" + ipAddress[i] +".yml";

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
			dockerComposeSplit.services["blockexplorerclient"] = dockerTemplate.services['blockexplorerclient']();
			dockerComposeSplit.services["blockexplorerserver"] = dockerTemplate.services['blockexplorerserver']();
			dockerCompose.services["ledgeriumstats"] = dockerTemplate.services['ledgeriumstats']();
			dockerCompose["services"]["quorum-maker"] = dockerTemplate.services["quorum-maker"]();

			dockerCompose.services["validator-"+readparams.nodeName + i] = dockerTemplate.services.validator(i);
			//dockerComposeSplit.services["validator-"+readparams.nodeName + i] = dockerTemplate.services.validator(i);
			
			if(!type) {
				dockerCompose.services["constellation-"+readparams.nodeName + i] = dockerTemplate.services.constellation(i);
				//dockerComposeSplit.services["constellation-"+readparams.nodeName + i] = dockerTemplate.services.constellation(i);
			} else {
				dockerCompose.services["tessera-"+readparams.nodeName + i] = dockerTemplate.services.tessera(i);		
				//dockerComposeSplit.services["tessera-"+readparams.nodeName + i] = dockerTemplate.services.tessera(i);		
			}
			dockerCompose.services["governance-ui-"+readparams.nodeName + i] = dockerTemplate.services.governanceapp(i);
			//dockerComposeSplit.services["governance-ui-"+readparams.nodeName + i] = dockerTemplate.services.governanceapp(i);
	
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
	const YMLFileFull = "./output/fullnode/docker-compose.yml";
	//Final output to the fullnode yml
	fs.writeFileSync(YMLFileFull, yaml.dump(dockerComposefull, {
		styles: {
			'!!null' : 'canonical'
		}
	}));

	var replace = "sed -i -e 's/~//g' " + YMLFileFull;
	exec(replace, function(error, stdout, stderr) {
		if (error) {
			console.log(error.code);
		}
	});

	sleep(1000, function() {
		// executes after one second, and blocks the thread
		//Remove the -e file on MAC platform
		if (process.platform == "darwin") {
				if(fs.existsSync(YMLFileFull+"-e"))
					fs.unlinkSync(YMLFileFull+"-e");
		}
	});
}
else if(readparams.modeFlag == "masternode") {
	for (var i = 0; i < numberOfNodes - readparams.faultynode ; i++) {
		dockerCompose.services["validator-" + readparams.nodeName] = dockerTemplate.services.validator(i);
		if(!type){
			dockerCompose.services["constellation-" + readparams.nodeName] = dockerTemplate.services.constellation(i);
		}else{
			dockerCompose.services["tessera-" + readparams.nodeName] = dockerTemplate.services.tessera(i);		
		}
		dockerCompose.services["governance-ui-" + readparams.nodeName] = dockerTemplate.services.governanceapp(i);
		let volumes = dockerCompose.services["validator-" + readparams.nodeName].volumes;
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
