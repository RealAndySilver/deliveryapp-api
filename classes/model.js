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
mongoose.connect("mongodb://iAmUser:iAmStudio1@ds053788.mongolab.com:53788/mensajeria");
//////////////////////////////////
//End of MongoDB Connection///////
//////////////////////////////////

//////////////////////////////////
//Global Vars/////////////////////
//////////////////////////////////
var exclude = {/*password:*/};
var verifyEmailVar = true;
var CONSTANTS = {
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
	}
};
//Producción
//var hostname = "192.241.187.135:2000";
var webapp = "192.241.187.135:3000"
//Dev
var hostname = "192.168.0.44:2000";
//var webapp = "192.241.187.135:3000";

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
	pickup_object: {type: Object, required:true},
	delivery_location : {type: {type: String}, 'coordinates':{type:[Number]}},	
	delivery_object: {type: Object, required:true},
	roundtrip: {type: Boolean, required:false},
	instructions : {type: String, required:true},
	priority: {type: Number, required:false},
	deadline: {type: Date, required:true},
	date_created: {type: Date},
	declared_value : {type: Number, required:false},
	price_to_pay : {type: Number, required:false},
	overall_status : {type: String, required:true}, //requested,started, finished
	status : {type: String, required:true}, //available, accepted, in-transit, delivered, returning, returned, aborted
	pickup_time : {type: Date, required:false},
	estimated : {type: Date, required:false},
	images: {type: Array, required:false},
	rated : {type: Boolean, required:false},
	rate_object : {type: Object, required:false},
}),
	DeliveryItem= mongoose.model('DeliveryItem',DeliveryItemSchema);
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

//Development AMAZON BUCKET
var client = knox.createClient({
    key: 'AKIAIERCR4POCARGBWHA'
  , secret: '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'
  , bucket: 'mensajeria'
});

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
			emailVerification(req,object,'user');
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
									/*Log*/utils.log("User/Login","Envío:",JSON.stringify(user));
									res.json({status: true, response: user, message:"Autenticado correctamente, pero no se pudo agregar el dispositivo"});
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
									/*Log*/utils.log("User/Login","Envío:",JSON.stringify(user));
									res.json({status: true, response: new_user});
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
								/*Log*/utils.log("User/Login","Envío:",JSON.stringify(user));
								res.json({status: true, response: user, message:"Autenticado correctamente, pero ocurrió un error.", error:err});
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
						res.json({status: true, response: user});
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
	User.find({},exclude,function(err,objects){
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
	DeliveryItem.find({user_id:req.params.user_id, overall_status:CONSTANTS.OVERALLSTATUS.FINISHED},exclude,function(err,objects){
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
	   {$set:filtered_body}, 
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
			emailVerification(req,object,'messenger');
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
	Messenger.findOne({_id:req.params.messenger_id},exclude,function(err,object){
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

/*Log*/utils.log("Messenger/Login","Recibo:",JSON.stringify(req.body));

	//Buscamos inicialmente que la cuenta del usuario exista
	Messenger.findOne({email:req.body.email},exclude,function(err,messenger){
		if(!messenger){
			//No existe
			res.json({status: false, error: "not found", error_id:0});
		}
		else{
			//Verificamos que el hash guardado en password sea igual al password de entrada
			if(security.compareHash(req.body.password, messenger.password)){
				//Acá se verifica si llega device info, y se agrega al device list del usuario
				//En este punto ya se encuentra autenticado el mensajero, las respuestas siempre serán positivas
				if(req.body.device_info){
					//En caso que recibamos información sobre el dispositivo
					//procedemos a parsear esta información en un formato json conocido
					/*Log*/utils.log("Messenger/Login","Envío:",JSON.stringify(user));
					req.body.device_info = utils.isJson(req.body.device_info) ? JSON.parse(req.body.device_info): req.body.device_info ;
					
					//Procedemos a guardar esta información dentro del documento
					Messenger.findOneAndUpdate({email:req.body.email}, {$addToSet:{devices:req.body.device_info}}, function(err,new_messenger){
						//Si no hay ningún error al guardar el device_info
						if(!err){
							if(!new_messenger){
								//Verificamos que el mensajero ya haya verificado su cuenta
								//por medio del email que enviamos
								if(messenger.email_confirmation){
									/*Log*/utils.log("User/Login","Envío:",JSON.stringify(messenger));
									res.json({status: true, response: messenger, message:"Autenticado correctamente, pero no se pudo agregar el dispositivo"});
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
									/*Log*/utils.log("User/Login","Envío:",JSON.stringify(messenger));
									res.json({status: true, response: new_messenger});
								}
								//Si no está verificado negamos el login
								else{
									utils.log("Messenger/Login","Envío:","Email no confirmado");
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
								/*Log*/utils.log("User/Login","Envío:",JSON.stringify(messenger));
								res.json({status: true, response: messenger, message:"Autenticado correctamente, pero ocurrió un error.", error:err});
							}
							//Si no está verificado negamos el login
							else{
								/*Log*/utils.log("Messenger/Login","Envío:","Email no confirmado");
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
						res.json({status: true, response: messenger});
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
	Messenger.find({},exclude,function(err,objects){
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
	   {$set:filtered_body}, 
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
			/*Log*/utils.log("DeliveryItem/AddPic/"+req.params.delivery_id,"Envio:",JSON.stringify(object));
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
			object.password = security.encrypt(req.body.new_password);
			object.save(function(err, result){
				if(err){
					
				}
				else{
					if(result){
						//mail.send("Clave Cambiada Con Exito");
						mail.send("Clave Cambiada Con Exito!", "Hola "+object.name+". <br>Tu contraseña ha sido cambiada con éxito. Ingresa ya a Mensajería:<br> <a href='http://mensajeria.com'> Mensajería </a>", messenger.email);
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
	//Creamos de manera correcta los objetos GEO para guardarlos en la base de datos
	var pickup_location = utils.convertInGeoObject(req.body.pickup_object);
	var delivery_location = utils.convertInGeoObject(req.body.delivery_object);
	
	new DeliveryItem({
		user_id : req.body.user_id,
		user_info: req.body.user_info,
		item_name: req.body.item_name,
		date_created: new Date(),
		pickup_location : pickup_location,
		pickup_object: req.body.pickup_object,
		delivery_location : delivery_location,	
		delivery_object: req.body.delivery_object,
		roundtrip: req.body.roundtrip,
		instructions : req.body.instructions,
		priority: req.body.priority,
		deadline: req.body.deadline,
		declared_value : req.body.declared_value,
		price_to_pay : req.body.price_to_pay,
		overall_status : CONSTANTS.OVERALLSTATUS.REQUESTED,
		status : CONSTANTS.STATUS.SYSTEM.AVAILABLE,
		pickup_time : req.body.pickup_time,
		rated : false,
		images : [],
	}).save(function(err,object){
		if(err){
			res.json(err);
		}
		else{
			//utils.log("Messenger","Envío:",JSON.stringify(object));
			User.findOneAndUpdate({_id:object.user_id},{$inc:{"stats.created_services":1}}, function(err, user){
				res.json({status: true, message: "Pedido creado exitosamente.", response: object});
			});
		}
	});
};
//Read One
exports.getDeliveryItemByID = function(req,res){
	//Esta función expone un servicio para buscar un DeliveryItem por id
	DeliveryItem.findOne({_id:req.params.delivery_id},exclude,function(err,object){
		if(!object){
			res.json({status: false, error: "not found"});
		}
		else{
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
	.limit(sort.limit)
	.execFind(function(err,objects){
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
			if(req.params.lat && req.params.lon && req.params.maxDistance){
				meters = parseInt(req.params.maxDistance);
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
			.limit(sort.limit)
			.execFind(function(err,objects){
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
			res.json({status: false, message: "Tienes más de "+maxServices+" activos."});
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
	.limit(sort.limit)
	.execFind(function(err,objects){
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
	.limit(sort.limit)
	.execFind(function(err,objects){
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
	.limit(sort.limit)
	.execFind(function(err,objects){
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
	.limit(sort.limit)
	.execFind(function(err,objects){
		if(err){
			res.json({status: false, error: "not found"});
		}
		else{
			utils.log("DeliveryItem/GetUserAborted/","Envío:",JSON.stringify(objects));
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
//DeliveryItem Messenger Only Update
exports.acceptDeliveryItem = function(req,res){
	utils.log("DeliveryItem/Accept/"+req.params.delivery_id,"Recibo:",JSON.stringify(req.body));
	
	//Verificamos que llegue el objeto mensajero con un id
	if(req.body.messenger_info._id){
		req.body.messenger_info = utils.isJson(req.body.messenger_info) ? 
										JSON.parse(req.body.messenger_info): 
										req.body.messenger_info ;
	}
	else{
		res.json({status: false, error: "No se encontró el objeto mensajero"});
		return;
	}
	//Procedemos a actualizar el DeliveryItem
	//Este debe tener condicion de status: available y el id correcto
	DeliveryItem.findOneAndUpdate({_id:req.params.delivery_id, status:CONSTANTS.STATUS.SYSTEM.AVAILABLE},
	   {$set:{
		   		messenger_id: req.body.messenger_info._id,
		   		messenger_info: req.body.messenger_info,
		   		status: CONSTANTS.STATUS.SYSTEM.ACCEPTED,
		   		overall_status: CONSTANTS.OVERALLSTATUS.STARTED
		   	}}, 
	   function(err,object){
		   	if(!object){
			   	res.json({status: false, error: "No se encontró el DeliveryItem"});
		   	}
		   	else{
		   		utils.log("DeliveryItem/Accept","Envío:",JSON.stringify(object));
		   		Messenger.findOneAndUpdate({_id:req.body.messenger_info._id},
		   									{$inc:{"stats.accepted_services":1}}, 
		   									function(err, user){
			   		res.json({status:true, message:"DeliveryItem aceptado exitosamente.", response:object});

			   	});
		   	}
	});
};
exports.inTransitDeliveryItem = function(req,res){
	utils.log("DeliveryItem/InTransit/"+req.params.delivery_id,"Recibo:",JSON.stringify(req.body));
	//Verificamos que llegue el objeto mensajero con un id
	if(req.body.messenger_info._id){
		req.body.messenger_info = utils.isJson(req.body.messenger_info) ? 
										JSON.parse(req.body.messenger_info): 
										req.body.messenger_info ;
	}
	else{
		res.json({status: false, error: "No se encontró el objeto mensajero"});
		return;
	}
	//Procedemos a actualizar el DeliveryItem
	//Este debe tener condicion de status: accepted y el id correcto del delivery y el mensajero
	DeliveryItem.findOneAndUpdate({_id:req.params.delivery_id, status:CONSTANTS.STATUS.SYSTEM.ACCEPTED, messenger_id:req.body.messenger_info._id},
	   {$set:{
		   		status: "in-transit",
		   	}}, 
	   function(err,object){
		   	if(!object){
			   	res.json({status: false, error: "No se encontró el DeliveryItem"});
		   	}
		   	else{
		   		utils.log("DeliveryItem/InTransit","Envío:",JSON.stringify(object));
			   	res.json({status:true, message:"DeliveryItem ahora está in-transit.", response:object});
		   	}
	});
};
exports.deliverDeliveryItem = function(req,res){
	utils.log("DeliveryItem/Deliver/"+req.params.delivery_id,"Recibo:",JSON.stringify(req.body));
	//Verificamos que llegue el objeto mensajero con un id
	if(req.body.messenger_info._id){
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
							overall_status:started, 
							messenger_id:req.body.messenger_info._id
						}, 
	   function(err,object){
		   	if(!object){
			   	res.json({status: false, error: "No se encontró el DeliveryItem"});
		   	}
		   	else{
			   	//Verificamos que roundtrip sea positivo
			   	//Este caso indica que el item después de entregado debe regresar
			   	//al punto de partida
				if(object.roundtrip){
					//Si el item se encuentra en tránsito debemos setearlo como
					//returning
					if(object.status = "in-transit"){
						object.status = CONSTANTS.STATUS.SYSTEM.RETURNING;
						object.save(function(err, result){
					   	utils.log("DeliveryItem/Deliver","Envío:",JSON.stringify(object));
							res.json({
										status:true, 
										message:"DeliveryItem ahora está returning.", 
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
					   	utils.log("DeliveryItem/Deliver","Envío:",JSON.stringify(object));
							res.json({
										status:true, 
										message:"DeliveryItem ahora está finished.", 
										response:result
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
					utils.log("DeliveryItem/Delivered","Envío:",JSON.stringify(object));
						res.json({
									status:true, 
									message:"DeliveryItem ahora está delivered.", 
									response:result
								});
					});
				}
			   	res.json({status:true, message:"DeliveryItem ahora está in-transit.", response:object});
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
			   	if(object.status == CONSTANTS.STATUS.SYSTEM.AVAILABLE){
				   	//Este es el primer caso para la aceptación del servicio
				   	//El objeto delivery tendrá ahora el id del mensajero
				   	//y el objeto mensajero en su totalidad para ser mostrado
				   	//en la aplicación de usuario
					object.messenger_id = req.body.messenger_info._id;
			   		object.messenger_info = req.body.messenger_info;
			   		
			   		if(req.body.messenger_info.time == 0)
			   			object.estimated = object.pickup_time;
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
						notifyEvent("user",result,CONSTANTS.STATUS.SYSTEM.CANCELLED);
					   	utils.log("DeliveryItem/Cancel","Envío:",JSON.stringify(object));
							res.json({
										status:true, 
										message:"DeliveryItem ahora está available para el usuario y no está asignado a ningún mensajero.", 
										response:result
									});
					});
				}
				else{
					object.status = CONSTANTS.STATUS.SYSTEM.ABORTED;
					object.overall_status = CONSTANTS.OVERALLSTATUS.ABORTED;
					object.abort_reason = req.body.messenger_info.abort_reason;
					object.save(function(err, result){
						notifyEvent("user",result,CONSTANTS.STATUS.SYSTEM.ABORTED);
					   	utils.log("DeliveryItem/Abort","Envío:",JSON.stringify(object));
							res.json({
										status:true, 
										message:"Servicio cancelado por mensajero. Razón: "+req.body.messenger_info.abort_reason, 
										response:result
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
						res.json({status:true, message:"DeliveryItem en estado available borrado exitosamente."});
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
						res.json({status:true, message:"DeliveryItem en estado accepted borrado exitosamente."});
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
						res.json({status:true, message:"DeliveryItem en estado accepted borrado exitosamente."});
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
						var url = 'http://'+webapp;
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
							var url = 'http://'+webapp;
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
	    res.redirect('http://'+webapp+'/#/account_activation/'+data.type+'/'+data.email);
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
		res.redirect('http://'+webapp+'/#/account_activation/'+data.type+'/'+data.email);
		return;
	}
	
	if (/Windows NT/.test(ua)){
		console.log("Caso WINDOWS NT");
		res.redirect('http://'+webapp+'/#/account_activation/'+data.type+'/'+data.email);
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
						error:err, 
					}
				);
		}
		else{
			var message = "Valor a pagar aproximado: $";
			var result = data.distanceValue/1000 *1000;
			var parsedOrigin = data.origin.split(",");
			var parsedDestination = data.destination.split(",");
			if(parsedOrigin[1] == parsedDestination[1]){
				if(result<5000){
				result = 5000;
				}
				res.json(
					{
						status: true, 
						message: message+result, 
						value:result, 
						duration:data.duration, 
						durationValue:data.durationValue,
						//data:data, 
						originCity:parsedOrigin, 
						destinationCity:parsedDestination
					}
				);
			}
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
		}
	});
};
//Notifier
var notifyEvent = function(type,inputObject,status){

	var notification = {
		status : '',
		type : '',
		message : '',
		action : status,
		os : '',
		token : ''
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
					notification.message = messageintro+"'"+ inputObject.item_name+"'"+" ha sido aceptado."
				}
				else if(status == CONSTANTS.STATUS.SYSTEM.INTRANSIT){
					notification.status = CONSTANTS.STATUS.USER.INTRANSIT;
					notification.message = messageintro+"'"+ inputObject.item_name+"'"+" se encuentra en tránsito."
				}
				else if(status == CONSTANTS.STATUS.SYSTEM.RETURNING){
					notification.status = CONSTANTS.STATUS.USER.RETURNING;
					notification.message = messageintro+"'"+ inputObject.item_name+"'"+" se encuentra regresando."
				}
				else if(status == CONSTANTS.STATUS.SYSTEM.RETURNED){
					notification.status = CONSTANTS.STATUS.USER.RETURNED;
					notification.message = messageintro+"'"+ inputObject.item_name+"'"+" ha sido regresado con éxito."
				}
				else if(status == CONSTANTS.STATUS.SYSTEM.DELIVERED){
					notification.status = CONSTANTS.STATUS.USER.DELIVERED;
					notification.message = messageintro+"'"+ inputObject.item_name+"'"+" ha sido entregado con éxito."
				}
				else if(status == CONSTANTS.STATUS.SYSTEM.CANCELLED){
					notification.status = CONSTANTS.STATUS.USER.CANCELLED;
					notification.message = messageintro+"'"+ inputObject.item_name+"'"+" está disponible para ser aceptado."
				}
				else if(status == CONSTANTS.STATUS.SYSTEM.ABORTED){
					notification.status = CONSTANTS.STATUS.USER.ABORTED;
					notification.message = messageintro+"'"+ inputObject.item_name+"'"+" ha sido cancelado por el mensajero."
				}
				notification.type = 'delivery';
				notification.os = object.device.os;
				notification.token = object.device.token;
				notification.id = inputObject._id;
				
				if(notification.token && notification.token.length>1)
					push.send(notification);
				else
					console.log("No hay token");
			}
		});
	}
	else if(type == "messenger"){	
	}
};
/////////////////////////////////
//End of Functions///////////////
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
		res.redirect('mensajeria://password_redirect?token='+req.params.token+'&type='+req.params.type+'&request='+req.params.request+'&email='+req.params.email);
		return;
	}
	
	if (/like Mac OS X/.test(ua)) {
		console.log("Caso MACOSX");
		res.redirect('http://'+webapp+'/#/NewPassword/'+req.params.token+'/'+req.params.type+'/'+req.params.request+'/'+req.params.email);
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
		res.redirect('http://'+webapp+'/#/NewPassword/'+req.params.token+'/'+req.params.type+'/'+req.params.request+'/'+req.params.email);
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