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

/*

Function that connects with Place 2 Pay in order to obtain a new token

*/
exports.deleteToken = function(token){				

	return true;
};


exports.getFranchiseByBIN = function (number){
    var franchise="";

    //VISA
    var re = new RegExp("^4");
    if (number.match(re) != null)
        franchise= "VI";

    // Mastercard
    re = new RegExp("^5[1-5]");
    if (number.match(re) != null)
        franchise= "MC";

    // AMEX
    re = new RegExp("^3[47]");
    if (number.match(re) != null)
        franchise= "AM";

    re = new RegExp("^36");
    if (number.match(re) != null)
        franchise= "DI";

    // Visa Electron
    re = new RegExp("^(4026|417500|4508|4844|491(3|7))");
    if (number.match(re) != null)
        franchise=  "VE";

    // Discover
    /*re = new RegExp("^(6011|622(12[6-9]|1[3-9][0-9]|[2-8][0-9]{2}|9[0-1][0-9]|92[0-5]|64[4-9])|65)");
    if (number.match(re) != null)
        franchise= "Discover";*/

    // Diners
        // Diners - Carte Blanche
    /*re = new RegExp("^30[0-5]");
    if (number.match(re) != null)
        franchise= "Diners - Carte Blanche";*/

    // JCB
    /*re = new RegExp("^35(2[89]|[3-8][0-9])");
    if (number.match(re) != null)
        franchise= "JCB";*/

    return franchise;
};