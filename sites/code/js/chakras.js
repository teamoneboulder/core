// if(!window.bindings) window.bindings={};//will be depreciated
// bindings.chakras=function(context,ele,options){
// 	console.log(context,ele,options)
// 	if(context){
// 		context.register(new window.chakras($(ele),options));
// 		// context.on('destroy',function(){
// 		// 	console.log('=========> context destroyed!');
// 		// 	method.destroy();
// 		// 	method=false;//clean up!
// 		// })
// 	}else{
// 		var method=new window.chakras($(ele),options);
// 		console.warn('no context passed!');
// 	}
// };
if(!window.modules) window.modules={};
modules.chakras=window.chakras=function(opts){
	var self=this;
	self.ele=opts.ele;
	if(!opts) opts={};
	self.options=$.extend(true,{},{
		background:'https://www.womenfitness.net/wp/wp-content/uploads/2016/10/chakras.jpg',
		hara:.5,
		radius:(opts.equalDistribution)?(1/16):.06,
		order:['crown','thirdeye','throat','heart','solarplexus','sacral','root'],
	  	chakras:{
	  		crown:{
			  	intensity:7,
			  	rate:2000,
			  	y:(opts.equalDistribution)?(1/8):.105,
			  	color:[178,102,255]
			},
			thirdeye:{
			  	intensity:7,
			  	rate:2000,
			  	y:(opts.equalDistribution)?(2/8):.21,
			  	color:[127,0,255],
			},
			throat:{
			  	intensity:7,
			  	rate:2000,
			  	y:(opts.equalDistribution)?(3/8):.3755,
			  	color:[0,0,204],
			},
			heart:{
			  	intensity:7,
			  	rate:2000,
			  	y:(opts.equalDistribution)?(4/8):.52,
			  	color:[69, 125, 22],
			},
			solarplexus:{
			  	intensity:7,
			  	rate:2000,
			  	y:(opts.equalDistribution)?(5/8):.64,
			  	color:[255,223,0],
			},
			sacral:{
			  	intensity:7,
			  	rate:2000,
			  	y:(opts.equalDistribution)?(6/8):.79,
			  	color:[255,152,0],
			},
			root:{
			  	intensity:7,
			  	rate:2000,
			  	y:(opts.equalDistribution)?(7/8):.94,
			  	color:[204, 0, 0],
			}
	  	}
	},opts);
	this.init=function(){
		if(self.options.background!='transparent'){
			self.ele.css('background','black');
			self.ele.html('<div style="position:absolute;top:0;left:0;right:0;bottom:0;z-index:1;background-image:url('+self.options.background+');background-repeat:no-repeat;background-size: auto 100%;background-position:center;"></div><div style="position:absolute;top:0;left:0;right:0;bottom:0;z-index:2;"><canvas style="width:100%;height:100%"></canvas></div>');
		}else{
			self.ele.html('<div style="position:absolute;top:0;left:0;right:0;bottom:0;z-index:1;"><canvas style="width:100%;height:100%"></canvas></div>');			
		}
		self.start();
	}
	this.start=function(){
		self.resize();
		if(self.options.static){
			self.render();
		}else{
			self.running=true;
			self.frames=requestAnimationFrame(function(ts){
				self.render(ts);
			});
		}
		if(self.options.fullWindow) window.addEventListener("resize",self.resize);
	}
	this.resize=function(){
		self.canvas = self.ele.find('canvas')[0];
		self.context=self.canvas.getContext('2d');
		self.canvas.width=self.ele[0].offsetWidth;
		self.canvas.height=self.ele[0].offsetHeight;
		self.canvas.style.width=self.ele[0].offsetWidth+'px';
		self.canvas.style.height=self.ele[0].offsetHeight+'px';
		self.width=parseInt(self.ele[0].offsetWidth,10);
		self.height=parseInt(self.ele[0].offsetHeight,10);
		self.radius=self.canvas.height*self.options.radius;
	}
	this.set=function(chakra,opts){
		if(!self.options.chakras[chakra]) return console.warn('Invalid Chakra ['+chakra+']');
		self.options.chakras[chakra]=$.extend(true,{},self.options.chakras[chakra],opts);
		if(self.options.static){
			self.render();
		}
	}
	this.stop=function(){
		if(self.frame){
			cancelAnimationFrame(self.frame);
			self.last=false;
		}
		if(self.running&&self.options.fullWindow){
			window.removeEventListener("resize",self.resize);
		}
		self.running=false;
	}
	this.render=function(highResTimestamp){
		// if(window.phi&&phi.animating){//dont do any drawing when animating
		// 	if(!self.options.static){
		// 		self.frame=requestAnimationFrame(function(ts){
		// 			self.render(ts);
		// 		});
		// 	}
		// 	return false;
		// }
		if(highResTimestamp){
			if(!self.renderStart) self.renderStart=highResTimestamp;
			var t=highResTimestamp-self.renderStart;
		}else{
			var t=0;
		}
		//clear last frame
		//clear around the hara line
		var xCenter=self.width*self.options.hara;//could be different
		self.context.clearRect(xCenter-self.radius, 0, xCenter+self.radius, self.height);
		var circles=self.getCircles(t);
		if(circles.length){
			for (var i = 0; i < circles.length; i++) {
				var circle=circles[i];
				var chakra=self.options.chakras[circle.chakra];
				var yCenter=self.height*chakra.y;
				self.context.beginPath();
			    self.context.arc(xCenter, yCenter, circle.radius, 0, Math.PI * 2);
			    if(circle.background) self.context.fillStyle = "rgba(255, 255, 255, "+circle.opacity+")";
			    else self.context.fillStyle = "rgba("+chakra.color[0]+", "+chakra.color[1]+", "+chakra.color[2]+", "+circle.opacity+")";
			    self.context.fill();
			};
		}
		if(!self.options.static){
			self.frame=requestAnimationFrame(function(ts){
				self.render(ts);
			});
		}
	}
	this.destroy=function(){
		if(!self.options.static) self.stop();//stop animation...
		//self.ele.children().remove();//will always be within a view
	}
	this.getCircles=function(t){
		var circles=[];
		//add white bg
		for (var i = 0; i < self.options.order.length; i++) {
			var id=self.options.order[i];
			circles.push({
				chakra:id,
				background:true,
				radius:self.radius,
				opacity:1
			})
		}
		for (var i = 0; i < self.options.order.length; i++) {
			var id=self.options.order[i];
			var chakra=self.options.chakras[id];
			if(chakra.intensity&&chakra.rate){
				var c=0;
				if(self.options.static){
					circles.push({
						chakra:id,
						radius:self.radius,
						opacity:chakra.intensity/10
					})
				}else{
					while(c<chakra.intensity){
						var cycles=(t+(c*(chakra.rate/chakra.intensity)))/chakra.rate;
						var percentComplete = cycles - Math.floor(cycles)
						var radius=self.radius*percentComplete;
						circles.push({
							chakra:id,
							radius:radius,
							opacity:1-percentComplete
						})
						c++;
					}
				}
			}
		};
		return circles;
	}
	self.init();
};