const gethCom = "geth --rpc --rpcaddr '0.0.0.0' --rpccorsdomain '*' \
--datadir '/eth' --rpcapi 'db,eth,net,web3,istanbul,personal,admin,debug,txpool' \
--ws --wsorigins '*' --wsapi 'db,eth,net,web3,personal,admin,debug,txpool' \
--wsaddr '0.0.0.0' --networkid 2018 --targetgaslimit 9007199254740000 --permissioned \
--debug --metrics --syncmode 'full' --gasprice 0 --mine --verbosity 3 --nodiscover \
--emitcheckpoints --istanbul.blockperiod 1 --mine --minerthreads 1 --syncmode full";

const constellationCom = "constellation-node --socket=/constellation/tm.ipc --publickeys=/constellation/tm.pub \
--privatekeys=/constellation/tm.key --storage=/constellation --verbosity=4";

const tesseraCom = "";

exports.tesseraFlag = true;
exports.externalNetwork = true;

const serviceConfig = {
	"eth-stats":{
		"ip" : "172.19.240.9"
	},
	"validator":{
		"startIp":"172.19.240.10",
		"gossipPort":21000,
		"rpcPort":8545,
		"wsPort":9000
	},
	"constellation":{
		"startIp":"172.19.240.100",
		"port":10000
	},
	"tessera":{
		"startIp":"172.19.240.100",
		"port":10000
	},
	"quorum-maker":{
		"ip"   : "172.19.240.196",
		"port" : 9999
	},
	"governance-app":{
		"port-exp": 3545,
		"port-int": 3003,
		"startIp" : "172.19.240.150"
	}
};

const services = {
	"eth-stats":{
		"image"        :  "quay.io/amis/ethstats:latest",
		"ports"        :  ["3000:3000"],
		"environment"  :  ["WS_SECRET=bb98a0b6442334d0cdf8a31b267892c1"],
		"restart"	   : "always",
		"networks"	   : {
		}
	},
	"quorum-maker":  {
			"hostname": "quorum-maker",
			"image"   : "mythrihegde/quorum:2.1.1_2.5.1",
			"ports"	  : [serviceConfig["quorum-maker"].port+":"+serviceConfig["quorum-maker"].port],
			"volumes" : ["./quorum-maker-conf:/conf","logs:/logs"],
			"depends_on": ["validator-0"],
			"entrypoint":[ "/bin/sh", "-c", "set -u\n"
			+"set -e\n"
			+"while : ; do\n"
			+"sleep 1\n"
			+"if [ -e /eth/geth.ipc ];then\n"
			+"break;\n"
			+"fi\n"
			+"done\n"
			+"cd /root/quorum-maker/\n"
			+"PUB=$$(cat /priv/tm.pub)\n"
			+"PUB=$$(echo $${PUB} | tr \"/\" \"\\/\")\n"
			+"if [ ! -e /root/quorum-maker/setup.conf ];then\n"			
			+"cp /conf/setup.conf /root/quorum-maker/\n"
			//+"sed -i -e \"/PUBKEY=/ s/=.*/=$${PUB}/\" ./setup.conf\n"
			+"sed -i -e \"/CURRENT_IP=/ s/=.*/="+serviceConfig.validator.startIp+"/\" ./setup.conf\n"
			+"sed -i -e \"/RPC_PORT=/ s/=.*/="+serviceConfig.validator.rpcPort+"/\" ./setup.conf\n"
			+"sed -i -e \"/WS_PORT=/ s/=.*/="+serviceConfig.validator.wsPort+"/\" ./setup.conf\n"
			+"sed -i -e \"/WHISPER_PORT=/ s/=.*/="+serviceConfig.validator.gossipPort+"/\" ./setup.conf\n"
			+"sed -i -e \"/CONSTELLATION_PORT=/ s/=.*/="+serviceConfig.constellation.port+"/\" ./setup.conf\n"
			+"sed -i -e \"/REGISTERED=/ s/=.*/=/\" ./setup.conf\n"
			+"fi\n"
			+"./NodeManager http://"+serviceConfig.validator.startIp+":"+serviceConfig.validator.rpcPort+" "+serviceConfig["quorum-maker"]["port"]+" /logs/gethLogs/ /logs/constellationLogs"],
			"networks": {
		    },
		    "restart": "always"
	},	    
	"validator": ()=>{
		return {
			"hostname"   : 'validator-',
			"image"		 :	"quorumengineering/quorum:latest",
			"ports"	     : [],
			"volumes"    : [],
			"depends_on" : ["constellation-"],
			"environment":	["PRIVATE_CONFIG=/constellation/tm.conf"],
			"entrypoint" : ["/bin/sh","-c"],
			"networks"	:	{
			},
			"restart"	: "always"
		}
	},
	"constellation": ()=>{
		return {
			"hostname"   : "constellation-",
			"image"		: "quorumengineering/constellation:latest",
			"ports"	     : [],
			"volumes"    : [],
			"entrypoint" : ["/bin/sh","-c"],
			"networks"	: {
			},
			"restart"	: "always"	
		}
	},
	"tessera": ()=>{
		return {
			"hostname"   : "tessera",
			"image"		: "quorumengineering/tessera:latest",
			"ports"	     : [],
			"volumes"    : [],
			"entrypoint" : ["/bin/sh","-c"],
			"networks"	: {
			},
			"restart"	: "always"	
		}
	},
	"networks" : {
		"test_net":{
			"driver" : "bridge",
			"ipam"   : {
				"driver"  :  "default",
				"config"  : [ 
					{
						"subnet" : "172.19.240.0/24"
					}
				]
			}
		}
	},
	"external" : {
		"test_net":{
			"external" : true
		}
	},
	"tesseraTemplate": ()=>{
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
	"governanceApp": (i)=>{
		return {
			"hostname" 		: "governance-ui-"+i,
			"image"    		: "ledgeriumengineering/governance_app_ui_img:latest",
			"ports"    		: [(serviceConfig["governance-app"]["port-exp"]+i)+":"+serviceConfig["governance-app"]["port-int"]],
			"volumes"  		: ['validator-'+i+':/eth'],
			"depends_on" 	: ["validator-"+i],
			"entrypoint"    : [ "/bin/sh","-c"],
			"networks"      : {

			}
		}
	}
};

const template = {	
	"version":"3",
	"services": {

	}
};

exports.template 				= template;
exports.services 				= services;
exports.serviceConfig			= serviceConfig;
exports.genValidatorCommand     = (i, gossipPort,genesisString,staticNodes,privateKeys,publicKeys,passwords)=>{
	const commands = [
		"while : ; do",
		"sleep 1",
		"if [[ -e /priv/tm.ipc ]];then",
		"break;",
		"fi",
		"done",
		"rm -f /eth/geth.ipc",
		"if [[ ! -e /eth/genesis.json ]];then",
		"mkdir -p /eth",
		"mkdir -p /logs/gethLogs",
		"echo '"+genesisString+"' > /eth/genesis.json",
		"echo '"+staticNodes+"' > /eth/static-nodes.json",
		"echo '"+staticNodes+"' > /eth/permissioned-nodes.json",
		"geth init /eth/genesis.json --datadir /eth",		
		"echo '"+passwords[i]+"' > ./password",
		"echo '"+privateKeys.split("0x")[1]+"' > ./file",
		"geth account import file --datadir /eth --password password",
		"rm -f ./file && rm -f ./password",
		"fi",
		gethCom+" --identity "+"\"validator-"+i+"\" --nodekeyhex \""+privateKeys.split("0x")[1]+"\" "+"--etherbase \""+publicKeys+"\" --port \""+gossipPort+"\""+
		" --ethstats \"validator-"+i+":bb98a0b6442334d0cdf8a31b267892c1@172.16.239.9:3000\" --rpcport "+ serviceConfig.validator.rpcPort +" --wsport "+serviceConfig.validator.wsPort
		+" 2>/logs/gethLogs/validator-0.txt"
	];
	var commandString = "";
	for (var j = 0; j < commands.length; j++) {
		commandString+=commands[j]+"\n";
	}
	return commandString;
};
exports.genConstellationCommand = (i,othernodes,ip,port)=>{
	const commands = [
		"rm -f /constellation/tm.ipc",
		"if [ -d \"constellation\" ]; then",
		"mkdir -p /constellation",
		"mkdir -p /logs/constellationLogs",
		"echo \"socket=\\"+"\"/constellation/tm.ipc\\"+"\"\\npublickeys=[\\"+"\"/constellation/tm.pub\\"+"\"]\\n\" > /constellation/tm.conf",
		"constellation-node --generatekeys=/constellation/tm",
		"cp /constellation/tm.pub /tmp/tm"+i+".pub",
		"fi",
		constellationCom+othernodes+" --url=http://"+ip+":"+port+"/ --port="+port+ "2>/logs/constellationLogs/validator-0_constellation.txt"
	];
	var commandString = "";
	for (var j = 0; j < commands.length; j++) {
		commandString+=commands[j]+"\n";
	}
	return commandString;
};
exports.genTesseraCommand = (i, template)=>{
	const dir = "/priv";
	const commands = [
		"rm -f "+dir+"/tm.ipc",
		"if [ ! -e \""+dir+"/tm.key\" ]; then",
		"mkdir -p "+dir,
		"mkdir -p /logs/constellationLogs",
		"echo -e \"\\n\" | java -jar /tessera/tessera-app.jar -keygen -filename "+dir+"/tm",
		"echo '"+JSON.stringify(template)+"' > "+dir+"/tessera-config.json",
		"cp "+dir+"/tm.pub /tmp/tm"+i+".pub",
		"fi",
		"java -Xms128M -Xmx128M -jar /tessera/tessera-app.jar -configfile "+dir+"/tessera-config.json 2>/logs/constellationLogs/validator-tessera.txt"
	];
	var commandString = "";
	for (var j = 0; j < commands.length; j++) {
		commandString+=commands[j]+"\n";
	}
	return commandString;
}
exports.geth = gethCom;
exports.constellation = constellationCom;