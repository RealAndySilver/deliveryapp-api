var CONSTANTS = {
	ERROR: {
		BADAUTH : 'a1',
		SESSIONEXPIRED : 'a2',
		FORBIDDEN : 'a3'
	}	
};
var	security = require('../classes/security');
exports.verifyHeader = function (req,res,next){
//next();
	res.format({
			html: function () {
				res.json({status:0,message:"access denied to API", error:1921890});
				},
			
			json: function () {
				var encoded=req.get('token');
				console.log("time "+req.get('SSL'));
				console.log("token "+req.get('token'));
				console.log("c99 "+req.get('C99-RSA'));
				console.log("content-type "+req.get('content-type'));
				var time=new Buffer(req.get('SSL'),'base64');
				var key=new Buffer(req.get('C99-RSA'),'base64');
				var milliseconds = Math.ceil((new Date).getTime()/1000);
				console.log("local time: "+milliseconds+", device time:"+time);
				console.log(" token " + encoded + " time " + time + " Difference in time " + Math.abs(milliseconds-time) + " key " + key);
				
				var crypto = require("crypto");
				var sha256 = crypto.createHash("sha256");
				sha256.update(key+time,"utf8");//utf8 here
				//sha256.update("12345","utf8");//utf8 here
				var result = sha256.digest("base64");
				console.log(" token local "+result);

				if(Math.abs(milliseconds-time)<20 && key == "lop+2dzuioa/000mojijiaop" && encoded == result){
					next();
				}
				else{
					res.json({status:0,message:"access denied, Bad authentication.",error:1921891});	
				}
			},
		});	
};
var decodeAuth = function(auth){
	
	console.log("Authorization Header is: ", auth);
	if(!auth) { 
        res.statusCode = 401;
        res.json({status: false, error: "not session attached"});
    }
    else if(auth) {     
        var tmp = auth.split(' ');  

        var buf = new Buffer(tmp[1], 'base64'); 
        var plain_auth = buf.toString();

        console.log("Decoded Authorization ", plain_auth);

        var creds = plain_auth.split(':'); 
        var username = creds[0];
        var password = creds[1];
        //password = new Buffer(password).toString('base64');
		return {email:username,password:password};
    }
};
exports.decodeAuth = decodeAuth;
exports.go = function(req,res,next,SchemaObject,type){
	var today = new Date();
	var sessionDate = null;
	var twoWeeks = new Date(today.getFullYear(), today.getMonth(), today.getDate()+14);
	var auth = req.headers['authorization'];  
	var loginInfo = decodeAuth(auth);
		
	SchemaObject.findOne({email: loginInfo.email})
		.exec(function(err,object){
			if(!object){
				res.json({status: false, error: "not found "+loginInfo.email});
			}
			else{
				if(security.compareHash(loginInfo.password, object.password)){
					console.log('entró');
					//return;
					req.info.type = type;
					req.info.vendor = object;
					sessionDate = object.session.exp_date;
					if(today<sessionDate){
						object.session.exp_date = twoWeeks;
						object.save(function(err, result){
							next();
						});
					}
					else{
						res.json({status: true, response: "Session expired, please log in.", error: CONSTANTS.ERROR.SESSIONEXPIRED});
					}
				}
				else{
						res.json({status: true, response: "Bad authentication", error: CONSTANTS.ERROR.BADAUTH});
				}
			}
		});
};