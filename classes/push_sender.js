var apn = require ('apn');
var gcm = require('node-gcm');

var CONSTANTS = {
	OS : {
		IOS : 'iOS',
		ANDROID : 'android'	
	}	
};

exports.send = function (notification){
	var development = false;
	var certificate = notification.cert;
	var key = notification.key;
	
	var iosPushOptions = {
		extension :  '',
		carpeta : '',
		url : '',
		cert : '',
		key : '',
		tokens_array : [],
		service : '',
	};
	
	if(notification.os === CONSTANTS.OS.IOS){
		iosPushOptions.extension = ".pem";
		iosPushOptions.carpeta = development ? "push_certs/dev/":"push_certs/prod/";
		iosPushOptions.url = development ? 'gateway.sandbox.push.apple.com':'gateway.push.apple.com';
		iosPushOptions.cert = iosPushOptions.carpeta+certificate+iosPushOptions.extension;
		iosPushOptions.key =  iosPushOptions.carpeta+key+iosPushOptions.extension;

		service = new apn.connection({ 
										gateway:iosPushOptions.url, 
										cert:iosPushOptions.cert, 
										key:iosPushOptions.key
									});
	
		service.on('connected', function() {console.log("Connected");});
		service.on('transmitted', function(notification, device) {
			console.log("Notification transmitted to:" + device.token.toString('hex'));
		});
		service.on('transmissionError', function(errCode, notification, device) {
		    console.error("Notification caused error: " + errCode + " for device ", device, notification);
		});
		service.on('timeout', function () {console.log("Connection Timeout");});
		service.on('disconnected', function() {console.log("Disconnected from APNS");});
		service.on('socketError', console.error);								
		
		pushToManyIOS = function() {
		    var note = new apn.notification();
		    note.expiry = Math.floor(Date.now() / 10000) + 3600; // Expires 1 hour from now.
			note.badge = 1;
			note.sound = "ping.aiff";
			note.alert = notification.message;
			note.payload = notification.payload;
		    service.pushNotification(note, notification.token);
		}
		pushToManyIOS();
	}				
	else if(notification.os === CONSTANTS.OS.ANDROID){
		var message = new gcm.Message({
		    collapseKey: 'demo',
		    delayWhileIdle: true,
		    timeToLive: 3,
		    data: {
		        key1: 'message1',
		        key2: 'message2'
		    }
		});
		
		var sender = new gcm.Sender(notification.gcmkey);
		var registrationIds = [];
		
		// OPTIONAL
		// add new key-value in data object
		//message.addDataWithKeyValue('key1','message1');
		//message.addDataWithKeyValue('key2','message2');
		
		// or add a data object
		message.addDataWithObject({
		    message : notification.message,
		    payload : notification.payload
		});
		
		message.collapseKey = 'demo';
		message.delayWhileIdle = true;
		message.timeToLive = 3;
		// END OPTION
		
		// At least one required
		registrationIds.push(notification.token);		
		/**
		 * Params: message-literal, registrationIds-array, No. of retries, callback-function
		 **/
		sender.send(message, registrationIds, 4, function (err, result) {
		    console.log(result);
		});
	}
};


