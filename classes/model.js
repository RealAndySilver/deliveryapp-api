//////////////////////////////////
//Dependencies////////////////////
//////////////////////////////////
var mongoose = require('mongoose');
var apn = require('apn');
var send_push = require('../classes/push_sender');
var utils = require('../classes/utils');
var mail = require('../classes/mail_sender');
var mail_template = require('../classes/mail_templates');
var fs = require('fs');
var express = require('express');
var knox = require('knox');
var gcm = require('node-gcm');
var	security = require('../classes/security');
var colors = require('colors');
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

//Producción
var hostname = "192.241.187.135:2000";
var webapp = "192.241.187.135:3000"
//Dev
//var hostname = "192.168.0.37:1414";
//var webapp = "192.241.187.135:3000"

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
	device : {type: [Device], required:false},
	favorites : {type: Array, required:false},
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
	item_name : {type: String, required:false},
	pickup_location : {type: {type: String}, 'coordinates':{type:[Number]}},
	pickup_object: {type: Object, required:true},
	delivery_location : {type: {type: String}, 'coordinates':{type:[Number]}},	
	delivery_object: {type: Object, required:true},
	roundtrip: {type: Boolean, required:false},
	instructions : {type: String, required:true},
	priority: {type: Number, required:false},
	deadline: {type: Date, required:true},
	declared_value : {type: Number, required:false},
	price_to_pay : {type: Number, required:false},
	overall_status : {type: String, required:true}, //requested,started, finished
	status : {type: String, required:true}, //available, accepted, in-transit, delivered, returning, returned, aborted
	pickup_time : {type: Date, required:false},
	image: {type: Object, required:false},
});
	DeliveryItemSchema.index({pickup_location:"2dsphere", required:false});
	DeliveryItemSchema.index({delivery_location:"2dsphere", required:false});
	DeliveryItem= mongoose.model('DeliveryItem',DeliveryItemSchema);
//////////////////////////////////
//End of Appointment  Schema//////
//////////////////////////////////

//////////////////////////////////
//Review Schema///////////////////
//////////////////////////////////
var ReviewSchema= new mongoose.Schema({
	user_id : {type: String, required:true},
	messenger_id : {type: String, required:true},
	review : {type: String, required:false},
	date_created : {type: Date, required:true},
}),
	Review= mongoose.model('Review',ReviewSchema);
//////////////////////////////////
//End of Review Schema////////////
//////////////////////////////////

//////////////////////////////////
//Image Schema////////////////////
//////////////////////////////////
var ImageSchema= new mongoose.Schema({
	name:{type: String, required: false,unique: false,},
	messenger_id: {type: String, required: false,unique: false,},
	type:{type: String, required: false,unique: false,},
	size:{type: Number, required:false, unique:false,},
	url:{type: String, required: false,unique: false,},
}),
	Image= mongoose.model('Image',ImageSchema);
//////////////////////////////////
//End of Image Schema/////////////
//////////////////////////////////

//Development AMAZON BUCKET
/*
var client = knox.createClient({
    key: 'AKIAJ32JCWGUBJ3BWFVA'
  , secret: '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'
  , bucket: 'doclinea'
});
*/

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
		devices: device_array,
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
					User.findOneAndUpdate({email:req.body.email}, {$addToSet:{devices:req.body.device_info}}, function(err,new_user){
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
	Messenger.find({user_id:req.params.user_id, overall_status:"requested"},exclude,function(err,objects){
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
	Messenger.find({user_id:req.params.user_id, overall_status:"started"},exclude,function(err,objects){
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
	Messenger.find({user_id:req.params.user_id, overall_status:"finished"},exclude,function(err,objects){
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
			object.password = req.body.password;
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
			if(security.compareHash(req.body.password, user.password)){
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
	User.findOne({_id:req.params.user_id}, function(err,messengers){
		if(!messengers){
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
			object.password = req.body.password;
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
//Delivery CRUD starts here//////////
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
		overall_status : "requested",
		status : "available",
		pickup_time : req.body.pickup_time,
	}).save(function(err,object){
		if(err){
			res.json(err);
		}
		else{
			utils.log("Messenger","Envío:",JSON.stringify(object));
			res.json({status: true, message: "Pedido creado exitosamente.", response: object});
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
	//Verificamos que lleguen los 3 parámetros completos lat lon y distancia
	//Luego creamos el query de la manera adecuada para que la base de datos
	//Haga la búsqueda por proximidad
	if(req.params.lat && req.params.lon && req.params.maxDistance){
		var meters = parseInt(req.params.maxDistance);
		query.pickup_location = {
					$near:
					{
						$geometry:
						{
							type:"Point" ,
							coordinates :[
											req.params.lon, 
											req.params.lat
										]
						},
						$maxDistance:meters
					}
				};	
		query.overall_status = "requested";
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
				res.json({status: false, error: "not found"});
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
//Update*
exports.addPicToDeliveryItem = function(req,res){
/*Log*/utils.log("DeliveryItem/AddPic/"+req.params.delivery_id,"Recibo:",JSON.stringify(req.body));
	DeliveryItem.findOne({_id:req.params.delivery_id},exclude,function(err,object){
		if(!object){
			res.json({status: false, error: "not found"});
		}
		else{
			/*Log*/utils.log("DeliveryItem/AddPic/"+req.params.delivery_id,"Envio:",JSON.stringify(object));
			uploadImage(req.files.image,object,"gallery", 'delivery');
			res.json({status: true, response: 'update in progress, get doctor again to see results'})
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
	DeliveryItem.findOneAndUpdate({_id:req.params.delivery_id, status:"available"},
	   {$set:{
		   		messenger_id: req.body.messenger_info._id,
		   		messenger_info: req.body.messenger_info,
		   		status: "accepted",
		   		overall_status: "started"
		   	}}, 
	   function(err,object){
		   	if(!object){
			   	res.json({status: false, error: "No se encontró el DeliveryItem"});
		   	}
		   	else{
		   		utils.log("DeliveryItem/Accept","Envío:",JSON.stringify(object));
			   	res.json({status:true, message:"DeliveryItem aceptado exitosamente.", response:object});
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
	DeliveryItem.findOneAndUpdate({_id:req.params.delivery_id, status:"accepted", messenger_id:req.body.messenger_info._id},
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
						object.status = "returning";
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
					else if(object.status = "returning"){
						object.status = "returned";
						object.overall_status = "finished";
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
					object.status = "delivered";
					object.overall_status = "finished";
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
			   	if(object.status == "available"){
				   	//Este es el primer caso para la aceptación del servicio
				   	//El objeto delivery tendrá ahora el id del mensajero
				   	//y el objeto mensajero en su totalidad para ser mostrado
				   	//en la aplicación de usuario
					object.messenger_id = req.body.messenger_info._id;
			   		object.messenger_info = req.body.messenger_info;
			   		//También modificamos el estado del pedido para que este no sea
			   		//mostrado como disponible a otros mensajeros
			   		object.status = "accepted";
			   		object.overall_status = "started";
			   		//Procedemos a guardar con los datos modificados
					object.save(function(err, result){
						utils.log("DeliveryItem/Accept","Envío:",JSON.stringify(result));
						res.json({status:true, message:"DeliveryItem aceptado exitosamente.", response:result});
					});
					return;
			   	}
			   	//Este caso es cuando el mensajero ya aceptó el servicio 
			   	//y se encuentra en camino para recogerlo
			   	else if (object.status == "accepted"){
				   	//También modificamos el estado del pedido para que este no sea
			   		//mostrado como disponible a otros mensajeros
				   	object.status = "in-transit";
				   	object.save(function(err, result){
				   		utils.log("DeliveryItem/InTransit","Envío:",JSON.stringify(object));
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
						
						if(object.status == "in-transit"){
							object.status = "returning";
							object.save(function(err, result){
						   	utils.log("DeliveryItem/Returning","Envío:",JSON.stringify(object));
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
						else if(object.status = "returning"){
							object.status = "returned";
							object.overall_status = "finished";
							object.save(function(err, result){
						   	utils.log("DeliveryItem/Returned","Envío:",JSON.stringify(object));
								res.json({
											status:true, 
											message:"DeliveryItem ahora está returned.", 
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
						object.status = "delivered";
						object.overall_status = "finished";
						object.save(function(err, result){
						utils.log("DeliveryItem/Delivered","Envío:",JSON.stringify(object));
							res.json({
										status:true, 
										message:"DeliveryItem ahora está delivered.", 
										response:result
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
			   	if(object.status == "available"){
					res.json({status:false, message:"No se puede regresar en estado available"});
					return;
			   	}
			   	//En este caso, el mensajero tendrá acceso al deliveryitem pero no podrá 
			   	//regresar el status. Para regresar este status es necesario usar el servicio
			   	//de Abort
			   	else if (object.status == "accepted"){
				   	res.json({status:false, message:"No se puede regresar en estado accepted, usar el servicio Abort"});
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
						if(object.status == "in-transit"){
							object.status = "accepted";
							object.save(function(err, result){
								res.json({
											status:true, 
											message:"DeliveryItem ahora está accepted.", 
											response:result
										});
							});
						}
						//Si el item se encuentra en returning debemos setearlo como
						//in-transit
						else if(object.status == "returning"){
							object.status = "in-transit";
							object.save(function(err, result){
								res.json({
											status:true, 
											message:"DeliveryItem ahora está in-transit.", 
											response:result
										});
							});
						}
						else if(object.status == "returned"){
							object.status = "returning";
							object.overall_status = "started"
							object.save(function(err, result){
								res.json({
											status:true, 
											message:"DeliveryItem ahora está in-transit.", 
											response:result
										});
							});
						}
					}
					//Este caso indica que el item después de entregado NO debe regresar
				   	//al punto de partida
					else{
						if(object.status == "in-transit"){
							object.status = "accepted";
							object.save(function(err, result){
									res.json({
									status:true, 
									message:"DeliveryItem ahora está accepted.", 
									response:result
								});
							});
						}
						else if(object.status == "delivered"){
							object.status = "in-transit";
							object.overall_status = "started";
							object.save(function(err, result){
									res.json({
									status:true, 
									message:"DeliveryItem ahora está in-transit.", 
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
							messenger_id:req.body.messenger_info._id
						}, 
	   function(err,object){
		   	if(!object){
			   	res.json({status: false, error: "No se encontró el DeliveryItem"});
		   	}
		   	else{
			   	if(object.status = "accepted"){
					object.status = "available";
					object.overall_status = "requested";
					object.messenger_info = {};
					object.messenger_id = "";
					object.save(function(err, result){
				   	utils.log("DeliveryItem/Abort","Envío:",JSON.stringify(object));
						res.json({
									status:true, 
									message:"DeliveryItem ahora está available para el usuario y no está asignado a ningún mensajero.", 
									response:result
								});
					});
				}
				else{
					object.status = "aborted";
					object.overall_status = "aborted";
					object.messenger_info.abort_reason = req.body.messenger_info.abort_reason;
					object.save(function(err, result){
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
//Delete
exports.deleteDeliveryItem = function(req,res){
	utils.log("DeliveryItem/Delete/"+req.params.delivery_id,"Recibo:",JSON.stringify(req.body));
	DeliveryItem.findOne({_id:req.params.delivery_id,user_id:req.params.user_id},exclude,function(err,object){
		if(!object){
			res.json({status: false, error: "not found"});
		}
		else{
			if(object.status == "available"){
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
			else if(object.status == "accepted"){
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
		}
	});
	
};
//////////////////////////////////////
//End of Messenger CRUD////////////////////
//////////////////////////////////////

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
//Send Push Notification//////////
//////////////////////////////////
exports.sendPush = function (req,res){
var android = req.body.android ? true:false;
var ios = req.body.ios ? true:false;
	Admin.findOne({_id:req.body.admin_id}, function(err,admin){
		if(!admin){
			
		}
		else{
			new Push({
			message: req.body.message,
			app_id:req.body.app_id,
			date:new Date(),
			sent_by:admin,
			android:android,
			ios:ios,
			delivered_qty_ios: ios ? req.body.delivered_qty_ios:0,
			delivered_qty_android: android ? req.body.delivered_qty_android:0,
			}).save(function(err,push){
				if(err){
					res.json({response:"error creating push on DB", error:err});
				}
				else{
				if(ios){
					PushToken.find({app_id:req.body.app_id, device_brand:"Apple"},{ push_token: 1, _id: 0 }, function(err,pushtokens){
						if(pushtokens.length<=0){
						}
						else{
							App.findOne({_id:req.body.app_id}, function(err,app){
								var extension = ".pem";
								var carpeta = app.is_development ? "push_certs/dev/":"push_certs/prod/";
								var url = app.is_development ? 'gateway.sandbox.push.apple.com':'gateway.push.apple.com';
								var cert = carpeta+app.ios_cert+extension;
								var key =  carpeta+app.ios_cert_key+extension;
								var tokens_array = new Array();
								for(var i=0;i<pushtokens.length;i++){
									tokens_array.push(pushtokens[i].push_token);
								}
								var service = new apn.connection({ gateway:url, cert:cert, key:key});

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
								
								// If you plan on sending identical paylods to many devices you can do something like this.
								pushToManyIOS = function(tokens) {
								    var note = new apn.notification();
								    note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
									note.badge = 0;
									note.sound = "ping.aiff";
									note.alert = req.body.message;
									note.payload = {'action': "no action"};
								    service.pushNotification(note, tokens);
								}
								pushToManyIOS(tokens_array);
								//console.log("enviar push a: "+tokens_array);
							});
						}
					});
				}
				if(android){
					PushToken.find({app_id:req.body.app_id, device_brand:"Android"}, function(err,pushtokens){
						if(pushtokens.length<=0){
						}
						else{
							// or with object values
							App.findOne({_id:req.body.app_id}, function(err,app){
							if(app){
									var message = new gcm.Message({
									    collapseKey: 'demo',
									    delayWhileIdle: true,
									    timeToLive: 3,
									    data: {
									        key1: 'message1',
									        key2: 'message2'
									    }
									});
									
									var sender = new gcm.Sender(app.gcm_apikey);
									var registrationIds = [];
									
									// OPTIONAL
									// add new key-value in data object
									//message.addDataWithKeyValue('key1','message1');
									//message.addDataWithKeyValue('key2','message2');
									
									// or add a data object
									message.addDataWithObject({
									    message: req.body.message,
									    app_name: app.name,
									});
									
									message.collapseKey = 'demo';
									message.delayWhileIdle = true;
									message.timeToLive = 3;
									// END OPTION
									
									// At least one required
									for(var i=0;i<pushtokens.length;i++){
										registrationIds.push(pushtokens[i].push_token);		
									}					
									/**
									 * Params: message-literal, registrationIds-array, No. of retries, callback-function
									 **/
									sender.send(message, registrationIds, 4, function (err, result) {
									    console.log(result);
									});
								}
							});
						}
					});
				}
					res.format({
						html: function () { res.redirect('/Dashboard/'+req.body.admin_id); },
						json: function () { res.send(); },
					});
				}
			});
		}
	});
};
//////////////////////////////////
//End of Send Push Notification///
//////////////////////////////////

/////////////////////////////////
//Functions//////////////////////
/////////////////////////////////
//Image Uploader*//
var uploadImage = function(file,object,type,owner){
	//Verificamos que llegue archivo adjunto
	if(!file){
		object.profile_pic = {name:"", image_url: ""};
		object.save(function(err,obj){
		});
		console.log('No hay archivo');
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
				console.log("Objeto: "+object.email);
				var req = client.put(owner+'/'+object.email+'/'+type+"/"+file.name, {
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
						owner: owner,
						owner_id: object._id,
						type: type,
						size:file.size,
					}).save(function(err,image){	
						if(err){
						}
						else{
							
							//Procedemos a actualizar el objeto doctor, hospital, o seguro
							//Al cual se le haya agregado la imagen
							//El doctor tiene 2 tipos de imágenes. Perfil, y galería.
							if(owner=="doctor"){
								if(type=="profile"){
									object.profile_pic = {name:image.name, image_url: image.url, id: image._id};
									object.save(function(err,doctor){
											return {status: true, response: {image_url:image.url}};
									});
								}
								else if(type=="gallery"){
									Doctor.findOneAndUpdate(
									    {_id: object._id},
									    {$push: {gallery: {image_url:image.url, name:file.name, id: image._id}}},
									    {safe: true, upsert: true},
									    function(err, doctor) {
									        console.log("Doctor: "+doctor);
									    }
									);
								}
							}
							
							//Los hospitales y seguros sólo tienen foto de perfil
							else if(owner == "hospital" || owner == "insurancecompany"){
								if(type=="profile"){
									object.logo = {name:image.name, image_url: image.url, id: image._id};
									object.save(function(err,doctor){
											return {status: true, response: {image_url:image.url}};
									});
								}
							}						
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
	}
	
	if (/like Mac OS X/.test(ua)) {
		console.log("Caso MACOSX");
	    res.redirect('doclinea://email_verification?email='+data.email+'&type='+data.type);
	    return;
	}
	
	if (/Android/.test(ua)){
		console.log("Caso Android");
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
	}
	
	if (/like Mac OS X/.test(ua)) {
		console.log("Caso MACOSX");
	    res.redirect('doclinea://password_redirect?token='+req.params.token+'&type='+req.params.type+'&request='+req.params.request+'&email='+req.params.email);
	}
	
	if (/Android/.test(ua)){
		console.log("Caso Android");
	}
	
	if (/webOS\//.test(ua)){
		console.log("Caso WEBOS");
	}
	
	if (/(Intel|PPC) Mac OS X/.test(ua)){
		console.log("Caso INTEL PPC MAC");
		res.redirect('http://'+webapp+'/#/NewPassword/'+req.params.token+'/'+req.params.type+'/'+req.params.request+'/'+req.params.email);
	}
	
	if (/Windows NT/.test(ua)){
		console.log("Caso Windows");
	}
};
/////////////////////////////////
//End of Password Redirect///////
/////////////////////////////////