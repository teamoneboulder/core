var GooglePlaces = require("googleplaces");
var googlePlaces = new GooglePlaces(process.env.GOOGLE_PLACES_API_KEY, 'json');
function createTiles(){
	var rastersize={lat:{min:-85,max:85},lng:{min:-180,max:180}};
	var size=1;//1 latlng deg
	var tiles=[];
	var lata=0;
	while((rastersize.lat.min+lata)<rastersize.lat.max){
		var lnga=0;
		while((rastersize.lng.min+lnga)<rastersize.lng.max){
			tiles.push({sw:{lat:(rastersize.lat.min+lata),lng:(rastersize.lng.min+lnga)},ne:{lat:(rastersize.lat.min+lata+size),lng:(rastersize.lng.min+lnga+size)}});
			lnga=lnga+size;
		}
		lata=lata+size;
	}
	return tiles;
}
var tiles=createTiles();

// parameters = {
//         location: [-33.8670522, 151.1957362],
//     types: "doctor"
// };
// googlePlaces.placeSearch(parameters, function (error, response) {
//     if (error) throw error;
//     console.log(response)
// })