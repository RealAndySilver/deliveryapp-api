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
exports.user_new_account = function(object,url) {
	var result = "Hola "+object.name+". <br>Mensajería te permite encontrar mensajeros <b>al instante, en línea, cerca de ti!</b><br> Tu Usuario: "+ object.email+"<br> Agenda ya tu próximo envío <a href='"+url+"'> Mensajería </a><br>Saludos! La App de Mensajería";
	return result;
}

exports.email_verification = function(object,url) {
	var result = "Hola "+object.name+"!. <br>Estás a solo un paso de ser parte de Mensajería!  Verifica tu cuenta haciendo click en el siguiente botón:<br> <a href='"+url+"'> Verificar </a><br>Saludos! La App de Mensajería :).";
	return result;
}