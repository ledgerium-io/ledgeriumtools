const fs = require('fs');
const ethUtil = require('ethereumjs-util');
const dockerTemplate = require("../templates/docker-template");
var genesisTemplate = require('../genesis');

const amount = "0xfffffffffffffffffffffffffffffffffffff";
var input = require('./getMnemonics');
var readparams = require('../readparams');

var mnemonic = input.template;

var envPrivateKeys = "";
var privateKeyJSON = {}; var writeprivatekeys = true;
var privateKeys = [], publicKeys = [], static_nodes = "[", staticNodesExternal = "[", extraData, enodes = [];
const vanity = mnemonic.istanbul.vanity || "0x0000000000000000000000000000000000000000000000000000000000000000";
const seal   = mnemonic.istanbul.seal || "0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";

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
	enodes.push(temp);
	static_nodes += (
		"\"enode://"+temp+
		"@"+
		baseIp+
		(startIp+i)+
		":"+
		dockerTemplate.serviceConfig.validator.gossipPort+
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
	let pubk = ethUtil.privateToAddress(privateKeys[i]).toString('hex');
	privateKeyJSON["0x" + pubk] = privateKeys[i].split("0x")[1];
	
	//Append private keys to a variable
	envPrivateKeys += "PRIVATEKEY" + i + "=" + privateKeys[i].split("0x")[1] + "\n";
	
	publicKeys.push(pubk);
	if(i != privateKeys.length-1){
		static_nodes+=",";
		staticNodesExternal+=",";
	}else{
		static_nodes+="]";
		staticNodesExternal+="]";
	}
}

temp = [];
var data = [];
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
const genesis = "genesis.json";
const privatekeys = "privatekeys.json";
const static = "static-nodes.json";
const envFile = __dirname + "/../output/.env"; //.env file path

const tempDir = __dirname + "/../output/tmp/";
if(fs.existsSync(tempDir + genesis))
	fs.unlinkSync(tempDir + genesis);
if(fs.existsSync(tempDir + privatekeys))
	fs.unlinkSync(tempDir + privatekeys);
if(fs.existsSync(tempDir + static))
	fs.unlinkSync(tempDir + static);
if(fs.existsSync(envFile))
	fs.unlinkSync(envFile);
	
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
}

if(readparams.modeFlag == "full") {
	fs.writeFileSync(tempDir+"genesis.json",JSON.stringify(genesisTemplate));
	fs.writeFileSync(tempDir+"static-nodes.json",static_nodes);
	fs.writeFileSync(tempDir+"permissioned-nodes.json",static_nodes);
	fs.writeFileSync(envFile, envPrivateKeys); //Write private keys to .env file

	const outputDir = __dirname + "/../../ledgeriumnetwork/";
	if (!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir);
	}
	if(fs.existsSync(outputDir + genesis))
		fs.unlinkSync(outputDir + genesis);
	if(fs.existsSync(outputDir + static))
		fs.unlinkSync(outputDir + static);
		
	fs.writeFileSync(outputDir+"genesis.json",JSON.stringify(genesisTemplate));
	fs.writeFileSync(outputDir+"static-nodes.json",staticNodesExternal);
	fs.writeFileSync(outputDir+"permissioned-nodes.json",staticNodesExternal);
}

if(writeprivatekeys) {
	var data = JSON.stringify(privateKeyJSON,null, 2);
	fs.writeFileSync(tempDir+"privatekeys.json",data);
}

exports.publicKeys = publicKeys;
exports.privateKeys = privateKeys;
exports.staticNodes = static_nodes;
exports.staticNodesExternal = staticNodesExternal;
exports.genesisString = JSON.stringify(genesisTemplate);
exports.passwords = input.passwords;
exports.enodes = enodes;