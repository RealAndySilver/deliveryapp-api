var soap = require('soap');
var sha1 = require('sha1');
var client=null;
var initClient=function(){
    if (!client){
        var wsdlOptions = {
  "overrideRootElement": {
    "namespace": "tns"}};
        var url = 'https://www.placetopay.com/soap/PlacetoPay/?wsdl';
        var args = {name: 'value'};
        soap.createClient(url,wsdlOptions, function(err, pClient) {
        client=pClient;
        //console.log("Client :",client);
        //console.log(client.describe());
      });
    }
    
}

initClient();

var crateHash=function(seed){
    var tranKey="44GdUHpa";
    return sha1(seed+tranKey);
}

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
exports.createToken = function(user,card_number,cvv,exp_date,callback){
    if (client){
        var date = new Date();
        var seed = date.toISOString();

        var authParams= {login:"13dd65d229afae2e65e9a94e301aa6dd",
                        tranKey:crateHash(seed),
                        seed: seed,
                        additional:[]};

        var cardInfoParams= {number:card_number,
                        type:"C",
                        expiration:exp_date,
                        differed:12,
                        secureCode:cvv};

        var personParams =  {documentType:"CC",
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

        var args = {auth:authParams,cardInfo:cardInfoParams,owner:personParams}                

        client.tokenizeCard(args, function(err, result, raw, soapHeader) {
            console.log(" LR ",client.lastRequest );
            console.log(" RSLT ",result);
            callback(err, result, raw, soapHeader);
          
      });
    }else{
         callback("ERROR");
    }
};

/*

Function that connects with Place 2 Pay in order to obtain a new token

*/
exports.deleteToken = function(token){				

	return true;
};


exports.getFranchiseByBIN = function (number){
    var franchise="NA";

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