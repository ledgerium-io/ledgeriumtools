const basicConfig = require('../src/basicconfig');
const readparams = require('../src/readparams');

const gethCom   = `geth --rpc --rpcaddr '0.0.0.0' --rpccorsdomain '*' \
--datadir '/eth' --rpcapi 'db,eth,net,web3,istanbul,personal,admin,debug,txpool' \
--txpool.nolocals --txpool.accountslots 128 --txpool.globalslots 32768 \
--txpool.accountqueue 512 --txpool.globalqueue 8192 \
--ws --wsorigins '*' --wsapi 'db,eth,net,web3,personal,admin,debug,txpool' \
--wsaddr '0.0.0.0' --networkid ${readparams.networkId} --targetgaslimit 9007199254740000 \
--debug --metrics --syncmode 'full' --mine --vmodule eth/*=5,consensus=6,core=6,ethstats=3,rpc=6,node=6 \
--minerthreads 1`;

const tesseraFlag = true;
const network_name = "test_net";
var base_ip = "172.19.240.0",entrypoint, qmvolumes =[];
var gateway = "172.19.240.1";
var statsURL;
var protocol = "https://";
if(readparams.network === "flinders"){
	statsURL = "flinders.ledgerium.io/stats";
} else if (readparams.network === "toorak") {
	statsURL = "toorak.ledgerium.io/stats";
}

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
	"redis" : {
		"ip" : base_ip.slice(0, base_ip.length-1)+"3"
	},
	"ledgeriumfaucet" : {
		"ip" : base_ip.slice(0, base_ip.length-1)+"4"
	},
	"mongodb" : {
		"ip" : base_ip.slice(0, base_ip.length-1)+"2"
	},
	// "docusaurus" : {
	// 	"ip" : base_ip.slice(0, base_ip.length-1)+"5"
	// },
	"blockexplorerclient":{
		"ip" : base_ip.slice(0, base_ip.length-1)+"6",
		"deploy": deployConfig(500,128)
	},
	"blockexplorerserver":{
		"ip" : base_ip.slice(0, base_ip.length-1)+"7",
		"deploy": deployConfig(500,128)
	},
	"ledgeriumstats":{
		"ip" : base_ip.slice(0, base_ip.length-1)+"8",
		"deploy": deployConfig(500,128)
	},
	// "ledgeriumdocs" : {
	// 	"ip" : base_ip.slice(0, base_ip.length-1)+"9"
	// },
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
						"chainId" : readparams.networkId.toString(),
					    "serverAddress"  : (port+i),
					    "bindingAddress" : "http://0.0.0.0:"+(port+i),
					    "sslConfig": {
					        "tls": "STRICT",
					        "generateKeyStoreIfNotExisted": true,
					        "serverKeyStore": "/keystores/server"+i+"-keystore",
					        "serverKeyStorePassword": "quorum",
					        "serverTrustStore": "/priv/server-truststore",
					        "serverTrustStorePassword": "quorum",
					        "serverTrustMode": "TOFU",
					        "knownClientsFile": "/priv/knownClients",
					        "clientKeyStore": "/keystores/client"+i+"-keystore",
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
						"app": "ThirdParty",
						"enabled": true,
						"serverAddress": (port + 100 + i),
						"bindingAddress": "http://0.0.0.0:" + (port + 100 + i),
						"communicationType": "REST",
						"sslConfig": {
							"tls": "STRICT",
							"generateKeyStoreIfNotExisted": true,
							"serverKeyStore": "/keystores/server0TP-keystore",
							"serverKeyStorePassword": "quorum",
							"serverTrustStore": "/priv/serverTP-truststore",
							"serverTrustStorePassword": "quorum",
							"serverTrustMode": "TOFU",
							"knownClientsFile": "/priv/knownTPClients",
							"clientKeyStore": "/keystores/client0TP-keystore",
							"clientKeyStorePassword": "quorum",
							"clientTrustStore": "/priv/clientTP-truststore",
							"clientTrustStorePassword": "quorum",
							"clientTrustMode": "TOFU",
							"knownServersFile": "/priv/knownTPServers"
						}
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
	// "quorum-maker": {
	// 	"ip"   : base_ip.slice(0, base_ip.length-1)+"196",
	// 	"port" : 9999,
	// 	'deploy': deployConfig(500,128)
	// },
	"governance-app": {
		"port-exp": 3545,
		"port-int": 3003,
		"startIp" : base_ip.slice(0, base_ip.length-1)+"150",
		'deploy': deployConfig(500,128)
	},
	"governanceappclient": {
		"port-exp": 3545,
		"port-int": 80,
		"startIp" : base_ip.slice(0, base_ip.length-1)+"40",
		'deploy': deployConfig(500,128)
	},
	"governanceappserver": {
		"port-exp": 3535,
		"port-int": 3535,
		"startIp" : base_ip.slice(0, base_ip.length-1)+"20",
		'deploy': deployConfig(500,128)
	}
};

// let hostValidatorName;
// if(readparams.distributed) {
// 	hostValidatorName = validatorNames[0]+'-'+basicConfig.publicKeys[0].slice(0,5);
// }
const services = {
	"blockexplorerclient": ()=> {
		var blockclient = {
			"hostname"		: "blockexplorerclient",
			"image"     	: "ledgeriumengineering/blockexplorerclient:v1.0",
			"ports"     	: ["2000:80"],
			"volumes" 		: ["./logs:/logs"],
			"depends_on"	: ["blockexplorerserver"],
			"restart"		: "always",
			"networks"		: {
			}
		};
		// var startEntryPoint = "";
		// startEntryPoint+="set -u\n";
		// startEntryPoint+="set -e\n";
		// startEntryPoint+="mkdir -p /logs/blockexplorerclientlogs";

		// const commands = [
		// 	startEntryPoint,
		// 	"DATE=`date '+%Y-%m-%d_%H-%M-%S'`",
		// 	"npm start >/logs/blockexplorerclientlogs/blockexplorerclient_$${DATE}_log.txt"
		// ];
		// blockclient.entrypoint.push(genCommand(commands));
		blockclient.deploy                 = serviceConfig['blockexplorerclient'].deploy;
		blockclient.networks[network_name] = { "ipv4_address":serviceConfig["blockexplorerclient"].ip };
		return blockclient;
	},
	"blockexplorerserver": ()=> {
		let validatorName;
		if(readparams.distributed) {
			validatorName = validatorNames[0] +'-' + basicConfig.publicKeys[0].slice(0,5);
		} else {
			validatorName = "validator-" + readparams.nodeName + "0";
		}
		var mongoHostURL = serviceConfig["mongodb"].ip;
		var mongoDBName = readparams.network;

		var blockserver = {
			"hostname"	: "blockexplorerserver",
			"image"     : "ledgeriumengineering/blockexplorerserver:v1.0",
			"ports"     : ["2002:2002"],
			"volumes" 	: ["./logs:/logs", "./" + validatorName +':/eth'],
			"environment": ["SERVER_PORT=2002", "SYNC_REQUESTS=100", "API_LIMIT_BLOCKS=100", "API_LIMIT_TRANSACTIONS=100"],
			"entrypoint": ["/bin/sh", "-c"],
			"depends_on": (readparams.distributed)? [validatorName] : ["validator-" + readparams.nodeName + '0'],
			"restart"	: "always",
			"networks"	: {
			}
		};
		blockserver.environment.push("MONGO_HOST="+mongoHostURL);
		blockserver.environment.push("MONGO_DB="+mongoDBName);
		blockserver.environment.push("MONGO_USERNAME="+"sa");
		blockserver.environment.push("MONGO_PASSWORD="+"sa");
		blockserver.environment.push("WEB3_HTTP=http://"+gateway+":"+serviceConfig.validator.rpcPort);
		blockserver.environment.push("WEB3_WS=ws://"+gateway+":"+serviceConfig.validator.wsPort);
		blockserver.environment.push("NODESTATS_URL=wss://"+serviceConfig["ledgeriumstats"].ip+"/primus");
		var startEntryPoint = "";
		startEntryPoint+="set -u\n";
		startEntryPoint+="set -e\n";
		startEntryPoint+="mkdir -p /logs/blockexplorerserverlogs";
		const commands = [
			startEntryPoint,
			"DATE=`date '+%Y-%m-%d_%H-%M-%S'`",
			"while [ ! -e /eth/geth.ipc ];do",
			"sleep 1",
			"echo \"Waiting for validator to be ready...\"",
			"done",
			"npm start >/logs/blockexplorerserverlogs/blockexplorerserver_$${DATE}_log.txt"
		];
		blockserver.entrypoint.push(genCommand(commands));
		blockserver.deploy                 = serviceConfig['blockexplorerserver'].deploy;
		blockserver.networks[network_name] = { "ipv4_address":serviceConfig["blockexplorerserver"].ip };
		return blockserver;
	},
	"ledgeriumstats": ()=> {
		var eth = {
			"hostname"	   : "ledgeriumstats",
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
	// "quorum-maker": ()=> {
	// 	var quorum = {
	// 		"hostname": "quorum-maker",
	// 		"image"   : "ledgeriumengineering/quorum-maker:v0.1",
	// 		"ports"	  : [serviceConfig["quorum-maker"].port+":"+serviceConfig["quorum-maker"].port],
	// 		"volumes" : ["./logs:/logs","./tmp:/tmp","quorum-maker:/quorum-maker"],
	// 		"depends_on": (readparams.distributed)? [validatorNames[0]+'-'+basicConfig.publicKeys[0].slice(0,5)] : ["validator-" + readparams.nodeName + '0'],
	// 		"entrypoint":[ "/bin/sh", "-c"],
	// 		"networks": {
	// 		},
	// 		"restart": "always"
	// 	};
	// 	quorum.deploy = serviceConfig['quorum-maker'].deploy;
	// 	quorum.networks[network_name] = { "ipv4_address": serviceConfig["quorum-maker"].ip }

	// 	if(readparams.distributed) {
	// 		quorum.volumes.push("./validator-" + ipAddress[0] + ":/eth");
	// 		var publicKeyPath = (i) => { return "/tmp/tm"+i+".pub"; };
	// 		if(tesseraFlag) {
	// 			quorum.volumes.push("./tessera-" + ipAddress[0] + ":/priv");
	// 		}
	// 		else{
	// 			quorum.volumes.push("constellation-" + ipAddress[0] + ":/constellation:z");
	// 		}
	// 	} else {
	// 		quorum.volumes.push("./validator-" + readparams.nodeName + "0" + ":/eth");
	// 		var publicKeyPath = (i) => { return "/tmp/tm"+i+".pub"; };
	// 		if(tesseraFlag) {
	// 			quorum.volumes.push("./tessera-" + readparams.nodeName + "0" + ":/priv");
	// 		}
	// 		else{
	// 			quorum.volumes.push("constellation-" + readparams.nodeName + "0" + ":/constellation:z");
	// 		}
	// 	}

	// 	var commands = [
	// 		"set -u",
	// 		"set -e",
	// 		"mkdir -p /logs/quorummakerlogs",
	// 		"DATE=`date '+%Y-%m-%d_%H-%M-%S'`",
	// 		"while : ;do",
	// 		"sleep 1",
	// 		"if [ -e /eth/geth.ipc ];then",
	// 		"break;",
	// 		"fi",
	// 		"done",
	// 		"cd /quorum-maker",
	// 		"if [ ! -e /quorum-maker/setup.conf ];then",
	// 		"RESPONSE=\`curl https://ipinfo.io/ip\` || \"--\"",
	// 		"echo \"EXTERNAL_IP=$${RESPONSE}\" > ./setup.conf"
	// 	];
	// 	for (var i = 0; i < basicConfig.publicKeys.length; i++) {
	// 		var prefix = "";
	// 		const startIp = serviceConfig.validator.startIp.split(".");
	// 		const ip = startIp[0]+"."+startIp[1]+"."+startIp[2]+"."+(parseInt(startIp[3])+i);
	// 		// const ip = (readparams.distributed)? ipAddress[i] : startIp[0]+"."+startIp[1]+"."+startIp[2]+"."+(parseInt(startIp[3])+i);
	// 		if(i != 0){
	// 			prefix = i+"_";
	// 			commands.push("echo \""+prefix+"ENODE="+basicConfig.enodes[i]+"\" >> ./setup.conf")
	// 		}else{
	// 			commands.push("echo \"CONTRACT_ADD=\" >> setup.conf");
	// 			commands.push("echo \"RPC_PORT="+serviceConfig.validator.rpcPort+"\" >> ./setup.conf");
	// 			commands.push("echo \"WS_PORT="+serviceConfig.validator.wsPort+"\" >> ./setup.conf");
	// 			commands.push("echo \"WHISPER_PORT="+serviceConfig.validator.gossipPort+"\" >> ./setup.conf");
	// 			commands.push("echo \"CONSTELLATION_PORT="+serviceConfig.constellation.port+"\" >> ./setup.conf");
	// 			commands.push("echo \"TOTAL_NODES="+basicConfig.publicKeys.length+"\" >> ./setup.conf")
	// 			commands.push("echo \"MODE=ACTIVE\" >> ./setup.conf")
	// 			commands.push("echo \"STATE=I\" >> ./setup.conf")
	// 			commands.push("echo \"PRIVATE_KEY="+"${PRIVATEKEY"+i+"}"+"\" >> ./setup.conf");
	// 		}
	// 		commands.push("if [ -e "+publicKeyPath(i)+" ];then")
	// 		commands.push("PUB=$$(cat "+publicKeyPath(i)+")");
	// 		commands.push("fi");
	// 		commands.push("echo \""+prefix+"PUBKEY=\"$${PUB} >> ./setup.conf")
	// 		commands.push("echo \""+prefix+"ROLE=Unassigned\" >> ./setup.conf")
	// 		commands.push("echo \""+prefix+"CURRENT_IP="+ip+"\" >> ./setup.conf");
	// 		commands.push("echo \""+prefix+"REGISTERED=\" >> ./setup.conf")
	// 		commands.push("echo \""+prefix+"NODENAME=validator-\""+i+" >> ./setup.conf")     // check validator name for below value
	// 	}
	// 	commands.push("fi");
	// 	commands.push("cd /root/quorum-maker/");
	// 	var tranStr;
	// 	if(!tesseraFlag) {
	// 		tranStr = "/logs/constellationlogs";
	// 	} else {
	// 		tranStr = "/logs/tesseralogs";
	// 	}
	// 	var commandString = " /logs/validatorlogs/ " +  tranStr + " /quorum-maker/setup.conf" + " >/logs/quorummakerlogs/" + "$${DATE}_log.txt";
	// 	//commands.push("./NodeManager http://"+serviceConfig.validator.startIp+":"+serviceConfig.validator.rpcPort+" "
	// 	commands.push("./NodeManager http://"+gateway+":"+serviceConfig.validator.rpcPort+" "
	// 		+serviceConfig["quorum-maker"]["port"]+ commandString);
	// 	quorum.entrypoint.push(genCommand(commands));
	// 	return quorum;
	// },
	"validator": (i,test)=> {
		var validatorName = "validator-", constellationName = "constellation-", tesseraName = "tessera-";
		let trimmedPubKey = basicConfig.publicKeys[i].slice(0,5);
		let PRIVATEKEY = `{PRIVATEKEY}`;
		let PASSWORD = `{PASSWORD}`;
		if(test){
			validatorName += "test-"; 
			constellationName += "test-";
			tesseraName += "test-";
		}

		if(readparams.modeFlag == "full" && !readparams.distributed) {
			validatorName += readparams.nodeName + i;
			constellationName += readparams.nodeName + i;
			tesseraName += readparams.nodeName + i;
			PRIVATEKEY = `{PRIVATEKEY${i}}`;
			PASSWORD = `{PASSWORD${i}}`;
		}
		else {
			validatorName = validatorNames[i] + '-' + trimmedPubKey;
			tesseraName += trimmedPubKey;
			governanceName += trimmedPubKey;
		}
		
		var ipaddressText;
		var startGeth;
		if (readparams.modeFlag == "full" && !readparams.distributed) {
			ipaddressText = " --ethstats \"" + validatorName + ":bb98a0b6442334d0cdf8a31b267892c1@"+serviceConfig["ledgeriumstats"].ip+":3000";
			startGeth = gethCom + " --rpcvhosts=" + readparams.nodeName + " --nodekeyhex \""+"${PRIVATEKEY" + i + "}"+"\" "
		} else {
			ipaddressText = " --ethstats \"" + validatorName + ":bb98a0b6442334d0cdf8a31b267892c1@"+statsURL;
			startGeth = gethCom + " --rpcvhosts=" + domainNames[i] + " --nodekeyhex \""+"${PRIVATEKEY}"+"\" "
		}
		
		startGeth += "--etherbase \""+basicConfig.publicKeys[i]+"\" --port \""+serviceConfig.validator.gossipPort+"\""
		+ipaddressText+ "\" --rpcport "+serviceConfig.validator.rpcPort
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

				if(readparams.distributed){
					cpPubKeys = "cp /priv/tm.pub /tmp/tm.pub";
				} else {
					cpPubKeys = "cp /priv/tm.pub /tmp/tm"+i+".pub";
				}
			}
		}
		else if(readparams.modeFlag == "blockproducer"){
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
			"echo '"+ PASSWORD +"' > ./password",
			"echo '"+PRIVATEKEY+"' > ./file",
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
		// else if(readparams.modeFlag == "blockproducer") {
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
		else if(readparams.modeFlag == "blockproducer") {
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
		
		if(readparams.modeFlag == "full" && !readparams.distributed) {
			validatorName += readparams.nodeName + i;
			tesseraName += readparams.nodeName + i;
		}
		else {
			validatorName += ipAddress[i];
			tesseraName += basicConfig.publicKeys[i].slice(0,5);
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
			"volumes"    : ["./"+tesseraName+":/priv", "./keystores:/keystores"],
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
				tesseraNineTemplate.serverConfigs[2].sslConfig.serverKeyStore = `/keystores/server${i}TP-keystore`;
			}
		}
		else if(readparams.modeFlag == "blockproducer") {
			for (var j = 0; j < basicConfig.publicKeys.length; j++) {
				peers.push({ "url" : protocol+readparams.externalIPAddress+":"+(port)+"/"})
			}
			tesseraNineTemplate.serverConfigs[0].serverAddress = protocol+currentIp+":"+port;
			tesseraNineTemplate.serverConfigs[2].serverAddress = protocol+currentIp+":"+(port + 100);
			tesseraNineTemplate.serverConfigs[0].bindingAddress = "https://0.0.0.0:"+(port);
			tesseraNineTemplate.serverConfigs[2].bindingAddress = "https://0.0.0.0:"+(port+100);
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
		var keytoolStr;
		if(readparams.distributed){
			keytoolStr = `keytool -alias tessera -dname CN=${tesseraName} -genKeypair -keyalg RSA -keysize 2048 -keystore /keystores/server${i}-keystore -storepass quorum -ext SAN=dns:localhost,dns:${tesseraName},ip:127.0.0.1,ip:0.0.0.0,ip:${startIp[0]}.${startIp[1]}.${startIp[2]}.${(i+parseInt(startIp[3]))},ip:${ipAddress[i]}`
		} else {
			keytoolStr = `keytool -alias tessera -dname CN=${tesseraName} -genKeypair -keyalg RSA -keysize 2048 -keystore /keystores/server${i}-keystore -storepass quorum -ext SAN=dns:localhost,dns:${tesseraName},ip:127.0.0.1,ip:0.0.0.0,ip:${startIp[0]}.${startIp[1]}.${startIp[2]}.${(i+parseInt(startIp[3]))},ip:${currentIp}`
		}
		const commands = [
			"DATE=`date '+%Y-%m-%d_%H-%M-%S'`",
			"rm -f /priv/tm.ipc",
			"if [ ! -e \"/priv/tm.key\" ];then",
			"mkdir -p /priv",
			"mkdir -p /logs/tesseralogs",
			"if [ ! -e \"/keystores/server"+i+"-keystore\" ];then",
			keytoolStr,
			"fi",
			"echo -e \"\\n\" | java -jar /tessera/tessera-app.jar -keygen -filename /priv/tm",
			/* old tessera versions
			"echo '"+JSON.stringify(tesseraTemplate)+"' > /priv/tessera-config.json",
			"echo '"+JSON.stringify(eTesseraTemplate)+"' > /priv/tessera-config.json",
			*/
			"echo '"+JSON.stringify(tesseraNineTemplate)+"' > /priv/tessera-config.json",
			"cp /priv/tm.pub /tmp/tm.pub",
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
		let trimmedPubKey = basicConfig.publicKeys[i].slice(0,5);

		if(readparams.modeFlag == "full" && !readparams.distributed){
			validatorName += readparams.nodeName + i;
			constellationName += readparams.nodeName + i;
			tesseraName += readparams.nodeName + i;
			governanceUIName += readparams.nodeName + i;
		}else {
			validatorName = validatorNames[i] + '-' + trimmedPubKey;
			constellationName += ipAddress[i];
			tesseraName += trimmedPubKey;
			governanceUIName += trimmedPubKey;
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
		// if((i == 0) && (readparams.modeFlag == "full")) { //Initialisation is to be done only for one node. We are doing for the first node -> i == 0
		// 	string+="cp /tmp/nodesdetails.json /eth/nodesdetails.json\n";
		// 	string+="cd /ledgerium/governanceapp/governanceapp\n",
		// 	//string+="node index.js protocol=http hostname=" + vip[0]+"."+vip[1]+"."+vip[2]+"."+(parseInt(vip[3])+i) +" port=" + serviceConfig.validator.rpcPort + " initiateApp="
		// 	string+="node index.js protocol=http hostname=" + gateway + " port=" + serviceConfig.validator.rpcPort + " initiateApp="
		// 	var privateKeyString="";
		// 	for(var nodeIndex = 0; nodeIndex < numberOfNodes;) {
		// 		privateKeyString+= "${PRIVATEKEY" + (nodeIndex++) + "}"
		// 		if(nodeIndex < numberOfNodes){ //if not the last node
		// 			privateKeyString+= ",";
		// 		}	
		// 	}
		// 	string+=privateKeyString;
		// 	string+=",/eth/nodesdetails.json";

		// 	var accountString="";
		// 	for(nodeIndex = 3; nodeIndex < numberOfNodes;) {
		// 		//first 3 accounts are init from initiateApp, rest of them should be added as adminValidatorSet and simpleValidatorSet
		// 		accountString+= "0x" + basicConfig.publicKeys[nodeIndex++];
		// 		if(nodeIndex < numberOfNodes){ //if not the last node
		// 			accountString+=",";
		// 		}	
		// 	}
		// 	string+=" runadminvalidator=addOneAdmin,"+accountString;
		// 	string+=" runsimplevalidator=addSimpleSetContractValidatorForAdmin,"+accountString;
		// 	string+= "\n"
		// }	
		string+="cd /ledgerium/governanceapp/governanceapp/app\n";
		
		//string+="node governanceUI.js "+vip[0]+"."+vip[1]+"."+vip[2]+"."+(parseInt(vip[3])+i)+" "+(serviceConfig.validator.rpcPort+i)+"\n";
		if(readparams.distributed) {
			if((i == 0) && (readparams.modeFlag == "full")) {
				string+="node governanceUI.js "+ gateway +" "+(serviceConfig.validator.rpcPort)+ " " + "0x${PRIVATEKEY}";
			}
			else {
				string+="node governanceUI.js "+ gateway +" "+(serviceConfig.validator.rpcPort);
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
	"governanceappserver": (i,test)=>{
		var validatorName = "validator-", tesseraName = "tessera-", governanceServerName = "governance-server-";
		let trimmedPubKey = basicConfig.publicKeys[i].slice(0,5);

		if(readparams.modeFlag == "full" && !readparams.distributed){
			validatorName += readparams.nodeName + i;
			tesseraName += readparams.nodeName + i;
			governanceServerName += readparams.nodeName + i;
		}else {
			validatorName = validatorNames[i] + '-' + trimmedPubKey;
			tesseraName += trimmedPubKey;
			governanceServerName += trimmedPubKey;
		}

		let govServer = {
			"hostname" 		: governanceServerName,
			"image"    		: "ledgeriumengineering/ledgeriumgovernance-server:v1.0",
			"volumes"  		: ["./logs:/logs","./" + validatorName +':/eth',"./tmp:/tmp", "./"+ tesseraName + ':/priv'],
			"environment"	: [],
			"depends_on" 	: [validatorName],
			"entrypoint"    : [ "/bin/sh","-c"],
			"networks"      : {

			},
			"restart"	 : "always",
			"deploy" : {
				"resources" : {
					"limits" : {
						"memory" : "500M"
					},
					"reservations" : {
						"memory" : "128M"
					}
				}
			}
		}

		if(readparams.distributed) {
			govServer.ports = [serviceConfig["governanceappserver"]["port-exp"]+":"+serviceConfig["governanceappserver"]["port-int"]]
		} else {
			govServer.ports = [(serviceConfig["governanceappserver"]["port-exp"]+i)+":"+serviceConfig["governanceappserver"]["port-int"]]
		}

		var string = "set -u\nset -e\n";
		string+="mkdir -p /logs/governanceapplogs\n";
		string+="DATE=`date '+%Y-%m-%d_%H-%M-%S'`\n";
		string+="while [ ! -e /eth/geth.ipc ];do\n";
		string+="sleep 1\n";
		string+="echo \"Waiting for validator to be ready...\"\n";
		string+="done\n";
		string+="cd /ledgerium/governanceapp/governanceapp\n";
		string+= "node service.js";
		string+= " >/logs/governanceapplogs/"+ governanceServerName + "_log_$${DATE}.txt";
		govServer.entrypoint.push(string);

		let validatorUrl = `http://${gateway}:${serviceConfig.validator.rpcPort+i}`;
		govServer.environment.push(`SERVER_PORT=${serviceConfig["governanceappserver"]["port-exp"]}`);
		govServer.environment.push(`WEB3_HTTP=${validatorUrl}`);

		const startIp = serviceConfig["governanceappserver"].startIp.split(".");
		const ip = startIp[0]+"."+startIp[1]+"."+startIp[2]+"."+(parseInt(startIp[3]) + i);
		govServer.networks[network_name] = { "ipv4_address":ip };
		return govServer;
	},
	"governanceappclient": (i,test)=>{
		var governanceClientName = "governance-client-", governanceServerName = "governance-server-";
		let trimmedPubKey = basicConfig.publicKeys[i].slice(0,5);
		let reactAppBaseUrl = '';

		if(readparams.modeFlag == "full" && !readparams.distributed){
			governanceClientName += readparams.nodeName + i;
			governanceServerName += readparams.nodeName + i;
		}else {
			governanceClientName += trimmedPubKey;
			governanceServerName += trimmedPubKey;
		}

		let govClient = {
			"hostname" 		: governanceClientName,
			"image"    		: "ledgeriumengineering/ledgeriumgovernance-client:v1.0",
			"volumes"  		: ["./logs:/logs"],
			"environment"	: [],
			"depends_on" 	: [governanceServerName],
			"networks"      : {

			},
			"restart"	 : "always"
		}

		if(readparams.distributed) {
			govClient.ports = [serviceConfig["governanceappclient"]["port-exp"]+":"+serviceConfig["governanceappclient"]["port-int"]]
		} else {
			govClient.ports = [(serviceConfig["governanceappclient"]["port-exp"]+i)+":"+serviceConfig["governanceappclient"]["port-int"]]
		}
		
		let govServerPort;
		if(readparams.distributed) {
			govServerPort = serviceConfig["governanceappserver"]["port-exp"];
		} else {
			govServerPort = serviceConfig["governanceappserver"]["port-exp"]+i;
		}
		
		//React App Base URl
		reactAppBaseUrl = `http://${readparams.externalIPAddress}:${govServerPort}`;
		govClient.environment.push(`REACT_APP_BASE_URL=${reactAppBaseUrl}`);

		const startIp = serviceConfig["governanceappclient"].startIp.split(".");
		const ip = startIp[0]+"."+startIp[1]+"."+startIp[2]+"."+(parseInt(startIp[3]) + i);
		govClient.networks[network_name] = { "ipv4_address":ip };
		return govClient;
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
		let validatorName;
		let PRIVATEKEY;
		if(readparams.distributed) {
			validatorName = validatorNames[0] +'-' + basicConfig.publicKeys[0].slice(0,5);
			PRIVATEKEY = '${PRIVATEKEY}';
		} else {
			validatorName = "validator-" + readparams.nodeName + "0";
			PRIVATEKEY = '${PRIVATEKEY0}';
		}
		var ledgeriumfaucet = {
			"image" : "ledgeriumengineering/ledgeriumfaucet:v1.0",
			"volumes"  	: ["./logs:/logs", "./" + validatorName +':/eth'],
			"depends_on" : [validatorName],
			"ports" : ["5577:5577"],
			"entrypoint" : ["/bin/sh", "-c"],
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
			"while [ ! -e /eth/geth.ipc ];do",
			"sleep 1",
			"echo \"Waiting for validator to be ready...\"",
			"done",
			"node index.js " + PRIVATEKEY + " >/logs/ledgeriumfaucetlogs/ledgeriumfaucet_$${DATE}_log.txt"
		];
		ledgeriumfaucet.entrypoint.push(genCommand(commands));
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
	},
	"mongodb": () => {
		var mongodb = {
			"image": "mongo:3.4.10",
			"container_name": "blk-free-mongodb",
			"ports": ["27017:27017"],
			"volumes": ["./mongo:/data/db:rw"],
			"entrypoint": "mongod --smallfiles --logpath=/dev/null --bind_ip '0.0.0.0'",
			"networks" : {}
		}
		mongodb.networks[network_name] = { "ipv4_address":serviceConfig["mongodb"].ip };
		return mongodb;
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
