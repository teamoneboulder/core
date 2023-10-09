$(function(){
	$.fn.animatedText=function(opts){
		var self=this;
		if(typeof opts=='string'){
			switch(opts){
				case 'destroy':
					var to=self.data('timeout');
					if(to) clearTimeout(to);
				break;
			}
			return false;
		}
		var mw = w=$(this).width()
		var mh = h=$(this).height();
		//stops
		var gs1 = 0;
		var gs2 = 1/5
		var gs3 = 2/5
		var gs4 = 3/5
		var gs5 = 4/5
		var gs6 = 1
		var id=Math.uuid(8);
		$(this).append('<canvas id="'+id+'" style="position:absolute;top:0;left:0;z-index:1000"></canvas>');
		var canvas=$(this).find('#'+id)[0];
		var context = canvas.getContext("2d"); 
		canvas.setAttribute('width', mw);
		canvas.setAttribute('height', mh);
		//set dpi
		var devicePixelRatio = window.devicePixelRatio || 1
		var cw=mw*devicePixelRatio
		var ch=mh*devicePixelRatio;
		canvas.width = cw;
		canvas.height = ch;
		canvas.style.width = mw+"px";
		canvas.style.height = mh+"px";
		function canvasApp() {
			var message = (opts.message)?opts.message:"< < <  Swipe  > > >";
			function drawScreen() {
				//clear
				context.clearRect(0, 0, cw, ch);
				//Background
				
				// context.fillStyle = "rgba(0, 0, 0, 0.4)";
				// context.fillRect(0, 0, canvas.width, canvas.height);
				//Text
				var fontSize=(opts.fontSize)?opts.fontSize:30;
				context.font = (fontSize*devicePixelRatio)+"px 'Sans Serif, Ariel'" 
				context.textAlign = "center";
				context.textBaseline = "middle";
				
				var metrics = context.measureText(message);
				var textWidth = metrics.width;
				var xPosition = cw*.5;
				var yPosition = ch*.5;
				if(!opts.direction||opts.direction=='horizontal') var gradient = context.createLinearGradient( 0,0,cw,0);
				else if(opts.direction=='vertical') var gradient = context.createLinearGradient( 0,0,0,ch);
				for (var i=0; i < colorStops.length; i++) {
					var tempColorStop = colorStops[i];
					var tempColor = tempColorStop.color;
					var tempStopPercent = tempColorStop.stopPercent;
					gradient.addColorStop(tempStopPercent,tempColor);
					tempStopPercent += .015;
					if (tempStopPercent > 1) {
						tempStopPercent = 0;
					}
					tempColorStop.stopPercent = tempStopPercent;;
					colorStops[i] = tempColorStop;
				}
				
				
				context.fillStyle    = gradient;
				context.fillText  ( message,  xPosition ,yPosition);	
			
			
			}
			
			function gameLoop() {
				self.data('timeout',window.setTimeout(gameLoop, 20));
				drawScreen()	
			}
			var colorStops = [
				{color:"rgba(255,255,255,1)", stopPercent:gs1},
				{color:"rgba(200,200,200,.8)", stopPercent:gs2},
				{color:"rgba(200,200,200,.6)", stopPercent:gs3},
				{color:"rgba(200,200,200,.6)", stopPercent:gs4},
				{color:"rgba(200,200,200,.8)", stopPercent:gs5},
				{color:"rgba(255,255,255,1)", stopPercent:gs6}
			];
			gameLoop();
			
		}
		canvasApp();
	}
})
