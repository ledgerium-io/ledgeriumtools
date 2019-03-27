//'use strict';
const basicConfig = require('../src/basicconfig');
const readparams = require('../src/readparams');

const gethCom   = "geth --rpc --rpcaddr '0.0.0.0' --rpccorsdomain '*' \
--datadir '/eth' --rpcapi 'db,eth,net,web3,istanbul,personal,admin,debug,txpool' \
--ws --wsorigins '*' --wsapi 'db,eth,net,web3,personal,admin,debug,txpool' \
--wsaddr '0.0.0.0' --networkid 2018 --targetgaslimit 9007199254740000 \
--debug --metrics --syncmode 'full' --mine --verbosity 6 \
--minerthreads 1";

const tesseraFlag = false;
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
	"mongodb" : {
		"ip" : base_ip.slice(0, base_ip.length-1)+"2"
	},
	"redis" : {
		"ip" : base_ip.slice(0, base_ip.length-1)+"3"
	},
	"docusaurus" : {
		"ip" : base_ip.slice(0, base_ip.length-1)+"4"
	},
	"blockexplorer" : {
		"ip" : base_ip.slice(0, base_ip.length-1)+"5"
	},
	"ledgeriumfaucet" : {
		"ip" : base_ip.slice(0, base_ip.length-1)+"6"
	},
	"web" : {
		"ip" : base_ip.slice(0, base_ip.length-1)+"7"
	},
	"ledgeriumstats":{
		"ip" : base_ip.slice(0, base_ip.length-1)+"8"
	},
	"ledgeriumdocs" : {
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
	"tessera-enhanced":{
		"startIp":base_ip.slice(0, base_ip.length-1)+"100",
		"port":10000,
		"tesseraTemplate":(i,port)=>{
    		return	{
    			"useWhiteList": false,
	    		"jdbc": {
		        	"username": "sa",
		        	"password": "",
		        	"url": "jdbc:h2:.//priv/db;MODE=Oracle;TRACE_LEVEL_SYSTEM_OUT=0",
		        	"autoCreateTables": true
	    		},
		   		"serverConfigs":[
			        {
			            "app":"ThirdParty",
			            "enabled": true,
			            "serverSocket":{
			                "type":"INET",
			                "port": port+i,
			                "hostName": ""
			            },
			            "communicationType" : "REST"
			        },
			        {
			            "app":"Q2T",
			            "enabled": true,
			            "serverSocket":{
			                "type":"UNIX",
			                "path":"/priv/tm.ipc"
			            },
			            "communicationType" : "UNIX_SOCKET"
			        },
			        {
			            "app":"P2P",
			            "enabled": true,
			            "serverSocket":{
			                "type":"INET",
			                "port": port+i,
			                "hostName": ""
			            },
			            "sslConfig": {
			                "tls": "OFF",
			                "generateKeyStoreIfNotExisted": true,
			                "serverKeyStore": "/priv/server${i}-keystore",
			                "serverKeyStorePassword": "quorum",
			                "serverTrustStore": "/priv/server-truststore",
			                "serverTrustStorePassword": "quorum",
			                "serverTrustMode": "TOFU",
			                "knownClientsFile": "/priv/knownClients",
			                "clientKeyStore": "/priv/client${i}-keystore",
			                "clientKeyStorePassword": "quorum",
			                "clientTrustStore": "/priv/client-truststore",
			                "clientTrustStorePassword": "quorum",
			                "clientTrustMode": "TOFU",
			                "knownServersFile": "/priv/knownServers"
			            },
			            "communicationType" : "REST"
			        }
    			],
			    "peer": [],
			    "keys": {
			        "passwords": [],
			        "keyData": [
			            {
			                "privateKeyPath": "/priv/tm.key",
			                "publicKeyPath": "/priv/tm.pub"
			            }
			        ]
			    },
    			"alwaysSendTo": []
			}
		}
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
			ipaddressText = " --ethstats \"" + validatorName + ":bb98a0b6442334d0cdf8a31b267892c1@"+serviceConfig["ledgeriumstats"].ip;
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
			//validator.entrypoint.push(genCommand(commands.slice(4, commands.length)));
			//validator.restart = "always";
			//return validator;
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
				othernodes+="http://"+readparams.externalIPAddress+":"+(serviceConfig.constellation.port+j)+"/";
				if(j != limit-1) {
					othernodes+=",";
				}
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
		if(!tesseraFlag)
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
		startTess+=" 2>/logs/tesseraLogs/"+ "$${DATE}_" + validatorName + "_Log.txt"
		var port = serviceConfig.tessera.port; //serviceConfig["tessera-enhanced"].port;
		var tesseraTemplate  = serviceConfig.tessera.tesseraTemplate(i);
		var eTesseraTemplate = serviceConfig["tessera-enhanced"].tesseraTemplate(i,port);
		var tessera          = {
			"hostname"   : tesseraName,
			"image"		 : "quorumengineering/tessera:latest",
			"ports"	     : [(port+i)+":"+port],
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
					peers.push({ "url" : "http://"+startIp[0]+"."+startIp[1]+"."+startIp[2]+"."+(parseInt(startIp[3])+j)+":"+(port+j)+"/"})
				}	
			}
		}
		else if(readparams.modeFlag == "addon") {
			for (var j = 0; j < basicConfig.publicKeys.length; j++) {
				peers.push({ "url" : "http://"+readparams.externalIPAddress+":"+(port+j)+"/"})
			}
		}
		tesseraTemplate.server.port 				   = port+i;
		tesseraTemplate.server.hostName 			   = "http://"+startIp[0]+"."+startIp[1]+"."+startIp[2]+"."+(i+parseInt(startIp[3]));
		eTesseraTemplate.serverConfigs[0].serverSocket = "http://"+startIp[0]+"."+startIp[1]+"."+startIp[2]+"."+(i+parseInt(startIp[3]));
		eTesseraTemplate.serverConfigs[2].serverSocker = "http://"+startIp[0]+"."+startIp[1]+"."+startIp[2]+"."+(i+parseInt(startIp[3]));
		tesseraTemplate.peer        				   = peers;
		eTesseraTemplate.peer 						   = peers;
		tessera.volumes								   = ["./"+tesseraName+":/priv"];
		const commands = [
			"DATE=`date '+%Y-%m-%d_%H-%M-%S'`",
			"rm -f /priv/tm.ipc",
			"if [ ! -e \"/priv/tm.key\" ];then",
			"mkdir -p /priv",
			"mkdir -p /logs/tesseraLogs",
			"echo -e \"\\n\" | java -jar /tessera/tessera-app.jar -keygen -filename /priv/tm",
			"echo '"+JSON.stringify(tesseraTemplate)+"' > /priv/tessera-config.json",
			"echo '"+JSON.stringify(eTesseraTemplate)+"' > /priv/tessera-config-enhanced.json",
			"cp /priv/tm.pub /tmp/tm"+i+".pub",
			"fi",
			startTess
		];
		if(tesseraFlag)
			tessera.volumes.push("./logs:/logs");
		tessera.entrypoint.push(genCommand(commands));
		tessera.networks[network_name] = { "ipv4_address":startIp[0]+"."+startIp[1]+"."+startIp[2]+"."+(i+parseInt(startIp[3])) };
		return tessera;
	},
	"governanceapp": (i,test)=>{
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
			"image"    		: "ledgeriumengineering/governance_app_ui_img:v1.0",
			"ports"    		: [(serviceConfig["governance-app"]["port-exp"]+i)+":"+serviceConfig["governance-app"]["port-int"]],
			"volumes"  		: ["./" + validatorName +':/eth',"./tmp:/tmp"],
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
		string+="cp /tmp/nodesdetails.json /eth/nodesdetails.json\n";
		string+="while [ ! -e /eth/geth.ipc ];do\n";
		string+="sleep 1\n";
		string+="echo \"Waiting for validator to be ready...\"\n";
		string+="done\n";
		if(i == 0) { //Initialisation is to be done only for one node. We are doing for the first node -> i == 0
			string+="cd /ledgerium/governanceapp/governanceapp\n",
			string+="node index.js protocol=http hostname=" + vip[0]+"."+vip[1]+"."+vip[2]+"."+(parseInt(vip[3])+i) +" port=" + serviceConfig.validator.rpcPort + " initiateApp="
			var privateKeyString="";
			for(var nodeIndex = 0; nodeIndex < numberOfNodes;) {
				privateKeyString+= "${PRIVATEKEY" + (nodeIndex++) + "}"
				if(nodeIndex < numberOfNodes){ //if not the last node
					privateKeyString+= ",";
				}	
			}
			string+=privateKeyString;
			string+=",/eth/nodesdetails.json";

			var accountString="";
			for(nodeIndex = 3; nodeIndex < numberOfNodes;) {
				//first 3 accounts are init from initiateApp, rest of them should be added as adminValidatorSet and simpleValidatorSet
				accountString+= "0x" + basicConfig.publicKeys[nodeIndex++];
				if(nodeIndex < numberOfNodes){ //if not the last node
					accountString+=",";
				}	
			}
			string+=" runadminvalidator=addOneAdmin,"+accountString;
			string+=" runsimplevalidator=addSimpleSetContractValidatorForAdmin,"+accountString;
			string+= "\n"
		}	
		string+="cd /ledgerium/governanceapp/governanceapp/app\n";
		
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
	},
	"blockexplorer" : () => {
		var blockexplorer = {
			"image" : "blkio10/explorer-free:2.1.2",
			"container_name" : "blk-free-explorer",
			"ports" : ["8081:8081"],
			"environment": ["ENABLE_PRIVATE_QUORUM=enabled", "JAVA_OPTS=", "EXPLORER_PORT=8081", "MONGO_DB_NAME=test", "USE_COSMOS=false"],
			"depends_on" : ["mongodb"],
			"networks" : {}
		}
		blockexplorer.networks[network_name] = { "ipv4_address":serviceConfig["blockexplorer"].ip };
		blockexplorer.environment.push("NODE_ENDPOINT=http://"+serviceConfig.validator.startIp+":"+serviceConfig.validator.rpcPort);
		blockexplorer.environment.push("MONGO_CLIENT_URI=mongodb://"+serviceConfig.mongodb.ip+":27017");
		blockexplorer.environment.push("UI_IP=http://"+serviceConfig.web.ip+":5000");
		return blockexplorer;
	},
	"mongodb": () => {
		var mongodb = {
			"image": "mongo:3.4.10",
			"container_name": "blk-free-mongodb",
			"ports": ["27017:27017"],
			"entrypoint": "mongod --smallfiles --logpath=/dev/null --bind_ip '0.0.0.0'",
			"networks" : {}
		}
		mongodb.networks[network_name] = { "ipv4_address":serviceConfig["mongodb"].ip };
		return mongodb;
	},
	"web" : () => {
		var web = {
			"image": "blkio10/explorer-ui-free:2.1.2",
			"container_name": "blk-free-explorer-ui",
			"ports": ["5000:5000"],
			"environment": ["REACT_APP_EXPLORER=http://localhost:8081"],
			"networks" : {}
		}
		web.networks[network_name] = { "ipv4_address":serviceConfig["web"].ip };
		return web;
	},
	"docusaurus" : () => {
		var doc = {
			"image" : "ledgeriumengineering/ledgeriumdocusaurus:v1.0",
			"ports" : ["4000:3000"],
			"entrypoint" : ["/bin/sh", "-c"],
			"networks" : {}
		};
		var commands = ["npm start"]
		doc.entrypoint.push(genCommand(commands))
		doc.networks[network_name] = {"ipv4_address": serviceConfig["docusaurus"].ip};
		return doc;
	},
	"ledgeriumfaucet" : () => {
		var ledgeriumfaucet = {
			"image" : "ledgeriumengineering/ledgeriumfaucet:v1.0",
			"ports" : ["5577:5577"],
			"entrypoint" : ["/bin/sh", "-c"],
			"volumes"  	: ["./logs:/logs"],
			"environment": ["GOOGLE_CAPTCHA_SECRET=6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe","REQUEST_LIMIT=3","REDIS_EXPIRE_SECONDS=86400"],
			"networks" : {}
		};
		var startEntryPoint = "";
		startEntryPoint+="set -u\n";
		startEntryPoint+="set -e\n";
		startEntryPoint+="mkdir -p /logs/ledgeriumfaucetLogs";
		const commands = [
			startEntryPoint,
			"DATE=`date '+%Y-%m-%d_%H-%M-%S'`",
			"node index.js ${PRIVATEKEY0} 2>/logs/ledgeriumfaucetLogs/$${DATE}_ledgeriumfaucet_Log.txt"
		];
		ledgeriumfaucet.entrypoint.push(genCommand(commands))
		ledgeriumfaucet.networks[network_name] = {"ipv4_address": serviceConfig["ledgeriumfaucet"].ip};
		ledgeriumfaucet.environment.push("NODE_URL=http://"+serviceConfig.validator.startIp+":"+serviceConfig.validator.rpcPort);
		ledgeriumfaucet.environment.push("REDIS_URL=redis://"+serviceConfig.redis.ip+":6379");
		return ledgeriumfaucet;
	},
	"redis": () => {
		var redis = {
			"image": "redis:alpine",
			"ports": ["6379:6379"],
			"networks" : {}
		}
		redis.networks[network_name] = {"ipv4_address": serviceConfig["redis"].ip};
		return redis;
	},
	"ledgeriumdocs" : () => {
		var doc = {
			"image" : "ledgeriumengineering/ledgeriumdocs:v1.0",
			"ports" : ["7000:8000"],
			"networks" : {}
		};
		doc.networks[network_name] = {"ipv4_address": serviceConfig["ledgeriumdocs"].ip};
		return doc;
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
