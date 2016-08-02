var fs = require('fs');
var HTML_TEMPLATES={};

var initHtmlTemplates=function () {
	fs.readFile('./public/html_templates/new_messenger_email.html','utf8', function (err, html) {
		if (err) {
			throw err;
		}
		//console.log(html);
		HTML_TEMPLATES.NEW_MESSENGER=html;
		//console.log(HTML_TEMPLATES.NEW_MESSENGER);
	});

};

initHtmlTemplates();

exports.doctor_new_account = function(object,url) {
	var result = "Estimado (a) Mensajero(a)  "+ object.name+" "+object.lastname+"<br>"+

	"<p>Gracias por ser parte de La App de Mensajería.  </p>"+
	"<p>A través de nuestra tecnología, usted brindará una mejor experiencia en servicio de mensajería.</p>"+
	"<p>Con La App de Mensajería:</p>"+
	"<ul>"+
	"<li>Aumentará el número de clientes.</li>"+
	"<li>Tendrá una listado online, en la cual puede visualizar sus pedidos sin complicaciones, desde cualquier lugar y en cualquier momento</li>"+
	"<li>Tendrá alertas en sus dispositivos móviles, como pedidos cancelados.</li>"+
	"<li>Tendrá un perfil personalizado con su información profesional</li>"+
	"<li>Buscar clientes fácilmente a través de nuestra tecnología de geolocalización</li>"+
	"</ul>"+
	"</p>"+

	"<p>Tu Usuario:</p>"+
	object.email+"<br>"+
	"<a href="+url+">Ver Pedidos Disponibles</a>.<br>"+
	"Saludos! La App de Mensajería";
	return result;
}

exports.messenger_new_account = function (messenger,url,logoUrl){
	var newMessage=HTML_TEMPLATES.NEW_MESSENGER.replace('@LOGO_URL',logoUrl);
	newMessage=newMessage.replace('@DOCS_URL',url);
	newMessage=newMessage.replace('@MESSENGER_NAME',messenger.name+' '+messenger.lastname);
	return newMessage;
}

exports.user_new_account = function(object,url) {
	var result = "Hola "+object.name+". <br>Vueltap te permite encontrar mensajeros <b>al instante, en línea, cerca de ti!</b><br> Tu Usuario: "+ object.email+"<br> Agenda ya tu próximo envío <a href='"+url+"'> Vueltap </a><br>Saludos! La App de Vueltap";
	return result;
}

exports.email_verification = function(object,url) {
	var result = "Hola "+object.name+"!. <br>Estás a solo un paso de ser parte de Vueltap!  Verifica tu cuenta haciendo click en el siguiente botón:<br> <a href='"+url+"'> Verificar </a><br>Saludos! La App de Vueltap :).";
	return result;
}

exports.payment_rejected_email = function(user,dlvrItem) {
	var result = "Hola "+user.name+"!. <br>Se presento un error procesado el pago de tu servicio "+
		dlvrItem.item_name+" por valor de "+dlvrItem.price_to_pay+
		"<br>Tu cuenta ha sido desactivada <br>Saludos! La App de Vueltap :).";
	return result;
}