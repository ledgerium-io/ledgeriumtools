const gethCom = "geth --rpc --rpcaddr '0.0.0.0' --rpcport '8545' --rpccorsdomain '*' \
--datadir '/eth' --rpcapi 'db,eth,net,web3,istanbul,personal,admin,debug,txpool' \
--ws --wsorigins '*' --wsport '9000' --wsapi 'db,eth,net,web3,personal,admin,debug,txpool' \
--wsaddr '0.0.0.0' --networkid 2018 --targetgaslimit 9007199254740000 --permissioned \
--debug --metrics --syncmode 'full' --gasprice 0 --mine --verbosity 3 --nodiscover \
--emitcheckpoints --istanbul.blockperiod 1 --mine --minerthreads 1 --syncmode full";

const constellationCom = "constellation-node --socket=/constellation/tm.ipc --publickeys=/constellation/tm.pub \
--privatekeys=/constellation/tm.key --storage=/constellation --verbosity=4";

const tesseraCom = "";

const services = {
	"eth-stats":{
		"image"        :  "quay.io/amis/ethstats:latest",
		"ports"        :  ["3000:3000"],
		"environment"  :  ["WS_SECRET=bb98a0b6442386d0cdf8a31b267892c1"],
		"restart"	   : "always",
	    "networks"	   : {
	    	"app_net"  : {
	    		"ipv4_address" : "172.16.239.9"
	    	}
	    }
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
				"app_net"	:	{
					"ipv4_address"	: ""
				}
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
	    		"app_net"  : {
	    			"ipv4_address" : ""
	    		}
	    	},
	    	"restart"	: "always"	
		}
	},
	"tessera": ()=>{
		return {
			"hostname"   : "tessera-",
			"image"		: "quorumengineering/tessera:latest",
			"ports"	     : [],
			"volumes"    : [],
			"entrypoint" : ["/bin/sh","-c"],
			"networks"	: {
	    		"app_net"  : {
	    			"ipv4_address" : ""
	    		}
	    	},
	    	"restart"	: "always"	
	    }
	},
	"networks" : {
		"app_net":{
			"driver" : "bridge",
			"ipam"   : {
				"driver"  :  "default",
				"config"  : [ 
					{
						"subnet" : "172.16.239.0/24"
					}
				]
			}
		}
	}	
};

const serviceConfig = {
	"validator":{
		"startIp":"172.16.239.10",
		"gossipPort":21000,
		"rpcPort":8545,
		"wsPort":9000
	},
	"constellation":{
		"startIp":"172.16.239.100",
		"port":10000
	},
	"tessera":{
		"startIp":"172.16.239.100",
		"port":10000
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
exports.genValidatorCommand     = (i, gossipPort,genesisString,staticNodes,privateKeys,publicKeys)=>{
	const commands = [
		"if [ -d \"/eth/geth\" ]; then",
		"mkdir -p /eth/geth",
		"echo '"+genesisString+"' > /eth/genesis.json",
		"echo '"+staticNodes+"' > /eth/static-nodes.json",
		"echo '"+staticNodes+"' > /eth/permissioned-nodes.json",
		"echo 'password' > ./password",
		"echo '"+privateKeys.split("0x")[1]+"' > ./file",
		"geth account import ./file --datadir /eth --password ./password",
		"rm ./file && rm ./password",
		"geth init /eth/genesis.json --datadir /eth",
		"fi",
		gethCom+" --identity "+"\"validator-"+i+"\" --nodekeyhex \""+privateKeys.split("0x")[1]+"\" "+"--etherbase \""+publicKeys+"\" --port \""+gossipPort+"\""
	];
	var commandString = "";
	for (var j = 0; j < commands.length; j++) {
		commandString+=commands[j]+"\n";
	}
	return commandString;
};
exports.genConstellationCommand = (i,othernodes,ip,port)=>{
	const commands = [
		"if [ -d \"constellation\" ]; then",
     	"mkdir -p /constellation",
      	"echo \"socket=\\"+"\"/constellation/tm.ipc\\"+"\"\\npublickeys=[\\"+"\"/constellation/tm.pub\\"+"\"]\\n\" > /constellation/tm.conf",
      	"constellation-node --generatekeys=/constellation/tm",
      	"cp /constellation/tm.pub /tmp/tm"+i+".pub",
      	"fi",
      	constellationCom+othernodes+" --url=http://"+ip+":"+port+"/ --port="+port
    ];
    var commandString = "";
	for (var j = 0; j < commands.length; j++) {
		commandString+=commands[j]+"\n";
	}
	return commandString;
}
exports.geth = gethCom;
exports.constellation = constellationCom;

/*
exports.getValidator = (i,basicConfig,genesisString)=>{
	const startIp = 10;
	const gossipPort = 21000;
	const rpcPort = 8545;
	const webSocketPort = 9000;
	const baseIp = "172.16.239.";
	var nodes = "[";
	for (var j = 0; j < basicConfig.publicKeys.length; j++) {
		nodes += ("\""+basicConfig.staticNodes[j]+"@"+baseIp+(startIp+j)+":"+gossipPort+"?discport=0\"");
		if(j != basicConfig.publicKeys.length-1){
			nodes+=",";
		}else{
			nodes+="]";
		}
	}
	return {
		"hostname"   : 'validator-'+i,
		"image"		 :	"quorumengineering/quorum:latest",
		"ports"	     : [(gossipPort+i)+":"+gossipPort, (rpcPort+i)+":"+rpcPort, (webSocketPort+i)+":"+webSocketPort],
		"volumes"    : ["validator-"+i+":/eth","constellation-"+i+":/constellation:z"],
		"depends_on" : ["constellation-"+i],
		"environment":	["PRIVATE_CONFIG=/constellation/tm.conf"],
		"entrypoint" : ["/bin/sh","-c","if [ -d \"/eth/geth\" ]; then\n"+
			"mkdir -p /eth/geth\n"+
			"echo '"+genesisString+"' > /eth/genesis.json\n"+
			"echo '"+nodes+"' > /eth/static-nodes.json\n"+
			"echo '"+nodes+"' > /eth/permissioned-nodes.json\n"+
			"echo 'password' > ./password\n"+
			"echo '"+basicConfig.privateKeys[i].split("0x")[1]+"' > ./file\n"+
			"geth account import ./file --datadir /eth --password ./password\n"+
			"rm ./file && rm ./password\n"+
			"geth init /eth/genesis.json --datadir /eth\n"+
			"fi\n"+			
			gethCom+" --identity "+"\"validator-"+i+"\" --nodekeyhex \""+basicConfig.privateKeys[i].split("0x")[1]+"\" "+
			"--etherbase \""+basicConfig.publicKeys[i]+"\" --port \""+gossipPort+"\""
		],
		"networks"	:	{
			"app_net"	:	{
				"ipv4_address"	: baseIp+(startIp+i)
			}
		},
		"restart"	: "always"
	};
}

exports.getConstellationNode = (i)=>{
	const constellationPort = 10000;
	const startIp = 100;
	const baseIp = "172.16.239.";
	othernodes = " --othernodes="
	var limit = 3;
	for (var j = 0; j < limit; j++) {
		if(i != j){
			othernodes+="http://"+baseIp+(startIp+j)+":"+(constellationPort+j)+"/";
			if(j != limit-1){
				othernodes+=",";
			}
		}else{
			limit++;
		}
	}
	return {
		"hostname"   : "constellation-"+i,
		"image"		: "quorumengineering/constellation:latest",
		"ports"	     : [(constellationPort+i)+":"+(constellationPort+i)],
		"volumes"    : ["constellation-"+i+":/constellation:z"],
		"entrypoint" : ["/bin/sh","-c","if [ -d \"constellation\" ]; then\n"+
			"mkdir -p /constellation\n"+
			"echo \"socket=\\"+"\"/constellation/tm.ipc\\"+"\"\\npublickeys=[\\"+"\"/constellation/tm.pub\\"+"\"]\\n\" > /constellation/tm.conf \n"+
			"constellation-node --generatekeys=/constellation/tm\n"+
			"cp /constellation/tm.pub /tmp/tm"+i+".pub\n"+
			"fi\n"+
			constellationCom+othernodes+" --url=http://"+baseIp+(startIp+i)+":"+(constellationPort+i)+"/ --port="+(constellationPort+i)+"\n"
		],
		"networks"	: {
    		"app_net"  : {
    			"ipv4_address" : baseIp+(startIp+i)
    		}
    	},
    	"restart"	: "always"	
	};
}

exports.getTesseraNode = (i)=>{
	const tesseraPort = 10000;
	const startIp = 100;
	const baseIp = "172.16.239.";
	othernodes = " --othernodes="
	return {
		"hostname"   : "tessera-"+i,
		"image"		: "quorumengineering/tessera:latest",
		"ports"	     : [(tesseraPort+i)+":"+(tesseraPort+i)],
		"volumes"    : ["tessera-"+i+":/tessera"],
		"entrypoint" : ["/bin/sh","-c","if [ -d \"tessera\" ]; then\n"+
			"mkdir -p /tessera\n"+
			"tessera -keygen -filename /tessera/tm\n"+
			"cp /tessera/tm.pub /tmp/tm"+i+".pub\n"+
			"fi\n"+
			tesseraCom+othernodes+" --url=http://"+baseIp+(startIp+i)+":"+(tesseraPort+i)+"/ --port="+(tesseraPort+i)+"\n"
		],
		"networks"	: {
    		"app_net"  : {
    			"ipv4_address" : baseIp+(startIp+i)
    		}
    	},
    	"restart"	: "always"	
	};
}
*/