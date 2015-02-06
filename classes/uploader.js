var tmp_path_image_url = req.files.image_url.path;
										var tmp_path_thumb_url = req.files.thumb_url.path;
									    var extension1 =".jpg";
									    var extension2 =".jpg";
									    if(req.files.image_url.type=="image/png"){
									    	extension1=".png";
									    }
									    if(req.files.image_url.type=="image/png"){
									    	extension2=".png";
									    }
								    	var target_path_image_url = './public/images/' + atom._id + "image_url" + extension1;
								    	var target_path_thumb_url = './public/images/' + atom._id + "thumb_url" + extension2;
									    // move the file from the temporary location to the intended location
									    
									    var final_image_url=req.body.previous_image_url;
									    var final_thumb_url=req.body.previous_thumb_url;
									    
									    if(req.files.image_url.size>0){
											fs.rename(tmp_path_image_url, target_path_image_url,function(err){
										        if (err) throw err;
										        final_image_url=image_url_prefix + atom._id + "image_url" + extension1;
										        // delete the temporary file
										        //fs.unlink(target_path_image_url, function(){});
										    });
										}
										if(req.files.thumb_url.size>0){
											fs.rename(tmp_path_thumb_url, target_path_thumb_url,function(err){
										        if (err) throw err;
										        final_thumb_url=image_url_prefix + atom._id + "thumb_url" + extension2;
										        // delete the temporary file
										        //fs.unlink(target_path_image_url, function(){});
											});
										}
									    
									    Atom.findOneAndUpdate({_id:atom.id},{$set:{image_url: final_image_url,
										    									   thumb_url: final_thumb_url}
										    								},
										    								function(err,atom){
										    								res.format({			
																				html: function () { res.redirect('/ItemDashboard/'+req.body.menu_item_id+'/'+req.body.app_id+'/'+req.body.admin_id); },
																				json: function () { res.send(atom); },
																			});	
										});
										function uploadImage(file,name,atom_id,previous_url){
	var tmp_path_image_url = file.path;
    var extension =".jpg";
    if(file.type=="image/png"){
    	extension=".png";
    }
	var target_path_image_url = './public/images/' + atom_id + name + extension;
    // move the file from the temporary location to the intended location
    
    var final_image_url=previous_url;
    
    if(file.name.size>0){
		fs.rename(tmp_path_image_url, target_path_image_url,function(err){
	        if (err) throw err;
	        final_image_url=image_url_prefix + atom_id + name + extension;
	        // delete the temporary file
	        //fs.unlink(target_path_image_url, function(){});
	    });
	}
	return final_image_url;
}