
exports.uploadImage = function(file,delivery_object){
	//Verificamos que llegue archivo adjunto
	if(!file){
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
	console.log("name:"+file.path)
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
				console.log("Objeto: "+delivery_object.messenger_info.email);
				var req = client.put(delivery_object.user_info.email+'/'+delivery_object.messenger_info.email+'/'+delivery_object.status+"/"+file.name, {
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
					}).save(function(err,image){	
						if(err){
						}
						else{
							delivery_object.images.push({
															name:image.name, 
															image_url:image.url, 
															id: image._id,
															delivery_status: delivery_object.status,
														});
														
							delivery_object.save(function(err,result){
									return {status: true, response: {image_url:image.url}};
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