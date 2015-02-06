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