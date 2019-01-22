const fs = require('fs');
const ethUtil = require('ethereumjs-util');
const dockerTemplate = require("../templates/docker-template");
var genesisTemplate = require('../genesis');

const amount = "0xfffffffffffffffffffffffffffffffffffff";
var input = require('./getMnemonics');
var readparams = require('../readparams');
 
var mnemonic = input.template;

var privateKeyJSON = {}; var writeprivatekeys = true;
const test = [
	'0x'+ethUtil.keccak("some random key for test").toString('hex'),
	'0x'+ethUtil.keccak("just to use as seed").toString('hex'),
	'0x'+ethUtil.keccak("for faulty node test").toString('hex'),
	'0x'+ethUtil.keccak("enaled only if test is greater than zero").toString('hex')
];
var testCount = readparams.test>4?4:readparams.test;
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

for (var i = 0; i < testCount; i++) {
	privateKeys.push(test[i]);
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

const tempDir = __dirname + "/../output/tmp/";
if(fs.existsSync(tempDir + genesis))
	fs.unlinkSync(tempDir + genesis);
if(fs.existsSync(tempDir + privatekeys))
	fs.unlinkSync(tempDir + privatekeys);
if(fs.existsSync(tempDir + static))
	fs.unlinkSync(tempDir + static);
	
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
}

if(readparams.modeFlag == "full") {
	fs.writeFileSync(tempDir+"genesis.json",JSON.stringify(genesisTemplate));
	fs.writeFileSync(tempDir+"static-nodes.json",static_nodes);
	fs.writeFileSync(tempDir+"permissioned-nodes.json",static_nodes);

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
var mode = '';
if (process.argv[2] == '1')
	mode = 1;
else 
	mode = 0;

exports.publicKeys = publicKeys;
exports.privateKeys = privateKeys;
exports.staticNodes = static_nodes;
exports.staticNodesExternal = staticNodesExternal;
exports.genesisString = JSON.stringify(genesisTemplate);
exports.passwords = input.passwords;
exports.enodes = enodes;