//////////////////////////////////
//Dependencies////////////////////
//////////////////////////////////
var mongoose = require('mongoose');
var apn = require('apn');
var push = require('../classes/push_sender');
var utils = require('../classes/utils');
var mail = require('../classes/mail_sender');
var mail_template = require('../classes/mail_templates');
var fs = require('fs');
var express = require('express');
var authentication = require('../classes/authentication');
var payments = require('../classes/payments');
var knox = require('knox');
var gcm = require('node-gcm');
var	security = require('../classes/security');
var colors = require('colors');
var distance = require('google-distance');
var imageUtilities = require('../classes/uploader');

//////////////////////////////////
//End of Dependencies/////////////
//////////////////////////////////

//////////////////////////////////
//MongoDB Connection /////////////
//////////////////////////////////
//test Iam studio
mongoose.connect("mongodb://vueltap:vueltap123@ds015909.mlab.com:15909/vueltap");
//Test Vueltap
//mongoose.connect("mongodb://iAmUser:iAmStudio1@ds015942.mlab.com:15942/vueltap-dev");
//////////////////////////////////
//End of MongoDB Connection///////
//////////////////////////////////

//////////////////////////////////
//Global Vars/////////////////////
//////////////////////////////////

//Producción
//var hostname = "vueltap.com:8080";
//var webapp = "https://vueltap.com"
//var webRootFolder = "/"
//Dev
var hostname = "192.241.187.135:2000";
var webapp = "http://192.185.136.242"
var webRootFolder = "/~julian/vueltap/"

var exclude = {/*password:*/};
var verifyEmailVar = true;
var CONSTANTS = {
	DISCLAIMER_USER_PATH:webapp+webRootFolder+'assets/pdf/TermsUsuario.pdf',
	DISCLAIMER_MESSENGER_PATH:webapp+webRootFolder+'assets/pdf/TermsMensajero.pdf',
	P2P: {STATUS:{ERROR:'0',APPROVED:'1',REJECTED:'2',PENDING:'3'}},
	STATUS : {
		SYSTEM : {
			AVAILABLE : 'available',
			ACCEPTED : 'accepted',
			INTRANSIT : 'in-transit',
			DELIVERED : 'delivered',
			RETURNING : 'returning',
			RETURNED : 'returned',
			CANCELLED : 'cancelled',
			ABORTED : 'aborted'
		},
		USER : {
			AVAILABLE : 'Disponible',
			ACCEPTED : 'Aceptado',
			INTRANSIT : 'En Tránsito',
			DELIVERED : 'Entregado',
			RETURNING : 'Regresando',
			RETURNED : 'Regresado',
			CANCELLED : 'Cancelado',
			ABORTED : 'Rechazado'
		}
	},
	OVERALLSTATUS : {
		REQUESTED : 'requested',
		STARTED : 'started',
		FINISHED : 'finished',
		ABORTED : 'aborted'
	},
	OS : {
		IOS : 'iOS',
		ANDROID : 'android'
	},
	GCM : {
		APIKEY : {
			USER : 'AIzaSyAU632zAjuf8UaRLYRG6B5LpOUKhKr2Sx4',
			MESSENGER : 'AIzaSyD_sfXqbP8vFsuMu7wTUeqDgqvl3cWXesM'
		}
	},
	APNS : {
		CERT : 'cert',
		KEY : 'key'
	},
	PMNT_METHODS : {
		CASH : 'cash',
		CREDIT : 'credit'
	},
	ERROR: {
		BADAUTH : 'a1',
		SESSIONEXPIRED : 'a2',
		FORBBIDEN : 'a3'
	}
};
var limitForSort = 20;


//////////////////////////////////
//End of Global Vars//////////////
//////////////////////////////////

//////////////////////////////////
//SubDocumentSchema///////////////
//////////////////////////////////
var Device = new mongoose.Schema({type:String, os:String, token:String, name:String}, {_id:false});
//////////////////////////////////
//End SubDocumentSchema///////////
//////////////////////////////////

//////////////////////////////////
//Admin Schema////////////////////
//////////////////////////////////
var AdminSchema= new mongoose.Schema({
	name: {type: String, required: true,unique: false,},
	email: {type: String, required: true,unique: true,},
	password: {type: String, required: true,unique: false,},
	type: {type: String, required: true,unique: false,},
	role:{type: String, required: true,unique: false,},
}),
	Admin= mongoose.model('Admin',AdminSchema);
//////////////////////////////////
//End of Admin Schema/////////////
//////////////////////////////////

//////////////////////////////////
//User Schema/////////////////////
//////////////////////////////////
var UserSchema= new mongoose.Schema({
	email : {type: String, required:true, unique:true,},
	password : {type: String, required:true},
	password_recover : {status: {type: Boolean}, token:{type:String}},
	email_confirmation : {type: Boolean, required:true},
	name : {type: String, required:true},
	lastname : {type: String, required:true},
	mobilephone: {type: Number, required: true},
	city: {type: String, required: false},
	device : {type: Object, required:false},
	favorites : {type: Array, required:false},
	stats : {type: Object, required:false},
	session: {
		token: {type: String, required: false},
		exp_date: {type: Date, required: false},
	}
}),
	User= mongoose.model('User',UserSchema);
//////////////////////////////////
//End of User Schema//////////////
//////////////////////////////////

//////////////////////////////////
//Messenger Schema///////////////////
//////////////////////////////////
var MessengerSchema= new mongoose.Schema({
	email : {type: String, required:true, unique:true,},
	password : {type: String, required:true},
	password_recover : {status: {type: Boolean}, token:{type:String}},
	email_confirmation : {type: Boolean, required:true},
	admin_confirmation : {type: Boolean, required:false},
	name : {type: String, required:true},
	lastname : {type: String, required:false},
	mobilephone : {type: String, required:true},
	identification : {type: String, required:false},
	city : {type: String, required:false},
	plate : {type: String, required:false},
	device : {type: [Device], required:false},
	favorites : {type: Array, required:false},
	total_reviews : {type: Number, required:false},
	total_rating : {type: Number, required:false},
	rating_average : {type: Number, required:false},
	profile_pic : {type: Object, required:false},
	stats : {type: Object, required:false},
	documents : {type: Object, required:false},
	session: {
		token: {type: String, required: false},
		exp_date: {type: Date, required: false},
	}
});
	Messenger= mongoose.model('Messenger',MessengerSchema);
//////////////////////////////////
//End of Doctor Schema////////////
//////////////////////////////////

//////////////////////////////////
//DeliveryItem Schema//////////////
//////////////////////////////////
var DeliveryItemSchema= new mongoose.Schema({
	user_id : {type: String, required:true},
	user_info: {type: Object, required:false},
	messenger_id: {type: String, required:false},
	messenger_info: {type: Object, required:false},
	messenger_comments: {type: String, required:false},
	abort_reason: String,
	item_name : {type: String, required:false},
	pickup_location : {type: {type: String}, 'coordinates':{type:[Number]}},
	pickup_details : String,
	pickup_object: {type: Object, required:true},
	delivery_location : {type: {type: String}, 'coordinates':{type:[Number]}},	
	delivery_details : String,
	delivery_object: {type: Object, required:true},
	roundtrip: {type: Boolean, required:false},
	send_image: {type: Boolean, required:false},
	send_signature: {type: Boolean, required:false},
	signature_object: {type: Object, required:false},
	insurance: {type: Boolean, required:false},
	insurancevalue: {type: Number, required:false},
	instructions : {type: String, required:true},
	priority: {type: Number, required:false},
	deadline: {type: Date, required:false},
	time_to_pickup: {type: String, required:false},
	time_to_deliver: {type: String, required:false},
	date_created: {type: Date},
	declared_value : {type: Number, required:false},
	price_to_pay : {type: Number, required:false},
	payment_method : {type: String, required:false}, //credit , cash
	payment_token_id : {type: String, required:false},
	trn_ids :[{type: mongoose.Schema.Types.ObjectId, ref: 'PlaceToPayTrn',required:false}], //stores the transaction id sent by p2p
	overall_status : {type: String, required:true}, //requested,started, finished
	status : {type: String, required:true}, //available, accepted, in-transit, delivered, returning, returned, aborted
	pickup_time : {type: Date, required:false},
	estimated : {type: Date, required:false},
	images: {type: Array, required:false},
	rated : {type: Boolean, required:false},
	rate_object : {type: Object, required:false},
});
	DeliveryItemSchema.index({ "pickup_location" : "2dsphere"});
	DeliveryItemSchema.index({ "delivery_location" : "2dsphere"});
	var DeliveryItem= mongoose.model('DeliveryItem',DeliveryItemSchema);
//////////////////////////////////
//End of Appointment  Schema//////
//////////////////////////////////

//////////////////////////////////
//Image Schema////////////////////
//////////////////////////////////
var ImageSchema= new mongoose.Schema({
	name:{type: String, required: false,unique: false,},
	messenger_id: {type: String, required: false,unique: false,},
	delivery_status:{type: String, required: false},
	delivery_name:{type: String, required: false},
	size:{type: Number, required:false, unique:false,},
	url:{type: String, required: false,unique: false,},
	date_created : {type: Date},
	owner: {type: String, required: false,unique: false,},
	owner_id:{type: String, required: false,unique: false,},
}),
	Image= mongoose.model('Image',ImageSchema);
//////////////////////////////////
//End of Image Schema/////////////
//////////////////////////////////


//////////////////////////////////
//File Schema/////////////////////
//////////////////////////////////
var FileSchema= new mongoose.Schema({
	name:{type: String, required: false,unique: false,},
	type:{type: String, required: false,unique: false,},
	owner: {type: String, required: false,unique: false,},
	size: Number,
	url:{type: String, required: false,unique: false,},
	local_path: String,
	file_type:{type: String, required: false},
	date_created : {type: Date},
}),
	File= mongoose.model('File',FileSchema);
//////////////////////////////////
//End of Image Schema/////////////
//////////////////////////////////


//////////////////////////////////
//PaymentToken Schema/////////////
//////////////////////////////////
var PaymentTokenSchema= new mongoose.Schema({
	token : {type: String, required:true,unique: true,},
	user_id : {type: String, required:true},
	card_last4:{type: String, required: true,unique: false,},
	franchise: {type: String, required: true,unique: false,},
	date_created : {type: Date},
	valid_until : {type: Date},
}),
	PaymentToken= mongoose.model('PaymentToken',PaymentTokenSchema);
//////////////////////////////////
//End of PaymentToken Schema//////
//////////////////////////////////

//////////////////////////////////
//SubDocumentSchema///////////////
//////////////////////////////////
var PlaceToPayTrnSchema = new mongoose.Schema({user_id : {type: String, required:true},p2p_trn_id:String, p2p_response:String, date_sent:String, status:String,ip_address:String,is_capture:Boolean});
PlaceToPayTrn= mongoose.model('PlaceToPayTrn',PlaceToPayTrnSchema);
//////////////////////////////////
//End SubDocumentSchema///////////
//////////////////////////////////


//Development AMAZON BUCKET
/*var client = knox.createClient({
    key: 'AKIAIERCR4POCARGBWHA'
  , secret: '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'
  , bucket: 'mensajeria'
});*/

//Production AMAZON BUCKET
var client = knox.createClient({
    key: 'AKIAJH4B7FYHA7UXYJTQ'
  , secret: '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'
  , bucket: 'vueltap'
});

//Session

exports.verifySession = function(req,res,next){
    req.info = {};
	var type = req.headers.type;
	//console.log("Veryfing header");
	//console.log("expired: "+JSON.stringify(req.headers.expired));
	//console.log("type: "+JSON.stringify(req.headers.type));
	if(req.headers.expired){
		 res.json({status: true, response: "Session expired", error: CONSTANTS.ERROR.SESSIONEXPIRED});
	}
	if(type == "admin"){
		req.info.type = "admin";
		next();
	}
	else if(type == "user"){

		authentication.go(req,res,next,User,type);
	}
	else if(type == "messenger"){
		authentication.go(req,res,next,Messenger,type);
	}
	else{
		res.json({status: false, response: "Header missing."});
	}
};
//

//////////////////////////////////
//Admin CRUD starts here//////////
//////////////////////////////////
//Create
exports.createAdmin = function(req,res){
	new Admin({
		name:req.body.name,
		email:req.body.email,
		password:req.body.password,
		type: 'admin',
		role: 'admin'
	}).save(function(err,admin){
		if(err){
			res.json(err);
		}
		else{
			res.json({status: true, response: admin});
		}
	});
};
//Read One
exports.getAdmin = function(req,res){
	Admin.findOne({_id:req.params._id},function(err,admin){
		if(err){
			res.json({status: false, error: "not found"});
		}
		else{
			res.json({status: true, response: admin});
		}
	});
};
//Read All
exports.getAdminList = function(req,res){
	Admin.find({},function(err,admins){
		if(admins.length<=0){
			res.json({status: false, error: "not found"});
		}
		else{
			res.json({status:true, response:admins});
		}
	});
};
//Update
exports.updateAdmin = function(req,res){
	Admin.findOneAndUpdate({_id:req.body.admin_id},
	   {$set:{name:req.body.name,
	   		  email:req.body.email,
	   		  password:req.body.password,
	   		  //app_id_list:req.body.app_id_list,
	   		  }
	   	}, 
	   	function(err,admin){
	   	if(!admin){
		   	res.json({status: false, error: "not found"});
	   	}
	   	else{
		   	res.json({status:true, response:admin});
	   	}
		
	});
};
//Delete
exports.deleteAdmin = function(req,res){
	Admin.remove({_id:req.params.admin_id},function(err){
		if(err){
			res.json(error.notFound);
		}
		else{
			res.format({
				html: function () { res.redirect('/Dashboard/'+req.params.super_admin_id); },
				json: function () { res.send(admin); },
			});
		}
	});
};
//////////////////////////////////
//End of Admin CRUD///////////////
//////////////////////////////////

//////////////////////////////////
//User CRUD starts here//////////
//////////////////////////////////
//Create*
exports.createUser = function(req,res){
	//Esta función crea un usuario nuevo a partir de una peticion POST
	var device_array = [];
	
	//Revisamos la información que llega y la parseamos en un formato json conocido
	if(req.body.device_info){
		req.body.device_info = utils.isJson(req.body.device_info) ? JSON.parse(req.body.device_info): req.body.device_info ;
		device_array.push(req.body.device_info);
	}

	//Procedemos a crear el usuario en la base de datos con la información que llega en el POST
	utils.log("User/Create","Recibo:",JSON.stringify(req.body));
	new User({
		email : req.body.email,
		//El estado inicial de confirmación email debe ser false
		//Este se trabaja con una variable global al principio de este documento
		email_confirmation : verifyEmailVar,
		//////////////////////////////////////
		//////////////////////////////////////
		password : req.body.password,
		name : req.body.name,
		lastname : req.body.lastname,
		mobilephone : req.body.mobilephone,
		city : req.body.city,
		date_created: new Date(),
		device: {},
	}).save(function(err,object){
		if(err){
			res.json({status: false, message: "Error al crear la cuenta.", err: err});
		}
		else{
			//Una vez creado el documento en la base de datos procedemos a enviar un email
			//de confirmación
			//emailVerification(req,object,'user');
			utils.log("User","Envío:",JSON.stringify(object));
			res.json({status: true, message: "Usuario creado exitosamente. Proceder a activar la cuenta.", response: object});
		}
	});
};
//Read One*
exports.getUserByEmail = function(req,res){
	//Esta función expone un servicio para buscar un usuario por email
	User.findOne({email:req.params.email},exclude,function(err,object){
		if(!object){
			res.json({status: false, error: "not found"});
		}
		else{
			res.json({status: true, response: object});
		}
	});
};
exports.getUserByID = function(req,res){
	//Esta función expone un servicio para buscar un usuario por id
	User.findOne({_id:req.params.user_id},exclude,function(err,object){
		if(!object){
			res.json({status: false, error: "not found"});
		}
		else{
			res.json({status: true, response: object});
		}
	});
};
//Login*
exports.authenticateUser = function(req,res){
//Esta función permite verificar la autenticidad del usuario por medio de un mail y un password
//Además de esto, si el usuario está en la versión móvil, nos permite capturar información 
//importante sobre su dispositivo
	var today = new Date();
	var twoWeeks = new Date(today.getFullYear(), today.getMonth(), today.getDate()+14);
/*Log*/utils.log("User/Login","Recibo:",JSON.stringify(req.body));
	//Buscamos inicialmente que la cuenta del usuario exista
	User.findOne({email:req.body.email},exclude,function(err,user){
		if(!user){
			//No existe
			res.json({status: false, error: "not found", error_id:0});
		}
		else{
			//Verificamos que el hash guardado en password sea igual al password de entrada
			if(security.compareHash(req.body.password, user.password)){
				//Acá se verifica si llega device info, y se agrega al device list del usuario
				//En este punto ya se encuentra autenticado el usuario, las respuestas siempre serán positivas
				if(req.body.device_info){
					//En caso que recibamos información sobre el dispositivo
					//procedemos a parsear esta información en un formato json conocido
					/*Log*/utils.log("User/Login","Envío:",JSON.stringify(user));
					req.body.device_info = utils.isJson(req.body.device_info) ? JSON.parse(req.body.device_info): req.body.device_info ;
					
					//Procedemos a guardar esta información dentro del documento
					User.findOneAndUpdate({email:req.body.email}, {$set:{device:req.body.device_info}}, function(err,new_user){
						//Si no hay ningún error al guardar el device_info
						if(!err){
							if(!new_user){
								//Verificamos que el usuario ya haya verificado su cuenta
								//por medio del email que enviamos
								if(user.email_confirmation){
									
									user.session.token= user.email;
									user.session.exp_date = twoWeeks;
									user.save(function(err, result){
										/*Log*/utils.log("User/Login","Envío:",JSON.stringify(user));
										res.json({status: true, response: result, message:"Autenticado correctamente, pero no se pudo agregar el dispositivo"});
									});
								}
								//Si no está verificado negamos el login
								else{
									utils.log("User/Login","Envío:","Email no confirmado");
									res.json({status: false, error: "User not confirmed. Please confirm by email", error_id:1});
								}						
							}
							else{
								//Verificamos que el usuario ya haya verificado su cuenta
								//por medio del email que enviamos
								if(user.email_confirmation){
									
									user.session.token= user.email;
									user.session.exp_date = twoWeeks;
									user.save(function(err, result){
										/*Log*/utils.log("User/Login","Envío:",JSON.stringify(user));
										res.json({status: true, response: result});
									});
								}
								//Si no está verificado negamos el login
								else{
									utils.log("User/Login","Envío:","Email no confirmado");
									res.json({status: false, error: "User not confirmed. Please confirm by email", error_id:1});
								}
							}
						}
						//Hubo error al guardar el device_info
						//Por lo tanto, esta información no quedará en el documento
						else{
							//Verificamos que el usuario ya haya verificado su cuenta
							//por medio del email que enviamos
							if(user.email_confirmation){
								user.session.token= user.email;
								user.session.exp_date = twoWeeks;
								user.save(function(err, result){
									/*Log*/utils.log("User/Login","Envío:",JSON.stringify(user));
									res.json({status: true, response: result, message:"Autenticado correctamente, pero ocurrió un error.", error:err});
								});
							}
							//Si no está verificado negamos el login
							else{
								/*Log*/utils.log("User/Login","Envío:","Email no confirmado");
								res.json({status: false, error: "User not confirmed. Please confirm by email", error_id:1});
							}
						}
					});
				}
				//No hay device info, así que esta sección pertenece a la app web
				else{
					//Verificamos que el usuario ya haya verificado su cuenta
					//por medio del email que enviamos
					if(user.email_confirmation){
						user.session.token= user.email;
								user.session.exp_date = twoWeeks;
								user.save(function(err, result){
									utils.log("User/Login","Envío:",JSON.stringify(result));
									res.json({status: true, response: result, message:"Autenticado correctamente"});
								});
					}
					//Si no está verificado negamos el login
					else{
						/*Log*/utils.log("User/Authenticate","Envío:","Email no confirmado");
						res.json({status: false, error: "User not confirmed. Please confirm by email", error_id:1});
					}
				}
			}
			//No se encontró el user
			else{
				res.json({status: false, error: "not found"});
			}
		}
	});
};
//Read All*
exports.getAllUsers = function(req,res){
	//Esta función expone un servicio para buscar todos los usuarios sin ningún criterio de búsqueda
	var sort = {};
	if(req.params.sort){
		sort = utils.isJson(req.params.sort) ? JSON.parse(req.params.sort):req.params.sort;
	}
	User.find({})
	.select(exclude)
	.sort(sort.name)
	.skip(sort.skip)
	.limit(sort.limit || limitForSort)
	.exec(function(err,objects){
		if(err){
			res.json({status: false, error: "not found"});
		}
		else{
			res.json({status: true, response: objects});
		}
	});
};
//User Deliveries Read*
exports.requestedDeliveries = function(req,res){
	//Esta función expone un servicio para buscar los deliveries que el usuario haya iniciado, pero
	//qué no hayan sido aceptados aún
	DeliveryItem.find({user_id:req.params.user_id, overall_status:CONSTANTS.OVERALLSTATUS.REQUESTED},exclude,function(err,objects){
		if(err){
			res.json({status: false, error: "not found"});
		}
		else{
			res.json({status: true, response: objects});
		}
	});
};
exports.startedDeliveries = function(req,res){
	//Esta función expone un servicio para buscar los deliveries que el usuario haya iniciado,
	//y qué ya hayan sido aceptados, pero se encuentren en curso ó estado no finalizado
	DeliveryItem.find({user_id:req.params.user_id, overall_status:CONSTANTS.OVERALLSTATUS.STARTED},exclude,function(err,objects){
		if(err){
			res.json({status: false, error: "not found"});
		}
		else{
			res.json({status: true, response: objects});
		}
	});
};
exports.finishedDeliveries = function(req,res){
	//Esta función expone un servicio para buscar los deliveries que el usuario haya iniciado,
	//qué ya hayan sido aceptados, y qué también hayan sido finalizados
	var sort = {};
	if(req.params.sort){
		sort = utils.isJson(req.params.sort) ? JSON.parse(req.params.sort):req.params.sort;
	}
	DeliveryItem.find({user_id:req.params.user_id, overall_status:CONSTANTS.OVERALLSTATUS.FINISHED})
	.sort(sort.name)
	.skip(sort.skip)
	.limit(sort.limit || limitForSort)
	.exec(function(err,objects){
		if(err){
			res.json({status: false, error: "not found"});
		}
		else{
			res.json({status: true, response: objects});
		}
	});
};
//Update*
exports.updateUser = function(req,res){
//Esta función actualiza la información del usuario por medio de un PUT

/*Log*/utils.log("User/Update","Recibo sin filtro:",JSON.stringify(req.body));

//Cómo medida de seguridad
//Eliminamos los parámetros _id, email y password que 
//vienen del POST para evitar que se sobreescriban
req.body._id = '';
req.body.email = '';
req.body.password = '';

//Parseamos los settings que llegan en un formato JSON conocido
if(req.body.settings){
	req.body.settings = utils.isJson(req.body.settings) ? JSON.parse(req.body.settings): req.body.settings ;
}

//Filtramos el body del POST para remover parámetros vacíos
//ya que la actualización se realiza de manera dinámica
var filtered_body = utils.remove_empty(req.body);

/*Log*/utils.log("User/Update","Recibo:",JSON.stringify(filtered_body));
	
	//Buscamos el usuario que se desea actualizar por medio de su _id
	User.findOneAndUpdate({_id:req.params.user_id},
		//Seteamos el nuevo contenido
	   {$set:filtered_body}, {new:true},
	   	function(err,object){
	   	if(!object){
		   	res.json({status: false, error: "not found"});
	   	}
	   	else{
	   		/*Log*/utils.log("User/Create","Envío:",JSON.stringify(object));
		   	res.json({status:true, message:"Usuario actualizado exitosamente.", response:object});
	   	}
	});
};
//Password
exports.requestRecoverUser = function(req,res){
	/*utils.log("User/Recover","Recibo:",req.params.user_email);*/
	User.findOne({email:req.params.user_email},function(err,object){
		if(!object){
			res.json({status: false, error: "not found"});
		}
		else{
			var token = security.encrypt(object.email);
			var tokenB64 = security.base64(token);
			object.password_recover = {status:true, token:token};
			object.save(function(err, result){
				if(err){
					res.json({status: false, error: err});
				}
				else{
					if(result){
						var url = 'http://'+hostname+'/api_1.0/Password/Redirect/user/'+object.email+'/new_password/'+tokenB64;
						mail.send("Recuperar Contraseña", 
									"Hola "+object.name+". <br>Ingresa a este link para recuperar tu contraseña:<br> <a href='"+url+"'> Recuperar </a>",object.email);
						res.json({status: true, response: {token:tokenB64}});
					}
				}
			});
		}
	});
};
exports.newPasswordUser = function(req,res){
	var token_decoded = security.decodeBase64(req.params.token);
	/*Log*/utils.log("User/NewPassword","Recibo:",token_decoded);
	User.findOne({password_recover:{status:true, token: token_decoded}},function(err,object){
		if(!object){
			res.json({status: false, error: "not found"});
		}
		else{
			object.password_recover.status = false;
			object.password_recover.token = "";
			object.password = security.encrypt(req.body.password);
			object.save(function(err, result){
				if(err){
					
				}
				else{
					if(result){
						//mail.send("Clave Cambiada Con Exito");
						mail.send("Clave Cambiada Con Exito!", "Hola "+object.name+". <br>Tu contraseña ha sido cambiada con éxito. Ingresa ya a Mensajería:<br> <a href='http://mensajeria.com'> Mensajería </a>", object.email);
						res.json({status: true, response: result});
					}
				}
			});
		}
	});
};
exports.changePasswordUser = function(req,res){
/*Log*/utils.log("User/ChangePassword","Recibo:",JSON.stringify(req.body));
	User.findOne({_id:req.params.user_id},function(err,object){
		if(!object){
			res.json({status: false, error: "not found"});
		}
		else{
			//Verificamos que el hash guardado en password sea igual al password de entrada
			if(security.compareHash(req.body.password, object.password)){
				//Acá se verifica si llega device info, y se agrega al device list del usuario
				//En este punto ya se encuentra autenticado el usuario, las respuestas siempre serán positivas
				object.password = security.encrypt(req.body.new_password);
				object.save(function(err, result){
					if(err){
						/*Log*/utils.log("User/ChangePassword","Error:",JSON.stringify(err));
						res.json({status: false, error: err, message: "Ocurrió un error al actualizar la contraseña."});
					}
					else{
						/*Log*/utils.log("User/ChangePassword","Envío:",JSON.stringify(object));
						res.json({status: true, response: object, message: "Contraseña actualizada exitosamente."});
					}
				});			
			}
			else{
				res.json({status: false, error: "La contraseña es incorrecta."});
			}
		}
	});
};
//Delete
exports.deleteUser = function(req,res){
	User.remove({_id:req.params.id},function(err){
		if(err){
			res.json(error.notFound);
		}
		else{
			res.json({status:true, message:"Usuario borrado exitosamente."});
		}
	});
};
//Invite
exports.userInvite = function(req,res){
/*Log*/utils.log("User/Invite","Recibo:",JSON.stringify(req.body));
	User.findOne({email:req.body.email}, function(err,object){
		if(object){
			mail.send(object.name+ " " + object.lastname + " quiere que pruebes Mensajería!", req.body.message,req.body.destination_email);
			res.json({status:true, message:"Mensaje enviado con éxito."});
		}
		else{
			res.json({status:false, message:"Error al enviar al mensaje. No hay autenticación."});
		}
	});
}
//Fav Messenger
exports.favMessenger = function(req,res){
	/*Log*/utils.log("User/Fav","Recibo:",JSON.stringify(req.body));
	User.findOneAndUpdate({_id:req.params.user_id},{$addToSet:{favorites:req.body.messenger_id}}, function (err,object) {
		if(object){
			Messenger.find({_id:{$in:object.favorites}}, function(err,messengers){
				if(messengers.length>0){
					res.json({
								response: messengers, 
								message: "Mensajero agregado a favoritos de manera exitosa.", 
								status:true
							});
				}
				else{
					res.json({message:"No hay favoritos para este usuario", status:true, response:messengers});
				}
				
			});
		}
		else{
			res.json({status:false, message:"Error al agregar Mensajero como favorito."});
		}
	});
};
//UnFav Messenger
exports.unFavMessenger = function(req,res){
	User.findOneAndUpdate({_id:req.params.user_id},{$pull:{favorites:req.body.messenger_id}}, function (err,object) {
		if(!object){
			res.json({message:"No se encontró el usuario.", status:false});
		}
		else{
			Messenger.find({_id:{$in:object.favorites}}, function(err,messengers){
				if(messengers.length>0){
					res.json({
								response: messengers, 
								message: "Mensajero removido de favoritos de manera exitosa.", 
								status:true
							});
				}
				else{
					res.json({message:"No hay favoritos para este usuario", status:true, response:messengers});
				}
			});
		}
	});
};
//Get Favorites
exports.getFavorites = function(req,res){
	/*Log*/utils.log("User/GetFavorites","Recibo:",JSON.stringify(req.body));
	User.findOne({_id:req.params.user_id}, function(err,user){
		if(!user){
			res.json({message:"No se encontró el usuario.", status:false});
		}
		else{
			Messenger.find({_id:{$in:messengers.favorites}}, function(err,messengers){
				if(messengers.length>0){
					res.json({response: messengers, status:true});
				}
				else{
					res.json({message:"No hay favoritos para este usuario", status:true, response:messengers});
				}
			});
		}	
	});
};
//////////////////////////////////////
//End of User CRUD////////////////////
//////////////////////////////////////

//Admin Messenger Stuff
exports.activateMessenger = function(req,res){
	
	Messenger.findOneAndUpdate({_id:req.params.messenger_id},
	{$set:{admin_confirmation:true}},
	function(err,object){
		if(!object){
			console.log('Messenger activate for: ',err);
			res.json({status: false, error: "Messenger not found"});
		}
		else{
			//mail.send("VuelTap ha aprobado tu solicitud!", "Bienvenido a VuelTap. Ya puedes ingresar a la app usando el usuario y contraseña con el que te inscribiste.",object.email);
			res.json({status: true, response: object});
		}
	});
};
exports.deactivateMessenger = function(req,res){
	Messenger.findOneAndUpdate({_id:req.params.messenger_id},
	{$set:{admin_confirmation:false}},
	function(err,object){
		if(!object){
			res.json({status: false, error: "Messenger not found"});
		}
		else{
			res.json({status: true, response: object});
		}
	});
};
//////////////////////////////////
//Messenger CRUD starts here//////////
//////////////////////////////////
//Create*
exports.createMessenger = function(req,res){
//Esta función crea un usuario nuevo a partir de una peticion POST
var device_array = [];

//Revisamos la información que llega y la parseamos en un formato json conocido
if(req.body.device_info){
	req.body.device_info = utils.isJson(req.body.device_info) ? JSON.parse(req.body.device_info): req.body.device_info ;
	device_array.push(req.body.device_info);
}

//Procedemos a crear el usuario en la base de datos con la información que llega en el POST
utils.log("Messenger","Recibo:",JSON.stringify(req.body));
	new Messenger({
		email : req.body.email,
		//El estado inicial de confirmación email debe ser false
		//Este se trabaja con una variable global al principio de este documento
		email_confirmation : verifyEmailVar,
		//////////////////////////////////////
		//////////////////////////////////////
		password : req.body.password,
		name : req.body.name,
		lastname : req.body.lastname,
		mobilephone : req.body.mobilephone,
		identification: req.body.identification,
		city :  req.body.city,
		plate: req.body.plate,
		date_created: new Date(),
		devices: device_array,
		profile_pic: {},
	}).save(function(err,object){
		if(err){
			console.log("error: "+err);
			res.json(err);
		}
		else{
			//Una vez creado el documento en la base de datos procedemos a enviar un email
			//de confirmación
			mail.send("Bienvenido a Vueltap", "Ingrese sus documentos en la url "+webapp+webRootFolder+"#/uploadFilesMessenger/"+object._id,req.body.email);
			//emailVerification(req,object,'messenger');
			utils.log("Messenger","Envío:",JSON.stringify(object));
			res.json({status: true, message: "Mensajero creado exitosamente. Proceder a activar la cuenta.", response: object});
		}
	});
};
//Read One*
exports.getMessengerByEmail = function(req,res){
	//Esta función expone un servicio para buscar un mensajero por email
	Messenger.findOne({email:req.params.email},exclude,function(err,object){
		if(!object){
			res.json({status: false, error: "not found"});
		}
		else{
			res.json({status: true, response: object});
		}
	});
};
exports.getMessengerByID = function(req,res){
	//Esta función expone un servicio para buscar un mensajero por id
	Messenger.findOneAndUpdate({_id:req.params.messenger_id},exclude,function(err,object){
		if(!object){
			res.json({status: false, error: "not found"});
		}
		else{
			res.json({status: true, response: object});
		}
	});
};
//Login*
exports.authenticateMessenger = function(req,res){
//Esta función permite verificar la autenticidad del usuario por medio de un mail y un password
//Además de esto, si el usuario está en la versión móvil, nos permite capturar información 
//importante sobre su dispositivo
	var today = new Date();
	var twoWeeks = new Date(today.getFullYear(), today.getMonth(), today.getDate()+14);
/*Log*/utils.log("Messenger/Login0","Recibo:",JSON.stringify(req.body));

	//Buscamos inicialmente que la cuenta del usuario exista
	Messenger.findOne({email:req.body.email},function(err,messenger){
		if(!messenger){
			//No existe
			res.json({status: false, error: "not found", error_id:0});
		}
		else{
			//Verificamos que el hash guardado en password sea igual al password de entrada
			if(security.compareHash(req.body.password, messenger.password)){
				if(messenger.admin_confirmation != true){
					res.json({status: false, error: "Este usuario aún no se encuentra activo.", error_id:101, response:{messenger_id:messenger._id, admin_confirmation: messenger.admin_confirmation}});
					return;
				}
				//Acá se verifica si llega device info, y se agrega al device list del usuario
				//En este punto ya se encuentra autenticado el mensajero, las respuestas siempre serán positivas
				if(req.body.device_info){
					//En caso que recibamos información sobre el dispositivo
					//procedemos a parsear esta información en un formato json conocido
					/*Log*/utils.log("Messenger/Login","Envío:",JSON.stringify(messenger));
					req.body.device_info = utils.isJson(req.body.device_info) ? JSON.parse(req.body.device_info): req.body.device_info ;
					
					//Procedemos a guardar esta información dentro del documento
					Messenger.findOneAndUpdate({email:req.body.email}, {$addToSet:{devices:req.body.device_info}}, function(err,new_messenger){
						//Si no hay ningún error al guardar el device_info
						if(!err){
							if(!new_messenger){
								//Verificamos que el mensajero ya haya verificado su cuenta
								//por medio del email que enviamos
								if(messenger.email_confirmation){
									messenger.session.token= messenger.email;
									messenger.session.exp_date = twoWeeks;
									messenger.save(function(err, result){
										/*Log*/utils.log("Messenger/Login1","Envío:",JSON.stringify(result));
										res.json({status: true, response: result, message:"Autenticado correctamente, pero no se pudo agregar el dispositivo"});
									});
								}
								//Si no está verificado negamos el login
								else{
									utils.log("Messenger/Login","Envío:","Email no confirmado");
									res.json({status: false, error: "User not confirmed. Please confirm by email", error_id:1});
								}						
							}
							else{
								//Verificamos que el usuario ya haya verificado su cuenta
								//por medio del email que enviamos
								if(messenger.email_confirmation){
									messenger.session.token= messenger.email;
									messenger.session.exp_date = twoWeeks;
									messenger.save(function(err, result){
										/*Log*/utils.log("Messenger/Login2","Envío:",JSON.stringify(result));
										res.json({status: true, response: result});
									});
								}
								//Si no está verificado negamos el login
								else{
									utils.log("Messenger/Login3","Envío:","Email no confirmado");
									res.json({status: false, error: "User not confirmed. Please confirm by email", error_id:1});
								}
							}
						}
						//Hubo error al guardar el device_info
						//Por lo tanto, esta información no quedará en el documento
						else{
							//Verificamos que el usuario ya haya verificado su cuenta
							//por medio del email que enviamos
							if(messenger.email_confirmation){
									messenger.session.token= messenger.email;
									messenger.session.exp_date = twoWeeks;
									messenger.save(function(err, result){
										/*Log*/utils.log("Messenger/Login4","Envío:",JSON.stringify(result));
										res.json({status: true, response: result, message:"Autenticado correctamente, pero ocurrió un error.", error:err});
								});
							}
							//Si no está verificado negamos el login
							else{
								/*Log*/utils.log("Messenger/Login5","Envío:","Email no confirmado");
								res.json({status: false, error: "Messenger not confirmed. Please confirm by email", error_id:1});
							}
						}
					});
				}
				//No hay device info, así que esta sección pertenece a la app web
				else{
					//Verificamos que el usuario ya haya verificado su cuenta
					//por medio del email que enviamos
					if(messenger.email_confirmation){
						messenger.session.token= messenger.email;
						messenger.session.exp_date = twoWeeks;
						messenger.save(function(err, result){
							res.json({status: true, response: result});
						});
					}
					//Si no está verificado negamos el login
					else{
						/*Log*/utils.log("Messenger/Login","Envío:","Email no confirmado");
						res.json({status: false, error: "Messenger not confirmed. Please confirm by email", error_id:1});
					}
				}
			}
			//No se encontró el mensajero
			else{
				res.json({status: false, error: "not found"});
			}
		}
	});
};
//Read All*
exports.getAllMessengers = function(req,res){
	//Esta función expone un servicio para buscar todos los mensajeros sin ningún criterio de búsqueda
	//Pendiente filtrado y límite
	var sort = {};
	if(req.params.sort){
		sort = utils.isJson(req.params.sort) ? JSON.parse(req.params.sort):req.params.sort;
	}
	Messenger.find({})
	.select(exclude)
	.sort(sort.name)
	.skip(sort.skip)
	.limit(sort.limit || limitForSort)
	.exec(function(err,objects){
		if(err){
			res.json({status: false, error: "not found"});
		}
		else{
			res.json({status: true, response: objects});
		}
	});
};
//Update*
exports.updateMessenger = function(req,res){
//Esta función actualiza la información del usuario por medio de un PUT

/*Log*/utils.log("Messenger/Update","Recibo sin filtro:",JSON.stringify(req.body));

//Cómo medida de seguridad
//Eliminamos los parámetros _id y email que 
//vienen del POST para evitar que se sobreescriban
req.body._id = '';
req.body.email = '';

//Parseamos los settings que llegan en un formato JSON conocido
if(req.body.settings){
	req.body.settings = utils.isJson(req.body.settings) ? JSON.parse(req.body.settings): req.body.settings ;
}

//Filtramos el body del POST para remover parámetros vacíos
//ya que la actualización se realiza de manera dinámica
var filtered_body = utils.remove_empty(req.body);

/*Log*/utils.log("User/Update","Recibo:",JSON.stringify(filtered_body));
	
	//Buscamos el usuario que se desea actualizar por medio de su _id
	Messenger.findOneAndUpdate({_id:req.params.messenger_id},
		//Seteamos el nuevo contenido
	   {$set:filtered_body},{new:true}, 
	   	function(err,object){
	   	if(!object){
		   	res.json({status: false, error: "not found"});
	   	}
	   	else{
	   		/*Log*/utils.log("Messenger/Update","Envío:",JSON.stringify(object));
		   	res.json({status:true, message:"Mensajero actualizado exitosamente.", response:object});
	   	}
	});
};
exports.updateProfilePic = function(req,res){
/*Log*/utils.log("Messenger/AddPic/"+req.params.messenger_id,"Recibo:",JSON.stringify(req.files));
	Messenger.findOne({_id:req.params.messenger_id},exclude,function(err,object){
		if(!object){
			res.json({status: false, error: "not found"});
		}
		else{
			uploadProfilePic(req.files.image,object,res);
		}
	});
};

//Password
exports.requestRecoverMessenger = function(req,res){
	/*Log*/utils.log("Messenger/Recover","Recibo:",req.params.email);
	Messenger.findOne({email:req.params.email},function(err,object){
		if(!object){
			res.json({status: false, error: "not found"});
		}
		else{
			var token = security.encrypt(object.email);
			var tokenB64 = security.base64(token);
			object.password_recover = {status:true, token:token};
			object.save(function(err, result){
				if(err){
					res.json({status: false, error: err});
				}
				else{
					if(result){
						var url = 'http://'+hostname+'/api_1.0/Password/Redirect/messenger/'+object.email+'/new_password/'+tokenB64;
						mail.send("Recuperar Contraseña", 
									"Hola "+object.name+". <br>Ingresa a este link para recuperar tu contraseña:<br> <a href='"+url+"'> Recuperar </a>",object.email);
						res.json({status: true, response: {token:tokenB64}});
					}
				}
			});
		}
	});
};
exports.newPasswordMessenger = function(req,res){
	var token_decoded = security.decodeBase64(req.params.token);
	/*Log*/utils.log("Messenger/NewPassword","Recibo:",token_decoded);
	Messenger.findOne({password_recover:{status:true, token: token_decoded}},function(err,object){
		if(!object){
			res.json({status: false, error: "not found"});
		}
		else{
			object.password_recover.status = false;
			object.password_recover.token = "";
			object.password = security.encrypt(req.body.password);
			object.save(function(err, result){
				if(err){
					
				}
				else{
					if(result){
						//mail.send("Clave Cambiada Con Exito");
						mail.send("Clave Cambiada Con Exito!", "Hola "+object.name+". <br>Tu contraseña ha sido cambiada con éxito. Ingresa ya a Mensajería:<br> <a href='http://mensajeria.com'> Mensajería </a>", object.email);
						res.json({status: true, response: result});
					}
				}
			});
		}
	});
};
exports.changePasswordMessenger = function(req,res){
/*Log*/utils.log("Messenger/Password","Recibo:",JSON.stringify(req.body));
	Messenger.findOne({_id:req.params.messenger_id},function(err,object){
		if(!object){
			res.json({status: false, error: "not found"});
		}
		else{
			//Verificamos que el hash guardado en password sea igual al password de entrada
			if(security.compareHash(req.body.password, object.password)){
				//Acá se verifica si llega device info, y se agrega al device list del usuario
				//En este punto ya se encuentra autenticado el usuario, las respuestas siempre serán positivas
				object.password = security.encrypt(req.body.new_password);
				object.save(function(err, result){
					if(err){
						/*Log*/utils.log("Messenger/Password","Error:",JSON.stringify(err));
						res.json({status: false, error: err, message: "Ocurrió un error al actualizar la contraseña."});
					}
					else{
						/*Log*/utils.log("Messenger/Password","Envío:",JSON.stringify(object));
						res.json({status: true, response: object, message: "Contraseña actualizada exitosamente."});
					}
				});			
			}
			else{
				res.json({status: false, error: "La contraseña es incorrecta."});
			}
		}
	});
};
//Delete
exports.deleteMessenger = function(req,res){
	Messenger.remove({_id:req.params.messenger_id},function(err){
		if(err){
			res.json(error.notFound);
		}
		else{
			res.json({status:true, message:"Mensajero borrado exitosamente."});
		}
	});
};
//Invite
exports.messengerInvite = function(req,res){
/*Log*/utils.log("Messenger/Invite","Recibo:",JSON.stringify(req.body));
	Messenger.findOne({email:req.body.email}, function(err,object){
		if(object){
			mail.send(object.name+ " " + object.lastname + " quiere que pruebes Mensajería!", req.body.message,req.body.destination_email);
			res.json({status:true, message:"Mensaje enviado con éxito."});
		}
		else{
			res.json({status:false, message:"Error al enviar al mensaje. No hay autenticación."});
		}
	});
}
//////////////////////////////////////
//End of Messenger CRUD////////////////////
//////////////////////////////////////

//////////////////////////////////
//Delivery CRUD starts here///////
//////////////////////////////////
//Create*
exports.createDelivery = function(req,res){
//Esta función crea un DeliveryItem nuevo a partir de una peticion POST
//Procedemos a crear el item en la base de datos con la información que llega en el POST
utils.log("Delivery","Recibo:",JSON.stringify(req.body));
//Revisamos la información que llega y la parseamos en un formato json conocido
	if(req.body.user_info){
		req.body.user_info = utils.isJson(req.body.user_info) ? 
																JSON.parse(req.body.user_info): 																				req.body.user_info ;
	}
	//Revisamos que el objeto pickup_object y el delivery_object vengan completos
	if(req.body.pickup_object.lat && req.body.pickup_object.lon && req.body.pickup_object.lon){
		req.body.pickup_object = utils.isJson(req.body.pickup_object) ? 
																		JSON.parse(req.body.pickup_object): 																			req.body.pickup_object ;
	}
	else{
		res.json({status: false, message: "El objeto pickup_object viene incompleto."});
	}
	if(req.body.delivery_object.lat && req.body.delivery_object.lon && req.body.delivery_object.lon){
		req.body.delivery_object = utils.isJson(req.body.delivery_object) ? 
																		JSON.parse(req.body.delivery_object): 																			req.body.delivery_object ;
	}
	else{
		res.json({status: false, message: "El objeto delivery_object viene incompleto."});
	}


	//New Implementacion
	if (req.body.payment_method === CONSTANTS.PMNT_METHODS.CREDIT){
		User.findOne({_id:req.body.user_id},
			function(errFndUsr,user){
				if (!errFndUsr){
					PaymentToken.findOne({_id:req.body.token_id},
					function(errPmtTkn,pmntToken){
						if (!errPmtTkn){
							payments.capturePaymentUsingToken(pmntToken.token,req.body.ip_address,'123456',req.body.price_to_pay,user,
							function(errorCreatePmnt,resPmt){
								if (!errorCreatePmnt){
									//console.log("RES ",resPmt);
									new PlaceToPayTrn({user_id : req.body.user_id,p2p_trn_id:resPmt[45], p2p_response:resPmt, date_sent:new Date(), status:resPmt[0],ip_address:req.body.ip_address,is_capture:true}).save(
									function(errCreateTrn,trnObject){
										if (!errCreateTrn){
											if (trnObject.status==CONSTANTS.P2P.STATUS.PENDING){
												createDeliveryItemHelper(req,res,trnObject._id);
											}else{
												res.json({status: false, message: "Error Procesando el pago. "+resPmt[3], response: "Transaccion rechazada en Place to Pay"});
											}
										}else{
											res.json({status: false, message: "Error creando pedido.", response: errCreateTrn});
										}
									});
								}else{
									res.json({status: false, message: "Error creando pedido.", response: errorCreatePmnt});
								}
							});
						}else{
							res.json({status: false, message: "Error creando pedido.", response: errPmtTkn});
						}
					});
				}else{
					res.json({status: false, message: "Error creando pedido.", response: errFndUsr});
				}
		});
	}else{
		createDeliveryItemHelper(req,res,null);
	}

	//END
	
	/*new DeliveryItem({
		user_id : req.body.user_id,
		user_info: req.body.user_info,
		item_name: req.body.item_name,
		date_created: new Date(),
		pickup_location : pickup_location,
		pickup_details : req.body.pickup_details,
		pickup_object: req.body.pickup_object,
		delivery_location : delivery_location,	
		delivery_details : req.body.delivery_details,
		delivery_object: req.body.delivery_object,
		roundtrip: req.body.roundtrip,
		send_image: req.body.send_image,
		send_signature: req.body.send_signature,
		signature_object: {status:false, signatureB64:''},
		insurance: req.body.insurance,
		insurancevalue: req.body.insurancevalue,
		instructions : req.body.instructions,
		priority: req.body.priority,
		declared_value : req.body.declared_value,
		price_to_pay : req.body.price_to_pay,
		payment_method : req.body.payment_method,
		overall_status : CONSTANTS.OVERALLSTATUS.REQUESTED,
		status : CONSTANTS.STATUS.SYSTEM.AVAILABLE,
		time_to_pickup : req.body.time_to_pickup,
		time_to_deliver: req.body.time_to_deliver,
		rated : false,
		images : [],
		payment_token_id:req.body.token_id,
	}).save(function(err,dlvrItem){
		if(err){
			res.json({status: false, message: "Error creando pedido.", response: err});
		}
		else{
			//utils.log("Messenger","Envío:",JSON.stringify(object));
			User.findOneAndUpdate({_id:dlvrItem.user_id},{$inc:{"stats.created_services":1}}, function(errFndUpd, user){
				if (!errFndUpd){
					if (req.body.payment_method === CONSTANTS.PMNT_METHODS.CREDIT){
						PaymentToken.findOne({_id:req.body.token_id},function(errPmtTkn,pmntToken){
							if (!errPmtTkn){
								payments.capturePaymentUsingToken(pmntToken.token,req.body.ip_address,'123456',req.body.price_to_pay,user,function(errorCreatePmnt,resPmt){
								console.log("Respuesta ",resPmt);
								if (!errorCreatePmnt && resPmt[0]=='3'){
									DeliveryItem.findOneAndUpdate({_id:dlvrItem._id},
				   									{"trn_id":trnObject._id}, 
				   									function(errUpdate, object){
				   										if (!errUpdate){
				   											res.json({status: true, message: "Pedido creado exitosamente.", response: dlvrItem});
				   										}else{
				   											console.log("ERROR ACTUALIZANDO ",errUpdate);
				   											res.json({status: true, message: "Pedido creado exitosamente. Con fallas en el pago", response: dlvrItem});
				   										}
				   										
					   								});	
								}else{
									console.log("ERROR ENVIANDO PAGO ",errorCreatePmnt);
									res.json({status: true, message: "Pedido creado exitosamente. Con fallas en el pago", response: dlvrItem});
								}
								});	
							}else{
								res.json({status: false, message: "Error creando pedido.", response: errPmtTkn});
							}
						});
						}else{
							res.json({status: true, message: "Pedido creado exitosamente.", response: dlvrItem});
						}	
					}else{
						res.json({status: false, message: "Error creando pedido.", response: errFndUpd});
					}
					
			});
		}
	});*/
};


var createDeliveryItemHelper = function(req,res,trnId){
	//Creamos de manera correcta los objetos GEO para guardarlos en la base de datos
	var pickup_location = utils.convertInGeoObject(req.body.pickup_object);
	var delivery_location = utils.convertInGeoObject(req.body.delivery_object);
	var tempDlvItem=new DeliveryItem({
		user_id : req.body.user_id,
		user_info: req.body.user_info,
		item_name: req.body.item_name,
		date_created: new Date(),
		pickup_location : pickup_location,
		pickup_details : req.body.pickup_details,
		pickup_object: req.body.pickup_object,
		delivery_location : delivery_location,	
		delivery_details : req.body.delivery_details,
		delivery_object: req.body.delivery_object,
		roundtrip: req.body.roundtrip,
		send_image: req.body.send_image,
		send_signature: req.body.send_signature,
		signature_object: {status:false, signatureB64:''},
		insurance: req.body.insurance,
		insurancevalue: req.body.insurancevalue,
		instructions : req.body.instructions,
		priority: req.body.priority,
		declared_value : req.body.declared_value,
		price_to_pay : req.body.price_to_pay,
		payment_method : req.body.payment_method,
		overall_status : CONSTANTS.OVERALLSTATUS.REQUESTED,
		status : CONSTANTS.STATUS.SYSTEM.AVAILABLE,
		time_to_pickup : req.body.time_to_pickup,
		time_to_deliver: req.body.time_to_deliver,
		rated : false,
		images : [],
		trn_ids : [],
		payment_token_id:null});
	if (req.body.payment_method === CONSTANTS.PMNT_METHODS.CREDIT){
		tempDlvItem.trn_ids=[trnId];
		tempDlvItem.payment_token_id=req.body.token_id;
	}
	tempDlvItem.save(
	function(errCrtDlvrItm,dlvrItem){
		if (!errCrtDlvrItm){
			User.findOneAndUpdate({_id:dlvrItem.user_id},{$inc:{"stats.created_services":1}}, 
			function(errFndUpdUsr, user){
				if (!errFndUpdUsr){
					res.json({status: true, message: "Pedido creado exitosamente.", response: dlvrItem});
				}else{
					res.json({status: false, message: "Error creando pedido.", response: errFndUpdUsr});
				}
			});
		}else{
			res.json({status: false, message: "Error creando pedido Item.", response: errCrtDlvrItm});
		}
	});
};

//Read One
exports.getDeliveryItemByID = function(req,res){
	//Esta función expone un servicio para buscar un DeliveryItem por id
	DeliveryItem.findOne({_id:req.params.delivery_id},function(err,object){
		if(!object){
			res.json({status: false, error: "not found"});
		}
		else{
			console.log("object: ",{status: true, response: object});
			res.json({status: true, response: object});
		}
	});
};
//Read Many
exports.getAllDeliveryItems = function(req,res){
	//Esta función expone un servicio para buscar todos los DeliveryItems sin ningún criterio de búsqueda
	//Pendiente filtrado y límite
	var sort = {};
	if(req.params.sort){
		sort = utils.isJson(req.params.sort) ? JSON.parse(req.params.sort):req.params.sort;
	}
	DeliveryItem.find({})
	.sort(sort.name)
	.skip(sort.skip)
	.limit(sort.limit || limitForSort)
	.exec(function(err,objects){
		if(err){
			res.json({status: false, error: "not found"});
		}
		else{
			res.json({status: true, response: objects});
		}
	});
};
//Read Many
exports.getAllDeliveryItemsByStatus = function(req,res){
	//Esta función expone un servicio para buscar todos los DeliveryItems sin ningún criterio de búsqueda
	//Pendiente filtrado y límite
	var sort = {};
	if(req.params.sort){
		sort = utils.isJson(req.params.sort) ? JSON.parse(req.params.sort):req.params.sort;
	}
	DeliveryItem.find({status:req.params.status})
	.sort(sort.name)
	.skip(sort.skip)
	.limit(sort.limit || limitForSort)
	.exec(function(err,objects){
		if(err){
			res.json({status: false, error: "not found"});
		}
		else{
			res.json({status: true, response: objects});
		}
	});
};
exports.getNearDeliveryItems = function(req,res){
	var query = {};
	var meters = "";
	var maxServices = 5;
	DeliveryItem.find({messenger_id:req.params.messenger_id, 
						overall_status: CONSTANTS.OVERALLSTATUS.STARTED},exclude,function(err,object){
		if(!object || object.length < maxServices){
			//Verificamos que lleguen los 3 parámetros completos lat lon y distancia
			//Luego creamos el query de la manera adecuada para que la base de datos
			//Haga la búsqueda por proximidad
			for(var i =0; i<object.length;i++){
				if(object[i].time_to_deliver=="now"){
					res.json({status: false, message: "Tienes un servicio inmediato por entregar. Debes finalizar este servicio para poder aceptar más."});
					return;
				}
			}
			if(req.params.lat && req.params.lon && req.params.maxDistance){
				meters = 15000;//parseInt(req.params.maxDistance);
				query.pickup_location = {
							$near:{
								$geometry:{
									type:"Point" ,
									coordinates :[
													req.params.lon, 
													req.params.lat
												]
								},
								$maxDistance:meters
							}
						};	
				query.overall_status = CONSTANTS.OVERALLSTATUS.REQUESTED;
			}
			else{
				res.json({status: false, error: "Faltan datos para la búsqueda"});
			}
				console.log("query: "+JSON.stringify(query));
		
			var sort = {};
			if(req.params.sort){
				sort = utils.isJson(req.params.sort) ? JSON.parse(req.params.sort):req.params.sort;
			}
			utils.log("DeliveryItem/Near/"+req.params.lat+"/"+req.params.lon+"/"+ req.params.maxDistance,"Recibo:","GET");
			DeliveryItem.find(query)
			.sort(sort.name)
			.skip(sort.skip)
			.limit(sort.limit || limitForSort)
			.exec(function(err,objects){
				if(!err){
					if(objects.length<=0){
						res.json({status: false, message: "No hay ningún servicio disponible cerca de ti. Intenta de nuevo en unos momentos."});
					}
					else{
						utils.log("DeliveryItem/Near","Envío:",JSON.stringify(objects));
						res.json({status: true, response: objects});
					}
				}
				else{
					res.json({status: false, error: err});
				}
			});
		}
		else{
			res.json({status: false, message: "Tienes más de "+maxServices+" servicios activos."});
		}
		
	});
};
exports.getByOverallStatus = function(req,res){
	//Esta función expone un servicio para buscar todos los DeliveryItems con overall_status seleccionado
	//Pendiente límite
	var sort = {};
	if(req.params.sort){
		sort = utils.isJson(req.params.sort) ? JSON.parse(req.params.sort):req.params.sort;
	}
	DeliveryItem.find({messenger_id:req.params.messenger_id, overall_status:req.params.overall_status},exclude)
	.sort(sort.name)
	.skip(sort.skip)
	.limit(sort.limit || limitForSort)
	.exec(function(err,objects){
		if(err){
			res.json({status: false, error: "not found"});
		}
		else{
			res.json({status: true, response: objects});
		}
	});
};
exports.getUserActive = function(req,res){
	//Esta función expone un servicio para buscar todos los DeliveryItems sin ningún criterio de búsqueda
	//Pendiente filtrado y límite
	var sort = {};
	if(req.params.sort){
		sort = utils.isJson(req.params.sort) ? JSON.parse(req.params.sort):req.params.sort;
	}
	DeliveryItem.find({user_id:req.params.user_id, $or:[{overall_status:'requested'},{overall_status:'started'}]})
	.sort(sort.name)
	.skip(sort.skip)
	.limit(sort.limit || limitForSort)
	.exec(function(err,objects){
		if(err){
			res.json({status: false, error: "not found"});
		}
		else{
			res.json({status: true, response: objects});
		}
	});
};
exports.getUserFinished = function(req,res){
	//Esta función expone un servicio para buscar todos los DeliveryItems sin ningún criterio de búsqueda
	//Pendiente filtrado y límite
	var sort = {};
	if(req.params.sort){
		sort = utils.isJson(req.params.sort) ? JSON.parse(req.params.sort):req.params.sort;
	}
	DeliveryItem.find({user_id:req.params.user_id, overall_status:'finished'})
	.sort(sort.name)
	.skip(sort.skip)
	.limit(sort.limit || limitForSort)
	.exec(function(err,objects){
		if(err){
			res.json({status: false, error: "not found"});
		}
		else{
			res.json({status: true, response: objects});
		}
	});
};
exports.getUserAborted = function(req,res){
	//Esta función expone un servicio para buscar todos los DeliveryItems Abortados sin ningún criterio de búsqueda
	//Pendiente filtrado y límite
	var sort = {};
	if(req.params.sort){
		sort = utils.isJson(req.params.sort) ? JSON.parse(req.params.sort):req.params.sort;
	}
	DeliveryItem.find({user_id:req.params.user_id, overall_status:CONSTANTS.OVERALLSTATUS.ABORTED})
	.sort(sort.name)
	.skip(sort.skip)
	.limit(sort.limit || limitForSort)
	.exec(function(err,objects){
		if(err){
			res.json({status: false, error: "not found"});
		}
		else{
			utils.log("DeliveryItem/GetUserAborted/","Envío:",JSON.stringify(objects));
			res.json({status: true, response: objects});
		}
	});
};
exports.getCountWithStatus = function(req,res){
	var query = {};
	if(req.params.status){
		query.status = req.params.status;
	}
	
	DeliveryItem
	.count(query)
	.exec(function(err,objects){
		if(err){
			res.json({status: false, error: "not found"});
		}
		else{
			utils.log("DeliveryItem/Count/"+req.params.status,"Envío:",JSON.stringify(objects));
			res.json({status: true, response: objects});
		}
	});
};

//Update*
exports.addPicToDeliveryItem = function(req,res){
/*Log*/utils.log("DeliveryItem/AddPic/"+req.params.delivery_id,"Recibo:",JSON.stringify(req.files));
	DeliveryItem.findOne({_id:req.params.delivery_id},exclude,function(err,object){
		if(!object){
			res.json({status: false, error: "not found"});
		}
		else{
			/*Log*/utils.log("DeliveryItem/AddPic/"+req.params.delivery_id,"Envio:",JSON.stringify(object));
			uploadImage(req.files.image,object,res);
		}
	});
};
exports.addSignatureToDeliveryItem = function(req,res){
	DeliveryItem.findOne({_id:req.params.delivery_id},function(err,object){
		if(!object){
			res.json({status: false, error: "not found"});
		}
		else{
			object.signature_object = {
				status: true,
				signatureB64: req.body.signatureB64,
				date_created: new Date()
			};
			object.save(function(err, new_object){
				res.json({status: true});
			});
		}
	});
};
//DeliveryItem Messenger Status Update
exports.changeStatusAcceptee = function(req,res){
	//Este método identifica el estado del pedido y continúa con el estado siguiente
	//de manera automática
	utils.log("DeliveryItem/Status/Accept/"+req.params.delivery_id,"Recibo:",JSON.stringify(req.body));
	//Verificamos que llegue el objeto mensajero con un id
	if(req.body.messenger_info){
		req.body.messenger_info = utils.isJson(req.body.messenger_info) ? 
										JSON.parse(req.body.messenger_info): 
										req.body.messenger_info ;
	}
	else{
		res.json({status: false, error: "No se encontró el objeto mensajero"});
		return;
	}
	//Procedemos a actualizar el DeliveryItem
	//Este debe tener condicion de overall_status: started y 
	//el id correcto del delivery y el mensajero
	DeliveryItem.findOne({_id:req.params.delivery_id}, 
	   function(err,object){
		   	if(!object){
			   	res.json({status: false, error: "No se encontró el DeliveryItem"});
		   	}
		   	else{
			   	//Este caso es cuando el usuario crea el pedido y este aún no ha sido aceptado
			   	//Por ningún mensajero
			   
				   	//Este es el primer caso para la aceptación del servicio
				   	//El objeto delivery tendrá ahora el id del mensajero
				   	//y el objeto mensajero en su totalidad para ser mostrado
				   	//en la aplicación de usuario
					object.messenger_id = req.body.messenger_info._id;
			   		object.messenger_info = req.body.messenger_info;
			   		
			   		if(req.body.messenger_info.time == 0)
			   			object.estimated = object.time_to_pickup;
			   		else
			   			object.estimated = utils.addMinutes(req.body.messenger_info.time);
			   			
			   		//También modificamos el estado del pedido para que este no sea
			   		//mostrado como disponible a otros mensajeros
			   		object.status = CONSTANTS.STATUS.SYSTEM.ACCEPTED;
			   		object.overall_status = CONSTANTS.OVERALLSTATUS.STARTED;
			   		//Procedemos a guardar con los datos modificados
					object.save(function(err, result){
						utils.log("DeliveryItem/Accept","Envío:",JSON.stringify(result));
						notifyEvent("user",result,object.status);
						Messenger.findOneAndUpdate({_id:req.body.messenger_info._id},
		   									{$inc:{"stats.started_services":1}}, 
		   									function(err, messenger){
		   									res.json({
			   											status:true, 
			   											message:"DeliveryItem aceptado exitosamente.",
			   											response:result
			   										});

						});
					});
					return;
			   	}
	});
};
//DeliveryItem Messenger Status Update
exports.changeStatusAccept = function(req,res){
	//Este método identifica el estado del pedido y continúa con el estado siguiente
	//de manera automática
	utils.log("DeliveryItem/Status/Accept/"+req.params.delivery_id,"Recibo:",JSON.stringify(req.body));
	//Verificamos que llegue el objeto mensajero con un id
	if(req.body.messenger_info){
		req.body.messenger_info = utils.isJson(req.body.messenger_info) ? 
										JSON.parse(req.body.messenger_info): 
										req.body.messenger_info ;
	}
	else{
		res.json({status: false, error: "No se encontró el objeto mensajero"});
		return;
	}
	//Procedemos a actualizar el DeliveryItem
	//Este debe tener condicion de overall_status: started y 
	//el id correcto del delivery y el mensajero
	DeliveryItem.findOneAndUpdate({_id:req.params.delivery_id, overall_status:CONSTANTS.OVERALLSTATUS.REQUESTED},
	{$set: {overall_status:CONSTANTS.OVERALLSTATUS.STARTED}}, 
	function(err,object){
		   	if(!object){
			   	console.log("Ya fue pedido por otro");
			   	res.json({status: false, message: "Lo sentimos. Este pedido ya fue tomado por otro mensajero.", response:null, error: "Lo sentimos. Este pedido ya fue tomado por otro mensajero."});
		   	}
		   	else{
			   	object.messenger_id = req.body.messenger_info._id;
		   		object.messenger_info = req.body.messenger_info;
		   		
		   		if(req.body.messenger_info.time == 0)
		   			object.estimated = object.time_to_pickup;
		   		else
		   			object.estimated = utils.addMinutes(req.body.messenger_info.time);
		   			
		   		//También modificamos el estado del pedido para que este no sea
		   		//mostrado como disponible a otros mensajeros
		   		object.status = CONSTANTS.STATUS.SYSTEM.ACCEPTED;
		   		object.overall_status = CONSTANTS.OVERALLSTATUS.STARTED;
		   		//Procedemos a guardar con los datos modificados
				object.save(function(err, result){
					utils.log("DeliveryItem/Accept","Envío:",JSON.stringify(result));
					notifyEvent("user",result,object.status);
					Messenger.findOneAndUpdate({_id:req.body.messenger_info._id},
	   									{$inc:{"stats.started_services":1}}, 
	   									function(err, messenger){
	   									res.json({
		   											status:true, 
		   											message:"DeliveryItem aceptado exitosamente.",
		   											response:result
		   										});

					});
				});
				return;
		}
	});
};
exports.changeStatusInTransit = function(req,res){
	utils.log("DeliveryItem/Status/InTransit/"+req.params.delivery_id,"Recibo:",JSON.stringify(req.body));
	DeliveryItem.findOne({_id:req.params.delivery_id}, 
	   function(err,object){
		   	if(!object){
			   	res.json({status: false, error: "No se encontró el DeliveryItem"});
		   	}
		   	else{
				//También modificamos el estado del pedido para que este no sea
		   		//mostrado como disponible a otros mensajeros
			   	object.status = CONSTANTS.STATUS.SYSTEM.INTRANSIT;
			   	object.save(function(err, result){
			   		utils.log("DeliveryItem/InTransit","Envío:",JSON.stringify(object));
			   		notifyEvent("user",result,object.status);
			   		res.json({status:true, message:"DeliveryItem ahora está in-transit.", response:object});						});
					return;
			   	
			}
	});
};

exports.changeStatusDelivered = function(req,res){
	utils.log("DeliveryItem/Status/Delivered/"+req.params.delivery_id,"Recibo:",JSON.stringify(req.body));
	if(req.body.messenger_info){
		req.body.messenger_info = utils.isJson(req.body.messenger_info) ? 
										JSON.parse(req.body.messenger_info): 
										req.body.messenger_info ;
	}
	else{
		res.json({status: false, error: "No se encontró el objeto mensajero"});
		return;
	}
	DeliveryItem.findOne({_id:req.params.delivery_id}, 
	   function(err,object){
		   	if(!object){
			   	res.json({status: false, error: "No se encontró el DeliveryItem"});
		   	}
		   	else{
			   	if(object.roundtrip){
					//El item se encuentra en tránsito, debemos setearlo como
					//delivered y el overall_status se marca cómo finished
					//este servicio ya está terminado y el motorizado cumplió
					object.status = CONSTANTS.STATUS.SYSTEM.DELIVERED;
					object.overall_status = CONSTANTS.OVERALLSTATUS.FINISHED;
					object.save(function(err, result){
						notifyEvent("user",result,object.status);
						utils.log("DeliveryItem/Status/Delivered","Envío:",JSON.stringify(object));
						Messenger.findOneAndUpdate({_id:req.body.messenger_info._id},
										{$inc:{"stats.finished_services":1}}, 
										function(err, user){
	   									res.json({
										status:true, 
										message:"DeliveryItem ahora está" + object.status, 
										response:result
									});
							});
					});
				}
				else{
					res.json({status: false, error: "Este DeliveryItem tiene roundtrip. Su estado no puede ser entregado. Debe ser Regresado / Returned"});
				}
			   	
			}
	});
};

exports.changeStatusReturning = function(req,res){
	utils.log("DeliveryItem/Status/Returning/"+req.params.delivery_id,"Recibo:",JSON.stringify(req.body));
	if(req.body.messenger_info){
		req.body.messenger_info = utils.isJson(req.body.messenger_info) ? 
										JSON.parse(req.body.messenger_info): 
										req.body.messenger_info ;
	}
	else{
		res.json({status: false, error: "No se encontró el objeto mensajero"});
		return;
	}
	DeliveryItem.findOne({_id:req.params.delivery_id}, 
	   function(err,object){
		   	if(!object){
			   	res.json({status: false, error: "No se encontró el DeliveryItem"});
		   	}
		   	else{
			   	if(object.roundtrip){
					object.status = CONSTANTS.STATUS.SYSTEM.RETURNING;
					object.save(function(err, result){
					notifyEvent("user",result,object.status);
				   	utils.log("DeliveryItem/Status/Returning","Envío:",JSON.stringify(object));
						res.json({
									status:true, 
									message:"DeliveryItem ahora está" + object.status, 
									response:result
								});
					});
				}
				else{
					res.json({status: false, error: "Este DeliveryItem tiene roundtrip. Su estado no puede ser diferente a Regresando."});
				}
			   	
			}
	});
};

/*
*
*
*
* */
var settlePaymentHelper=function(res,req,dlvrItem,callback){
	PlaceToPayTrn.findOne({_id:dlvrItem.trn_ids[0]},
		function (errFndP2PTrn,p2pTrn){
			if (!errFndP2PTrn){
				PaymentToken.findOne({_id:dlvrItem.payment_token_id},
				function(errFndPmntTkn,pmntTkn){
					if (!errFndPmntTkn){
						//DEBEMOS ENVIAR TRN A PLACE TO PAY
						payments.settleTransaction(p2pTrn.p2p_trn_id,p2pTrn.ip_address,pmntTkn.franchise,
						function(errorPayment, body){
							var resPmt=body.split(',');
							new PlaceToPayTrn({user_id : p2pTrn.user_id,p2p_trn_id:resPmt[45], p2p_response:resPmt, date_sent:new Date(), status:resPmt[0],ip_address:p2pTrn.ip_address,is_capture:false}).save(
							function(errCreateTrn,trnObject){
								dlvrItem.trn_ids.push(trnObject._id);
								dlvrItem.save(
								function(errSve,newDelItem){
									callback(errorPayment,resPmt);	
								});
							});
						});
					}else{
						res.json({status: false, error: "Error Procesando Pago "+errFndPmntTkn});
					}

				});
			}else{
				res.json({status: false, error: "Error Procesando Pago"+errFndP2PTrn});
			}
		});
};


exports.changeStatusReturned = function(req,res){
	utils.log("DeliveryItem/Status/Returning/"+req.params.delivery_id,"Recibo:",JSON.stringify(req.body));
	if(req.body.messenger_info){
		req.body.messenger_info = utils.isJson(req.body.messenger_info) ? 
										JSON.parse(req.body.messenger_info): 
										req.body.messenger_info ;
	}
	else{
		res.json({status: false, error: "No se encontró el objeto mensajero"});
		return;
	}
	DeliveryItem.findOne({_id:req.params.delivery_id}, 
	   function(err,object){
		   	if(!object){
			   	res.json({status: false, error: "No se encontró el DeliveryItem"});
		   	}
		   	else{
			   	if(object.roundtrip){
					object.status = CONSTANTS.STATUS.SYSTEM.RETURNED;
					object.overall_status = CONSTANTS.OVERALLSTATUS.FINISHED;
					object.save(function(err, result){
						notifyEvent("user",result,object.status);
					   	utils.log("DeliveryItem/Returned","Envío:",JSON.stringify(object));
					   	Messenger.findOneAndUpdate({_id:req.body.messenger_info._id},
									{$inc:{"stats.finished_services":1}}, 
									function(err, user){
									res.json({
										status:true, 
										message:"DeliveryItem ahora está" + object.status, 
										response:result
									});
   						});
					});
				}
				else{
					res.json({status: false, error: "Este DeliveryItem tiene roundtrip. Su estado no puede ser diferente a Regresado."});
				}
			}
	});
};
exports.changeStatus = function(req,res){
	//Este método identifica el estado del pedido y continúa con el estado siguiente
	//de manera automática
	utils.log("DeliveryItem/NextStatus/"+req.params.delivery_id,"Recibo:",JSON.stringify(req.body));
	//Verificamos que llegue el objeto mensajero con un id
	if(req.body.messenger_info){
		req.body.messenger_info = utils.isJson(req.body.messenger_info) ? 
										JSON.parse(req.body.messenger_info): 
										req.body.messenger_info ;
	}
	else{
		res.json({status: false, error: "No se incluyó el messenger_info."});
		return;
	}
	//Procedemos a actualizar el DeliveryItem
	//Este debe tener condicion de overall_status: started y 
	//el id correcto del delivery y el mensajero
	DeliveryItem.findOne({_id:req.params.delivery_id}, 
	   function(err,object){
		   	if(!object){
			   	res.json({status: false, error: "No se encontró el DeliveryItem"});
		   	}
		   	else{
			   	//Este caso es cuando el usuario crea el pedido y este aún no ha sido aceptado
			   	//Por ningún mensajero
			   	if(req.params.status == CONSTANTS.STATUS.SYSTEM.AVAILABLE){
					object.status = CONSTANTS.STATUS.SYSTEM.AVAILABLE;
					object.overall_status = CONSTANTS.OVERALLSTATUS.REQUESTED;
					object.messenger_info = {};
					object.messenger_id = '';
					object.images = [];
					object.save(function(err, result){
					   	utils.log("DeliveryItem/Restart","Envío:",JSON.stringify(object));
							res.json({
										status:true, 
										message:"DeliveryItem ahora está available para el usuario y no está asignado a ningún mensajero.", 
										response:result
									});
					});
				}
			   	else if(req.params.status == CONSTANTS.STATUS.SYSTEM.ACCEPTED){
				   	//Este es el primer caso para la aceptación del servicio
				   	//El objeto delivery tendrá ahora el id del mensajero
				   	//y el objeto mensajero en su totalidad para ser mostrado
				   	//en la aplicación de usuario
					object.messenger_id = req.body.messenger_info._id;
			   		object.messenger_info = req.body.messenger_info;
			   		
			   		if(req.body.messenger_info.time == 0)
			   			object.estimated = object.time_to_pickup;
			   		else
			   			object.estimated = utils.addMinutes(req.body.messenger_info.time);
			   			
			   		//También modificamos el estado del pedido para que este no sea
			   		//mostrado como disponible a otros mensajeros
			   		object.status = CONSTANTS.STATUS.SYSTEM.ACCEPTED;
			   		object.overall_status = CONSTANTS.OVERALLSTATUS.STARTED;
			   		//Procedemos a guardar con los datos modificados
					object.save(function(err, result){
						utils.log("DeliveryItem/Accept","Envío:",JSON.stringify(result));
						notifyEvent("user",result,object.status);
						Messenger.findOneAndUpdate({_id:req.body.messenger_info._id},
		   									{$inc:{"stats.started_services":1}}, 
		   									function(err, messenger){
		   									res.json({
			   											status:true, 
			   											message:"DeliveryItem aceptado exitosamente.",
			   											response:result
			   										});

						});
					});
					return;
			   	}
			   	//Este caso es cuando el mensajero ya aceptó el servicio 
			   	//y se encuentra en camino para recogerlo
			   	else if (req.params.status == CONSTANTS.STATUS.SYSTEM.INTRANSIT){
				   	//También modificamos el estado del pedido para que este no sea
			   		//mostrado como disponible a otros mensajeros
				   	object.status = CONSTANTS.STATUS.SYSTEM.INTRANSIT;
			   		object.overall_status = CONSTANTS.OVERALLSTATUS.STARTED;
				   	object.save(function(err, result){
				   		utils.log("DeliveryItem/InTransit","Envío:",JSON.stringify(object));
				   		notifyEvent("user",result,object.status);
				   		res.json({status:true, message:"DeliveryItem ahora está in-transit.", response:object});					});
					return;
			   	}
			   	//Los siguientes casos son posteriores a los casos anteriores
			   	//Y dependen de la variable roundtrip para crear un nuevo status siguiente
		
					
				else if(req.params.status == CONSTANTS.STATUS.SYSTEM.RETURNING){
					object.status = CONSTANTS.STATUS.SYSTEM.RETURNING;
			   		object.overall_status = CONSTANTS.OVERALLSTATUS.STARTED;
					object.save(function(err, result){
					notifyEvent("user",result,object.status);
				   	utils.log("DeliveryItem/Returning","Envío:",JSON.stringify(object));
						res.json({
									status:true, 
									message:"DeliveryItem ahora está" + object.status, 
									response:result
								});
					});
				}
				//Si el item se encuentra en tránsito debemos setearlo como
				//returned y el overall_status se marca cómo finished
				//este servicio ya está terminado y el motorizado cumplió
				else if(req.params.status = CONSTANTS.STATUS.SYSTEM.RETURNED){
					object.status = CONSTANTS.STATUS.SYSTEM.RETURNED;
					object.overall_status = CONSTANTS.OVERALLSTATUS.FINISHED;
					object.save(function(err, result){
						notifyEvent("user",result,object.status);
					   	utils.log("DeliveryItem/Returned","Envío:",JSON.stringify(object));
					   	Messenger.findOneAndUpdate({_id:req.body.messenger_info._id},
									{$inc:{"stats.finished_services":1}}, 
									function(err, user){
									if (object.payment_method===CONSTANTS.PMNT_METHODS.CREDIT){
										settlePaymentHelper(res,req,object,
										function(errUpdPmnt,resPmnt){
										//console.log("RESPMNT ",resPmnt);
										if (!errUpdPmnt && resPmnt[0]===CONSTANTS.P2P.STATUS.APPROVED){
											res.json({
											status:true, 
											message:"DeliveryItem ahora está" + object.status, 
											response:result});
										}else{
											res.json({status: false, error: "Error Updating Payment "+errUpdPmnt});
										}
										});
									}else{
										res.json({
										status:true, 
										message:"DeliveryItem ahora está" + object.status, 
										response:result
										});
									}
   						});
					});
				}
				//Este caso indica que el item después de entregado NO debe regresar
			   	//al punto de partida
				else if(req.params.status = CONSTANTS.STATUS.SYSTEM.DELIVERED){
					//El item se encuentra en tránsito, debemos setearlo como
					//delivered y el overall_status se marca cómo finished
					//este servicio ya está terminado y el motorizado cumplió
					object.status = CONSTANTS.STATUS.SYSTEM.DELIVERED;
					object.overall_status = CONSTANTS.OVERALLSTATUS.FINISHED;
					object.save(function(err, result){
						notifyEvent("user",result,object.status);
						utils.log("DeliveryItem/Delivered","Envío:",JSON.stringify(object));
						Messenger.findOneAndUpdate({_id:req.body.messenger_info._id},
   									{$inc:{"stats.finished_services":1}}, 
   							function(err, user){
   								if (object.payment_method===CONSTANTS.PMNT_METHODS.CREDIT){
									settlePaymentHelper(res,req,object,
									function(errUpdPmnt,resPmnt){
										//console.log("RESPMNT ",resPmnt);
										if (!errUpdPmnt && resPmnt[0]===CONSTANTS.P2P.STATUS.APPROVED){
											res.json({
											status:true, 
											message:"DeliveryItem ahora está" + object.status, 
											response:result
											});
										}else{
											res.json({status: false, error: "Error Updating Payment "+errUpdPmnt});
										}
									});
								}else{
									res.json({
									status:true, 
									message:"DeliveryItem ahora está" + object.status, 
									response:result
									});
								}
	   									
   							});
					});
			   	}
			   	else if(req.params.status = CONSTANTS.STATUS.SYSTEM.ABORTED){
					object.status = CONSTANTS.STATUS.SYSTEM.ABORTED;
					object.overall_status = CONSTANTS.OVERALLSTATUS.ABORTED;
					object.abort_reason = req.body.messenger_info.abort_reason;
					object.estimated = null;
					object.save(function(err, result){
						Messenger.findOneAndUpdate({_id:req.body.messenger_info._id},
						{$inc:{"stats.aborted_services":1}}, 
						function(err, user){
							notifyEvent("user",result,CONSTANTS.STATUS.SYSTEM.ABORTED);
						   	utils.log("DeliveryItem/Abort","Envío:",JSON.stringify(object));
							res.json({
									status:true, 
									message:"Servicio cancelado por mensajero. Razón: "+req.body.messenger_info.abort_reason, 
									response:result
							});
	   					});
					});
				}
			   	else{
				   	res.json({status:false, message:"El status: "+req.params.status+' no existe.'});
			   	}
		   	}
	});
};
//DeliveryItem User Only Update
exports.rateDeliveryItem = function(req,res){
	/*Log*/utils.log("DeliveryItem/Rate/"+req.params.delivery_id,"Recibo:",JSON.stringify(req.body));
	DeliveryItem.findOne({_id:req.params.delivery_id, user_id: req.body.user_id, overall_status: CONSTANTS.OVERALLSTATUS.FINISHED},exclude,function(err,object){
		if(!object){
			res.json({status: false, error: "not found"});
		}
		else{
			if(!object.rated){
				object.rate_object = {};
				object.rate_object.rating = req.body.rating;
				object.rate_object.review = req.body.review;
				object.rated = true;
				object.save(function(err,result){
					Messenger.findOneAndUpdate({_id:object.messenger_id},{$inc:{total_reviews:1, total_rating:object.rate_object.rating}},function(err, messenger){
						if(messenger){
							messenger.rating_average = (messenger.total_rating / messenger.total_reviews).toFixed(1);
							messenger.save(function(err, result){
								/*Log*/utils.log("DeliveryItem/Rate/"+req.params.delivery_id,"Envio:",JSON.stringify(messenger));	
							res.json({status: true, message: 'Envío calificado exitosamente', response:object, messenger_average_rating: messenger.rating_average});
							});	
						}
					});
				});
			}
			else{
				res.json({status: false, message: 'Este envío ya fue calificado', response:object});
			}
		}
	});
};

//Experiment
exports.nextStatus = function(req,res){
	//Este método identifica el estado del pedido y continúa con el estado siguiente
	//de manera automática
	utils.log("DeliveryItem/NextStatus/"+req.params.delivery_id,"Recibo:",JSON.stringify(req.body));
	//Verificamos que llegue el objeto mensajero con un id
	if(req.body.messenger_info){
		req.body.messenger_info = utils.isJson(req.body.messenger_info) ? 
										JSON.parse(req.body.messenger_info): 
										req.body.messenger_info ;
	}
	else{
		res.json({status: false, error: "No se encontró el objeto mensajero", message:"No se encontró el DeliveryItem"});
		return;
	}
	//Procedemos a actualizar el DeliveryItem
	//Este debe tener condicion de overall_status: started y 
	//el id correcto del delivery y el mensajero
	DeliveryItem.findOne({_id:req.params.delivery_id}, 
	   function(err,object){
		   	if(!object){
			   	res.json({status: false, error: "No se encontró el DeliveryItem", message:"No se encontró el DeliveryItem"});
		   	}
		   	else{
			   	//Debemos verificar si existe mensajero asociado a este deliveryitem para evitar
			   	//Que otro mensajero lo pueda tomar
			   			   console.log('Entré al delivery: ', {deliverymsn_id:object.messenger_id, msn:req.body.messenger_info, del:object});
			   			   

			   	if(object.messenger_id){ 
				   	if(object.messenger_id.length > 0){
						if(object.messenger_id != req.body.messenger_info._id){
						   	console.log('Pedido tomado por otro mensajero: ', {delivery_msn:object.messenger_id, msn:req.body.messenger_info._id});
						   	res.json({status: false, message: "Lo sentimos. Este pedido ya fue tomado por otro mensajero.", response:null, error: "Lo sentimos. Este pedido ya fue tomado por otro mensajero."});
						   	return;
						}
					}  
				}
			   	//return;
			   	//Este caso es cuando el usuario crea el pedido y este aún no ha sido aceptado
			   	//Por ningún mensajero
			   	if(object.status == CONSTANTS.STATUS.SYSTEM.AVAILABLE){
				   	//Este es el primer caso para la aceptación del servicio
				   	//El objeto delivery tendrá ahora el id del mensajero
				   	//y el objeto mensajero en su totalidad para ser mostrado
				   	//en la aplicación de usuario
					object.messenger_id = req.body.messenger_info._id;
			   		object.messenger_info = req.body.messenger_info;
			   		
			   		if(req.body.messenger_info.time == 0)
			   			object.estimated = object.time_to_pickup;
			   		else
			   			object.estimated = utils.addMinutes(req.body.messenger_info.time);
			   			
			   		//También modificamos el estado del pedido para que este no sea
			   		//mostrado como disponible a otros mensajeros
			   		object.status = CONSTANTS.STATUS.SYSTEM.ACCEPTED;
			   		object.overall_status = CONSTANTS.OVERALLSTATUS.STARTED;
			   		//Procedemos a guardar con los datos modificados
					object.save(function(err, result){
						utils.log("DeliveryItem/Accept","Envío:",JSON.stringify(result));
						notifyEvent("user",result,object.status);
						Messenger.findOneAndUpdate({_id:req.body.messenger_info._id},
		   									{$inc:{"stats.started_services":1}}, 
		   									function(err, messenger){
		   									res.json({
			   											status:true, 
			   											message:"DeliveryItem aceptado exitosamente.",
			   											response:result
			   										});

						});
					});
					return;
			   	}
			   	//Este caso es cuando el mensajero ya aceptó el servicio 
			   	//y se encuentra en camino para recogerlo
			   	else if (object.status == CONSTANTS.STATUS.SYSTEM.ACCEPTED){
				   	//También modificamos el estado del pedido para que este no sea
			   		//mostrado como disponible a otros mensajeros
				   	object.status = CONSTANTS.STATUS.SYSTEM.INTRANSIT;
				   	object.save(function(err, result){
				   		utils.log("DeliveryItem/InTransit","Envío:",JSON.stringify(object));
				   		notifyEvent("user",result,object.status);
				   		res.json({status:true, message:"DeliveryItem ahora está in-transit.", response:object});					});
					return;
			   	}
			   	//Los siguientes casos son posteriores a los casos anteriores
			   	//Y dependen de la variable roundtrip para crear un nuevo status siguiente
				else{
				   	//Verificamos que roundtrip sea positivo
				   	//Este caso indica que el item después de entregado debe regresar
				   	//al punto de partida
					if(object.roundtrip){
						//Si el item se encuentra en tránsito debemos setearlo como
						//returning
						
						if(object.status == CONSTANTS.STATUS.SYSTEM.INTRANSIT){
							object.status = CONSTANTS.STATUS.SYSTEM.RETURNING;
							object.save(function(err, result){
							notifyEvent("user",result,object.status);
						   	utils.log("DeliveryItem/Returning","Envío:",JSON.stringify(object));
								res.json({
											status:true, 
											message:"DeliveryItem ahora está" + object.status, 
											response:result
										});
							});
						}
						//Si el item se encuentra en tránsito debemos setearlo como
						//returned y el overall_status se marca cómo finished
						//este servicio ya está terminado y el motorizado cumplió
						else if(object.status = CONSTANTS.STATUS.SYSTEM.RETURNING){
							object.status = CONSTANTS.STATUS.SYSTEM.RETURNED;
							object.overall_status = CONSTANTS.OVERALLSTATUS.FINISHED;
							object.save(function(err, result){
								notifyEvent("user",result,object.status);
							   	utils.log("DeliveryItem/Returned","Envío:",JSON.stringify(object));
							   	Messenger.findOneAndUpdate({_id:req.body.messenger_info._id},
	   									{$inc:{"stats.finished_services":1}}, 
	   									function(err, user){
	   									res.json({
												status:true, 
												message:"DeliveryItem ahora está" + object.status, 
												response:result
											});
		   						});
							});
						}
					}
					//Este caso indica que el item después de entregado NO debe regresar
				   	//al punto de partida
					else{
						//El item se encuentra en tránsito, debemos setearlo como
						//delivered y el overall_status se marca cómo finished
						//este servicio ya está terminado y el motorizado cumplió
						object.status = CONSTANTS.STATUS.SYSTEM.DELIVERED;
						object.overall_status = CONSTANTS.OVERALLSTATUS.FINISHED;
						object.save(function(err, result){
							notifyEvent("user",result,object.status);
							utils.log("DeliveryItem/Delivered","Envío:",JSON.stringify(object));
							Messenger.findOneAndUpdate({_id:req.body.messenger_info._id},{$inc:{"stats.finished_services":1}}, 
	   						function(err, user){
		   						if (object.payment_method===CONSTANTS.PMNT_METHODS.CREDIT){
									settlePaymentHelper(res,req,object,
									function(errUpdPmnt,resPmnt){
										//console.log("RESPMNT ",resPmnt);
										if (!errUpdPmnt && resPmnt[0]===CONSTANTS.P2P.STATUS.APPROVED){
											res.json({
											status:true, 
											message:"DeliveryItem ahora está" + object.status, 
											response:result
											});
										}else{
											res.json({status: false, error: "Error Updating Payment "+errUpdPmnt});
										}
									});
									}else{
										res.json({
										status:true, 
										message:"DeliveryItem ahora está" + object.status, 
										response:result
										});
									}		
	   						});
						});
					}
				   	//res.json({status:true, message:"DeliveryItem ahora está in-transit.", response:object});
			   	}
		   	}
	});
};
exports.lastStatus = function(req,res){
	//Este método identifica el estado del pedido y lo regresa al estado anterior
	//de manera automática
	utils.log("DeliveryItem/LastStatus/"+req.params.delivery_id,"Recibo:",JSON.stringify(req.body));
	//Verificamos que llegue el objeto mensajero con un id
	if(req.body.messenger_info){
		req.body.messenger_info = utils.isJson(req.body.messenger_info) ? 
										JSON.parse(req.body.messenger_info): 
										req.body.messenger_info ;
	}
	else{
		res.json({status: false, error: "No se encontró el objeto mensajero"});
		return;
	}
	//Procedemos a actualizar el DeliveryItem
	//Este debe tener condicion de overall_status: started y 
	//el id correcto del delivery y el mensajero
	DeliveryItem.findOne({_id:req.params.delivery_id}, 
	   function(err,object){
		   	if(!object){
			   	res.json({status: false, error: "No se encontró el DeliveryItem"});
		   	}
		   	else{
			   	//En este caso, el mensajero no tendrá acceso al deliveryitem y no podrá 
			   	//regresar el status.. es imposible
			   	if(object.status == CONSTANTS.STATUS.SYSTEM.AVAILABLE){
					res.json({status:false, message:"No se puede regresar en estado available"});
					return;
			   	}
			   	//En este caso, el mensajero tendrá acceso al deliveryitem pero no podrá 
			   	//regresar el status. Para regresar este status es necesario usar el servicio
			   	//de Abort
			   	else if (object.status == CONSTANTS.STATUS.SYSTEM.ACCEPTED){
				   	res.json({status:false, message:"No se puede regresar en estado accepted, usar el servicio Abort"});
			   	}
			   	else if (object.status == CONSTANTS.STATUS.SYSTEM.INTRANSIT){
				   	res.json({status:false, message:"No se puede regresar en estado in-transit, usar el servicio Abort"});
			   	}
			   	//Los siguientes casos son posteriores a los casos anteriores
			   	//Y dependen de la variable roundtrip para crear un nuevo status siguiente
				else{
				   	//Verificamos que roundtrip sea positivo
				   	//Este caso indica que el item después de entregado debe regresar
				   	//al punto de partida
					if(object.roundtrip){
						//Si el item se encuentra en tránsito debemos setearlo como
						//returning
						/*
if(object.status == CONSTANTS.STATUS.SYSTEM.INTRANSIT){
							object.status = CONSTANTS.STATUS.SYSTEM.ACCEPTED;
							object.save(function(err, result){
								notifyEvent("user",result,object.status);
								res.json({
											status:true, 
											message:"DeliveryItem ahora está" + object.status, 
											response:result
										});
							});
						}
*/
						//Si el item se encuentra en returning debemos setearlo como
						//in-transit
						if(object.status == CONSTANTS.STATUS.SYSTEM.RETURNING){
							object.status = CONSTANTS.STATUS.SYSTEM.INTRANSIT;
							object.save(function(err, result){
								notifyEvent("user",result,object.status);
								res.json({
											status:true, 
											message:"DeliveryItem ahora está" + object.status, 
											response:result
										});
							});
						}
						else if(object.status == CONSTANTS.STATUS.SYSTEM.RETURNED){
							object.status = CONSTANTS.STATUS.SYSTEM.RETURNING;
							object.overall_status = CONSTANTS.OVERALLSTATUS.STARTED
							object.save(function(err, result){
								notifyEvent("user",result,object.status);
								res.json({
											status:true, 
											message:"DeliveryItem ahora está" + object.status, 
											response:result
										});
							});
						}
					}
					//Este caso indica que el item después de entregado NO debe regresar
				   	//al punto de partida
					else{
						
						/*
if(object.status == CONSTANTS.STATUS.SYSTEM.INTRANSIT){
							object.status = CONSTANTS.STATUS.SYSTEM.ACCEPTED;
							object.save(function(err, result){
								notifyEvent("user",result,object.status);
								res.json({
									status:true, 
									message:"DeliveryItem ahora está" + object.status, 
									response:result
								});
							});
						}
*/
						if(object.status == CONSTANTS.STATUS.SYSTEM.DELIVERED){
							object.status = CONSTANTS.STATUS.SYSTEM.INTRANSIT;
							object.overall_status = CONSTANTS.OVERALLSTATUS.STARTED;
							object.save(function(err, result){
								notifyEvent("user",result,object.status);
								res.json({
									status:true, 
									message:"DeliveryItem ahora está" + object.status, 
									response:result
								});
							});
						}
						
					}
			   	}
		   	}
	});
};
//Abort
exports.abortDeliveryItem = function(req,res){
	//Este método sólo puede ser utilizado por el mensajero asignado al pedido
	//El usuario no podrá abortar ningún delivery
	utils.log("DeliveryItem/Abort/"+req.params.delivery_id,"Recibo:",JSON.stringify(req.body));
	//Verificamos que llegue el objeto mensajero con un id
	if(req.body.messenger_info){
		req.body.messenger_info = utils.isJson(req.body.messenger_info) ? 
										JSON.parse(req.body.messenger_info): 
										req.body.messenger_info ;
	}
	else{
		res.json({status: false, error: "No se encontró el objeto mensajero"});
		return;
	}
	//Procedemos a actualizar el DeliveryItem
	//Este debe tener condicion de overall_status: started y 
	//el id correcto del delivery y el mensajero
	DeliveryItem.findOne({
							_id:req.params.delivery_id, 
							messenger_id:req.body.messenger_info._id
						}, 
	   function(err,object){
		   	if(!object){
			   	res.json({status: false, error: "No se encontró el DeliveryItem"});
		   	}
		   	else{
			   	if(object.status == CONSTANTS.STATUS.SYSTEM.ACCEPTED){
					object.status = CONSTANTS.STATUS.SYSTEM.AVAILABLE;
					object.overall_status = CONSTANTS.OVERALLSTATUS.REQUESTED;
					object.messenger_info = {};
					object.messenger_id = '';
					object.save(function(err, result){
						Messenger.findOneAndUpdate({_id:req.body.messenger_info._id},
	   									{$inc:{"stats.cancelled_services":1}}, 
	   									function(err, user){
		   									notifyEvent("user",result,CONSTANTS.STATUS.SYSTEM.CANCELLED);
		   									utils.log("DeliveryItem/Cancel","Envío:",JSON.stringify(object));
		   									res.json({
												status:true, 
												message:"DeliveryItem ahora está available para el usuario y no está asignado a ningún mensajero.", 
												response:result
											});
	   					});
						
					});
				}
				else{
					object.status = CONSTANTS.STATUS.SYSTEM.ABORTED;
					object.overall_status = CONSTANTS.OVERALLSTATUS.ABORTED;
					object.abort_reason = req.body.messenger_info.abort_reason;
					object.estimated = null;
					object.save(function(err, result){
						Messenger.findOneAndUpdate({_id:req.body.messenger_info._id},
	   									{$inc:{"stats.aborted_services":1}}, 
	   									function(err, user){
		   									notifyEvent("user",result,CONSTANTS.STATUS.SYSTEM.ABORTED);
										   	utils.log("DeliveryItem/Abort","Envío:",JSON.stringify(object));
											res.json({
														status:true, 
														message:"Servicio cancelado por mensajero. Razón: "+req.body.messenger_info.abort_reason, 
														response:result
											});
	   					});
					});
				}
		   	}
	});
};
exports.restartDeliveryItem = function(req,res){
	DeliveryItem.findOne({
							_id:req.params.delivery_id, 
							user_id:req.body.user_id
						}, 
	   function(err,object){
		   	if(!object){
			   	res.json({status: false, error: "No se encontró el DeliveryItem"});
		   	}
		   	else{
			   	if(object.overall_status == CONSTANTS.OVERALLSTATUS.ABORTED){
					object.status = CONSTANTS.STATUS.SYSTEM.AVAILABLE;
					object.overall_status = CONSTANTS.OVERALLSTATUS.REQUESTED;
					object.messenger_info = {};
					object.messenger_id = '';
					object.images = [];
					object.save(function(err, result){
					   	utils.log("DeliveryItem/Restart","Envío:",JSON.stringify(object));
							res.json({
										status:true, 
										message:"DeliveryItem ahora está available para el usuario y no está asignado a ningún mensajero.", 
										response:result
									});
					});
				}
				else{
					res.json({
								status:false, 
								message:"No se encontró el DeliveryItem", 
							});
				}
		   	}
	});	
};


/*
 *
 *
 * */
var voidPaymentHelper=function(res,req,dlvrItem,msg){
	if (dlvrItem.payment_method===CONSTANTS.PMNT_METHODS.CREDIT){
		PlaceToPayTrn.findOne({_id:dlvrItem.trn_ids[0]},
			function (errFndP2PTrn,p2pTrn){
				if (!errFndP2PTrn){
					PaymentToken.findOne({_id:dlvrItem.payment_token_id},
						function(errFndPmntTkn,pmntTkn){
							if (!errFndPmntTkn){
								//DEBEMOS ENVIAR TRN A PLACE TO PAY
								payments.voidTransaction(p2pTrn.p2p_trn_id,p2pTrn.ip_address,pmntTkn.franchise,
									function(errorPayment, body){
										var resPmt=body.split(',');
										new PlaceToPayTrn({user_id : p2pTrn.user_id,p2p_trn_id:resPmt[45], p2p_response:resPmt, date_sent:new Date(), status:resPmt[0],ip_address:p2pTrn.ip_address,is_capture:false}).save(
											function(errCreateTrn,trnObject){
												/*dlvrItem.trn_ids.push(trnObject._id);
												dlvrItem.save(
													function(errSve,newDelItem){
														callback(errorPayment,resPmt);
													});*/
												if (!errCreateTrn){
													if (!errorPayment && resPmt[0]===CONSTANTS.P2P.STATUS.APPROVED){
														res.json({
															status:true,
															message:msg});
													}else{
														res.json({status: false, error: "Error Updating Payment "+errorPayment});
													}

												}else{
													res.json({status: false, error: "Error Eliminando Pago "+errFndPmntTkn});
												}
											});
									});
							}else{
								res.json({status: false, error: "Error Eliminando Pago "+errFndPmntTkn});
							}

						});
				}else{
					res.json({status: false, error: "Error Eliminando Pago"+errFndP2PTrn});
				}
			});
	}else{
		res.json({
			status:true,
			message:msg
		});
	}
};

//Delete
exports.deleteDeliveryItem = function(req,res){
	utils.log("DeliveryItem/Delete/"+req.params.delivery_id,"Recibo:",JSON.stringify(req.body));
	DeliveryItem.findOne({_id:req.params.delivery_id,user_id:req.params.user_id},exclude,function(err,object){
		if(!object){
			res.json({status: false, error: "not found"});
		}
		else{
			if(object.status == CONSTANTS.STATUS.SYSTEM.AVAILABLE){
				DeliveryItem.remove({_id:req.params.delivery_id,user_id:req.params.user_id},
				function(err){
					if(err){
						res.json({status: false, error: "No se pudo borrar ya que no se encontró el item"});
					}
					else{
						voidPaymentHelper(res,req,object,"DeliveryItem en estado available borrado exitosamente.");
					}
				});
			}
			else if(object.status == CONSTANTS.STATUS.SYSTEM.ACCEPTED){
				DeliveryItem.remove({_id:req.params.delivery_id,user_id:req.params.user_id},
				function(err){
					if(err){
						res.json({status: false, error: "No se pudo borrar ya que no se encontró el item"});
					}
					else{
						//En este punto se le debe alertar al motorizado que el servicio fue cancelado
						voidPaymentHelper(res,req,object,"DeliveryItem en estado accepted borrado exitosamente.");
					}
				});
			}
			else if(object.status == CONSTANTS.STATUS.SYSTEM.ABORTED){
				DeliveryItem.remove({_id:req.params.delivery_id,user_id:req.params.user_id},
				function(err){
					if(err){
						res.json({status: false, error: "No se pudo borrar ya que no se encontró el item"});
					}
					else{
						//En este punto se le debe alertar al motorizado que el servicio fue cancelado
						voidPaymentHelper(res,req,object,"DeliveryItem en estado accepted borrado exitosamente.");
					}
				});
			}
			else{
				res.json({status:false, message:"Este pedido no puede ser eliminado. Por favor, póngase en contacto con el mensajero."});
			}
		}
	});
};
//////////////////////////////////
//End of Messenger CRUD///////////
//////////////////////////////////

//Logout
exports.logoutMessenger = function(req,res){
//Esta función actualiza la información del usuario por medio de un PUT

/*Log*/utils.log("Messenger/Logout","Recibo sin filtro:",JSON.stringify(req.body));
	
	//Buscamos el usuario que se desea actualizar por medio de su _id
	Messenger.findOneAndUpdate({_id:req.params.messenger_id},
		//Seteamos el nuevo contenido
	   {$set:{session:{}}}, 
	   	function(err,object){
	   	if(!object){
		   	res.json({status: false, error: "not found"});
	   	}
	   	else{
	   		/*Log*/utils.log("Messenger/Logout","Envío:",JSON.stringify(object));
		   	res.json({status:true, message:"Mensajero deslogueado exitosamente."});
	   	}
	});
};

exports.logoutUser = function(req,res){
//Esta función actualiza la información del usuario por medio de un PUT

/*Log*/utils.log("User/Logout","Recibo sin filtro:",JSON.stringify(req.body));
	
	//Buscamos el usuario que se desea actualizar por medio de su _id
	User.findOneAndUpdate({_id:req.params.user_id},
		//Seteamos el nuevo contenido
	   {$set:{session:{}, device:[]}}, 
	   	function(err,object){
	   	if(!object){
		   	res.json({status: false, error: "not found"});
	   	}
	   	else{
	   		/*Log*/utils.log("User/Logout","Envío:",JSON.stringify(object));
		   	res.json({status:true, message:"Mensajero deslogueado exitosamente."});
	   	}
	});
};
//End of logout

exports.addFile = function(req,res){
	if(!req.body.type){
		res.json({status:false, message:'Error. No type found.'});
		return;
	}
	if(req.files && req.files.file){
		Messenger.findOne({_id:req.params.messenger_id})
		.exec(function(err,messenger){
			if(err){
				res.json({status:false, error:err});
			}
			else{
				if(messenger){
					uploadFile(res,req.files.file,messenger.email,messenger,req.body.type);
				}
				else{
					res.json({status:false, response:null, message:'Messenger not found..'});
				}
			}
		});
	}
	else{
		res.json({status:false, response:null,message:'No file attached..'});
	}
};

//////////////////////////////////
//Verify//////////////////////////
//////////////////////////////////
//Verify
exports.verifyAccount= function(req,res){
	/*Log*/utils.log("Account/Verify/"+req.params.type,"Recibo:",req.params.emailb64);
	var email_decoded = security.decodeBase64(req.params.emailb64);
	if(req.params.type == "messenger"){
		Messenger.findOne({email:email_decoded},function(err,object){
		if(!object){
			res.json({status: false, error: "not found"});
		}
		else{
			var checkIfConfirmed = object.email_confirmation;
			object.email_confirmation = true;
			object.save(function(err, result){
				if(err){
					res.json({status: false, error: err});
				}
				else{
					if(result){
						var url = webapp;
						if(!checkIfConfirmed){
							mail.send("!Bienvenido a Mensajería!", mail_template.doctor_new_account(object,url), object.email);
						}
						
						var data = {};
						data.email = email_decoded;
						data.type = 'doctor';
						browserAccountRedirect(req,res,data);
					}
				}
			});
		}
	});
	}
	else if(req.params.type == "user"){
		User.findOne({email:email_decoded},function(err,object){
			if(!object){
				res.json({status: false, error: "not found"});
			}
			else{
				var checkIfConfirmed = object.email_confirmation;
				object.email_confirmation = true;
				object.save(function(err, result){
					if(err){
						res.json({status: false, error: err});
					}
					else{
						if(result){
							var url = webapp;
							if(!checkIfConfirmed){
								mail.send("!Bienvenido a Mensajería!", mail_template.user_new_account(object,url), user.email);
							}
							
							var data = {};
							data.email = email_decoded;
							data.type = 'user';
							browserAccountRedirect(req,res,data);
						}
					}
				});
			}
		});
	}
};
exports.sendEmailVerification = function(req,res){
	/*Log*/utils.log("Account/SendEmailVerification","Recibo:",JSON.stringify(req.body));
	var email_decoded = security.decodeBase64(req.params.emailb64);
	if(email_decoded == req.body.email){
		if(req.params.type == 'messenger'){
			Messenger.findOne({email:email_decoded}, function(err,object){
				if(!object){
					res.json({status: false, error: 'not found'});
				}
				else{
					emailVerification(req,object,'messenger');
					res.json({status: true, response: 'Email sent to: '+object.email});
				}
			});
		}
		else if(req.params.type == 'user'){
			User.findOne({email:email_decoded}, function(err,object){
				if(!object){
					res.json({status: false, error: 'not found'});
				}
				else{
					emailVerification(req,object,'user');
					res.json({status: true, response: 'Email sent to: '+object.email});
				}
			});
		}
	}
	else{
		res.json({status: false, error: 'Wrong data.'});
	}
};
//////////////////////////////////
//End of Verify///////////////////
//////////////////////////////////

//////////////////////////////////
//Functions///////////////////////
//////////////////////////////////
//Image Uploader*//
var uploadImage = function(file,delivery_object,response){
	
	var amazonUrl = '';
	var findSpace = ' ';
	var regSpace = new RegExp(findSpace, 'g');
	var findSpecial = '[\\+*?\\[\\^\\]$(){}=!<>|:]';
	var regSpecial = new RegExp(findSpecial, 'g');
	
	//Verificamos que llegue archivo adjunto
	if(!file){
		response.json({
						status: false, 
						message: 'Error, no se recibió ningún archivo'
					});
		return;
	} 
	
	//Guardamos el path de la imagen en una variable
	//Y verificamos su extensión para proceder con el guardado adecuado
    var tmp_path_image_url = file.path;
    var extension =".jpg";
    if(file.type=="image/png"){
    	extension=".png";
    }
    
    //Generamos una ruta de guardado temporal local
	var target_path_image_url = './public/images/' + file.size + file.name;  
	
	//Revisamos que el tamaño del adjunto sea mayor a 0  
    if(file.size>0){
		fs.renameSync(tmp_path_image_url,target_path_image_url);		
		fs.stat(target_path_image_url, function(err, stat){
		  
			if(err){
				console.log("error1 "+err);
			}
			else{
				//Si no hay error en el proceso de guardado local
				//Procedemos a subir el archivo al bucket con una ruta definida coherentemente
				//Esta ruta se genera con los parámetros de entrada de la función
				
				
				amazonUrl = delivery_object.user_info.email+'/'+
							delivery_object.item_name+'/'+
							delivery_object.status+"/"+
							file.name;
				
				amazonUrl = amazonUrl.
								replace(regSpace, '').
								replace(regSpecial, '');
				
				var req = client.put(amazonUrl, {
					      'Content-Length': stat.size,
					      'Content-Type': file.type,
					      'x-amz-acl': 'public-read'
				});
				fs.createReadStream(target_path_image_url).pipe(req);
				
				//Cuando el servidor responda, procedemos a guardar la información
				//De la imagen en la base de datos
				req.on('response', function(res){
					fs.unlink(target_path_image_url, function(){});
					new Image({
						name:file.name,
						url:req.url,
						owner: delivery_object.user_info.email,
						owner_id: delivery_object.user_id,
						delivery_status: delivery_object.status,
						delivery_name: delivery_object.item_name,
						size:file.size,
						date_created: new Date(),
					}).save(function(err,image){	
						if(err){
							response.json({
											status: false, 
											message: 'Error guardando la imagen'
										});
						}
						else{
							delivery_object.images.push(image);							
							delivery_object.save(function(err,result){
									response.json({
													status: true, 
													message: 'Actualización exitosa', 
													response: result,
												});
							});												
						}
					});
			  });
			}
		});
	}
    else{
	    //Si el tamaño del adjunto no es mayor a 0 quiere decir que no hay adjunto
	    console.log('no hay imagen');
    }
}
var uploadProfilePic = function(file,messenger,response){
	var amazonUrl = '';
	var findSpace = ' ';
	var regSpace = new RegExp(findSpace, 'g');
	var findSpecial = '[\\+*?\\[\\^\\]$(){}=!<>|:]';
	var regSpecial = new RegExp(findSpecial, 'g');
	
	//Verificamos que llegue archivo adjunto
	if(!file){
		response.json({
						status: false, 
						message: 'Error, no se recibió ningún archivo'
					});
		return;
	} 
	
	//Guardamos el path de la imagen en una variable
	//Y verificamos su extensión para proceder con el guardado adecuado
	var tmp_path_image_url = file.path;
    var extension =".jpg";
    if(file.type=="image/png"){
    	extension=".png";
    }
    
    //Generamos una ruta de guardado temporal local
	var target_path_image_url = './public/images/' + file.size + file.name;  
	
	//Revisamos que el tamaño del adjunto sea mayor a 0  
    if(file.size>0){
		fs.renameSync(tmp_path_image_url,target_path_image_url);		
		fs.stat(target_path_image_url, function(err, stat){
		  
			if(err){
				console.log("error1 "+err);
			}
			else{
				//Si no hay error en el proceso de guardado local
				//Procedemos a subir el archivo al bucket con una ruta definida coherentemente
				//Esta ruta se genera con los parámetros de entrada de la función
				amazonUrl = "messengers"+'/'+
							messenger.email+'/'+
							"profile"+'/'+
							file.name;
				
				amazonUrl = amazonUrl.
								replace(regSpace, '').
								replace(regSpecial, '');
								
				var req = client.put(amazonUrl, {
					      'Content-Length': stat.size,
					      'Content-Type': file.type,
					      'x-amz-acl': 'public-read'
				});
				fs.createReadStream(target_path_image_url).pipe(req);
				
				//Cuando el servidor responda, procedemos a guardar la información
				//De la imagen en la base de datos
				req.on('response', function(res){
					fs.unlink(target_path_image_url, function(){});
					messenger.profile_pic = {};
					messenger.profile_pic = {
												name:file.name,
												url:req.url,
												size:file.size,
												date_created: new Date(),
											};
					messenger.save(function(err, object){
						if(!object){
							response.json({status: false, error: "Error al guardar"});
						}
						else{
							/*Log*/utils.log("Messenger/AddPic/"+object._id,"Envio:",JSON.stringify(object));
							response.json({status: true, response: object});
						}
					});
			  });
			}
		});
	}
    else{
	    //Si el tamaño del adjunto no es mayor a 0 quiere decir que no hay adjunto
	    console.log('no hay imagen');
    }
}

var uploadFile = function(response,file,email,objectToSave,type){
	//Verify the attachment
	if(!file){
		response.json({status: false, message:'No file attached.'});
		return;
	} 
	var filePath = '';
	var extension = '.'+file.name.split('.').pop();
	var fileName = type+extension;  // Igualamos el nombre del archivo al tipo para evitar que se cree más de un archivo para un mismo item
		
	var amazonUrl = '';
	var findSpace = ' ';
	var regSpace = new RegExp(findSpace, 'g');
	var findSpecial = '[\\+*?\\[\\^\\]$(){}=!<>|:]';
	var regSpecial = new RegExp(findSpecial, 'g');

	//Guardamos el path de la imagen en una variable
	//Y verificamos su extensión para proceder con el guardado adecuado
	var tmp_path_image_url = file.path;
    
    //Generamos una ruta de guardado temporal local
	var target_path_image_url = './public/images/' + file.size + file.name;  
	console.log("name:"+file.path)

    if(file.size>0){
		fs.renameSync(tmp_path_image_url,target_path_image_url);		
		fs.stat(target_path_image_url, function(err, stat){
		  
			if(err){
				console.log("error1 "+err);
			}
			else{
				amazonUrl = 'messengers'+'/'+email+'/'+type+"/"+fileName;
				amazonUrl = amazonUrl.replace(regSpace, '').replace(regSpecial, '');
								
				var req = client.put(amazonUrl, {
					      'Content-Length': stat.size,
					      'Content-Type': file.type,
					      'x-amz-acl': 'public-read'
				});
				fs.createReadStream(target_path_image_url).pipe(req);
				
				req.on('response', function(res){
					fs.unlink(target_path_image_url, function(){});
					new File({
						name: file.name,
						type: type,
						url: decodeURI(req.url),
						local_path: amazonUrl,
						owner: email,
						size: file.size,
						file_type: file.type,
						date_created: new Date(),
					}).save(function(err,newFile){	
						if(err){
						}
						else{
							if(!objectToSave.documents){
								objectToSave.documents = {};			
							}
							objectToSave.set('documents.'+type, {
								url : decodeURI(req.url),
								file_id : newFile._id,
								date_created : newFile.date_created
							});
											
							objectToSave.save(function(err,result){
								console.log("Error: ", result);
									response.json({status: true, message:'File uploaded successfully.', response: {url:newFile.url}});
							});												
						}
					});
			  });
			}
		});
	}
    else{
	    //Si el tamaño del adjunto no es mayor a 0 quiere decir que no hay adjunto
	    console.log('no File');
	    response.json({status: false, message:'No file attached.'});
		return;
    }
}


//Browser Account Redirect*//
var browserAccountRedirect = function (req,res,data){
//Esta sección detecta en que browser y sistema operativo se abre
//El correo de verificación de la cuenta.
//Esto con el fin de redireccionar a la app en caso de móvil
//Ó direccionar a la página en caso de la versión web

	var ua = req.headers['user-agent'],
	    $ = {};
	if (/mobile/i.test(ua)){
		console.log("Caso MOBILE");
		res.redirect('mensajeria://email_verification?email='+data.email+'&type='+data.type);
	}
	
	if (/like Mac OS X/.test(ua)) {
		console.log("Caso MACOSX");
	    res.redirect(webapp+'/#/account_activation/'+data.type+'/'+data.email);
		return;
	}
	
	if (/Android/.test(ua)){
		console.log("Caso Android");
	    res.redirect('mensajeria://email_verification?email='+data.email+'&type='+data.type);
		return;
	}
	
	if (/webOS\//.test(ua)){
		console.log("Caso WEBOS");
		return;
	}
	if (/(Intel|PPC) Mac OS X/.test(ua)){
		console.log("Caso INTEL PPC MACOSX");
		res.redirect(webapp+'/#/account_activation/'+data.type+'/'+data.email);
		return;
	}
	
	if (/Windows NT/.test(ua)){
		console.log("Caso WINDOWS NT");
		res.redirect(webapp+'/#/account_activation/'+data.type+'/'+data.email);
		return;
	}	
};
//Email Verifier*//
var emailVerification = function (req,data,type){
	//Encriptamos el correo del usuario
	var token = security.encrypt(data.email);
	//Lo encodeamos en base 64 para poderlo utilizar en la url
	var tokenB64 = security.base64(token);
	//Tomamos el correo sin encriptar y lo encodeamos en base 64
	var emailB64 = security.base64(data.email);
	//Formamos una url decifrable únicamente por nuestro sistema para poder verificar la autenticidad
	var url = 'http://'+hostname+'/api_1.0/Account/Verify/'+type+'/'+emailB64+'/'+tokenB64;
				mail.send("Verifica tu cuenta", mail_template.email_verification(data,url), data.email);
};
//Price Calculator
exports.getPrice = function (req,res){
	var message = "";
	var result = null;
	var parsedOrigin = "";
	var parsedDestination = "";
	var insurancePrice = 0;
	var minPrice = 3000;
	if(req.params.insurancevalue){
		insurancePrice = req.params.insurancevalue;
/*
		if(insurancePrice == 500000){
			insurancePrice = 10000;
		}
		else if(insurancePrice == 1000000){
			insurancePrice = 20000;
		}
		else if(insurancePrice == 2000000){
			insurancePrice = 30000;
		}
*/
		insurancePrice = insurancePrice*0.02;
	}
	
	distance.get(
	{
	  index: 1,
	  origin: req.params.loc1,
	  destination: req.params.loc2,
	  mode: 'driving',
	  language: 'es',
	},
	function(err, data) {
		if (err){
			res.json(
					{
						status: false, 
						message: "Ocurrió un error a la hora de hacer el cálculo", 
						insurance: insurancePrice, 
						error:err, 
					}
				);
		}
		else{
			message = "Valor a pagar aproximado: $";
			result = data.distanceValue/1000 *1000;
			parsedOrigin = data.origin.split(",");
			parsedDestination = data.destination.split(",");
			//if(parsedOrigin[1] == parsedDestination[1]){
				if(result<minPrice){
				result = minPrice;
				}
				res.json(
					{
						status: true, 
						message: message+result, 
						value:result,
						insurance: insurancePrice, 
						duration:data.duration, 
						durationValue:data.durationValue,
						originCity:parsedOrigin, 
						destinationCity:parsedDestination
					}
				);
			/*}
			
else{
				res.json(
					{
						status: false, 
						message: "La ciudad de origen es distinta a la ciudad de destino. La tarifa debe ser consultada con el mensajero",  
						origin:parsedOrigin[1], 
						destination:parsedDestination[1]
					}
				);
			}
*/
		}
	});
};
exports.closeToMe = function (req,res){
	var maxKm = 1;
	var maxMessengers = 15;
	var minMessengers = 4;
	var lat = req.params.lat;
	var lon = req.params.lon;
	
	if(!req.params.lat && !req.params.lon){
		res.json({status:false, message: 'You must send lat and lon'});
	}
	
	var lat100km = 110.574;
	var lon100km = 111.320*Math.cos(lat100km);
	var lat1km = 1/lat100km;
	var lon1km = 1/lon100km;
	var messengers = Math.floor((Math.random() * maxMessengers) + minMessengers);
	var randomKm1 = 0;
	var randomKm2 = 0;
	var locationsArray = [];
	var plusOrMinus1 = 0;
	var plusOrMinus2 = 0;	
	
	for (var i = 0; i<messengers; i++){
		randomKm1 = Math.random();
		randomKm2 = Math.random();
		randomSign = Math.floor((Math.random() * (maxKm*2)) + 1);
		plusOrMinus1 = Math.random() < 0.5 ? -1 : 1;
		plusOrMinus2 = Math.random() < 0.5 ? -1 : 1;
		locationsArray.push({
			lat:(parseFloat(lat)+parseFloat((lat1km*(maxKm * randomKm1*plusOrMinus1)))), 
			lon:(parseFloat(lon)+parseFloat(lon1km*(maxKm * randomKm2*plusOrMinus2)))
		});
		randomKm1=0;
		randomKm2=0;
		plusOrMinus1=0;
		plusOrMinus2=0;
	}
	
	res.json({
				status : true,
				response: {
					total : locationsArray.length,
					locations : locationsArray
				}
			});
};
exports.getInsuranceIntervals = function(req,res){
	var insuranceIntervals = [
		100000,
		200000,
		300000,
		400000,
		500000,
		600000,
		700000,
		800000,
		900000,
		1000000,
		1100000,
		1200000,
		1300000,
		1400000,
		1500000,
		1600000,
		1700000,
		1800000,
		1900000,
		2000000
	];
	
	res.json({status: true, response: insuranceIntervals});
}

/*
Returns the PDF to be displayed over the agreement screen
*/
exports.getDisclarimerPDF = function (req,res){
	if (req.params.disclaimer_type=='user'){
		res.writeHead(301,{Location: CONSTANTS.DISCLAIMER_USER_PATH});
		res.end();
	}else{
		res.writeHead(301,{Location: CONSTANTS.DISCLAIMER_MESSENGER_PATH});
		res.end();
	}
	
};


//Notifier
var notifyEvent = function(type,inputObject,status){

	var notification = {
		status : '',
		type : '',
		message : '',
		action : 'delivery',
		os : '',
		token : '',
		key : CONSTANTS.APNS.KEY,
		cert : CONSTANTS.APNS.CERT
	};
	var messageintro = "Tu pedido ";
	if(type=="user"){
		User.findOne({_id:inputObject.user_id}, function(err, object){
			if(!object){
				//res.json({status:false, message:"not found"});
			}
			else{
				if(status == CONSTANTS.STATUS.SYSTEM.ACCEPTED){
					notification.status = CONSTANTS.STATUS.USER.ACCEPTED;
					notification.message = messageintro+"'"+ inputObject.item_name+"'"+" ha sido aceptado. Llegará aproximadamente en "+inputObject.messenger_info.time+" minutos";
				}
				else if(status == CONSTANTS.STATUS.SYSTEM.INTRANSIT){
					notification.status = CONSTANTS.STATUS.USER.INTRANSIT;
					notification.message = messageintro+"'"+ inputObject.item_name+"'"+" se encuentra en tránsito.";
				}
				else if(status == CONSTANTS.STATUS.SYSTEM.RETURNING){
					notification.status = CONSTANTS.STATUS.USER.RETURNING;
					notification.message = messageintro+"'"+ inputObject.item_name+"'"+" se encuentra regresando.";
				}
				else if(status == CONSTANTS.STATUS.SYSTEM.RETURNED){
					notification.status = CONSTANTS.STATUS.USER.RETURNED;
					notification.message = messageintro+"'"+ inputObject.item_name+"'"+" ha sido regresado con éxito.";
				}
				else if(status == CONSTANTS.STATUS.SYSTEM.DELIVERED){
					notification.status = CONSTANTS.STATUS.USER.DELIVERED;
					notification.message = messageintro+"'"+ inputObject.item_name+"'"+" ha sido entregado con éxito.";
				}
				else if(status == CONSTANTS.STATUS.SYSTEM.CANCELLED){
					notification.status = CONSTANTS.STATUS.USER.CANCELLED;
					notification.message = messageintro+"'"+ inputObject.item_name+"'"+" está disponible para ser aceptado.";
				}
				else if(status == CONSTANTS.STATUS.SYSTEM.ABORTED){
					notification.status = CONSTANTS.STATUS.USER.ABORTED;
					notification.message = messageintro+"'"+ inputObject.item_name+"'"+" ha sido cancelado por el mensajero.";
				}
				notification.type = 'delivery';
				if(object.device && object.device.os){
					notification.os = object.device.os;
				}
				else{
					notification.os = 'no';
					return;
				}
				notification.os = object.device.os ? object.device.os:'no';
				notification.token = object.device.token;
				notification.id = inputObject._id;
				notification.type = 'user';
				notification.gcmkey = CONSTANTS.GCM.APIKEY.USER;
				notification.payload = {
											'action': notification.action,
											'u_type' : notification.type,
											'id' : notification.id
										};
				
				if(notification.token && notification.token.length>1)
					push.send(notification);
				else
					console.log("No hay token");
			}
		});
	}
	else if(type == "messenger"){	
		notification.gcmkey = CONSTANTS.GCM.APIKEY.MESSENGER;
	}
};
/////////////////////////////////
//End of Functions///////////////
/////////////////////////////////


/////////////////////////////////
//////// Payments ///////////////
/////////////////////////////////

/*
Funcion que retorna los metodos de pagos disponibles por el id de usuario
*/
exports.getPaymentMethodsByUser = function(req,res){
	//console.log ("User ",req.params.user_id);
	PaymentToken.find({user_id:req.params.user_id})
	.select('-token')
	.exec(function(err,objects){
		if(err){
			res.json({status: false, error: "not found"});
		}else{
			res.json({status: true, response: objects});
		}
	});
}


/*
Funcion que crea un nuevo metodo de pago asociado a un usuario
*/
exports.createPaymentMethod = function(req,res){
	utils.log("Payments/CreatePaymentMethod","Recibo:",JSON.stringify(req.body));
	User.findOne({_id:req.body.user_id},exclude,function(err1,object){
		if(!object){
			res.json({status: false, error: "User not found"});
		}
		else{
			payments.createToken(object,req.body.card_number,req.body.cvv,req.body.exp_date,
				function(err2, result, raw, soapHeader){
				if (!err2){
					new PaymentToken({
					user_id : req.body.user_id,
					token : result.tokenizeCardResult.token,
					card_last4 : req.body.card_number.substr(req.body.card_number.length-4, req.body.card_number.length),
					franchise : result.tokenizeCardResult.franchise,
					date_created: new Date(),
					valid_until: result.tokenizeCardResult.validUntil,
					}).save(function(err3,object){
						if(err3){
							res.json({status: false, message: "Error al registrar el metodo de pago "+err3 , err: err3});
						}
						else{
							utils.log("Payment Token Created","Envío:",JSON.stringify(object));
							//Clear the token for never sending it to the FE
							object.token='';
							res.json({status: true, message: "Metodo de Pago creado exitosamente.", response: object});
						}
					});
				}else{
					res.json({status: false, message:err2.toString(), err: err2});
				}
			});
			
		}
	});
}


/*
Servicio que elimina un metodo de pago asociado a un usuario
*/
exports.deletePaymentMethod = function(req,res){
	PaymentToken.findOne({_id:req.params.pmt_method_id},exclude,function(err,object){
		if(!object){
			res.json({status: false, error: "Payment Method no existe"});
		}
		else{
			payments.deleteToken(object.token,function(err2, result, raw, soapHeader){
				if (!err2 && result.invalidateTokenResult=='OK'){
					PaymentToken.remove({_id:req.params.pmt_method_id},function(err3){
					if(err3){
						res.json({status: false, error: "Error eliminando Payment Method", err: err3});
					}
					else{
						res.json({status: true, message: "Metodo de Pago eliminado exitosamente."});
					}
				});
				}else{
					res.json({status: false, error: "Error eliminando Payment Method", err: result.invalidateTokenResult});
				}
				
			});
		}
	});
};


exports.getFranchiseByBIN = function (req,res){
    var franchise=payments.getFranchiseByBIN(req.params.bin?req.params.bin:"");
    res.json({status: true, response: franchise});
};

exports.capturePaymentUsingToken = function (req,res){
	/*User.findOne({_id:req.body.user_id},exclude,function(err1,object){
		if(!object){
			res.json({status: false, error: "User not found"});
		}
		else{
			//console.log ("IP ",req.headers); 
			//console.log("IP 2 ", req.connection);
			payments.capturePaymentUsingToken(req.body.token,req.body.customerIP,req.body.invoiceNum,req.body.amount,object,function(error,body){
				if (error){
					res.json({status: false, err: error});
				}else{
					res.json({status: true, msg: body});
				}
			});		
		}
	});*/
	payments.settleTransaction("000000");
	res.json({status: true});

	};

/////////////////////////////////
//End of Payments ///////////////
/////////////////////////////////

/////////////////////////////////
//Password Redirect//////////////
/////////////////////////////////
exports.passwordRedirect = function (req, res){
	console.log("Password redirect function");
	var ua = req.headers['user-agent'],
	    $ = {};
	
	if (/mobile/i.test(ua)){
		console.log("Caso Mobile");
		if(req.params.type == "user")
			res.redirect('mensajeria://password_redirect?token='+req.params.token+'&type='+req.params.type+'&request='+req.params.request+'&email='+req.params.email);
		else
			res.redirect('mensajeria-m://password_redirect?token='+req.params.token+'&type='+req.params.type+'&request='+req.params.request+'&email='+req.params.email);
		return;
	}
	
	if (/like Mac OS X/.test(ua)) {
		console.log("Caso MACOSX");
		res.redirect(webapp+'/#/NewPassword/'+req.params.token+'/'+req.params.type+'/'+req.params.request+'/'+req.params.email);
		return;
	}
	
	if (/Android/.test(ua)){
		res.redirect('mensajeria://password_redirect?token='+req.params.token+'&type='+req.params.type+'&request='+req.params.request+'&email='+req.params.email);
		return;
	}
	
	if (/webOS\//.test(ua)){
		console.log("Caso WEBOS");
		return;
	}
	
	if (/(Intel|PPC) Mac OS X/.test(ua)){
		console.log("Caso INTEL PPC MAC");
		res.redirect(webapp+'/#/NewPassword/'+req.params.token+'/'+req.params.type+'/'+req.params.request+'/'+req.params.email);
		return;
	}
	
	if (/Windows NT/.test(ua)){
		console.log("Caso Windows");
		return;
	}
};
/////////////////////////////////
//End of Password Redirect///////
/////////////////////////////////