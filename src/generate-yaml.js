const basicConfig    = require('./basic-config');
const fs 			 = require('fs'); 
const dockerTemplate = require('../templates/docker-template');
const yaml 			 = require('js-yaml');

var dockerCompose  = dockerTemplate.template;

dockerCompose.services["eth-stats"]       = dockerTemplate.services['eth-stats'];
if(!dockerTemplate.externalNetwork){
	dockerCompose['networks']             = dockerTemplate.services['networks'];
}else{
	dockerCompose['networks']             = dockerTemplate.services['external'];
}
dockerCompose["services"]["quorum-maker"] = dockerTemplate.services["quorum-maker"];
dockerCompose['volumes'] 				  = {};
const type 								  = dockerTemplate.tesseraFlag;
const networkName						  = Object.keys(dockerCompose['networks'])[0];
dockerCompose['services']["quorum-maker"]["networks"][networkName] = { "ipv4_address": dockerTemplate.serviceConfig["quorum-maker"].ip };
dockerCompose['services']['eth-stats']["networks"][networkName] = { "ipv4_address": dockerTemplate.serviceConfig["eth-stats"].ip };

const getValidator = (i)=>{
	const startIp         	= dockerTemplate.serviceConfig.validator.startIp.split(".");
	const gossipPort   		= dockerTemplate.serviceConfig.validator.gossipPort;
	const rpcPort      		= dockerTemplate.serviceConfig.validator.rpcPort;
	const webSocketPort		= dockerTemplate.serviceConfig.validator.wsPort;
	const ip         		= startIp[0]+"."+startIp[1]+"."+startIp[2]+"."+(parseInt(startIp[3])+i);
	var validator      		= dockerTemplate.services.validator();
	validator.hostname 		= validator.hostname+i;
	validator.ports  	    = [(gossipPort+i)+":"+gossipPort, (rpcPort+i)+":"+rpcPort, (webSocketPort+i)+":"+webSocketPort];
	if ( !type ){
		validator.volumes 	    = ["validator-"+i+":/eth","constellation-"+i+":/constellation:z"];
		validator["depends_on"] = ["constellation-"+i];
		validator["environment"]= ["PRIVATE_CONFIG=/constellation/tm.conf"];
		if (i == 0){
			dockerCompose["services"]["quorum-maker"].volumes.push("validator-"+i+":/eth");
			dockerCompose["services"]["quorum-maker"].volumes.push("constellation-"+i+":/constellation:z");
		}
	}else{
		validator.volumes 	    = ["validator-"+i+":/eth","tessera-"+i+":/priv"];
		validator["depends_on"] = ["tessera-"+i];
		validator["environment"]= ["PRIVATE_CONFIG=/priv/tm.ipc"];
		if (i == 0){
			dockerCompose["services"]["quorum-maker"].volumes.push("validator-"+i+":/eth");
			dockerCompose["services"]["quorum-maker"].volumes.push("tessera-"+i+":/priv");
		}
	}
	validator.entrypoint.push(
		dockerTemplate.genValidatorCommand(
			i,
			gossipPort,
			basicConfig.genesisString,
			basicConfig.staticNodes,
			basicConfig.privateKeys[i],
			basicConfig.publicKeys[i],
			basicConfig.passwords
		)
	);
	validator.networks[networkName] = { "ipv4_address":ip };
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
	constellation.networks[networkName] = { "ipv4_address":ip };
	return constellation;
}

const getTessera = (i)=>{
	var peers = [];
	const startIp = dockerTemplate.serviceConfig.tessera.startIp.split(".");
	const port    = dockerTemplate.serviceConfig.tessera.port;
	const ip      = startIp[0]+"."+startIp[1]+"."+startIp[2]+"."+(i+parseInt(startIp[3]));
	var tesseraTemplate 						= dockerTemplate.services.tesseraTemplate();
	var tessera         						= dockerTemplate.services.tessera();
	tesseraTemplate.server.port 				= port;
	tesseraTemplate.server.hostName 			= "http://"+ip;
	tesseraTemplate.peer        				= peers;
	tessera.volumes								= ["tessera-"+i+":/priv"];
	tessera.ports          						= [(port+i)+":"+port];
	tessera.networks[networkName] = { "ipv4_address":ip };
	for (var j = 0; j < basicConfig.publicKeys.length; j++) {
			peers.push({ "url" : "http://"+startIp[0]+"."+startIp[1]+"."+startIp[2]+"."+(j+parseInt(startIp[3]))+":"+port+"/"})
	}	
	tessera.hostname 							= tessera.hostname+i;
	tessera.entrypoint.push(
		dockerTemplate.genTesseraCommand(i,tesseraTemplate)
	);
	return tessera;
}

const getGovernanceUI = (i)=>{
	var gov  = dockerTemplate.services.governanceApp(i);
	const startIp = dockerTemplate.serviceConfig["governance-app"].startIp.split(".");
	ip = startIp[0]+"."+startIp[1]+"."+startIp[2]+"."+(parseInt(startIp[3])+i);
	var string = "";
	if(i == 0){
			string+="cd /ledgerium/governanceapp/governanceApp\n"
			string+="node index.js protocol=ws hostname=localhost port=9000 privateKeys="+basicConfig.privateKeys[i]+"\n";
	}
	string+="cd /ledgerium/governanceapp/governanceApp/app\n";
	string+="node governanceUI.js "+dockerCompose.services['validator-'+i].networks[networkName]["ipv4_address"]+" "+dockerTemplate.serviceConfig.validator.rpcPort+"\n";
	gov.entrypoint.push(string);
	//console.log(dockerCompose.services['validator-'+i].networks[networkName]["ipv4_address"]);
	if ( !type ){
		gov.volumes.push("constellation-"+i+":/constellation:z")
	}else{
		gov.volumes.push('tessera-'+i+':/priv')
	}
	gov.networks[networkName] = { "ipv4_address":ip };
	return gov;
}

for (var i = 0; i < basicConfig.publicKeys.length; i++) {
	dockerCompose.services['validator-'+i] = getValidator(i);
	if(!type){
		dockerCompose.services["constellation-"+i] = getConstellation(i);
	}else{
		dockerCompose.services["tessera-"+i] = getTessera(i);		
	}
	dockerCompose.services['governance_ui-'+i] = getGovernanceUI(i);
	volumes = dockerCompose.services["validator-"+i].volumes;
	for (var j = volumes.length - 1; j >= 0; j--) {
		dockerCompose.volumes[volumes[j].split(":")[0]] = null;
	}
}
dockerCompose.volumes["logs"] = null;
fs.writeFileSync(process.argv[2]+'/docker-compose.yml',yaml.dump(dockerCompose,{
  styles: {
    '!!null' : 'canonical'
  }
}));