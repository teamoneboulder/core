var SunCalc = require('suncalc');
var date = new Date(parseInt(process.argv[2],10));
var data={
	solar:{
		times:SunCalc.getTimes(date,parseFloat(process.argv[3]), parseFloat(process.argv[4])),
		position:SunCalc.getPosition(date, parseFloat(process.argv[3]), parseFloat(process.argv[4]))
	},
	moon:{
		times:SunCalc.getMoonTimes(date, parseFloat(process.argv[3]), parseFloat(process.argv[4])),
		position:SunCalc.getMoonPosition(date, parseFloat(process.argv[3]), parseFloat(process.argv[4])),
		illumination:SunCalc.getMoonIllumination(date)
	}
}
console.log(JSON.stringify(data));
process.exit(0);