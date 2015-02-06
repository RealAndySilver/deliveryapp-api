var bcrypt = require('bcrypt');
exports.passwordEncrypt = function (req, res, next) {
	if(req.body.password){
		req.body.password = encrypt(req.body.password);
		if(req.body.new_password){
			req.body.new_password = encrypt(req.body.new_password);
		}
	}
	next(); 
};
exports.decodeBase64 = function(data){
	return new Buffer(data, 'base64').toString();
};
exports.base64 = function(data){
	return new Buffer(data).toString('base64');
};
var encrypt = function(data){
	var bcrypt = require('bcrypt');
	// Generate a salt
	var salt = bcrypt.genSaltSync(10);
	// Hash the password with the salt
	var result = bcrypt.hashSync(data, salt);
	return result;
};
exports.encrypt = function(data){
	return encrypt(data);
};
exports.compareHash = function (password_in, hash) {
	return bcrypt.compareSync(password_in, hash);		
};