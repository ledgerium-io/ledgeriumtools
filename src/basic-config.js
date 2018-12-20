const fs 			   = require('fs');
const ethUtil  		   = require('ethereumjs-util');
const dockerTemplate   = require("../templates/docker-template");
var genesisTemplate    = require('../templates/genesis-template');
const amount           = "0xfffffffffffffffffffffffffffffffffffff";
var input   		   = require('./getMnemonics');
var mnemonic 		   = input.template;

var privateKeys = [], publicKeys = [], static_nodes = "[", extraData, enodes = [];
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
	var enode = ethUtil.privateToPublic(privateKeys[i]).toString('hex')
	enodes.push(enode);
	static_nodes += (
		"\"enode://"+enode+
		"@"+
		baseIp+
		(startIp+i)+
		":"+
		dockerTemplate.serviceConfig.validator.gossipPort+
		"?discport=0\""
	);
	publicKeys.push(ethUtil.privateToAddress(privateKeys[i]).toString('hex'));
	if(i != privateKeys.length-1){
		static_nodes+=",";
	}else{
		static_nodes+="]";
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

exports.publicKeys    = publicKeys;
exports.privateKeys   = privateKeys;
exports.staticNodes   = static_nodes;
exports.genesisString = JSON.stringify(genesisTemplate);
exports.passwords     = input.passwords;
exports.enodes = enodes;