var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , admin = require('./routes/admin')
  , http = require('http')
  , https = require('https')
  , path = require('path')
  , model = require('./classes/model')
  , mail = require('./classes/mail_sender')
  , authentication = require('./classes/authentication')
  ,	security = require('./classes/security');
var app = express();

var testing = true;
var fs = require('fs');
if (!testing){
  var privateKey  = fs.readFileSync('/etc/letsencrypt/live/vueltap.com/privkey.pem', 'utf8');
  var certificate = fs.readFileSync('/etc/letsencrypt/live/vueltap.com/fullchain.pem', 'utf8');
  var ca = fs.readFileSync('/etc/letsencrypt/live/vueltap.com/chain.pem', 'utf8');
  var credentials = {key: privateKey, cert: certificate, ca:ca};
}

// all environments

var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type , Authorization, Content-Length, X-Requested-With, type, token');
    if ('OPTIONS' == req.method) {
      res.send(200);
    }
    else{
	  next();  
    }
};

app.set('port', process.env.PORT || 8080);
app.set('s-port', process.env.PORT || 8080);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.set('view options', { pretty: false });
app.use(allowCrossDomain);
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}
app.get('/*', function(req, res, next){ 
  res.setHeader('Last-Modified', (new Date()).toUTCString());
  next(); 
});

//Public Methods
app.get('/api_1.0/CloseToMe/:lat/:lon', model.closeToMe);
app.get('/api_1.0/GetInsuranceIntervals', model.getInsuranceIntervals);
app.get('/api_1.0/GetPrice/:loc1/:loc2/:insurancevalue?', model.getPrice);
app.get('/api_1.0/GetDisclaimerPDF/:disclaimer_type', model.getDisclarimerPDF);

//Middleware to encode password
app.post('/api_1.0/User/Create', security.passwordEncrypt);
app.post('/api_1.0/Messenger/Create', security.passwordEncrypt);
//app.post('/api_1.0/User/NewPassword/*', security.passwordEncrypt);
app.post('/api_1.0/User/NewPassword/*', security.passwordEncrypt);
app.post('/api_1.0/Messenger/NewPassword/*', security.passwordEncrypt);

//////////////////////////////

//Account Verifications
app.get('/api_1.0/Account/Verify/:type/:emailb64/:encodedb64email', model.verifyAccount);
app.post('/api_1.0/Account/SendEmailVerification/:type/:emailb64', model.sendEmailVerification);
///////////////////////

app.get('/api_1.0/Password/Redirect/:type/:email/:request/:token', model.passwordRedirect);

//User Recover Password
app.put('/api_1.0/User/NewPassword/:token', model.newPasswordUser);
app.get('/api_1.0/User/Recover/:user_email', model.requestRecoverUser);

//User Recover Password
app.get('/api_1.0/Messenger/Recover/:email', model.requestRecoverMessenger);
app.put('/api_1.0/Messenger/NewPassword/:token', model.newPasswordMessenger);

//Verify
//app.all('/api_1.0/*', authentication.verifyHeader);

//Login
//app.post('/api_1.0/Login', model.adminLogin);

///////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////
//User Create API
app.post('/api_1.0/User/Create', model.createUser);
//User Authenticate
app.put('/api_1.0/User/Login', model.authenticateUser);
//Messenger Authenticate
app.put('/api_1.0/Messenger/Login', model.authenticateMessenger);
//Messenger Create APIs
app.post('/api_1.0/Messenger/Create', model.createMessenger);
app.put('/api_1.0/Messenger/File/:messenger_id', model.addFile);

//Session
app.all('/api_1.0/*', model.verifySession);
//User Read APIs
app.get('/api_1.0/User/Email/:email', model.getUserByEmail);
app.get('/api_1.0/User/:user_id', model.getUserByID);
app.get('/api_1.0/Users/:sort?', model.getAllUsers);
app.get('/api_1.0/User/Favorites/:user_id', model.getFavorites);
//User Deliveries Read APIs
app.get('/api_1.0/User/StartedDeliveries/:user_id', model.startedDeliveries);
app.get('/api_1.0/User/RequestedDeliveries/:user_id', model.requestedDeliveries);
app.get('/api_1.0/User/FinishedDeliveries/:user_id/:sort?', model.finishedDeliveries);
//User Update APIs
app.put('/api_1.0/User/Update/:user_id', model.updateUser);
//User Delete APIs
app.delete('/api_1.0/User/:user_id', model.deleteUser);
//Change Password
app.put('/api_1.0/User/Password/:user_id', model.changePasswordUser);

//Invite
app.put('/api_1.0/User/Invite', model.userInvite);
//Fav Messenger
app.put('/api_1.0/User/Fav/:user_id', model.favMessenger);
//UnFav Messenger
app.put('/api_1.0/User/UnFav/:user_id', model.unFavMessenger);
///////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////

//User Read APIs
app.get('/api_1.0/Messenger/Email/:email', model.getMessengerByEmail);
app.get('/api_1.0/Messenger/:messenger_id', model.getMessengerByID);
app.get('/api_1.0/Messengers/:sort?', model.getAllMessengers);

//User Update APIs
app.put('/api_1.0/Messenger/Update/:messenger_id', model.updateMessenger);
app.put('/api_1.0/Messenger/AddPic/:messenger_id', model.updateProfilePic);
//User Delete APIs
app.delete('/api_1.0/Messenger/:messenger_id', model.deleteMessenger);
//Change Password
app.put('/api_1.0/Messenger/Password/:messenger_id', model.changePasswordMessenger);
//Invite
app.put('/api_1.0/Messenger/Invite', model.messengerInvite);
///////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////
//DeliveryItem Create APIs
app.post('/api_1.0/DeliveryItem/Create', model.createDelivery);
//DeliveryItem Read APIs
app.get('/api_1.0/DeliveryItem/:delivery_id', model.getDeliveryItemByID);
app.get('/api_1.0/DeliveryItem/UserActive/:user_id/:sort?', model.getUserActive);
app.get('/api_1.0/DeliveryItem/UserFinished/:user_id/:sort?', model.getUserFinished);
app.get('/api_1.0/DeliveryItem/UserAborted/:user_id/:sort?', model.getUserAborted);
app.get('/api_1.0/DeliveryItems/Near/:lat/:lon/:maxDistance/:messenger_id/:sort?', model.getNearDeliveryItems);
app.get('/api_1.0/DeliveryItems/:sort?', model.getAllDeliveryItems);
app.get('/api_1.0/DeliveryItems/:status/:sort?', model.getAllDeliveryItemsByStatus);
app.get('/api_1.0/DeliveryItems/OverallStatus/:overall_status/:messenger_id/:sort?', model.getByOverallStatus);
app.get('/api_1.0/Count/DeliveryItems/:status?', model.getCountWithStatus);

//DeliveryItem Update APIs
app.put('/api_1.0/DeliveryItem/AddPic/:delivery_id', model.addPicToDeliveryItem);
app.put('/api_1.0/DeliveryItem/AddSignature/:delivery_id', model.addSignatureToDeliveryItem);
//DeliveryItem Messenger Status Updates APIs
app.put('/api_1.0/DeliveryItem/ChangeStatus/Accept/:delivery_id', model.changeStatusAccept);
app.put('/api_1.0/DeliveryItem/ChangeStatus/InTransit/:delivery_id', model.changeStatusInTransit);
app.put('/api_1.0/DeliveryItem/ChangeStatus/Delivered/:delivery_id', model.changeStatusDelivered);
app.put('/api_1.0/DeliveryItem/ChangeStatus/Returning/:delivery_id', model.changeStatusReturning);
app.put('/api_1.0/DeliveryItem/ChangeStatus/Returned/:delivery_id', model.changeStatusReturned);
app.put('/api_1.0/DeliveryItem/ChangeStatus/Status/:status/:delivery_id', model.changeStatus);

//Experiment
app.put('/api_1.0/DeliveryItem/NextStatus/:delivery_id', model.nextStatus);
app.put('/api_1.0/DeliveryItem/LastStatus/:delivery_id', model.lastStatus);
////////////
app.put('/api_1.0/DeliveryItem/Abort/:delivery_id', model.abortDeliveryItem);
app.put('/api_1.0/DeliveryItem/Restart/:delivery_id', model.restartDeliveryItem);
//DeliveryItem Delete APIs
app.delete('/api_1.0/DeliveryItem/Delete/:delivery_id/:user_id', model.deleteDeliveryItem);
//Rate
app.put('/api_1.0/DeliveryItem/Rate/:delivery_id', model.rateDeliveryItem);

//Logout
app.put('/api_1.0/Messenger/Logout/:messenger_id', model.logoutMessenger);
app.put('/api_1.0/User/Logout/:user_id', model.logoutUser);
///////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////


///////////////////////////////////////////////////////////////////
/////////                 Payments                     ////////////
///////////////////////////////////////////////////////////////////

app.get('/api_1.0/Payments/PaymentMethods/:user_id', model.getPaymentMethodsByUser);
app.post('/api_1.0/Payments/CreatePaymentMethod', model.createPaymentMethod);
app.delete('/api_1.0/Payments/DeletePaymentMethod/:pmt_method_id', model.deletePaymentMethod);
app.get('/api_1.0/Payments/GetFranchiseByBIN/:bin', model.getFranchiseByBIN);
app.get('/api_1.0/Payments/PaymentHistoryByUser/:user_id', model.getPaymentHistoryByUser);


///////////////////////////////////////////////////////////////////
/////////                END PAYMENTS                   ///////////
///////////////////////////////////////////////////////////////////

app.put('/api_1.0/Admin/ActivateMessenger/:messenger_id', model.activateMessenger);
app.put('/api_1.0/Admin/DeactivateMessenger/:messenger_id', model.deactivateMessenger);


//Create APIs
app.post('/api_1.0/CreateAdmin', model.createAdmin);

//Update APIs
app.post('/api_1.0/Admin/UpdateAdmin', model.updateAdmin);

//Delete APIs
app.get('/api_1.0/DeleteAdmin/:admin_id/:super_admin_id', model.deleteAdmin);

//Mobile APIs

if(testing){
    http.createServer(app).listen(app.get('port'), function(){
	console.log('Http Express server listening on port ' + app.get('port'));
    });
}
else{
    https.createServer(credentials, app).listen(app.get('s-port'), function(){
	console.log('Https Express server listening on port ' + app.get('s-port'));
    });
}
