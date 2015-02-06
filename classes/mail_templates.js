exports.doctor_new_account = function(object,url) {
	var result = "Estimado (a) Doctor(a)  "+ object.name+" "+object.lastname+"<br>"+

	"<p>Gracias por ser parte de DocLinea.  </p>"+
	"<p>A través de nuestra tecnología, usted brindará una mejor experiencia de atención en salud para sus pacientes.</p>"+
	"<p>Con DocLinea:</p>"+
	"<ul>"+
	"<li>Aumentará el número de pacientes en su consultorio.</li>"+
	"<li>Tendrá una agenda online, en la cual puede administrar sus citas sin complicaciones, desde cualquier lugar y en cualquier momento</li>"+
	"<li>Sus pacientes podrán reservar citas las 24 horas / 7 días de la semana</li>"+
	"<li>Podrá cancelar y reprogramar sus citas.</li>"+
	"<li>Tendrá alertas en sus dispositivos móviles, como citas canceladas o reprogramadas</li>"+
	"<li>Tendrá un perfil personalizado con sus credenciales profesionales</li>"+
	"<li>Sus pacientes podrán ubicarlo fácilmente a través de nuestra tecnología de geolocalización</li>"+
	"<li>Sus pacientes recibirán recordatorios  de las citas  programadas, reduciendo así  la tasa de ausencias</li>"+
	"<li>Sus citas canceladas a última hora pueden ser reagendadas fácilmente por la disponibilidad 24/7</li>"+
	"</ul>"+
	"</p>"+

	"<p>Su Usuario:</p>"+
	object.email+"<br>"+
	"<a href="+url+">Ver Agenda</a>.<br>"+
	"Saludos! Tu equipo DocLinea";
	return result;
}
exports.user_new_account = function(object,url) {
	var result = "Hola "+object.name+". <br>DocLinea te permite encontrar y reservar citas con Doctores <b>al instante, en línea, cerca de ti y totalmente Gratis!</b><br> Con DocLinea puedes visualizar, reprogramar o cancelar tus citas en cualquier momento, 24 horas/ 7 días a la semana.<br> Tu Usuario: "+ object.email+"<br> Reserva ya tu próxima cita médica! <a href='"+url+"'> Doclinea </a><br>Saludos! Tu Equipo DocLinea";
	return result;
}

exports.email_verification = function(object,url) {
	var result = "Hola "+object.name+"!. <br>Estás a solo un paso de ser parte de DocLinea!  Verifica tu cuenta haciendo click en el siguiente botón:<br> <a href='"+url+"'> Verificar </a><br>Saludos! Tu equipo DocLinea.";
	return result;
}