const basicConfig = require('./basicconfig');
const readparams = require('./readparams');
const fs = require('fs'); 
var exec = require('child_process').exec;
const dockerTemplate = require('../templates/dockertemplate');
const yaml = require('js-yaml');

var dockerCompose  = dockerTemplate.template;

switch (readparams.env) {
	case "dev":
		
		dockerCompose.services["docusaurus"] = dockerTemplate.services['docusaurus']();
		dockerCompose.services["REST"] = dockerTemplate.services['rest']();
		dockerCompose.services["mongodb"] = dockerTemplate.services['mongodb']();
		dockerCompose.services["web"] = dockerTemplate.services['web']();
		break;
	
	case "prod":
		
		dockerCompose.services["REST"] = dockerTemplate.services['rest']();
		dockerCompose.services["mongodb"] = dockerTemplate.services['mongodb']();
		dockerCompose.services["web"] = dockerTemplate.services['web']();
		break;
	
	default:
		break;
}

if(readparams.modeFlag == "full"){
	dockerCompose.services["ledgeriumstats"] = dockerTemplate.services['ledgeriumstats']();
	dockerCompose["services"]["quorum-maker"] = dockerTemplate.services["quorum-maker"]();
}	

if(!dockerTemplate.networks.Externalflag){
	dockerCompose['networks'] = dockerTemplate.networks['internal']();
}else{
	dockerCompose['networks'] = dockerTemplate.networks['external']();
}

const type = dockerTemplate.tesseraFlag;
if(readparams.modeFlag == "full"){
	dockerCompose.volumes["quorum-maker"] = null;
	for (var i = 0; i < numberOfNodes - readparams.faultynode; i++) {	
		dockerCompose.services["validator-"+i] = dockerTemplate.services.validator(i);
		if(!type) {
			dockerCompose.services["constellation-"+i] = dockerTemplate.services.constellation(i);
		} else {
			dockerCompose.services["tessera-"+i] = dockerTemplate.services.tessera(i);		
		}
		dockerCompose.services["governance-ui-"+i] = dockerTemplate.services.governanceApp(i);
		let volumes = dockerCompose.services["validator-"+i].volumes;
		for (var j = volumes.length - 1; j >= 0; j--) {
			if(volumes[j].slice(0,1) != ".")
				dockerCompose.volumes[volumes[j].split(":")[0]] = null;
		}
	}
	if( readparams.faultynode > 0 ){
		for (var i = numberOfNodes - readparams.faultynode; i < numberOfNodes; i++) {
			dockerCompose.services["validator-test-"+i] = dockerTemplate.services.validator(i,true);
			if(!type) {
				dockerCompose.services["constellation-test-"+i] = dockerTemplate.services.constellation(i,true);
			} else {
				dockerCompose.services["tessera-test-"+i] = dockerTemplate.services.tessera(i,true);		
			}
			dockerCompose.services["governance-ui-test-"+i] = dockerTemplate.services.governanceApp(i,true);
			let volumes = dockerCompose.services["validator-test-"+i].volumes;
			for (var j = volumes.length - 1; j >= 0; j--) {
				if(volumes[j].slice(0,1) != ".")
					dockerCompose.volumes[volumes[j].split(":")[0]] = null;
			}
		}	
	}
}
else if(readparams.modeFlag == "addon"){
	for (var i = 0; i < numberOfNodes - readparams.faultynode ; i++) {
		dockerCompose.services["validator-" + readparams.nodeName] = dockerTemplate.services.validator(i);
		if(!type){
			dockerCompose.services["constellation-" + readparams.nodeName] = dockerTemplate.services.constellation(i);
		}else{
			dockerCompose.services["tessera-" + readparams.nodeName] = dockerTemplate.services.tessera(i);		
		}
		dockerCompose.services["governance-ui-" + readparams.nodeName] = dockerTemplate.services.governanceApp(i);
		let volumes = dockerCompose.services["validator-" + readparams.nodeName].volumes;
		for (var j = volumes.length - 1; j >= 0; j--) {
			if(volumes[j].slice(0,1) != ".")
				dockerCompose.volumes[volumes[j].split(":")[0]] = null;
		}
	}
	if( readparams.faultynode > 0 ){
		for (var i = numberOfNodes - readparams.faultynode; i < numberOfNodes; i++) {
			dockerCompose.services["validator-test-"+i] = dockerTemplate.services.validator(i,true);
			if(!type) {
				dockerCompose.services["constellation-test-"+i] = dockerTemplate.services.constellation(i);
			} else {
				dockerCompose.services["tessera-test-"+i] = dockerTemplate.services.tessera(i);		
			}
			dockerCompose.services["governance-ui-test-"+i] = dockerTemplate.services.governanceApp(i);
			let volumes = dockerCompose.services["validator-test-"+i].volumes;
			for (var j = volumes.length - 1; j >= 0; j--) {
				if(volumes[j].slice(0,1) != ".")
					dockerCompose.volumes[volumes[j].split(":")[0]] = null;
			}
		}	
	}
}

const YMLFile = "./output/docker-compose.yml";
//Final output to the yml
fs.writeFileSync(YMLFile, yaml.dump(dockerCompose,{
	styles: {
		'!!null' : 'canonical'
	}
}));

//var replace = "sed -i -e 's/~//g' ./output/docker-compose.yml";
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
	if(fs.existsSync(YMLFile+"-e"))
		fs.unlinkSync(YMLFile+"-e");
	}
});

function sleep(time, callback) {
    var stop = new Date().getTime();
    while(new Date().getTime() < stop + time) {
        ;
    }
    callback();
}
