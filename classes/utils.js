exports.remove_empty = function trim_nulls(data) {
  var y;
  for (var x in data) {
    y = data[x];
    if (y==="null" || y===null || y==="" || typeof y === "undefined" || (y instanceof Object && Object.keys(y).length == 0)) {
      delete data[x];
    }
    if (y instanceof Object) y = trim_nulls(y);
  }
  return data;
};

var isJson = exports.isJson = function(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
};

exports.regexForString = function (string){
	return { $regex: string, $options: 'i' };
};

exports.convertInGeoObject = function (location){
	var returningLocation = {};
	var coordinates = [];
	if(location.lat && location.lon){
		coordinates.push(location.lon);
		coordinates.push(location.lat);
		returningLocation = {type:'Point', coordinates: coordinates};
	}
	return returningLocation;
};

exports.log = function(service_name, request, json){
	//console.log(new Date().toISOString()+": "+service_name.blue +" "+ request.green+" "+ json.cyan);	
};