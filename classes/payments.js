var generateToken = function(){
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 15; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
};


/*

Function that connects with Place 2 Pay in order to obtain a new token

*/
exports.createToken = function(user,card_number,cvv,exp_date){
	var authParams= {login:"vueltap",
						trankey:"",
						seed:"",
						additional:[]};

	var cardInfoParams= {number:card_number,
						type:"C",
						expiration:exp_date,
						differed:12,
						secureCode:cvv};

	var personParams = 	{documentType:"CC",
						document:"",
						firstName:user.name,
						lastName:user.lastName,
						company:"",
						emailAddress:user.email,
						address: "",
						city:"",
						province :"",
						country : "CO",
						phone:"",
						mobile:user.mobilephone};				

	return generateToken();
};