var soap = require('soap');
var sha1 = require('sha1');
var request = require("request");

var client=null;

var CONSTANTS = {
    P2P_PARAMS :    {
                    LOGIN:"13dd65d229afae2e65e9a94e301aa6dd",
                    TRAN_KEY:"44GdUHpa",
                    P2P_URL_FORM:"https://www.placetopay.com/gateway/paymentdirect.php",
                    P2P_URL_WSDL:"https://www.placetopay.com/soap/PlacetoPay/?wsdl",
                    IS_DEV:'TRUE',
                    TRN_TYPES:
                                {
                                    AUTH_ONLY:'AUTH_ONLY' ,
                                    CAPTURE_ONLY:'CAPTURE_ONLY',
                                    SETTLE:'SETTLE',
                                    VOID:'VOID'       
                                }
                    }
    ,
    STATUS:{ERROR:'0',APPROVED:'1',REJECTED:'2',PENDING:'3'}
    };

var initClient=function(){
    if (!client){
        var wsdlOptions = {
  "overrideRootElement": {
    "namespace": "tns"}};
        var url = CONSTANTS.P2P_PARAMS.P2P_URL_WSDL;
        soap.createClient(url,wsdlOptions, function(err, pClient) {
        client=pClient;
        //console.log("Client :",client);
        console.log(client.describe());
      });
    }
    
}

initClient();

var createHash=function(seed){
    if(!seed){
        var date = new Date();
        seed = date.toISOString();
    }
    return sha1(seed+CONSTANTS.P2P_PARAMS.TRAN_KEY);
}

var createAuthObject=function(){
    var date = new Date();
    var seed = date.toISOString();
    return {login:CONSTANTS.P2P_PARAMS.LOGIN,
                        tranKey:createHash(seed),
                        seed: seed,
                        additional:[]};
}

/*
* Prepares the object to be send to the capture
* */
var createFormDataCaptOnly=function(token,customerIP,invoiceNum,amount,customer){

    return {x_version: '2.0',
            x_delim_data: 'TRUE',
            x_relay_response: 'FALSE',
            x_login: CONSTANTS.P2P_PARAMS.LOGIN,
            x_tran_key: CONSTANTS.P2P_PARAMS.TRAN_KEY,
            x_test_request: CONSTANTS.P2P_PARAMS.IS_DEV,
            x_type: CONSTANTS.P2P_PARAMS.TRN_TYPES.CAPTURE_ONLY,
            x_method: 'CC',
            x_customer_ip: customerIP,
            x_invoice_num: invoiceNum,
            x_amount: amount,
            x_tax: '0',
            x_amount_base: '0',
            x_token: token,
            //x_card_type: 'C',
            //cx_card_code: '123',
            x_differed: '1',
            x_cust_id: customer._id+'',
            x_first_name: customer.name+'',
            x_currency_code: 'COP',
            /*'x_additional_data[Destino]': '0',
            'x_additional_data[Ruta]': '0',
            'x_additional_data[Origen]': '0',
            'x_additional_data[Fecha de Salida]': '0',
            'x_additional_data[Fecha de Regreso]': '0',
            'x_additional_data[Escalas]': '0',
            'x_additional_data[Clase de Tarifa]': '0',
            'x_additional_data[Tipo de Ruta]': '0',
            'x_additional_data[Cabina]': '0',
            'x_additional_data[Promocional]': '0',
            'x_additional_data[# de Viajero Frecuente]': '0',
            'x_additional_data[Hora de Salida]': '0' */}   
};

/*
 * Prepares the object to be send to the settle transaction
 *
 * */
var createFormDataSettle=function(trnId,customerIP,franchise){
    return {x_version: '2.0',
        x_delim_data: 'TRUE',
        x_relay_response: 'FALSE',
        x_login: CONSTANTS.P2P_PARAMS.LOGIN,
        x_tran_key: CONSTANTS.P2P_PARAMS.TRAN_KEY,
        x_test_request: CONSTANTS.P2P_PARAMS.IS_DEV,
        x_type: CONSTANTS.P2P_PARAMS.TRN_TYPES.SETTLE,
        x_customer_ip: customerIP,
        x_franchise: franchise,
        x_parent_session: trnId,
    };
};

/*
 * Prepares the object to be send to the void transaction
 *
 * */
var createFormDataVoid=function(trnId,customerIP,franchise){
    return {x_version: '2.0',
        x_delim_data: 'TRUE',
        x_relay_response: 'FALSE',
        x_login: CONSTANTS.P2P_PARAMS.LOGIN,
        x_tran_key: CONSTANTS.P2P_PARAMS.TRAN_KEY,
        x_test_request: CONSTANTS.P2P_PARAMS.IS_DEV,
        x_type: CONSTANTS.P2P_PARAMS.TRN_TYPES.VOID,
        x_customer_ip: customerIP,
        x_franchise: franchise,
        x_parent_session: trnId,
    };
};

/*
Function that connects with Place 2 Pay in order to obtain a new token
*/
exports.createToken = function(user,card_number,cvv,exp_date,callback){
    if (client){

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

        var args = {auth:createAuthObject(),cardInfo:cardInfoParams,owner:personParams}                

        client.tokenizeCard(args, function(err, result, raw, soapHeader) {
            //console.log(" LR ",client.lastRequest );
            //console.log(" RSLT ",result);
            callback(err, result, raw, soapHeader);
      });
    }else{
         callback("SOAP client not initialized");
    }
};

/*

Function that connects with Place 2 Pay in order to remove an existing token

*/
exports.deleteToken = function(token,callback){				
    if (client){
        var args = {auth:createAuthObject(),token:token};
        client.invalidateToken(args, function(err, result, raw, soapHeader) {
            //console.log(" LR ",client.lastRequest );
            //console.log(" RSLT ",result);
            callback(err, result, raw, soapHeader);
      });
    }else{
         callback("SOAP client not initialized");
    }
};

/*
    Function that settle a previously CAPTURE trn using the capturePaymentUsingToken
*/
exports.settleTransaction = function(trnId,customerIP,franchise,callback){
    var formData=createFormDataSettle(trnId,customerIP,franchise);
    //console.log("Data to send ",formData);    
    var options = { method: 'POST',
        url: CONSTANTS.P2P_PARAMS.P2P_URL_FORM,
        headers: 
        {   //'postman-token': '15592359-7706-eb9c-ef2f-57f78eba273c',
            'cache-control': 'no-cache',
            'content-type': 'multipart/form-data; boundary=---011000010111000001101001' },
            formData: formData};

    request(options, function (error, response, body) {
        //console.log("ERROR ",error);
        console.log("BODY ",body.split(','));
        callback(error,body);
    });
};

/*
    Function that voids a previously CAPTURE trn using the capturePaymentUsingToken
*/
exports.voidTransaction = function(trnId,customerIP,franchise,callback){
    var formData=createFormDataVoid(trnId,customerIP,franchise);
    //console.log("Data to send ",formData);    
    var options = { method: 'POST',
        url: CONSTANTS.P2P_PARAMS.P2P_URL_FORM,
        headers: 
        {   //'postman-token': '15592359-7706-eb9c-ef2f-57f78eba273c',
            'cache-control': 'no-cache',
            'content-type': 'multipart/form-data; boundary=---011000010111000001101001' },
            formData: formData};

    request(options, function (error, response, body) {
        //console.log("ERROR ",error);
        console.log("BODY ",body.split(','));
        callback(error,body);
    });
};


/*
Fucntion that connects with P2P for making an CAPTURE_ONLY charge to the credit card associated
to a token
*/
exports.capturePaymentUsingToken=function(token,customerIP,invoiceNum,amount,customer,callback){
    var formData=createFormDataCaptOnly(token,customerIP,invoiceNum,amount,customer);
    //console.log("Data to send ",formData);    
    var options = { method: 'POST',
        url: CONSTANTS.P2P_PARAMS.P2P_URL_FORM,
        headers: 
        {   //'postman-token': '15592359-7706-eb9c-ef2f-57f78eba273c',
            'cache-control': 'no-cache',
            'content-type': 'multipart/form-data; boundary=---011000010111000001101001' },
            formData: formData};

    request(options, function (error, response, body) {
        console.log("BODY ",body.split(','));
        callback(error,body.split(','));
    });
};

/*
* Returns the list of possible values for the P2P response
*
* */
exports.getStatusList=function(){
    return CONSTANTS.STATUS;
};

/*
 * Returns the list of possible values for the P2P response
 *
 * */
exports.getTrnTypes=function(){
    return CONSTANTS.P2P_PARAMS.TRN_TYPES;
};

/*
* Resolves the status name according to a value
*
* */
exports.getStatusText=function(statusId){
    if (CONSTANTS.STATUS.APPROVED===statusId){
        return "Aprobada";
    }
    if (CONSTANTS.STATUS.PENDING===statusId){
        return "Pendiente";
    }
    if (CONSTANTS.STATUS.ERROR===statusId){
        return "Error";
    }
    if (CONSTANTS.STATUS.REJECTED===statusId){
        return "Rechazada";
    }
    return "";
};

/**
 * Generates a random invoice number to be send to P2P
 * 
 * */
exports.generateRandomInvoiceNumber = function(){
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 8; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
};


/*
*
* Determines the Franchise of Card
* */
exports.getFranchiseByBIN = function (number){
    var franchise="NA";
    //VISA
    var re = new RegExp("^4");
    if (number.match(re) != null)
        franchise= "VISA";

    // Mastercard
    re = new RegExp("^5[1-5]");
    if (number.match(re) != null)
        franchise= "MASTERCARD";

    // AMEX
    re = new RegExp("^3[47]");
    if (number.match(re) != null)
        franchise= "AMEX";

    re = new RegExp("^36");
    if (number.match(re) != null)
        franchise= "DINERS";

    // Visa Electron
    re = new RegExp("^(4026|417500|4508|4844|491(3|7))");
    if (number.match(re) != null)
        franchise=  "VE";

    // Discover
    /*re = new RegExp("^(6011|622(12[6-9]|1[3-9][0-9]|[2-8][0-9]{2}|9[0-1][0-9]|92[0-5]|64[4-9])|65)");
    if (number.match(re) != null)
        franchise= "DISCOVER";*/

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