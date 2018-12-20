const basicConfig = require('../src/basic-config');

const gethCom = "geth --rpc --rpcaddr '0.0.0.0' --rpccorsdomain '*' \
--datadir '/eth' --rpcapi 'db,eth,net,web3,istanbul,personal,admin,debug,txpool' \
--ws --wsorigins '*' --wsapi 'db,eth,net,web3,personal,admin,debug,txpool' \
--wsaddr '0.0.0.0' --networkid 2018 --targetgaslimit 9007199254740000 --permissioned \
--debug --metrics --syncmode 'full' --gasprice 0 --mine --verbosity 3 --nodiscover \
--emitcheckpoints --istanbul.blockperiod 1 --mine --minerthreads 1 --syncmode full";

const constellationCom = "constellation-node --socket=/constellation/tm.ipc --publickeys=/constellation/tm.pub \
--privatekeys=/constellation/tm.key --storage=/constellation --verbosity=4";

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
	"eth-stats":{
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
				    "url"     		   : "jdbc:h2:.//priv"+i+"/db;MODE=Oracle;TRACE_LEVEL_SYSTEM_OUT=0",
		            "autoCreateTables" : true
				},
				"server"        : {
					"port"     : "",
					"hostName" : "",
					"sslConfig": {
						"tls"                         : "OFF",
						"generateKeyStoreIfNotExisted": true,
						"serverKeyStore"              : "/priv"+i+"/server-keystore",
						"serverKeyStorePassword"      : "quorum",
						"serverTrustStore"            : "/priv"+i+"/server-truststore",
						"serverTrustStorePassword"    : "quorum",
						"serverTrustMode"             : "TOFU",
						"knownClientsFile"            : "/priv"+i+"/knownClients",
						"clientKeyStore"              : "/priv"+i+"/client-keystore",
						"clientKeyStorePassword"  	  : "quorum",
						"clientTrustStore"            : "/priv"+i+"/client-truststore",
						"clientTrustStorePassword"	  : "quorum",
						"clientTrustMode"             : "TOFU",
						"knownServersFile"            : "/priv"+i+"/knownServers"
					}
				},
				"peer"          : [],
				"keys"          : {
					"passwords": [],
					"keyData"  : [
					    {
						    "privateKeyPath"   : "/priv"+i+"/tm.key",
							"publicKeyPath": "/priv"+i+"/tm.pub"
						}
					]
				},
				"alwaysSendTo"  : [],
				"unixSocketFile": "/priv"+i+"/tm.ipc"/*,
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
const helper = {
	"quorum-maker": (i)=>{
		if(i==0){
			entrypoint = "set -u\n"
			+"set -e\n"
			+"while : ;do\n"
			+"sleep 1\n"
			+"if [ -e /eth/geth.ipc ];then\n"
			+"break;\n"
			+"fi\n"
			+"done\n"
			+"cd /root/quorum-maker/\n"
			+"if [ ! -e /root/quorum-maker/setup.conf ];then\n"			
			+"cp /conf/setup.conf /root/quorum-maker/\n"
		}
		if(!tesseraFlag){
			qmvolumes.push("constellation-"+i+":/constellation"+i+":z");
			entrypoint = entrypoint+"PUB=$$(cat /constellation"+i+"/tm.pub)\n"
		}
		else{
			entrypoint = entrypoint+"PUB=$$(cat /priv"+i+"/tm.pub)\n"
			qmvolumes.push("tessera-"+i+":/priv"+i);
		}
		if(i==0){
			entrypoint = entrypoint
			+"RESPONSE=\`curl https://ipinfo.io/ip\` || \"--\"\n"
			+"sed -i -e \"/EXTERNAL_IP=/ s/=.*/=$${RESPONSE}/\" ./setup.conf\n"
			+"sed -i -e \"/CURRENT_IP=/ s/=.*/="+serviceConfig.validator.startIp+"/\" ./setup.conf\n"
			+"sed -i -e \"/RPC_PORT=/ s/=.*/="+serviceConfig.validator.rpcPort+"/\" ./setup.conf\n"
			+"sed -i -e \"/WS_PORT=/ s/=.*/="+serviceConfig.validator.wsPort+"/\" ./setup.conf\n"
			+"sed -i -e \"/WHISPER_PORT=/ s/=.*/="+serviceConfig.validator.gossipPort+"/\" ./setup.conf\n"
			+"sed -i -e \"/CONSTELLATION_PORT=/ s/=.*/="+serviceConfig.constellation.port+"/\" ./setup.conf\n"
			+"sed -i -e \"/CONTRACT_ADD=/ s/=.*/=/\" ./setup.conf\n"
			+"sed -i -e \"/REGISTERED=/ s/=.*/=/\" ./setup.conf\n"
			+"sed -i -e \"/NODENAME=/ s/=.*/=validator-"+i+"/\" ./setup.conf\n"
			+"echo \"PUBKEY=\"$${PUB} >> ./setup.conf\n"
			+"sed -i -e \"/TOTAL_NODES=/ s/=.*/="+basicConfig.publicKeys.length+"/\" ./setup.conf\n"
		}
		else{
			const startIp         	= serviceConfig.validator.startIp.split(".");
			const ip         		= startIp[0]+"."+startIp[1]+"."+startIp[2]+"."+(parseInt(startIp[3])+i);
			const enode 			= basicConfig.enodes[i]
			entrypoint = entrypoint 
			//+"sed -i -e \"/CURRENT_IP=/ s/=.*/="+ip+"/\" ./setup.conf\n"
			//+"sed -i -e \"/REGISTERED=/ s/=.*/=/\" ./setup.conf\n"
			//+"sed -i -e \"/NODENAME=/ s/=.*/=validator-"+i+"/\" ./setup.conf\n"
			//+"sed -i -e \"/ENODE=/ s/=.*/="+enode+"/\" ./setup.conf\n"
			+"echo "+i+"\"_CURRENT_IP=\""+ip+" >> ./setup.conf\n"
			+"echo "+i+"\"_REGISTERED=\" >> ./setup.conf\n"
			+"echo "+i+"\"_NODENAME=validator-\""+i+" >> ./setup.conf\n"
			+"echo "+i+"\"_ENODE=\""+enode+" >> ./setup.conf\n"
			+"echo "+i+"\"_PUBKEY=\"$${PUB} >> ./setup.conf\n"
			+"echo "+i+"\"_RAFT_ID=\""+i+" >> ./setup.conf\n"
			
		}
		if(i==basicConfig.publicKeys.length-1){
			entrypoint = entrypoint
			+"fi\n"
			+"./NodeManager http://"+serviceConfig.validator.startIp+":"+serviceConfig.validator.rpcPort+" "+serviceConfig["quorum-maker"]["port"]+" /logs/gethLogs/ /logs/constellationLogs"
			
		}	
	}
}
const services = {
	"eth-stats": ()=>{
		var eth = {
			"image"        :  "quay.io/amis/ethstats:latest",
			"ports"        :  ["3000:3000"],
			"environment"  :  ["WS_SECRET=bb98a0b6442334d0cdf8a31b267892c1"],
			"restart"	   : "always",
			"networks"	   : {
			}
		};
		eth.networks[network_name] = { "ipv4_address":serviceConfig["eth-stats"].ip };
		return eth;
	},
	"quorum-maker": ()=>{
		var quorum = {
			"hostname": "quorum-maker",
			"image"   : "mythrihegde/quorum:2.1.1_2.5.1",
			"ports"	  : [serviceConfig["quorum-maker"].port+":"+serviceConfig["quorum-maker"].port],
			"volumes" : ["./quorum-maker-conf:/conf","logs:/logs"],
			"depends_on": ["validator-0"],
			"entrypoint":["/bin/sh", "-c",entrypoint],
			"networks": {
			},
			"restart": "always"
		};
		quorum.volumes.push("validator-0:/eth");
		quorum.networks[network_name] = { "ipv4_address": serviceConfig["quorum-maker"].ip }
		console.log(qmvolumes);
		quorum.volumes = quorum.volumes.concat(qmvolumes)
		return quorum;
	},	    
	"validator": (i)=>{
		var startGeth = gethCom+" --identity \"validator-"+i+"\" --nodekeyhex \""+basicConfig.privateKeys[i].split("0x")[1]+"\" "
		+"--etherbase \""+basicConfig.publicKeys[i]+"\" --port \""+serviceConfig.validator.gossipPort+"\""
		+" --ethstats \"validator-"+i+":bb98a0b6442334d0cdf8a31b267892c1@172.16.239.9:3000\" --rpcport "+serviceConfig.validator.rpcPort
		+" --wsport "+serviceConfig.validator.wsPort;
		if(i == 0)
			startGeth+=" 2>/logs/gethLogs/validator-0.txt\n"
		const startIp = serviceConfig.validator.startIp.split(".");
		var validator = {
			"hostname"   : 'validator-'+i,
			"image"		 :	"quorumengineering/quorum:latest",
			"ports"	     : [
				(serviceConfig.validator.gossipPort+i)+":"+serviceConfig.validator.gossipPort,
				(serviceConfig.validator.rpcPort+i)+":"+serviceConfig.validator.rpcPort, 
				(serviceConfig.validator.wsPort+i)+":"+serviceConfig.validator.wsPort
			],
			"volumes"    : [],
			"depends_on" : ["constellation-"],
			"environment":	["PRIVATE_CONFIG=/constellation"+i+"/tm.conf"],
			"entrypoint" : ["/bin/sh","-c"],
			"networks"	:	{
			},
			"restart"	: "always"
		};
		var startWait = "";
		if ( !tesseraFlag ){
			validator.volumes 	    = ["validator-"+i+":/eth","constellation-"+i+":/constellation"+i+":z","./tmp:/tmp"];
			validator["depends_on"] = ["constellation-"+i];
			validator["environment"]= ["PRIVATE_CONFIG=/constellation"+i+"/tm.conf"];
			startWait 				= "while [ ! -e /constellation"+i+"/tm.ipc ];do"
		}else{
			validator.volumes 	    = ["validator-"+i+":/eth","tessera-"+i+":/priv"+i,"./tmp:/tmp"];
			validator["depends_on"] = ["tessera-"+i];
			validator["environment"]= ["PRIVATE_CONFIG=/priv"+i+"/tm.ipc"];
			startWait               = "while [ ! -e /priv"+i+"/tm.ipc ];do";
		}
		const commands = [
			startWait,
			"sleep 1",
			"echo \"waiting for priv impl...\"",
			"done",
			"rm -f /eth/geth.ipc",
			"if [ ! -e /eth/genesis.json ];then",
			"mkdir -p /eth",
			"mkdir -p /logs/gethLogs",
			"cp /tmp/genesis.json /eth/genesis.json",
			"cp /tmp/static-nodes.json /eth/static-nodes.json",
			"cp /tmp/permissioned-nodes.json /eth/permissioned-nodes.json",
			"geth init /eth/genesis.json --datadir /eth",		
			"echo '"+basicConfig.passwords[i]+"' > ./password",
			"echo '"+basicConfig.privateKeys[i].split("0x")[1]+"' > ./file",
			"geth account import file --datadir /eth --password password",
			"rm -f ./file && rm -f ./password",
			"fi",
			startGeth
		];
		validator.networks[network_name] = { "ipv4_address":startIp[0]+"."+startIp[1]+"."+startIp[2]+"."+(parseInt(startIp[3])+i) };
		validator.entrypoint.push(genCommand(commands));
		if(i == 0)
			validator.volumes.push("logs:/logs");
		return validator;
	},
	"constellation": (i)=>{
		var startIp 	  = serviceConfig.constellation.startIp.split(".");
		var othernodes 	  = " --othernodes=";
		var limit 		  = 3;
		for (var j = 0; j < limit; j++){
			if(i != j){
		    	othernodes+="http://"+startIp[0]+"."+startIp[1]+"."+startIp[2]+"."+(parseInt(startIp[3])+j)+":"+(serviceConfig.constellation.port+j)+"/";
		    	if(j != limit-1){
		      		othernodes+=",";
		    	}
		  	}else{
		    	limit++;
		  	}
		}
		var startConst    = constellationCom+othernodes
		+" --url=http://"+startIp[0]+"."+startIp[1]+"."+startIp[2]+"."+(parseInt(startIp[3])+i)+":"+(serviceConfig.constellation.port+i)
		+"/ --port="+(serviceConfig.constellation.port+i);
		if(i == 0)
			startConst+=" 2>/logs/constellationLogs/validator-0_constellation.txt"
		var constellation = {
			"hostname"   : "constellation-"+i,
			"image"		: "quorumengineering/constellation:latest",
			"ports"	     : [(serviceConfig.constellation.port+i)+":"+(serviceConfig.constellation.port+i)],
			"volumes"    : ["constellation-"+i+":/constellation"+i+":z"],
			"entrypoint" : ["/bin/sh","-c"],
			"networks"	: {
			},
			"restart"	: "always"	
		};
		const commands = [
			"rm -f /constellation"+i+"/tm.ipc",
			"if [ ! -e \"/constellation"+i+"/tm.pub\" ];then",
			"mkdir -p /constellation"+i+"",
			"mkdir -p /logs/constellationLogs",
			"echo \"socket=\\"+"\"/constellation"+i+"/tm.ipc\\"+"\"\\npublickeys=[\\"+"\"/constellation"+i+"/tm.pub\\"+"\"]\\n\" > /constellation"+i+"/tm.conf",
			"constellation-node --generatekeys=/constellation"+i+"/tm",
			"cp /constellation"+i+"/tm.pub /tmp/tm"+i+".pub",
			"fi",
			startConst
		];
		if(!tesseraFlag && i == 0)
			constellation.volumes.push("logs:/logs");
		constellation.entrypoint.push(genCommand(commands));
		constellation.networks[network_name] = { "ipv4_address":startIp[0]+"."+startIp[1]+"."+startIp[2]+"."+(parseInt(startIp[3])+i) };
		return constellation;
	},
	"tessera": (i)=>{
		var startTess = "java -Xms128M -Xmx128M -jar /tessera/tessera-app.jar -configfile /priv"+i+"/tessera-config.json";
		if(i == 0)
			startTess+=" 2>/logs/constellationLogs/validator-tessera.txt"
		var tesseraTemplate  = serviceConfig.tessera.tesseraTemplate(i);
		var tessera          = {
			"hostname"   : "tessera"+i,
			"image"		: "quorumengineering/tessera:latest",
			"ports"	     : [(serviceConfig.tessera.port+i)+":"+serviceConfig.tessera.port],
			"volumes"    : [],
			"entrypoint" : ["/bin/sh","-c"],
			"networks"	: {
			},
			"restart"	: "always"	
		};
		const startIp = serviceConfig.tessera.startIp.split(".");
		var peers = [];
		for (var j = 0; j < basicConfig.publicKeys.length; j++) {
				peers.push({ "url" : "http://"+startIp[0]+"."+startIp[1]+"."+startIp[2]+"."+(j+parseInt(startIp[3]))+":"+serviceConfig.tessera.port+"/"})
		}
		tesseraTemplate.server.port 				= serviceConfig.tessera.port;
		tesseraTemplate.server.hostName 			= "http://"+startIp[0]+"."+startIp[1]+"."+startIp[2]+"."+(i+parseInt(startIp[3]));
		tesseraTemplate.peer        				= peers;
		tessera.volumes								= ["tessera-"+i+":/priv"+i];
		const commands = [
			"rm -f /priv"+i+"/tm.ipc",
			"if [ ! -e \"/priv"+i+"/tm.key\" ];then",
			"mkdir -p /priv"+i+"",
			"mkdir -p /logs/constellationLogs",
			"echo -e \"\\n\" | java -jar /tessera/tessera-app.jar -keygen -filename /priv"+i+"/tm",
			"echo '"+JSON.stringify(tesseraTemplate)+"' > /priv"+i+"/tessera-config.json",
			"cp /priv"+i+"/tm.pub /tmp/tm"+i+".pub",
			"fi",
			startTess
		];
		if(tesseraFlag && i == 0)
			tessera.volumes.push("logs:/logs");
		tessera.entrypoint.push(genCommand(commands));
		tessera.networks[network_name] = { "ipv4_address":startIp[0]+"."+startIp[1]+"."+startIp[2]+"."+(i+parseInt(startIp[3])) };
		return tessera;
	},
	"governanceApp": (i)=>{
		var gov = {
			"hostname" 		: "governance-ui-"+i,
			"image"    		: "ledgeriumengineering/governance_app_ui_img:latest",
			"ports"    		: [(serviceConfig["governance-app"]["port-exp"]+i)+":"+serviceConfig["governance-app"]["port-int"]],
			"volumes"  		: ['validator-'+i+':/eth'],
			"depends_on" 	: ["validator-"+i],
			"entrypoint"    : [ "/bin/sh","-c"],
			"networks"      : {

			}
		}
		const startIp = serviceConfig["governance-app"].startIp.split(".");
		const ip = startIp[0]+"."+startIp[1]+"."+startIp[2]+"."+(parseInt(startIp[3])+i);
		const vip = serviceConfig.validator.startIp.split(".");
		var string = "";
		if((i == 0) && (numberOfNodes >= 3)) {
				string+="cd /ledgerium/governanceapp/governanceApp\n"
				string+="node index.js protocol=http hostname=localhost port=8545 privateKeys="
				+basicConfig.privateKeys[0].split("0x")[1]+","
				+basicConfig.privateKeys[1].split("0x")[1]+","
				+basicConfig.privateKeys[2].split("0x")[1]+"\n";
		}
		string+="cd /ledgerium/governanceapp/governanceApp/app\n";
		string+="node governanceUI.js "+vip[0]+"."+vip[1]+"."+vip[2]+"."+(parseInt(vip[3])+i)+" "+serviceConfig.validator.rpcPort+"\n";
		gov.entrypoint.push(string);
		if ( !tesseraFlag ){
			gov.volumes.push("constellation-"+i+":/constellation"+i+":z")
		}else{
			gov.volumes.push('tessera-'+i+':/priv'+i)
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
exports.helper 					= helper;
