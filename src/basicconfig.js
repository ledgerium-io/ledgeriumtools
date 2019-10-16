const fs = require('fs');
const ethUtil = require('ethereumjs-util');
const dockerTemplate = require("../templates/dockertemplate");
var genesisTemplate = require('../templates/genesistemplate');

const amount = "0xfffffffffffffffffffffffffffffffffffff";
var readparams = require('./readparams');
var input = require('./getmnemonics');

var mnemonic = input.template;

var rpcPort = 8545;
var nodeJSON = {};
var nodeDetails = [];
var faultyNodeFlag = readparams.faultynode;
var writeprivatekeys = true;
let envParams = "";
let privateKeyJSON = {};
var validatorIDs = [], hostNames = [], privateKeys = [], publicKeys = [], static_nodes = "[", staticNodesExternal = "[", extraData, enodes = [];
const vanity = mnemonic.istanbul.vanity || "0x0000000000000000000000000000000000000000000000000000000000000000";
const seal   = mnemonic.istanbul.seal || "0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";

const outputDir = __dirname + "/../output/";
const tempDir = __dirname + "/../output/tmp/";
const fullnodeDir = __dirname + "/../output/fullnode/"
const fullnodeTempDir = __dirname + "/../output/fullnode/tmp/"

if (!fs.existsSync(fullnodeDir)) {
    fs.mkdirSync(fullnodeDir);
}

if (!fs.existsSync(fullnodeTempDir)) {
    fs.mkdirSync(fullnodeTempDir);
}

if(mnemonic.mode == 0){
	var temp = mnemonic.mnemonic;
	for (var i = 0; i < temp.length; i++) {
		privateKeys.push('0x'+ethUtil.keccak(temp[i]).toString('hex'));
	}
}else {
	privateKeys = mnemonic.keys;
}

var baseIp = dockerTemplate.serviceConfig.validator.startIp.split(".");
const startIp = (parseInt(baseIp[3]));
baseIp = baseIp[0]+"."+baseIp[1]+"."+baseIp[2]+".";
for (var i = 0; i < privateKeys.length; i++) {
	
	var temp = ethUtil.privateToPublic(privateKeys[i]).toString('hex');
	let pubk = ethUtil.privateToAddress(privateKeys[i]).toString('hex');
	enodes.push(temp);

	if(readparams.distributed) {
		envParams="";
		privateKeyJSON={};
		static_nodes += (
			"\"enode://"+temp+
			"@"+
			ipAddress[i]+
			":"+
			(dockerTemplate.serviceConfig.validator.gossipPort) +
			"?discport=0\""
		);
		staticNodesExternal += (
			"\"enode://"+temp+
			"@"+
			ipAddress[i]+
			":"+
			(dockerTemplate.serviceConfig.validator.gossipPort+i)+
			"?discport=0\""
		);

		
		privateKeyJSON["0x" + pubk] = privateKeys[i].split("0x")[1];
		
		//Append private keys and passwords to a variable
		// envParams += "PRIVATEKEY" + i + "=" + privateKeys[i].split("0x")[1] + "\n";
		// envParams += "PASSWORD" + i + "=" + input.passwords[i] + "\n";
		envParams += "PRIVATEKEY" + "=" + privateKeys[i].split("0x")[1] + "\n";
		envParams += "PASSWORD" + "=" + input.passwords[i];
		if(i === 0) {
			fs.writeFileSync(outputDir + ".env", envParams);
			fs.writeFileSync(tempDir+ "privatekeys.json", JSON.stringify(privateKeyJSON,null, 2))
		} else {
			fs.writeFileSync(fullnodeDir + ".env" +i, envParams);
			fs.writeFileSync(fullnodeTempDir+ "privatekeys" + i + ".json", JSON.stringify(privateKeyJSON,null, 2))
		}
	} else {
		static_nodes += (
			"\"enode://"+temp+
			"@"+
			baseIp+
			(startIp+i)+
			":"+
			(dockerTemplate.serviceConfig.validator.gossipPort) +
			"?discport=0\""
		);
		staticNodesExternal += (
			"\"enode://"+temp+
			"@"+
			readparams.externalIPAddress+
			":"+
			(dockerTemplate.serviceConfig.validator.gossipPort+i)+
			"?discport=0\""
		);

		privateKeyJSON["0x" + pubk] = privateKeys[i].split("0x")[1];
		
		//Append private keys and passwords to a variable
		if(readparams.modeFlag === 'blockproducer') {
			envParams += "PRIVATEKEY" + "=" + privateKeys[i].split("0x")[1] + "\n";
			envParams += "PASSWORD" + "=" + input.passwords[i] + "\n";	
		} else {
			envParams += "PRIVATEKEY" + i + "=" + privateKeys[i].split("0x")[1] + "\n";
			envParams += "PASSWORD" + i + "=" + input.passwords[i] + "\n";
		}

		if(i === privateKeys.length-1)
		fs.writeFileSync(outputDir + ".env", envParams);
		fs.writeFileSync(tempDir+ "privatekeys.json", JSON.stringify(privateKeyJSON,null, 2))
	}

	publicKeys.push(pubk);
	if(i != privateKeys.length-1){
		static_nodes+=",";
		staticNodesExternal+=",";
	}else{
		static_nodes+="]";
		staticNodesExternal+="]";
	}

	var validatorName = "validator-";
	if(faultyNodeFlag)
		validatorName += "test-" + i;
	else {
		validatorName += i;
	}
	validatorIDs.push(validatorName);
	hostNames.push(validatorName);

	var node = {
		nodename:validatorName,
		hostname: validatorName,
		role: readparams.modeFlag + " node",
		ipaddress:readparams.externalIPAddress,
		port:(rpcPort + i),
		publickey: "0x" + pubk,
		enodeUrl: temp
	};
	nodeDetails.push(node);
}
nodeJSON["nodes"] = nodeDetails;

temp = [];
var data = [];
genesisTemplate['config'].chainId = readparams.networkId;
genesisTemplate['coinbase'] = "0x0000000000000000000000000000000000000000";
for (var i = 0; i < publicKeys.length; i++) {
	genesisTemplate['alloc'][publicKeys[i]] = { "balance" : amount };
	temp.push(Buffer.from(publicKeys[i],'hex'));
}
data.push(temp);
temp = seal.split('0x');
if(temp.length == 1)
	throw "Make sure all hex values start from 0x";
data.push(Buffer.from(temp[1],"hex"));
data.push([]);

genesisTemplate['extraData'] = vanity+ethUtil.rlp.encode(data).toString("hex");

//Remove the files
const genesisFile = "genesis.json";
const privatekeysFile = "privatekeys.json";
const staticFile = "static-nodes.json";
const permissionedFile = "permissioned-nodes.json";
// const envFile = __dirname + "/../output/.env"; //.env file path

if(fs.existsSync(tempDir + genesisFile))
	fs.unlinkSync(tempDir + genesisFile);
if(fs.existsSync(tempDir + privatekeysFile))
	fs.unlinkSync(tempDir + privatekeysFile);
if(fs.existsSync(tempDir + staticFile))
	fs.unlinkSync(tempDir + staticFile);
if(fs.existsSync(tempDir + permissionedFile))
	fs.unlinkSync(tempDir + permissionedFile);
if(fs.existsSync(envFile))
	fs.unlinkSync(envFile);
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
}

//Create env file for both full/blockproducer mode
// fs.writeFileSync(envFile, envParams); //Write private keys and passwords to .env file

if(readparams.modeFlag == "full") {
	const nodeDetailsFile = "nodesdetails.json";
	if (!fs.existsSync(fullnodeDir)) {
		fs.mkdirSync(fullnodeDir);
	}
	const envFilefullnode = __dirname + "/../output/fullnode/.env"; //.env file path
	if(fs.existsSync(envFilefullnode))
		fs.unlinkSync(envFilefullnode);
	//Create env file for full node, will be used by faucet
	// fs.writeFileSync(envFilefullnode, envParams); //Write private keys and passwords to .env file
	
	fs.writeFileSync(tempDir + genesisFile, JSON.stringify(genesisTemplate));
	fs.writeFileSync(tempDir + staticFile, static_nodes);
	//fs.writeFileSync(tempDir + permissionedFile, static_nodes);
	fs.writeFileSync(tempDir + nodeDetailsFile, JSON.stringify(nodeJSON, null, 2));

	const networkDir = __dirname + "/../../ledgeriumnetwork/";
	if (!fs.existsSync(networkDir)) {
		fs.mkdirSync(networkDir);
	}
	if(fs.existsSync(networkDir + genesisFile))
		fs.unlinkSync(networkDir + genesisFile);
	if(fs.existsSync(networkDir + staticFile))
		fs.unlinkSync(networkDir + staticFile);
	if(fs.existsSync(networkDir + permissionedFile))
		fs.unlinkSync(networkDir + permissionedFile);
		
	fs.writeFileSync(networkDir + genesisFile, JSON.stringify(genesisTemplate));
	fs.writeFileSync(networkDir + staticFile, staticNodesExternal);
	//fs.writeFileSync(networkDir + permissionedFile, staticNodesExternal);
	//fs.writeFileSync(networkDir + nodeDetailsFile, JSON.stringify(nodeJSON, null, 2));
}

// if(writeprivatekeys) {
// 	var data = JSON.stringify(privateKeyJSON,null, 2);
// 	fs.writeFileSync(tempDir + privatekeysFile, data);
// }

exports.validatorIDs = hostNames;
exports.hostNames = hostNames;
exports.publicKeys = publicKeys;
exports.privateKeys = privateKeys;
exports.staticNodes = static_nodes;
exports.staticNodesExternal = staticNodesExternal;
exports.genesisString = JSON.stringify(genesisTemplate);
exports.passwords = input.passwords;
exports.enodes = enodes;