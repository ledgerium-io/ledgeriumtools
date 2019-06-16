const fs = require('fs');
var randomstring = require("randomstring");

//Possible values are "full" to generate yml with quorum-maker and eth-stat
//And "single" mode to generate yml without these two containers
var modeFlag = "master";
var env = "dev";
var externalIPAddress = "127.0.0.1";
var nodeName = "nodeName";
var faultynode = 0;
var domainName = "domainName";
var networkId = "2019";
readInitialParams();

function readInitialParams(){
	var initialParamFileName = __dirname + "/../initialparams.json";
    if(fs.existsSync(initialParamFileName)){
        var initialDataRaw = fs.readFileSync(initialParamFileName,"utf8");
		var initialData = JSON.parse(initialDataRaw);
		
		if(initialData["mode"] != undefined)
			modeFlag = initialData["mode"];
			
		if(initialData["env"] != undefined)
			env = initialData["env"];
		
		if(initialData["nodeName"] != undefined)
			nodeName = initialData["nodeName"];
		else  
			nodeName = randomstring.generate(3);
		
		if(initialData["externalIPAddress"] != undefined)
        	externalIPAddress = initialData["externalIPAddress"];

        if(initialData["faultynode"] != undefined)
			faultynode = initialData["faultynode"];
		
		if(initialData["networkId"] != undefined)
			networkId = initialData["networkId"];

		if(initialData['domainName'] != undefined)
			domainName = initialData['domainName'];

		if (modeFlag == "full" || modeFlag == "master") {
			console.log("YML file with", modeFlag, "mode for", env, "setup");
		} else {
			console.log ('Invalid mode ::', modeFlag )
		}	
    }
    else{
        console.log("initialparams.json file does not exist! The program may not function properly!");
    }    
}
exports.modeFlag = modeFlag;
exports.env = env;
exports.externalIPAddress = externalIPAddress;
exports.nodeName = nodeName;
exports.faultynode = faultynode;
exports.domainName = domainName;
exports.networkId = networkId;