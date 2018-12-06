const basicConfig    = require('./basic-config');
const fs 			 = require('fs'); 
const dockerTemplate = require('../templates/docker-template');
const yaml 			 = require('js-yaml');

var dockerCompose  = dockerTemplate.template;

dockerCompose.services["eth-stats"] = dockerTemplate.services['eth-stats'];
dockerCompose['networks']           = dockerTemplate.services['networks'];
dockerCompose['volumes'] 			= {};

const getValidator = (i)=>{
	const startIp         	= dockerTemplate.serviceConfig.validator.startIp.split(".");
	const gossipPort   		= dockerTemplate.serviceConfig.validator.gossipPort;
	const rpcPort      		= dockerTemplate.serviceConfig.validator.rpcPort;
	const webSocketPort		= dockerTemplate.serviceConfig.validator.wsPort;
	const ip         		= startIp[0]+"."+startIp[1]+"."+startIp[2]+"."+(parseInt(startIp[3])+i);
	var validator      		= dockerTemplate.services.validator();
	validator.hostname 		= validator.hostname+i;
	validator.ports  	    = [(gossipPort+i)+":"+gossipPort, (rpcPort+i)+":"+rpcPort, (webSocketPort+i)+":"+webSocketPort];
	validator.volumes 	    = ["validator-"+i+":/eth","constellation-"+i+":/constellation:z"];
	validator["depends_on"] = ["constellation-"+i];
	validator.entrypoint.push(
		dockerTemplate.genValidatorCommand(
			i,
			gossipPort,
			basicConfig.genesisString,
			basicConfig.staticNodes,
			basicConfig.privateKeys[i],
			basicConfig.publicKeys[i]
		)
	);
	validator.networks["app_net"]["ipv4_address"] = ip;
	return validator;
}

const getConstellation = (i)=>{
	var limit 				= 3;
	const constellationPort = dockerTemplate.serviceConfig.constellation.port;
	var startIp 			= dockerTemplate.serviceConfig.constellation.startIp.split(".");
	const baseIp			= startIp[0]+"."+startIp[1]+"."+startIp[2]+".";
	var othernodes 			= " --othernodes=";
	startIp = parseInt(startIp[3]);
	for (var j = 0; j < limit; j++){
		if(i != j){
	    	othernodes+="http://"+baseIp+(startIp+j)+":"+(constellationPort+j)+"/";
	    	if(j != limit-1){
	      		othernodes+=",";
	    	}
	  	}else{
	    	limit++;
	  	}
	}
	var constellation 	   = dockerTemplate.services.constellation();
	constellation.hostname = constellation.hostname+i;
	constellation.ports    = [(constellationPort+i)+":"+(constellationPort+i)];
	constellation.volumes  = ["constellation-"+i+":/constellation:z"]
	constellation.entrypoint.push(
		dockerTemplate.genConstellationCommand(
			i,
			othernodes,
			baseIp+(startIp+i),
			constellationPort+i
		)
	);
	constellation.networks["app_net"]["ipv4_address"] = baseIp+(startIp+i);
	return constellation;
}



for (var i = 0; i < basicConfig.publicKeys.length; i++) {
	dockerCompose.services['validator-'+i] = getValidator(i);
	dockerCompose.services["constellation-"+i] = getConstellation(i);
	volumes = dockerCompose.services["validator-"+i].volumes;
	for (var j = volumes.length - 1; j >= 0; j--) {
		dockerCompose.volumes[volumes[j].split(":")[0]] = null;
	}
}

fs.writeFileSync(process.argv[3]+'/docker-compose.yml',yaml.dump(dockerCompose,{
  styles: {
    '!!null' : 'canonical'
  }
}));