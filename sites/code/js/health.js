if(!window.modules) window.modules={};
window.healthColors={
	profile:'rgb(178,102,255)',
	culture:'rgb(127,0,255)',
	play:'rgb(20,0,204)',
	gift:'rgb(255,152,0)'
}
modules.health=window.health=function(opts){
	var self=this;
	if(!opts.ele) return console.warn('No element passed!');
	self.ele=opts.ele;
	if(!opts) opts={};
	self.options=$.extend(true,{},{
		border:10,
		//width:50,
		//healthBorder:'black',
		colors:window.healthColors
	},opts);
	this.init=function(){
		self.ele.html('<div style="position:absolute;top:0;left:0;right:0;bottom:0;z-index:1;"><canvas style="width:100%;height:100%"></canvas></div>');
		self.resize();
		self.render();
	}
	this.resize=function(){
		self.canvas = self.ele.find('canvas')[0];
		self.context=self.canvas.getContext('2d');
		self.canvas.width=self.ele[0].offsetWidth;
		self.canvas.height=self.ele[0].offsetHeight;
		self.canvas.style.width=self.ele[0].offsetWidth+'px';
		self.canvas.style.height=self.ele[0].offsetHeight+'px';
		self.width=self.ele.width();
		self.height=self.ele.height();
		if(self.options.width){
			self.center=self.options.width;
		}else{
			self.center=((self.width>self.height)?self.height:self.width)/2;
		}
		self.baseRadius=(self.center-2*self.options.border)/2;
		self.center=self.center/2
		//self.radius=self.canvas.height*self.options.radius;
	}
	this.render=function(){
		var startingPoint = 0; 
		var percent=(100/Object.keys(self.options.health).length)
		self.context.beginPath();  
		self.context.fillStyle = 'white';
		self.context.moveTo(self.center,self.center);
		self.context.arc( self.center,self.center, self.baseRadius+(self.options.border), 0, 2 * Math.PI );
		self.context.fill(); 
		for (var key in self.options.health) {
			var data=self.options.health[key];
			var endPoint = startingPoint + ( 2 / 100 * percent ); 
			self.context.beginPath();  
			self.context.fillStyle = self.options.colors[key];
			self.context.moveTo(self.center,self.center);
			self.context.arc( self.center,self.center, self.baseRadius+(self.options.border*data/100), startingPoint * Math.PI, endPoint * Math.PI );
			self.context.fill(); 
			startingPoint=endPoint;
		}
		if(self.options.healthBorder){
			self.context.beginPath();  
			self.context.fillStyle = self.options.healthBorder;
			self.context.arc( self.center,self.center, self.baseRadius+(self.options.border)-1, 0, 2 * Math.PI );
			self.context.stroke(); 
		}
	}
	this.destroy=function(){
		//if(!self.options.static) self.stop();//stop animation...
	}
	self.init();
};