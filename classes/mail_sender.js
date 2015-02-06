var nodemailer = require('nodemailer');
var transport = nodemailer.createTransport("SMTP", {
        service: 'Gmail',
        auth: {
            user: "support@iamstudio.co",
            pass: "watashiwa1"
        }
});

var message = function(subject,the_message,mail_address){
		result={
			    from: 'Doclinea <recover@doclinea.com>',
			    to: '<'+mail_address+'>',
			    subject: subject,
			    headers: {
			        'X-Secure-level': 1000
			    },
			    text: the_message,
			    html:the_message
		    };
	   return result;
};
exports.send= function(subject,the_message,mail_address){
	transport.sendMail(message(subject,the_message,mail_address), function(err){
	    if(err){
	        //res.json({status:0,message:'error',error:err})
	        console.log(err.message);
	        return;
	    }
	    console.log('Message sent successfully to '+mail_address);
	    //res.json({status:1,message:'mail sent',error:0});
	    // if you don't want to use this transport object anymore, uncomment following line
	    //transport.close(); // close the connection pool
	});
};
