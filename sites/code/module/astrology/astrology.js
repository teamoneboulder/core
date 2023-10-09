if(!window.modules) window.modules={};
modules.astrology=function(opts){
	var self=this;
	self.options=opts;
	$const.tlong = -105.270546; // longitude boulder
	$const.glat = 40.014984; // latitude
	this.inRetrograde=function(body,date,last,data){
		date.hours=0;
		$processor.calc(date, $moshier.body[body]);
		var pos_1=$.extend(true,{},$moshier.body[body].position.rect);
		var epos_1=$.extend(true,{},$moshier.body.earth.position.rect);
		date.hours=1;//change 1 hour, less likely to hit inflection points
		$processor.calc(date, $moshier.body[body]);
		var pos_2=$.extend(true,{},$moshier.body[body].position.rect);
		var epos_2=$.extend(true,{},$moshier.body.earth.position.rect);
		var t1=self.getTheta(pos_1,epos_1);
		var t2=self.getTheta(pos_2,epos_2);
		if(t2<t1){
			if(typeof last!='undefined'){
				if(!last){//start
					if(!data[body]) data[body]=[];
					data[body].push({
						start:$.extend(true,{},date)
					});
				}
			}
			return true;
		}else{
			if(typeof last!='undefined'){
				if(last){//end
					data[body][data[body].length-1].end=$.extend(true,{},date)
				}
			}
			//console.log('non retrograde',date)
			return false;
		}
	}
	this.convertTime=function(js_date){
		return {year: js_date.getFullYear(), month: (js_date.getMonth()+1), day: js_date.getDate(), hours: js_date.getHours(), minutes: js_date.getMinutes(), seconds: js_date.getSeconds()}
	}
	this.getSolarSystem=function(date){
		console.time('getSolarSystem')
		if(!date) date=new Date();
		var planets=['mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto'];
		var data={};
		$.each(planets,function(i,body){
			$processor.calc(self.convertTime(date), $moshier.body[body]);
			data[body]=$moshier.body[body].position.rect;
		})
		console.timeEnd('getSolarSystem')
		return data;
	}
	this.getPlanetaryRetrogrades=function(year){
		console.time('getPlanetaryRetrogrades')
		var planets=['mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto','chiron','sirius'];
		var data={};
		$.each(planets,function(i,v){
			var date={year: year, month: 1, day: 1, hours: 0, minutes: 0, seconds: 0}
			data=self.getRetrogradeBoundary(v,date,data);
		})
		console.log(data);
		console.timeEnd('getPlanetaryRetrogrades')
	}
	this.getRetrogradeBoundary=function(planet,date,data){
		var mc=1;
		var last=false;
		while(mc<=12){
			var dc=1;
			date.month=mc;
			while(dc<29){
				date.day=dc;
				last=self.inRetrograde(planet,date,last,data);
				dc++;
			}
			mc++;
		}
		return data;
	}
	this.getTheta=function(planet,earth){
		var diff={
			x:planet[0]-earth[0],
			y:planet[1]-earth[1],
			z:planet[2]-earth[2]
		}
		return Math.atan2(diff.y,diff.x);
	}
	if(!$processor.initd){
		$processor.init();
		$processor.initd=1
	}
}