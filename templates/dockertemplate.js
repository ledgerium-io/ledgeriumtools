//'use strict';
const basicConfig = require('../src/basicconfig');
const readparams = require('../src/readparams');

const gethCom   = "geth --rpc --rpcaddr '0.0.0.0' --rpccorsdomain '*' \
--datadir '/eth' --rpcapi 'db,eth,net,web3,istanbul,personal,admin,debug,txpool' \
--ws --wsorigins '*' --wsapi 'db,eth,net,web3,personal,admin,debug,txpool' \
--wsaddr '0.0.0.0' --networkid 2018 --targetgaslimit 9007199254740000 \
--debug --metrics --syncmode 'full' --mine --verbosity 6 \
--minerthreads 1";

const tesseraFlag = true;
const network_name = "test_net";
var base_ip = "172.19.240.0",entrypoint, qmvolumes =[];

const genCommand = (commands)=>{
	var commandString = "";
	for (var j = 0; j < commands.length; j++) {
		commandString+=commands[j]+"\n";
	}
	return commandString;
}
const networks = {
	"Externalflag"    : true,
	"internal":()=>{
		var temp = {}
		temp[network_name] = {
			"driver" : "bridge",
			"ipam"   : {
				"driver"  :  "default",
				"config"  : [
					{
						"subnet" : base_ip+"/24"
					}
				]
			}
		};
		return temp;
	},
	"external": ()=>{
		var temp = {}
		temp[network_name] = {
			"external" : true
		};
		return temp;
	}
};
const serviceConfig = {
	"ledgeriumstats":{
		"ip" : base_ip.slice(0, base_ip.length-1)+"9"
	},
	"validator":{
		"startIp": base_ip.slice(0, base_ip.length-1)+"10",
		"gossipPort":30303,
		"rpcPort":8545,
		"wsPort":9000
	},
	"constellation":{
		"startIp":base_ip.slice(0, base_ip.length-1)+"100",
		"port":10000
	},
	"tessera":{
		"startIp":base_ip.slice(0, base_ip.length-1)+"100",
		"port":10000,
		"tesseraTemplate": (i)=>{
			return {
				"useWhiteList"  : false,
				"jdbc"          : {
					"username"		   : "sa",
				    "password"		   : "",
				    "url"     		   : "jdbc:h2:.//priv/db;MODE=Oracle;TRACE_LEVEL_SYSTEM_OUT=0",
		            "autoCreateTables" : true
				},
				"server"        : {
					"port"     : "",
					"hostName" : "",
					"sslConfig": {
						"tls"                         : "OFF",
						"generateKeyStoreIfNotExisted": true,
						"serverKeyStore"              : "/priv/server-keystore",
						"serverKeyStorePassword"      : "quorum",
						"serverTrustStore"            : "/priv/server-truststore",
						"serverTrustStorePassword"    : "quorum",
						"serverTrustMode"             : "TOFU",
						"knownClientsFile"            : "/priv/knownClients",
						"clientKeyStore"              : "/priv/client-keystore",
						"clientKeyStorePassword"  	  : "quorum",
						"clientTrustStore"            : "/priv/client-truststore",
						"clientTrustStorePassword"	  : "quorum",
						"clientTrustMode"             : "TOFU",
						"knownServersFile"            : "/priv/knownServers"
					}
				},
				"peer"          : [],
				"keys"          : {
					"passwords": [],
					"keyData"  : [
					    {
						    "privateKeyPath"   : "/priv/tm.key",
							"publicKeyPath": "/priv/tm.pub"
						}
					]
				},
				"alwaysSendTo"  : [],
				"unixSocketFile": "/priv/tm.ipc"/*,
				"disablePeerDiscovery": true*/
			}
		},
	},
	"quorum-maker":{
		"ip"   : base_ip.slice(0, base_ip.length-1)+"196",
		"port" : 9999
	},
	"governance-app":{
		"port-exp": 3545,
		"port-int": 3003,
		"startIp" : base_ip.slice(0, base_ip.length-1)+"150"
	}
};

const services = {
	"ledgeriumstats": ()=>{
		var eth = {
			"image"        : "ledgeriumengineering/ledgeriumstats:v1.0",
			"ports"        : ["3000:3000"],
			"environment"  : ["WS_SECRET=bb98a0b6442334d0cdf8a31b267892c1"],
			"restart"	   : "always",
			"networks"	   : {
			}
		};
		eth.networks[network_name] = { "ipv4_address":serviceConfig["ledgeriumstats"].ip };
		return eth;
	},
	"quorum-maker": ()=>{
		var quorum = {
			"hostname": "quorum-maker",
			"image"   : "ledgeriumengineering/quorum-maker:v0.1",
			"ports"	  : [serviceConfig["quorum-maker"].port+":"+serviceConfig["quorum-maker"].port],
			"volumes" : ["./logs:/logs","./tmp:/tmp","quorum-maker:/quorum-maker"],
			"depends_on": ["validator-0"],
			"entrypoint":[ "/bin/sh", "-c"],
			"networks": {
			},
			"restart": "always"
		};
		quorum.volumes.push("./validator-0:/eth");
		quorum.networks[network_name] = { "ipv4_address": serviceConfig["quorum-maker"].ip }
		var publicKeyPath = (i) => { return "/tmp/tm"+i+".pub"; };
		if(tesseraFlag){
			quorum.volumes.push("./tessera-0:/priv");
		}
		else{
			quorum.volumes.push("constellation-0:/constellation:z");
		}
		var commands = [
			"set -u",
			"set -e",
			"mkdir -p /logs/quorummakerLogs",
			"DATE=`date '+%Y-%m-%d_%H-%M-%S'`",
			"while : ;do",
			"sleep 1",
			"if [ -e /eth/geth.ipc ];then",
			"break;",
			"fi",
			"done",
			"cd /quorum-maker",
			"if [ ! -e /quorum-maker/setup.conf ];then",
			"RESPONSE=\`curl https://ipinfo.io/ip\` || \"--\"",
			"echo \"EXTERNAL_IP=$${RESPONSE}\" > ./setup.conf"
		];
		for (var i = 0; i < basicConfig.publicKeys.length; i++) {
			var prefix = "";
			const startIp = serviceConfig.validator.startIp.split(".");
			const ip   = startIp[0]+"."+startIp[1]+"."+startIp[2]+"."+(parseInt(startIp[3])+i);
			if(i != 0){
				prefix = i+"_";
				commands.push("echo \""+prefix+"ENODE="+basicConfig.enodes[i]+"\" >> ./setup.conf")
			}else{
				commands.push("echo \"CONTRACT_ADD=\" >> setup.conf");
				commands.push("echo \"RPC_PORT="+serviceConfig.validator.rpcPort+"\" >> ./setup.conf");
				commands.push("echo \"WS_PORT="+serviceConfig.validator.wsPort+"\" >> ./setup.conf");
				commands.push("echo \"WHISPER_PORT="+serviceConfig.validator.gossipPort+"\" >> ./setup.conf");
				commands.push("echo \"CONSTELLATION_PORT="+serviceConfig.constellation.port+"\" >> ./setup.conf");
				commands.push("echo \"TOTAL_NODES="+basicConfig.publicKeys.length+"\" >> ./setup.conf")
				commands.push("echo \"MODE=ACTIVE\" >> ./setup.conf")
				commands.push("echo \"STATE=I\" >> ./setup.conf")
				commands.push("echo \"PRIVATE_KEY="+"${PRIVATEKEY"+i+"}"+"\" >> ./setup.conf");
			}
			commands.push("if [ -e "+publicKeyPath(i)+" ];then")
			commands.push("PUB=$$(cat "+publicKeyPath(i)+")");
			commands.push("fi");
			commands.push("echo \""+prefix+"PUBKEY=\"$${PUB} >> ./setup.conf")
			commands.push("echo \""+prefix+"ROLE=Unassigned\" >> ./setup.conf")
			commands.push("echo \""+prefix+"CURRENT_IP="+ip+"\" >> ./setup.conf");
			commands.push("echo \""+prefix+"REGISTERED=\" >> ./setup.conf")
			commands.push("echo \""+prefix+"NODENAME=validator-\""+i+" >> ./setup.conf")     // check validator name for below value
		}
		commands.push("fi");
		commands.push("cd /root/quorum-maker/");
		commands.push("./NodeManager http://"+serviceConfig.validator.startIp+":"+serviceConfig.validator.rpcPort+" "
			+serviceConfig["quorum-maker"]["port"]+" /logs/gethLogs/ /logs/constellationLogs /quorum-maker/setup.conf"
			+" 2>/logs/quorummakerLogs/" + "$${DATE}_Log.txt");
		quorum.entrypoint.push(genCommand(commands));
		return quorum;
	},
	"validator": (i,test)=>{
		var validatorName = "validator-", constellationName = "constellation-", tesseraName = "tessera-", governanceUIName = "governance-ui-";
		if(test){
			validatorName += "test-"; 
			constellationName += "test-";
			tesseraName += "test-";
			governanceUIName += "test-";
		}
		if(readparams.modeFlag == "full") {
			validatorName += i;
			constellationName += i;
			tesseraName += i;
			governanceUIName += i;
		}
		else if(readparams.modeFlag == "addon") {
			validatorName += readparams.nodeName;
			constellationName += readparams.nodeName;
			tesseraName += readparams.nodeName;
			governanceUIName += readparams.nodeName;
		}
		var ipaddressText;
		var startGeth;
		if(readparams.modeFlag == "full")
			ipaddressText = " --ethstats \"" + validatorName + ":bb98a0b6442334d0cdf8a31b267892c1@"+base_ip.slice(0, base_ip.length-1)+"9";
		else if(readparams.modeFlag == "addon")
			ipaddressText = " --ethstats \"" + validatorName + ":bb98a0b6442334d0cdf8a31b267892c1@"+readparams.externalIPAddress;
		startGeth = gethCom + " --rpcvhosts=" + readparams.domainName + " --nodekeyhex \""+"${PRIVATEKEY"+[i]+"}"+"\" "
		+"--etherbase \""+basicConfig.publicKeys[i]+"\" --port \""+serviceConfig.validator.gossipPort+"\""
		+ipaddressText+":3000\" --rpcport "+serviceConfig.validator.rpcPort
		+" --wsport "+serviceConfig.validator.wsPort; // quorum maker service uses this identity
		const startIp = serviceConfig.validator.startIp.split(".");
		var validator = {
			"hostname"   : validatorName, 
			"image"		 :	"ledgeriumengineering/ledgeriumcore:v1.1",
			"ports"	     : [
				(serviceConfig.validator.gossipPort+i)+":"+serviceConfig.validator.gossipPort,
				(serviceConfig.validator.rpcPort+i)+":"+serviceConfig.validator.rpcPort,
				(serviceConfig.validator.wsPort+i)+":"+serviceConfig.validator.wsPort
			],
			"volumes"    : [],
			"depends_on" : [constellationName],
			"environment":	["PRIVATE_CONFIG=/constellation/tm.conf"],
			"entrypoint" : ["/bin/sh","-c"],
			"networks"	:	{
			},
			"restart"	: "always"
		};
		var startWait = "";
		var cpPubKeys = "";
		startWait+="set -u\n";
		startWait+="set -e\n";
		if(readparams.modeFlag == "full"){
			if ( !tesseraFlag ){
				validator.volumes 	    = ["./" + validatorName +":/eth", constellationName +":/constellation:z","./tmp:/tmp"];
				validator["depends_on"] = [constellationName];
				validator["environment"]= ["PRIVATE_CONFIG=/constellation/tm.conf"];
				startWait 				= "while [ ! -e /constellation/tm.ipc ];do"
				cpPubKeys = "cp /constellation/tm.pub /tmp/tm"+i+".pub";
			}else{
				validator.volumes 	    = ["./" + validatorName +":/eth","./" + tesseraName +":/priv","./tmp:/tmp"];
				validator["depends_on"] = [tesseraName];
				validator["environment"]= ["PRIVATE_CONFIG=/priv/tm.ipc"];
				startWait               = "while [ ! -e /priv/tm.ipc ];do";
				cpPubKeys = "cp /priv/tm.pub /tmp/tm"+i+".pub";
			}
		}
		else if(readparams.modeFlag == "addon"){
			if ( !tesseraFlag ){
				validator.volumes 	    = ["./" + validatorName +":/eth", constellationName +":/constellation:z","./tmp:/tmp"];
				validator["depends_on"] = [constellationName];
				validator["environment"]= ["PRIVATE_CONFIG=/constellation/tm.conf"];
				startWait 				= "while [ ! -e /constellation/tm.ipc ];do"
				cpPubKeys = "cp /constellation/tm.pub /tmp/tm"+i+".pub";
			}else{
				validator.volumes 	    = ["./" + validatorName +":/eth","./" + tesseraName +":/priv","./tmp:/tmp"];
				validator["depends_on"] = [tesseraName];
				validator["environment"]= ["PRIVATE_CONFIG=/priv/tm.ipc"];
				startWait               = "while [ ! -e /priv/tm.ipc ];do";
				cpPubKeys = "cp /priv/tm.pub /tmp/tm"+ readparams.nodeName +".pub";
			}
		}
		const commands = [
			startWait,
			"sleep 1",
			"echo \"waiting for priv impl...\"",
			"done",
			"DATE=`date '+%Y-%m-%d_%H-%M-%S'`",
			"rm -f /eth/geth.ipc",
			"if [ ! -e /eth/genesis.json ];then",
			"mkdir -p /eth",
			"mkdir -p /logs/gethLogs",
			"cp /tmp/genesis.json /eth/genesis.json",
			"cp /tmp/static-nodes.json /eth/static-nodes.json",
			cpPubKeys,
			"geth init /eth/genesis.json --datadir /eth",		
			"echo '"+"${PASSWORD"+[i]+"}"+"' > ./password",
			"echo '"+"${PRIVATEKEY"+[i]+"}"+"' > ./file",
			"geth account import file --datadir /eth --password password",
			"rm -f ./file && rm -f ./password",
			"fi"
		];
		validator.networks[network_name] = { "ipv4_address":startIp[0]+"."+startIp[1]+"."+startIp[2]+"."+(parseInt(startIp[3])+i) };
		if(test){
			validator.hostname = validatorName;
			if ( !tesseraFlag ) {
				validator.volumes 	    = ["./" + validatorName +":/eth", constellationName +":/constellation:z","./tmp:/tmp"];
				validator["depends_on"] = [constellationName];
			} else {
				validator.volumes 	    = ["./" + validatorName +":/eth","./" + tesseraName +":/priv","./tmp:/tmp"];
				validator["depends_on"] = [tesseraName];
			}
			validator.environment = ["PRIVATE_CONFIG=/constellation/tm.conf"];
			validator.image = "ledgeriumengineering/quorum:faulty_node";
			
			startGeth += " --identity \"" + validatorName + "_faulty\"" + "\ --istanbul.faultymode 1";
		} else {
			startGeth+= " --identity \"" + validatorName + "\"";
		}
		startGeth+=" --emitcheckpoints 2>/logs/gethLogs/" + "$${DATE}_" + validatorName + "_Log.txt\n";
		commands.push(startGeth);
		validator.entrypoint.push(genCommand(commands));
		validator.volumes.push("./logs:/logs");
		return validator;
	},
	"constellation": (i,test)=>{
		var validatorName = "validator-", constellationName = "constellation-";
		if(test){
			validatorName += "test-"; 
			constellationName += "test-";
		}
		if(readparams.modeFlag == "full") {
			validatorName += i;
			constellationName += i;
		}
		else if(readparams.modeFlag == "addon") {
			validatorName += readparams.nodeName;
			constellationName += readparams.nodeName;
		}

		var constellationCom = "constellation-node --socket=/constellation/tm.ipc --publickeys=/constellation/tm.pub "
			+"--privatekeys=/constellation/tm.key --storage=/constellation --verbosity=4";

		var startIp 	  = serviceConfig.constellation.startIp.split(".");
		var othernodes 	  = " --othernodes=";
		var limit 		  = 3;
		if(readparams.modeFlag == "full") {
			for (var j = 0; j < limit; j++) {
				if(i != j){
					othernodes+="http://"+startIp[0]+"."+startIp[1]+"."+startIp[2]+"."+(parseInt(startIp[3])+j)+":"+(serviceConfig.constellation.port+j)+"/";
					if(j != limit-1){
						othernodes+=",";
					}
				}else{
					limit++;
				}
			}
		}
		else if(readparams.modeFlag == "addon") {
			for (var j = 0; j < limit; j++) {
				//if(i != j) {
				othernodes+="http://"+readparams.externalIPAddress+":"+(serviceConfig.constellation.port+j)+"/";
				if(j != limit-1) {
					othernodes+=",";
				}
				// } else {
				// 	limit++;
				// }
			}
		}
		var startConst = constellationCom + othernodes
		+" --url=http://"+startIp[0]+"."+startIp[1]+"."+startIp[2]+"."+(parseInt(startIp[3])+i)+":"+(serviceConfig.constellation.port+i)
		+"/ --port="+(serviceConfig.constellation.port+i);
		//if(i == 0)
		startConst+=" 2>/logs/constellationLogs/" + "$${DATE}_" + validatorName + "_Log.txt"
		var constellation = {
			"hostname"   : constellationName,
			"image"		 : "quorumengineering/constellation:latest",
			"ports"	     : [(serviceConfig.constellation.port+i)+":"+(serviceConfig.constellation.port+i)],
			"volumes"    : [constellationName +":/constellation:z"],
			"entrypoint" : ["/bin/sh","-c"],
			"networks"	: {
			},
			"restart"	: "always"
		};
		const commands = [
			"DATE=`date '+%Y-%m-%d_%H-%M-%S'`",
			"rm -f /constellation/tm.ipc",
			"if [ ! -e \"/constellation/tm.pub\" ];then",
			"mkdir -p /constellation",
			"mkdir -p /logs/constellationLogs",
			"echo \"socket=\\"+"\"/constellation/tm.ipc\\"+"\"\\npublickeys=[\\"+"\"/constellation/tm.pub\\"+"\"]\\n\" > /constellation/tm.conf",
			"constellation-node --generatekeys=/constellation/tm",
			"cp /constellation/tm.pub /tmp/tm"+i+".pub",
			"fi",
			startConst
		];
		if(!tesseraFlag)//if(!tesseraFlag && i == 0)
			constellation.volumes.push("./logs:/logs");
		constellation.entrypoint.push(genCommand(commands));
		constellation.networks[network_name] = { "ipv4_address":startIp[0]+"."+startIp[1]+"."+startIp[2]+"."+(parseInt(startIp[3])+i) };
		return constellation;
	},
	"tessera": (i,test)=>{
		var validatorName = "validator-", tesseraName = "tessera-";
		if(test){
			validatorName += "test-"; 
			tesseraName += "test-";
		}
		if(readparams.modeFlag == "full") {
			validatorName += i;
			tesseraName += i;
		}
		else if(readparams.modeFlag == "addon") {
			validatorName += readparams.nodeName;
			tesseraName += readparams.nodeName;
		}
		var startTess = "java -Xms128M -Xmx128M -jar /tessera/tessera-app.jar -configfile /priv/tessera-config.json";
		//if(i == 0)
			startTess+=" 2>/logs/tesseraLogs/"+ "$${DATE}_" + validatorName + "_Log.txt"
		var tesseraTemplate  = serviceConfig.tessera.tesseraTemplate(i);
		var tessera          = {
			"hostname"   : tesseraName,
			"image"		 : "ledgeriumengineering/ledgeriumtessera:v1.0",
			"ports"	     : [(serviceConfig.tessera.port+i)+":"+serviceConfig.tessera.port],
			"volumes"    : [],
			"entrypoint" : ["/bin/sh","-c"],
			"networks"	 : {
			},
			"restart"	 : "always"
		};
		const startIp = serviceConfig.tessera.startIp.split(".");
		var peers = [];
		var limit = 3;
		if(readparams.modeFlag == "full") {
			for (var j = 0; j < basicConfig.publicKeys.length; j++) {
				if(i != j){
					peers.push({ "url" : "http://"+startIp[0]+"."+startIp[1]+"."+startIp[2]+"."+(parseInt(startIp[3])+j)+":"+(serviceConfig.tessera.port+j)+"/"})
				}	
			}
		}
		else if(readparams.modeFlag == "addon") {
			for (var j = 0; j < basicConfig.publicKeys.length; j++) {
				peers.push({ "url" : "http://"+readparams.externalIPAddress+":"+(serviceConfig.tessera.port+j)+"/"})
			}
		}
		tesseraTemplate.server.port 				= serviceConfig.tessera.port+i;
		tesseraTemplate.server.hostName 			= "http://"+startIp[0]+"."+startIp[1]+"."+startIp[2]+"."+(i+parseInt(startIp[3]));
		tesseraTemplate.peer        				= peers;
		tessera.volumes								= ["./"+tesseraName+":/priv"];
		const commands = [
			"DATE=`date '+%Y-%m-%d_%H-%M-%S'`",
			"rm -f /priv/tm.ipc",
			"if [ ! -e \"/priv/tm.key\" ];then",
			"mkdir -p /priv",
			"mkdir -p /logs/tesseraLogs",
			"echo -e \"\\n\" | java -jar /tessera/tessera-app.jar -keygen -filename /priv/tm",
			"echo '"+JSON.stringify(tesseraTemplate)+"' > /priv/tessera-config.json",
			"cp /priv/tm.pub /tmp/tm"+i+".pub",
			"fi",
			startTess
		];
		if(tesseraFlag)//if(tesseraFlag && i == 0)
			tessera.volumes.push("./logs:/logs");
		tessera.entrypoint.push(genCommand(commands));
		tessera.networks[network_name] = { "ipv4_address":startIp[0]+"."+startIp[1]+"."+startIp[2]+"."+(i+parseInt(startIp[3])) };
		return tessera;
	},
	"governanceApp": (i,test)=>{
		var validatorName = "validator-", constellationName = "constellation-", tesseraName = "tessera-", governanceUIName = "governance-ui-";
		if(test){
			validatorName += "test-"; 
			constellationName += "test-";
			tesseraName += "test-";
			governanceUIName += "test-";
		}
		if(readparams.modeFlag == "full") {
			validatorName += i;
			constellationName += i;
			tesseraName += i;
			governanceUIName += i;
		}
		else if(readparams.modeFlag == "addon") {
			validatorName += readparams.nodeName;
			constellationName += readparams.nodeName;
			tesseraName += readparams.nodeName;
			governanceUIName += readparams.nodeName;
		}
		var gov = {
			"hostname" 		: governanceUIName,
			"image"    		: "ledgeriumengineering/governance_app_ui_img:new_metamask",
			"ports"    		: [(serviceConfig["governance-app"]["port-exp"]+i)+":"+serviceConfig["governance-app"]["port-int"]],
			"volumes"  		: ["./" + validatorName +':/eth'],
			"depends_on" 	: [validatorName],
			"entrypoint"    : [ "/bin/sh","-c"],
			"networks"      : {

			},
			"restart"	 : "always"
		}
		const startIp = serviceConfig["governance-app"].startIp.split(".");
		const ip = startIp[0]+"."+startIp[1]+"."+startIp[2]+"."+(parseInt(startIp[3])+i);
		const vip = serviceConfig.validator.startIp.split(".");
		var string = "set -u\n set -e\n";
		string+="mkdir -p /logs/governanceappLogs\n";
		string+="DATE=`date '+%Y-%m-%d_%H-%M-%S'`\n";
		if(i == 0) { //Initialisation is to be done only for one node. We are doing for the first node -> i == 0
			string+="cd /ledgerium/governanceapp/governanceApp\n",
			string+="node index.js protocol=http hostname=" + vip[0]+"."+vip[1]+"."+vip[2]+"."+(parseInt(vip[3])+i) +" port=8545 privateKeys="
			for(nodeIndex = 0; nodeIndex < numberOfNodes;) {
			//if((i == 0) && (numberOfNodes >= 3)) {
				string+= "${PRIVATEKEY" + (nodeIndex++) + "}"
				if(nodeIndex < numberOfNodes) //the last node
				string+= ","
			}
			string+= "\n"
			string+="node index.js protocol=http hostname=" + vip[0]+"."+vip[1]+"."+vip[2]+"."+(parseInt(vip[3])+i) +" port=8545 initialiseApp=/eth/nodedetails.json\n";
		}	
		string+="cd /ledgerium/governanceapp/governanceApp/app\n";
		string+="node governanceUI.js "+vip[0]+"."+vip[1]+"."+vip[2]+"."+(parseInt(vip[3])+i)+" "+(serviceConfig.validator.rpcPort+i)+"\n";		
		string+=" 2>/logs/governanceappLogs/"+ "$${DATE}_" + validatorName + "_Log.txt"
		gov.entrypoint.push(string);
		if ( !tesseraFlag ){
			gov.volumes.push(constellationName+":/constellation:z")
		}else{
			gov.volumes.push("./"+tesseraName+":/priv")
		}
		gov.networks[network_name] = { "ipv4_address":ip };
		return gov;
	}
};
const template = {
	"version":"3",
	"services": {

	},
	"volumes":{

	}
};
exports.template 				= template;
exports.services 				= services;
exports.serviceConfig			= serviceConfig;
exports.networks				= networks;
exports.tesseraFlag				= tesseraFlag;
