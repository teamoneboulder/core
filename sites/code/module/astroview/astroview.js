if(!window.modules) window.modules={};
modules.astroview=function(opts){
	var self=this;
	self.options=opts;
	this.show=function(){
		$('body').render({
			template:'modules_astroview_page',
			binding:function(ele){
				self.ele=ele;
				TweenLite.to($('#wrapper'),.3,{scale:.7})
				TweenLite.to(ele,.3,{opacity:1,onComplete:function(){
					self.loadCanvas();
					ele.find('.timeselect').stap(function(){
						var menu=new modules.inlinemenu({
                            ele:ele,
                            button:$(this),
                            menu:[{
                                id:'all',
                                name:'All Notifications',
                                icon:'icon-globe'
                            },{
                                id:'blog',
                                name:'Blog Notifications',
                                icon:'icon-blog'
                            }]
                        });
                        menu.show();
					},1,'tapactive')
					ele.find('.x_closer').stap(function(){
						self.close();
					},1,'tapactive')
				}})
			}
		})
	}
	this.loadCanvas=function(){
		fabric.Object.prototype.originX = fabric.Object.prototype.originY = 'center';

	  var canvas = this.__canvas = new fabric.Canvas('solarsystem', {
	    hoverCursor: 'pointer',
	    selection: false,
	    perPixelTargetFind: true,
	    targetFindTolerance: 5
	  });
	  	canvas.setHeight($('#canvascontainer').height());
		canvas.setWidth($('#canvascontainer').width());
	  // load sun and center it
	  fabric.Image.fromURL(app.siteurl+'/pub/img/sun.png', function(sunImg) {
	    canvas.add(sunImg);
	    sunImg.center();
	  });

	  var planetSize = 26,
	      totalPlanets = 12,
	      rotationSpeed = 20000,
	      orbits = [ ],
	      planets = [ ],
	      planetNames = ['Selene', 'Mimas', 'Ares', 'Enceladus', 'Tethys', 'Dione',
	                     'Zeus', 'Rhea', 'Titan', 'Janus', 'Hyperion', 'Iapetus'];

	  var hoverCircle = new fabric.Circle({
	    radius: 13,
	    fill: '#000',
	    stroke: 'rgb(0,192,255)',
	    strokeWidth: 3,
	    left: -100,
	    top: -100
	  });

	  var planetLabel = new fabric.Text('', {
	    fill: '#fff',
	    fontSize: 16,
	    fontFamily: 'Open Sans',
	    textBackgroundColor: '#002244'
	  });

	  // load sprite with planets
	  fabric.Image.fromURL(app.siteurl+'/pub/img/planets.png', function(planetsImg) {

	    // temp canvas to generate planet images
	    var tempCanvas = new fabric.StaticCanvas();

	    // only to fit one planet onto temp canvas
	    tempCanvas.setDimensions({
	      width: planetSize,
	      height: planetSize
	    });

	    // make sure image is drawn from left/top corner
	    planetsImg.originX = 'left';
	    planetsImg.originY = 'top';

	    // add it onto temp canvas
	    tempCanvas.add(planetsImg);

	    for (var i = 0; i < totalPlanets; i++) {
	      createOrbit(i);
	    }
	    canvas.add(hoverCircle);

	    for (var i = 0; i < totalPlanets; i++) {
	      createPlanet(i, planetsImg, tempCanvas);
	    }

	    canvas.add(planetLabel);
	  });

	  function createOrbit(i) {
	    var orbit = new fabric.Circle({
	      radius: 26 * i + 90,
	      left: canvas.getWidth() / 2,
	      top: canvas.getHeight() / 2,
	      fill: '',
	      stroke: 'rgba(0,192,255,0.5)',
	      hasBorders: false,
	      hasControls: false,
	      lockMovementX: true,
	      lockMovementY: true,
	      index: i
	    });
	    canvas.add(orbit);
	    orbits.push(orbit);
	  }

	  function createPlanet(i, planetsImg, tempCanvas) {

	    // offset planets sprite to fit each of the planets onto it
	    planetsImg.left = -planetSize * i;
	    planetsImg.setCoords();
	    tempCanvas.renderAll();

	    // get data url for that planet
	    var img = new Image();
	    img.onload = function() {
	      // create image of a planet from data url
	      var oImg = new fabric.Image(img, {

	        name: planetNames[i],
	        index: i,
	        scaleX: 1 / canvas.getRetinaScaling(),
	        scaleY: 1 / canvas.getRetinaScaling(),
	        // position planet 90px from canvas center and 26px from previous planet
	        left: (canvas.getWidth() / 2) - 90 - (planetSize * i),
	        top: canvas.getHeight() / 2,

	        // remove borders and corners but leaving object available for events
	        hasBorders: false,
	        hasControls: false
	      });
	      canvas.add(oImg);
	      planets.push(oImg);
	      animatePlanet(oImg, i);
	    }
	    img.src = tempCanvas.toDataURL();
	  }

	  function animatePlanet(oImg, planetIndex) {

	    var radius = planetIndex * 26 + 90,

	        // rotate around canvas center
	        cx = canvas.getWidth() / 2,
	        cy = canvas.getHeight() / 2,

	        // speed of rotation slows down for further planets
	        duration = (planetIndex + 1) * rotationSpeed,

	        // randomize starting angle to avoid planets starting on one line
	        startAngle = fabric.util.getRandomInt(-180, 0),
	        endAngle = startAngle + 359;

	    (function animate() {

	      fabric.util.animate({
	        startValue: startAngle,
	        endValue: endAngle,
	        duration: duration,

	        // linear movement
	        easing: function(t, b, c, d) { return c*t/d + b; },

	        onChange: function(angle) {
	          angle = fabric.util.degreesToRadians(angle);

	          var x = cx + radius * Math.cos(angle);
	          var y = cy + radius * Math.sin(angle);

	          oImg.set({ left: x, top: y }).setCoords();

	          // only render once
	          if (planetIndex === totalPlanets - 1) {
	            canvas.renderAll();
	          }
	        },
	        onComplete: animate
	      });
	    })();
	  }

	  var hoverTarget, prevHoverTarget;

	  canvas.on('mouse:over', function(options) {
	    hoverTarget = options.target;
	  });

	  canvas.on('mouse:out', function(options) {
	    hoverTarget = null;
	    prevHoverTarget = options.target;
	  });

	  canvas.on('after:render', function() {
	    orbits.forEach(function(orbit) {
	      orbit.strokeWidth = 1;
	      orbit.stroke = 'rgba(0,192,255,0.5)';
	    });
	    if (hoverTarget && !hoverTarget.text) {
	      var hoveredPlanet = planets[hoverTarget.index];
	      var hoveredOrbit = orbits[hoveredPlanet.index];

	      hoveredOrbit.set({
	        strokeWidth: 3,
	        stroke: 'rgb(0,192,255)'
	      });

	      hoverCircle.set({
	        left: hoveredPlanet.left,
	        top: hoveredPlanet.top
	      });

	      planetLabel.set({
	        left: hoveredPlanet.left + 50,
	        top: hoveredPlanet.top + 20,
	        text: hoveredPlanet.name
	      });
	    }
	    else {
	      hoverCircle.set({ left: -100, top: -100 });
	      planetLabel.set({ left: -100, top: -100 });
	    }
	  });
	}
	this.close=function(){
		TweenLite.to($('#wrapper'),.3,{scale:1})
		TweenLite.to(self.ele,.3,{opacity:0,onComplete:function(){
			self.ele.remove();
			delete self;
		}})
	}
}