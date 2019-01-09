const basicConfig = require('./basic-config');
const readparams = require('../readparams');
const fs = require('fs'); 
var exec = require('child_process').exec;
const dockerTemplate = require('../templates/docker-template');
const yaml = require('js-yaml');

var dockerCompose  = dockerTemplate.template;

if(readparams.modeFlag == "full"){
	dockerCompose.services["eth-stats"] = dockerTemplate.services['eth-stats']();
}	

if(!dockerTemplate.networks.Externalflag){
	dockerCompose['networks'] = dockerTemplate.networks['internal']();
}else{
	dockerCompose['networks'] = dockerTemplate.networks['external']();
}

const type = dockerTemplate.tesseraFlag;
if(readparams.modeFlag == "full"){
	dockerCompose.volumes['quorum-maker'] = null;
	for (var i = 0; i < basicConfig.publicKeys.length; i++) {
		dockerCompose.services['validator-'+i] = dockerTemplate.services.validator(i);
		if(!type){
			dockerCompose.services["constellation-"+i] = dockerTemplate.services.constellation(i);
		}else{
			dockerCompose.services["tessera-"+i] = dockerTemplate.services.tessera(i);		
		}
		dockerCompose.services['governance-ui-'+i] = dockerTemplate.services.governanceApp(i);
		volumes = dockerCompose.services["validator-"+i].volumes;
		for (var j = volumes.length - 1; j >= 0; j--) {
			if(volumes[j].slice(0,1) != ".")
				dockerCompose.volumes[volumes[j].split(":")[0]] = null;
		}
	}
}
else if(readparams.modeFlag == "addon"){
	for (var i = 0; i < basicConfig.publicKeys.length; i++) {
		dockerCompose.services['validator-' + readparams.nodeName] = dockerTemplate.services.validator(i);
		if(!type){
			dockerCompose.services["constellation-" + readparams.nodeName] = dockerTemplate.services.constellation(i);
		}else{
			dockerCompose.services["tessera-" + readparams.nodeName] = dockerTemplate.services.tessera(i);		
		}
		dockerCompose.services['governance-ui-' + readparams.nodeName] = dockerTemplate.services.governanceApp(i);
		volumes = dockerCompose.services["validator-" + readparams.nodeName].volumes;
		for (var j = volumes.length - 1; j >= 0; j--) {
			if(volumes[j].slice(0,1) != ".")
				dockerCompose.volumes[volumes[j].split(":")[0]] = null;
		}
	}
}

if(readparams.modeFlag == "full"){
	dockerCompose["services"]["quorum-maker"] = dockerTemplate.services["quorum-maker"]();
}

//Final output to the yml
fs.writeFileSync("./output/docker-compose.yml",yaml.dump(dockerCompose,{
	styles: {
		'!!null' : 'canonical'
	}
}));

var replace = "sed -i -e 's/~//g' ./output/docker-compose.yml";
exec(replace, function(error, stdout, stderr) {
	if (error) {
	  console.log(error.code);
	}
  });
