const basicConfig = require('../src/basicconfig');
const readparams = require('../src/readparams');

const gethCom   = `geth --rpc --rpcaddr '0.0.0.0' --rpccorsdomain '*' \
--datadir '/eth' --rpcapi 'db,eth,net,web3,istanbul,personal,admin,debug,txpool' \
--ws --wsorigins '*' --wsapi 'db,eth,net,web3,personal,admin,debug,txpool' \
--wsaddr '0.0.0.0' --networkid ${readparams.networkId} --targetgaslimit 9007199254740000 \
--debug --metrics --syncmode 'full' --mine --verbosity 6 \
--minerthreads 1`;

const tesseraFlag = true;
const network_name = "test_net";
var base_ip = "172.19.240.0",entrypoint, qmvolumes =[];
var gateway = "172.19.240.1"

const genCommand = (commands)=>{
	var commandString = "";
	for (var j = 0; j < commands.length; j++) {
		commandString+=commands[j]+"\n";
	}
	return commandString;
}

const deployConfig=(maxMem,minMem)=>{
	return {
		"resources":{
			"limits":{
				"memory": maxMem+'M'
			},
			"reservations":{
				"memory": minMem+'M'
			}
		}
	};
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
		"ip" : base_ip.slice(0, base_ip.length-1)+"8",
		"deploy": deployConfig(500,128)
	},
	"validator": {
		"startIp": base_ip.slice(0, base_ip.length-1)+"10",
		"gossipPort":30303,
		"rpcPort":8545,
		"wsPort":9000,
		"deploy":deployConfig(1024,128)
	},
	"constellation": {
		"startIp":base_ip.slice(0, base_ip.length-1)+"100",
		"port":10000,
		'deploy':deployConfig(1024,128)
	},
	"tessera": {
		"startIp":base_ip.slice(0, base_ip.length-1)+"100",
		"port":10000,
		'deploy':deployConfig(1024,128),
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
	"tessera-enhanced": {
		"startIp":base_ip.slice(0, base_ip.length-1)+"100",
		"port":10000,
		'deploy':deployConfig(1024,128),
		"tesseraTemplate":(i,port)=>{
    		return	{
    			"useWhiteList": false,
	    		"jdbc": {
		        	"username": "sa",
		        	"password": "",
		        	"url": "jdbc:h2:.//priv/db;MODE=Oracle;TRACE_LEVEL_SYSTEM_OUT=0",
					autoCreateTables : true
	    		},
		   		"serverConfigs":[
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
			                "serverKeyStore": "/priv/server"+i+"-keystore",
			                "serverKeyStorePassword": "quorum",
			                "serverTrustStore": "/priv/server-truststore",
			                "serverTrustStorePassword": "quorum",
			                "serverTrustMode": "TOFU",
			                "knownClientsFile": "/priv/knownClients",
			                "clientKeyStore": "/priv/client"+i+"-keystore",
			                "clientKeyStorePassword": "quorum",
			                "clientTrustStore": "/priv/client-truststore",
			                "clientTrustStorePassword": "quorum",
			                "clientTrustMode": "TOFU",
			                "knownServersFile": "/priv/knownServers"
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
						"app":"ThirdParty",
						"enabled": true,
						"serverSocket":{
							"type":"INET",
							"port": port+100+i,
							"hostName": ""
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
    			"alwaysSendTo": [],
				"unixSocketFile": "/priv/tm.ipc"
			}
		}
	},
	"tessera-nine" : {
		"startIp":base_ip.slice(0, base_ip.length-1)+"100",
		"port":10000,
		'deploy':deployConfig(1024,128),
		'tesseraTemplate': ( i, port ) =>{
			return {
				"useWhiteList" : false,
				"jdbc"         : {
					"username" : "sa",
					"password" : "",
					"url"      : "jdbc:h2:.//priv/db;MODE=Oracle;TRACE_LEVEL_SYSTEM_OUT=0",
					"autoCreateTables" : true
				},
				"serverConfigs" : [
					{
					    "app":"P2P",
						"enabled": true,
						"ledgerId" : readparams.networkId.toString(),
					    "serverAddress"  : (port+i),
					    "bindingAddress" : "http://0.0.0.0:"+(port+i),
					    "sslConfig": {
					        "tls": "STRICT",
					        "generateKeyStoreIfNotExisted": true,
					        "serverKeyStore": "/priv/server"+i+"-keystore",
					        "serverKeyStorePassword": "quorum",
					        "serverTrustStore": "/priv/server-truststore",
					        "serverTrustStorePassword": "quorum",
					        "serverTrustMode": "TOFU",
					        "knownClientsFile": "/priv/knownClients",
					        "clientKeyStore": "/priv/client"+i+"-keystore",
					        "clientKeyStorePassword": "quorum",
					        "clientTrustStore": "/priv/client-truststore",
					        "clientTrustStorePassword": "quorum",
					        "clientTrustMode": "TOFU",
					        "knownServersFile": "/priv/knownServers"
					    },
						"communicationType" : "REST"
					},
					{
						"app":"Q2T",
						"enabled": true,
						"serverAddress": "unix:/priv/tm.ipc",
						"communicationType" : "REST"
					},
					{
						"app":"ThirdParty",
						"enabled": true,
						"serverAddress" : (port+100+i),
						"bindingAddress": "http://0.0.0.0:"+(port+100+i),
						"communicationType" : "REST"
					}
				],
				"peer" : [],
				"keys": {
			        "passwords": [],
			        "keyData": [
			            {
			                "privateKeyPath": "/priv/tm.key",
			                "publicKeyPath": "/priv/tm.pub"
			            }
			        ]
			    },
    			"alwaysSendTo": [],
				"unixSocketFile": "/priv/tm.ipc"
			}
		}
	},
	"quorum-maker": {
		"ip"   : base_ip.slice(0, base_ip.length-1)+"196",
		"port" : 9999,
		'deploy': deployConfig(500,128)
	},
	"governance-app": {
		"port-exp": 3545,
		"port-int": 3003,
		"startIp" : base_ip.slice(0, base_ip.length-1)+"150",
		'deploy': deployConfig(500,128)
	},
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
	"ledgeriumdocs" : {
		"ip" : base_ip.slice(0, base_ip.length-1)+"9"
	}
};

const services = {
	"ledgeriumstats": ()=> {
		var eth = {
			"image"        : "ledgeriumengineering/ledgeriumstats:v1.0",
			"ports"        : ["3000:3000"],
			"environment"  : ["WS_SECRET=bb98a0b6442334d0cdf8a31b267892c1"],
			"restart"	   : "always",
			"networks"	   : {
			}
		};
		eth.deploy                 = serviceConfig['ledgeriumstats'].deploy;
		eth.networks[network_name] = { "ipv4_address":serviceConfig["ledgeriumstats"].ip };
		return eth;
	},
	"quorum-maker": ()=> {
		var quorum = {
			"hostname": "quorum-maker",
			"image"   : "ledgeriumengineering/quorum-maker:v0.1",
			"ports"	  : [serviceConfig["quorum-maker"].port+":"+serviceConfig["quorum-maker"].port],
			"volumes" : ["./logs:/logs","./tmp:/tmp","quorum-maker:/quorum-maker"],
			"depends_on": (readparams.distributed)? ["validator-" + ipAddress[0]] : ["validator-" + readparams.nodeName + '0'],
			"entrypoint":[ "/bin/sh", "-c"],
			"networks": {
			},
			"restart": "always"
		};
		
		quorum.deploy = serviceConfig['quorum-maker'].deploy;
		quorum.networks[network_name] = { "ipv4_address": serviceConfig["quorum-maker"].ip }

		if(readparams.distributed) {
			quorum.volumes.push("./validator-" + ipAddress[0] + ":/eth");
		
			var publicKeyPath = (i) => { return "/tmp/tm"+i+".pub"; };
			if(tesseraFlag) {
				quorum.volumes.push("./tessera-" + ipAddress[0] + ":/priv");
			}
			else{
				quorum.volumes.push("constellation-" + ipAddress[0] + ":/constellation:z");
			}
		} else {
			quorum.volumes.push("./validator-" + readparams.nodeName + "0" + ":/eth");
			var publicKeyPath = (i) => { return "/tmp/tm"+i+".pub"; };
			if(tesseraFlag) {
				quorum.volumes.push("./tessera-" + readparams.nodeName + "0" + ":/priv");
			}
			else{
				quorum.volumes.push("constellation-" + readparams.nodeName + "0" + ":/constellation:z");
			}
		}

		var commands = [
			"set -u",
			"set -e",
			"mkdir -p /logs/quorummakerlogs",
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
			const ip = startIp[0]+"."+startIp[1]+"."+startIp[2]+"."+(parseInt(startIp[3])+i);
			// const ip = (readparams.distributed)? ipAddress[i] : startIp[0]+"."+startIp[1]+"."+startIp[2]+"."+(parseInt(startIp[3])+i);
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
		var tranStr;
		if(!tesseraFlag) {
			tranStr = "/logs/constellationlogs";
		} else {
			tranStr = "/logs/tesseralogs";
		}
		var commandString = " /logs/validatorlogs/ " +  tranStr + " /quorum-maker/setup.conf" + " >/logs/quorummakerlogs/" + "$${DATE}_log.txt";
		//commands.push("./NodeManager http://"+serviceConfig.validator.startIp+":"+serviceConfig.validator.rpcPort+" "
		commands.push("./NodeManager http://"+gateway+":"+serviceConfig.validator.rpcPort+" "
			+serviceConfig["quorum-maker"]["port"]+ commandString);
		quorum.entrypoint.push(genCommand(commands));
		return quorum;
	},
	"validator": (i,test)=> {
		var validatorName = "validator-", constellationName = "constellation-", tesseraName = "tessera-";
		if(test){
			validatorName += "test-"; 
			constellationName += "test-";
			tesseraName += "test-";
		}

		if(readparams.distributed) {
			validatorName += ipAddress[i];
			constellationName += ipAddress[i];
			tesseraName += ipAddress[i];
		} else {
			if(readparams.modeFlag == "full") {
				validatorName += readparams.nodeName + i;
				constellationName += readparams.nodeName + i;
				tesseraName += readparams.nodeName + i;
			}
			else if(readparams.modeFlag == "masternode") {
				validatorName += readparams.nodeName;
				constellationName += readparams.nodeName;
				tesseraName += readparams.nodeName;
			}
		}
		
		var ipaddressText;
		var startGeth;
		if(readparams.modeFlag == "full") {
			if(readparams.distributed) {
				ipaddressText = " --ethstats \"" + validatorName + ":bb98a0b6442334d0cdf8a31b267892c1@"+ipAddress[0];
			} else {
				ipaddressText = " --ethstats \"" + validatorName + ":bb98a0b6442334d0cdf8a31b267892c1@"+serviceConfig["ledgeriumstats"].ip;
			}
		}
		else if(readparams.modeFlag == "masternode")
			ipaddressText = " --ethstats \"" + validatorName + ":bb98a0b6442334d0cdf8a31b267892c1@"+readparams.externalIPAddress;
		startGeth = gethCom + " --rpcvhosts=" + readparams.domainName + " --nodekeyhex \""+"${PRIVATEKEY"+[i]+"}"+"\" "
		+"--etherbase \""+basicConfig.publicKeys[i]+"\" --port \""+serviceConfig.validator.gossipPort+"\""
		+ipaddressText+":3000\" --rpcport "+serviceConfig.validator.rpcPort
		+" --wsport "+serviceConfig.validator.wsPort; // quorum maker service uses this identity
		const startIp = serviceConfig.validator.startIp.split(".");
		var validator = {
			"hostname"   : validatorName, 
			"image"		 :	"ledgeriumengineering/ledgeriumcore:blockrewards",
			"volumes"    : [],
			"depends_on" : [constellationName],
			"environment":	["PRIVATE_CONFIG=/constellation/tm.conf"],
			"entrypoint" : ["/bin/sh","-c"],
			"networks"	:	{
			},
			"restart"	: "always"
		};

		if(readparams.distributed) {
			validator.ports = [
				serviceConfig.validator.gossipPort+":"+serviceConfig.validator.gossipPort,
				serviceConfig.validator.rpcPort+":"+serviceConfig.validator.rpcPort,
				serviceConfig.validator.wsPort+":"+serviceConfig.validator.wsPort
			]
		} else {
			validator.ports = [
				(serviceConfig.validator.gossipPort+i)+":"+serviceConfig.validator.gossipPort,
				(serviceConfig.validator.rpcPort+i)+":"+serviceConfig.validator.rpcPort,
				(serviceConfig.validator.wsPort+i)+":"+serviceConfig.validator.wsPort
			]
		}

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
		else if(readparams.modeFlag == "masternode"){
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
			"mkdir -p /logs/validatorlogs",
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
		validator.deploy = serviceConfig['validator'].deploy;
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
		startGeth+=" --emitcheckpoints 2>/logs/validatorlogs/" + validatorName + "_log_$${DATE}.txt";
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
		//if(readparams.modeFlag == "full") {
			validatorName += readparams.nodeName + i;
			constellationName += readparams.nodeName + i;
		// }
		// else if(readparams.modeFlag == "masternode") {
		// 	validatorName += readparams.nodeName + i;
		// 	constellationName += readparams.nodeName + i;
		// }

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
		else if(readparams.modeFlag == "masternode") {
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
		startConst+=" >/logs/constellationlogs/" + constellationName + "_log_$${DATE}.txt";
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
			"mkdir -p /logs/constellationlogs",
			"echo \"socket=\\"+"\"/constellation/tm.ipc\\"+"\"\\npublickeys=[\\"+"\"/constellation/tm.pub\\"+"\"]\\n\" > /constellation/tm.conf",
			"constellation-node --generatekeys=/constellation/tm",
			"cp /constellation/tm.pub /tmp/tm"+i+".pub",
			"fi",
			startConst
		];
		constellation.deploy = serviceConfig['constellation'].deploy;
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

		if(readparams.distributed) {
			validatorName += ipAddress[i];
			tesseraName += ipAddress[i];
		} else {
			if(readparams.modeFlag == "full") {
				validatorName += readparams.nodeName + i;
				tesseraName += readparams.nodeName + i;
			}
			else if(readparams.modeFlag == "masternode") {
				validatorName += readparams.nodeName;
				tesseraName += readparams.nodeName;
			}
		}


		var startTess = "java -Xms1024M -Xmx1024M -jar /tessera/tessera-app.jar -configfile /priv/tessera-config.json";
		startTess+=" >/logs/tesseralogs/"+ tesseraName + "_log_$${DATE}.txt";
		var port = serviceConfig["tessera-nine"].port;
		/* old tessera versions
		var port = serviceConfig.tessera.port; 
		var port = serviceConfig["tessera-enhanced"].port;
		*/
		/* old tessera
		var port = serviceConfig.tessera.port; //serviceConfig["tessera-enhanced"].port;
		var tesseraTemplate  = serviceConfig.tessera.tesseraTemplate(i);
		var eTesseraTemplate = serviceConfig["tessera-enhanced"].tesseraTemplate(i,port);
		*/
		var tesseraNineTemplate = serviceConfig["tessera-nine"].tesseraTemplate( i, port );
		var tessera          = {
			"hostname"   : tesseraName,
			"image"		 : "ledgeriumengineering/tessera:v1.1",
			"volumes"    : [],
			"entrypoint" : ["/bin/sh","-c"],
			"networks"	 : {
			},
			"restart"	 : "always"
		};

		if(readparams.distributed) {
			tessera.ports	= [(port)+":"+(port),(port+100)+":"+(port+100)]
		} else {
			tessera.ports	= [(port+i)+":"+(port+i),(port+100+i)+":"+(port+100+i)]
		}

		const startIp = serviceConfig.tessera.startIp.split(".");
		var peers = [];
		var limit = 3;
		if(readparams.modeFlag == "full") {
			for (var j = 0; j < basicConfig.publicKeys.length; j++) {
				if(i != j){
					// peers.push({ "url" : "http://"+startIp[0]+"."+startIp[1]+"."+startIp[2]+"."+(parseInt(startIp[3])+j)+":"+(port+j)+"/"})
					if(readparams.distributed){
						peers.push({ "url" : "https://"+ipAddress[j]+":"+(port)+"/"})
					} else {
						peers.push({ "url" : "https://"+readparams.externalIPAddress+":"+(port+j)+"/"})
					}
				}	
			}
			const serverPortP2p 		= tesseraNineTemplate.serverConfigs[0].serverAddress;
			const serverPortThirdParty  = tesseraNineTemplate.serverConfigs[2].serverAddress;
			if(readparams.distributed) {
				tesseraNineTemplate.serverConfigs[0].serverAddress = "https://"+ipAddress[i]+":"+port;
				tesseraNineTemplate.serverConfigs[2].serverAddress = "https://"+ipAddress[i]+":"+(port+100);
				tesseraNineTemplate.serverConfigs[0].bindingAddress = "https://0.0.0.0:"+(port);
				tesseraNineTemplate.serverConfigs[2].bindingAddress = "https://0.0.0.0:"+(port+100);
			} else {
				tesseraNineTemplate.serverConfigs[0].serverAddress = "https://"+readparams.externalIPAddress+":"+serverPortP2p;
				tesseraNineTemplate.serverConfigs[2].serverAddress = "https://"+startIp[0]+"."+startIp[1]+"."+startIp[2]+"."+(i+parseInt(startIp[3]))+":"+serverPortThirdParty;
				tesseraNineTemplate.serverConfigs[0].bindingAddress = "https://0.0.0.0:"+serverPortP2p;
				tesseraNineTemplate.serverConfigs[2].bindingAddress = "https://0.0.0.0:"+serverPortThirdParty;
			}
		}
		else if(readparams.modeFlag == "masternode") {
			for (var j = 0; j < basicConfig.publicKeys.length; j++) {
				peers.push({ "url" : "http://"+readparams.externalIPAddress+":"+(port+j)+"/"})
			}
			const serverPortP2p 		= tesseraNineTemplate.serverConfigs[0].serverAddress;
			const serverPortThirdParty  = tesseraNineTemplate.serverConfigs[2].serverAddress;
			tesseraNineTemplate.serverConfigs[0].serverAddress = "http://"+readparams.externalIPAddress+":"+serverPortP2p;
			tesseraNineTemplate.serverConfigs[2].serverAddress = "http://"+readparams.externalIPAddress+":"+serverPortThirdParty;
		}
		/* old tessera versions
		tesseraTemplate.server.port 				   = port+i;
		tesseraTemplate.server.hostName 			   = "http://"+startIp[0]+"."+startIp[1]+"."+startIp[2]+"."+(i+parseInt(startIp[3]));
		eTesseraTemplate.serverConfigs[0].serverSocket.hostName = "http://"+startIp[0]+"."+startIp[1]+"."+startIp[2]+"."+(i+parseInt(startIp[3]));
		eTesseraTemplate.serverConfigs[2].serverSocket.hostName = "http://"+startIp[0]+"."+startIp[1]+"."+startIp[2]+"."+(i+parseInt(startIp[3]));
		tesseraTemplate.peer        				   = peers;
		eTesseraTemplate.peer 						   = peers;
		*/
		tesseraNineTemplate.peer              			   = peers;
		tessera.volumes								       = ["./"+tesseraName+":/priv"];
		var keytoolStr;
		if(readparams.distributed){
			keytoolStr = `keytool -alias tessera -dname CN=${tesseraName} -genkeypair -keystore /priv/server${i}-keystore -storepass quorum -ext SAN=dns:localhost,dns:${tesseraName},ip:127.0.0.1,ip:0.0.0.0,ip:${startIp[0]}.${startIp[1]}.${startIp[2]}.${(i+parseInt(startIp[3]))},ip:${ipAddress[i]}`
		} else {
			keytoolStr = `keytool -alias tessera -dname CN=${tesseraName} -genkeypair -keystore /priv/server${i}-keystore -storepass quorum -ext SAN=dns:localhost,dns:${tesseraName},ip:127.0.0.1,ip:0.0.0.0,ip:${startIp[0]}.${startIp[1]}.${startIp[2]}.${(i+parseInt(startIp[3]))},ip:${readparams.externalIPAddress}`
		}
		const commands = [
			"DATE=`date '+%Y-%m-%d_%H-%M-%S'`",
			"rm -f /priv/tm.ipc",
			"if [ ! -e \"/priv/tm.key\" ];then",
			"mkdir -p /priv",
			"mkdir -p /logs/tesseralogs",
			keytoolStr,
			"echo -e \"\\n\" | java -jar /tessera/tessera-app.jar -keygen -filename /priv/tm",
			/* old tessera versions
			"echo '"+JSON.stringify(tesseraTemplate)+"' > /priv/tessera-config.json",
			"echo '"+JSON.stringify(eTesseraTemplate)+"' > /priv/tessera-config.json",
			*/
			"echo '"+JSON.stringify(tesseraNineTemplate)+"' > /priv/tessera-config.json",
			"cp /priv/tm.pub /tmp/tm"+i+".pub",
			"fi",
			startTess
		];
		/* old tessera versions
		tessera.deploy = serviceConfig['tessera-enhanced'].deploy;
		tessera.deploy = serviceConfig['tessera'].deploy;
		*/
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

		if(readparams.distributed) {
			validatorName += ipAddress[i];
			constellationName += ipAddress[i];
			tesseraName += ipAddress[i];
			governanceUIName += ipAddress[i];
		} else {

			if(readparams.modeFlag == "full"){
				validatorName += readparams.nodeName + i;
				constellationName += readparams.nodeName + i;
				tesseraName += readparams.nodeName + i;
				governanceUIName += readparams.nodeName + i;
			}else {
				validatorName += readparams.nodeName;
				constellationName += readparams.nodeName;
				tesseraName += readparams.nodeName;
				governanceUIName += readparams.nodeName;
			}

		}

		var gov = {
			"hostname" 		: governanceUIName,
			"image"    		: "ledgeriumengineering/governance_app_ui_img:v1.0",
			"volumes"  		: ["./logs:/logs","./" + validatorName +':/eth',"./tmp:/tmp"],
			"depends_on" 	: [validatorName],
			"entrypoint"    : [ "/bin/sh","-c"],
			"networks"      : {

			},
			"restart"	 : "always"
		}

		if(readparams.distributed) {
			gov.ports = [serviceConfig["governance-app"]["port-exp"]+":"+serviceConfig["governance-app"]["port-int"]]
		} else {
			gov.ports = [(serviceConfig["governance-app"]["port-exp"]+i)+":"+serviceConfig["governance-app"]["port-int"]]
		}

		const startIp = serviceConfig["governance-app"].startIp.split(".");
		const ip = startIp[0]+"."+startIp[1]+"."+startIp[2]+"."+(parseInt(startIp[3]) + i);
		const vip = serviceConfig.validator.startIp.split(".");
		var string = "set -u\n set -e\n";
		string+="mkdir -p /logs/governanceapplogs\n";
		string+="DATE=`date '+%Y-%m-%d_%H-%M-%S'`\n";
		string+="while [ ! -e /eth/geth.ipc ];do\n";
		string+="sleep 1\n";
		string+="echo \"Waiting for validator to be ready...\"\n";
		string+="done\n";
		if((i == 0) && (readparams.modeFlag == "full")) { //Initialisation is to be done only for one node. We are doing for the first node -> i == 0
			string+="cp /tmp/nodesdetails.json /eth/nodesdetails.json\n";
			string+="cd /ledgerium/governanceapp/governanceapp\n",
			//string+="node index.js protocol=http hostname=" + vip[0]+"."+vip[1]+"."+vip[2]+"."+(parseInt(vip[3])+i) +" port=" + serviceConfig.validator.rpcPort + " initiateApp="
			string+="node index.js protocol=http hostname=" + gateway + " port=" + serviceConfig.validator.rpcPort + " initiateApp="
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
		
		//string+="node governanceUI.js "+vip[0]+"."+vip[1]+"."+vip[2]+"."+(parseInt(vip[3])+i)+" "+(serviceConfig.validator.rpcPort+i)+"\n";
		if(readparams.distributed) {
			if((i == 0) && (readparams.modeFlag == "full")) {
				string+="node governanceUI.js "+ ipAddress[i] +" "+(serviceConfig.validator.rpcPort)+ " " + "0x${PRIVATEKEY0}";
			}
			else {
				string+="node governanceUI.js "+ ipAddress[i] +" "+(serviceConfig.validator.rpcPort);
			}
		} else {
			if((i == 0) && (readparams.modeFlag == "full")) {
				string+="node governanceUI.js "+ gateway +" "+(serviceConfig.validator.rpcPort+i)+ " " + "0x${PRIVATEKEY0}";
			}
			else {
				string+="node governanceUI.js "+ gateway +" "+(serviceConfig.validator.rpcPort+i);
			}
		}	
		string+= " >/logs/governanceapplogs/"+ governanceUIName + "_log_$${DATE}.txt";
		gov.entrypoint.push(string);
		if ( !tesseraFlag ){
			gov.volumes.push(constellationName+":/constellation:z")
		}else{
			gov.volumes.push("./"+tesseraName+":/priv")
		}
		gov.networks[network_name] = { "ipv4_address":ip };
		gov.deploy = serviceConfig['governance-app'].deploy;
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
		//blockexplorer.environment.push("NODE_ENDPOINT=http://"+serviceConfig.validator.startIp+":"+serviceConfig.validator.rpcPort);
		blockexplorer.environment.push("NODE_ENDPOINT=http://"+gateway+":"+serviceConfig.validator.rpcPort);
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
		var commands = ["node sidebars.js && npm start"]
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
		startEntryPoint+="mkdir -p /logs/ledgeriumfaucetlogs";
		const commands = [
			startEntryPoint,
			"DATE=`date '+%Y-%m-%d_%H-%M-%S'`",
			"node index.js ${PRIVATEKEY0} >/logs/ledgeriumfaucetlogs/ledgeriumfaucet_$${DATE}_log.txt"
		];
		ledgeriumfaucet.entrypoint.push(genCommand(commands))
		ledgeriumfaucet.networks[network_name] = {"ipv4_address": serviceConfig["ledgeriumfaucet"].ip};
		//ledgeriumfaucet.environment.push("NODE_URL=http://"+serviceConfig.validator.startIp+":"+serviceConfig.validator.rpcPort);
		ledgeriumfaucet.environment.push("NODE_URL=http://"+ gateway +":"+serviceConfig.validator.rpcPort);
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
const templatefull = {
	"version":"3",
	"services": {

	},
	"volumes":{

	}
};
const splitTemplate = {
	"version":"3",
	"services": {

	},
	"volumes":{

	}
};
exports.template 			= template;
exports.templatefull 		= templatefull;
exports.splitTemplate 		= splitTemplate;
exports.services 			= services;
exports.serviceConfig		= serviceConfig;
exports.networks			= networks;
exports.tesseraFlag			= tesseraFlag;
