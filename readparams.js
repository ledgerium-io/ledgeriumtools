const fs = require('fs');
var randomstring = require("randomstring");

//Possible values are "full" to generate yml with quorum-maker and eth-stat
//And "single" mode to generate yml without these two containers
var modeFlag = "addon";
var externalIPAddress = "127.0.0.1";
var nodeName = "nodeName";
var test = 0;
readInitialParams();

function readInitialParams(){
	var initialParamFileName = __dirname + "/initialparams.json";
    if(fs.existsSync(initialParamFileName)){
        var initialDataRaw = fs.readFileSync(initialParamFileName,"utf8");
		var initialData = JSON.parse(initialDataRaw);
		
		if(initialData["mode"] != undefined)
            modeFlag = initialData["mode"];
		
		if(initialData["nodeName"] != undefined)
			nodeName = initialData["nodeName"];
		else  
			nodeName = randomstring.generate(3);
		
		if(initialData["externalIPAddress"] != undefined)
        	externalIPAddress = initialData["externalIPAddress"];

        if(initialData["test"] != undefined)
        	test = initialData["test"];
        console.log("YML file with mode as", modeFlag);
    }
    else{
        console.log("initialparams.json file does not exist! The program may not function properly!");
    }    
}
exports.modeFlag = modeFlag;
exports.externalIPAddress = externalIPAddress;
exports.nodeName = nodeName;
exports.test = test;