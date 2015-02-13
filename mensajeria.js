var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , admin = require('./routes/admin')
  , http = require('http')
  , path = require('path')
  , model = require('./classes/model')
  , mail = require('./classes/mail_sender')
  , authentication = require('./classes/authentication')
  ,	security = require('./classes/security');
var app = express();
// all environments

var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type , Authorization, Content-Length, X-Requested-With');
    if ('OPTIONS' == req.method) {
      res.send(200);
    }
    else{
	  next();  
    }
}

app.set('port', process.env.PORT || 2000);
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

//Middleware to encode password
app.post('/api_1.0/User/Create', security.passwordEncrypt);
app.post('/api_1.0/Messenger/Create', security.passwordEncrypt);
app.post('/api_1.0/User/NewPassword/*', security.passwordEncrypt);
app.post('/api_1.0/Messenger/NewPassword/*', security.passwordEncrypt);

//////////////////////////////

//Account Verifications
app.get('/api_1.0/Account/Verify/:type/:emailb64/:encodedb64email', model.verifyAccount);
app.post('/api_1.0/Account/SendEmailVerification/:type/:emailb64', model.sendEmailVerification);
///////////////////////

app.get('/api_1.0/Password/Redirect/:type/:email/:request/:token', model.passwordRedirect);

//Verify
//app.all('/api_1.0/*', authentication.verifyHeader);

//Login
//app.post('/api_1.0/Login', model.adminLogin);

///////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////
//User Create API
app.post('/api_1.0/User/Create', model.createUser);
//User Read APIs
app.get('/api_1.0/User/Email/:email', model.getUserByEmail);
app.get('/api_1.0/User/:user_id', model.getUserByID);
app.get('/api_1.0/Users', model.getAllUsers);
app.get('/api_1.0/User/Favorites/:user_id', model.getFavorites);
//User Deliveries Read APIs
app.get('/api_1.0/User/StartedDeliveries/:user_id', model.startedDeliveries);
app.get('/api_1.0/User/RequestedDeliveries/:user_id', model.requestedDeliveries);
app.get('/api_1.0/User/FinishedDeliveries/:user_id', model.finishedDeliveries);
//User Authenticate
app.put('/api_1.0/User/Login', model.authenticateUser);
//User Update APIs
app.put('/api_1.0/User/Update/:user_id', model.updateUser);
//User Delete APIs
app.delete('/api_1.0/User/:user_id', model.deleteUser);
//Change Password
app.put('/api_1.0/User/Password/:user_id', model.changePasswordUser);
//User Recover Password
app.get('/api_1.0/User/Recover/:email', model.requestRecoverUser);
app.put('/api_1.0/User/NewPassword/:token', model.newPasswordUser);
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
//Messenger Create APIs
app.post('/api_1.0/Messenger/Create', model.createMessenger);
//User Read APIs
app.get('/api_1.0/Messenger/Email/:email', model.getMessengerByEmail);
app.get('/api_1.0/Messenger/:messenger_id', model.getMessengerByID);
app.get('/api_1.0/Messengers', model.getAllMessengers);
//User Authenticate
app.put('/api_1.0/Messenger/Login', model.authenticateMessenger);
//User Update APIs
app.put('/api_1.0/Messenger/Update/:messenger_id', model.updateMessenger);
//User Delete APIs
app.delete('/api_1.0/Messenger/:messenger_id', model.deleteMessenger);
//Change Password
app.put('/api_1.0/Messenger/Password/:messenger_id', model.changePasswordMessenger);
//User Recover Password
app.get('/api_1.0/Messenger/Recover/:email', model.requestRecoverMessenger);
app.put('/api_1.0/Messenger/NewPassword/:token', model.newPasswordMessenger);
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
app.get('/api_1.0/DeliveryItems/Near/:lat/:lon/:maxDistance/:sort?', model.getNearDeliveryItems);
app.get('/api_1.0/DeliveryItems/:sort?', model.getAllDeliveryItems);
app.get('/api_1.0/DeliveryItems/OverallStatus/:overall_status/:messenger_id/:sort?', model.getByOverallStatus);
//DeliveryItem Update APIs
app.put('/api_1.0/DeliveryItem/AddPic/:delivery_id', model.addPicToDeliveryItem);
//DeliveryItem Messenger Only Update APIs
app.put('/api_1.0/DeliveryItem/Accept/:delivery_id', model.acceptDeliveryItem);
app.put('/api_1.0/DeliveryItem/InTransit/:delivery_id', model.inTransitDeliveryItem);
app.put('/api_1.0/DeliveryItem/Deliver/:delivery_id', model.deliverDeliveryItem);
//Experiment
app.put('/api_1.0/DeliveryItem/NextStatus/:delivery_id', model.nextStatus);
////////////
app.put('/api_1.0/DeliveryItem/Abort/:delivery_id', model.abortDeliveryItem);
//DeliveryItem Delete APIs
app.delete('/api_1.0/DeliveryItem/Delete/:delivery_id/:user_id', model.deleteDeliveryItem);
///////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////


//Create APIs
app.post('/api_1.0/CreateAdmin', model.createAdmin);

//Update APIs
app.post('/api_1.0/Admin/UpdateAdmin', model.updateAdmin);

//Delete APIs
app.get('/api_1.0/DeleteAdmin/:admin_id/:super_admin_id', model.deleteAdmin);

//Mobile APIs

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});