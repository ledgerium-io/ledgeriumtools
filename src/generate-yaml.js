const basicConfig = require('./basic-config');
const fs = require('fs'); 
const dockerTemplate = require('../templates/docker-template');
const yaml = require('js-yaml');

var dockerCompose  = dockerTemplate.template;

dockerCompose.services["eth-stats"] = dockerTemplate.services['eth-stats']();
if(!dockerTemplate.networks.Externalflag){
	dockerCompose['networks'] = dockerTemplate.networks['internal']();
}else{
	dockerCompose['networks'] = dockerTemplate.networks['external']();
}
const type = dockerTemplate.tesseraFlag;

for (var i = 0; i < basicConfig.publicKeys.length; i++) {
	dockerCompose.services['validator-'+i] = dockerTemplate.services.validator(i);
	if(!type){
		dockerCompose.services["constellation-"+i] = dockerTemplate.services.constellation(i);
	}else{
		dockerCompose.services["tessera-"+i] = dockerTemplate.services.tessera(i);		
	}
	dockerCompose.services['governance_ui-'+i] = dockerTemplate.services.governanceApp(i);
	volumes = dockerCompose.services["validator-"+i].volumes;
	for (var j = volumes.length - 1; j >= 0; j--) {
		if(volumes[j].slice(0,1) != ".")
			dockerCompose.volumes[volumes[j].split(":")[0]] = null;
	}
}

dockerCompose["services"]["quorum-maker"] = dockerTemplate.services["quorum-maker"]();
fs.writeFileSync("./output/docker-compose.yml",yaml.dump(dockerCompose,{
  styles: {
    '!!null' : 'canonical'
  }
}));