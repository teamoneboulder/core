export default function(options){
    var self=this;
    this.options=options;
    this.version=1.0;
    this.debugTime=0;
    this.init=function(){
        console.log('INIT VERSION: '+self.version)
        this.defaultMode='rain';
        this.container=options.element;
        this.ready=false;
        this.pixels = new Uint32Array(options.size.width*options.size.height);
        this.ratio=0;
        self.uid=Math.uuid(12);
        if(options.ele){
            if(self.debugTime) console.time('init');
            this.ele=options.ele;
            var mw=options.ele.clientWidth
            var mh=options.ele.clientHeight
            this.scale=1;
            this.size={
                width:(options.size.width+1)*this.scale,
                height:(options.size.height+1)*this.scale,
            }
            var wr=self.size.width/mw;
            var hr=self.size.height/mh;
            if(wr>hr){//use width
                self.ratio=mw/options.size.width;
                self.size.width=mw;
                self.size.height=(mw/options.size.width)*options.size.height;
            }else{//use height
                self.ratio=mh/options.size.height;
                self.size.height=mh;
                self.size.width=(mh/options.size.height)*options.size.width;
            }
            var id='canvas_'+self.uid;
            this.ele.innerHTML='<div id="pixelview_'+self.uid+'" style="z-index:2;width:'+self.size.width+'px;height:'+self.size.height+'px;position:relative"></div><div style="height:0px;overflow:hidden"><canvas id="'+id+'" class="fasttransition" style="width:'+self.size.width+'px;height:'+self.size.height+'px;visibility:none;"></canvas></div>';
            this.canvas=document.getElementById(id);
            this.pixelview=document.getElementById('pixelview_'+self.uid);
            this.canvas.width=self.size.width;
            this.canvas.height=self.size.height;
            this.context=self.canvas.getContext('2d');
            self.pixelScale=self.ratio*.8;
            self.framerate=(options.config.framerate)?options.config.framerate:20;
            if(self.debugTime) console.time('setMode');
            self.setMode(options.config.mode,options.config.settings);
            if(self.debugTime) console.timeEnd('setMode');
            self.pause();
            if(self.debugTime) console.timeEnd('init');
            return false;
        }else if(this.container){//web debugger!
            this.scale=Math.floor((document.body.clientWidth*.9)/(options.size.width+1))-10;
            this.size={
                width:(options.size.width+1)*this.scale,
                height:(options.size.height+1)*this.scale,
            }
            this.container.innerHTML='<div style="position:relative;height:100%;"><div style="position:absolute;top:0px;left:0;bottom:0;width:250px;color:white;z-index:3;border-right:1px solid white">'+
            '<div style="position:absolute;bottom:5px;left:5px;width:100px;height:150px;background-image:url(https://s3.amazonaws.com/one-light/static/giraffx.jpeg);" class="coverimg"></div>'+
            '<div style="vertical-align:center;font-size:20px;padding-top:5px;padding-bottom:10px;font-weight:bold;background:white;color:black;text-align:center;">Giraffx Debugger</div>'+
            '<div class="optiontitle">Board Scale</div>'+
            '<div><input id="scale" value="1" min=".25" max="1" step=".05" type="range" class="rangeslider rangeslider2 slider1"  style="background:transparent;border:0px;width:240px;"></div>'+
            '<div class="optiontitle">Pixel Scale</div>'+
            '<div><input id="pixelscale" value="1" min=".25" max="1" step=".05" type="range" class="rangeslider rangeslider2 slider1"  style="background:transparent;border:0px;width:240px"></div>'+
            '<div class="optiontitle">Framerate</div>'+
            '<div><input id="framerate" value="30" min="1" max="60" step="1" type="range" class="rangeslider rangeslider2 slider1"  style="background:transparent;border:0px;width:240px"></div>'+
            '<div style="vertical-align:center;display:none;" id="viewtype"><div class="optiontitle">Source</div><div><select id="sourceselector" class="optionselect"><option value="browser">Browser</option><option value="server">Server</option></select></div></div>'+
            '<div style="vertical-align:center;"><div class="optiontitle">Mode</div><div><select id="modeselector" class="optionselect">'+self.getModeOptions()+'<select></div></div>'+
            '<div id="modesettings"></div>'+
            //'<div style="vertical-align:center;width:100px;text-align:center"><div>Pixels Only</div><div><input type="checkbox" id="pixeltoggle"></div></div>'+
            '</div>'+
            '<div style="position:absolute;top:0;left:250px;right:0;bottom:0;overflow:hidden"><div id="canvas_view" style="position:relative;transform-origin:top center;"><table style="min-width:100%;min-height:100%;text-align:center"><tr><td><div id="server_view" style="display: none;"><div id="server_gradient_framerate" style="color:white"></div><img src="" id="server_gradient_img"/></div></div><div style="position:relative;display:inline-block;" id="browser_view"><canvas id="canvas" class="fasttransition" style="width:'+self.size.width+'px;height:'+self.size.height+'px"></canvas><div id="pixelview" style="z-index:2;position:absolute;top:0;left:0;width:'+self.size.width+'px;height:'+self.size.height+'px"></div></td></tr></table></div></div></div></div>'
            $('#scale').rangeslider({
            }).on('change',function(){
                self.setScale(event.currentTarget.value);
            })
            $('#pixelscale').rangeslider({
            }).on('change',function(){
                self.pixelScale=event.currentTarget.value;
                self.updateBoardSize()
            })
            self.pixelScale=.8;
            $('#pixelscale').val(.8)
            $('#scale').val(.8);
            $('#framerate').rangeslider({
            }).on('change',function(){
                self.updateFrameRate(event.currentTarget.value);
                self.updateSettings()
            })
            self.framerate=options.framerate;
            self.setScale(.8);
            $('#sourceselector').on('change', (event) => {
                self.setViewSource(event.currentTarget.value);
            })
            $('#modeselector').on('change', (event) => {
                self.setMode(event.currentTarget.value);
                self.updateSettings();
            });
            $('#modeselector').val(this.defaultMode);
            this.settingsArea=document.getElementById('modesettings');
            this.canvas=document.getElementById('canvas');
            this.canvas.width=self.size.width;
            this.canvas.height=self.size.height;
            this.context=self.canvas.getContext('2d');
            this.pixelview=document.getElementById('pixelview');
            this.canvasview=document.getElementById('canvas_view');
            this.img = new Image();   // Create new img element
            this.img.crossOrigin = "Anonymous";
        }else{//nod
            this.scale=40;
            this.size={
                width:(options.size.width+1)*this.scale,
                height:(options.size.height+1)*this.scale
            }
            if(options.strip&&options.strip.instance){
                this.strip=options.strip.instance;
                this.strip_config=Object.assign({},{
                    leds:(options.size.width*options.size.height),
                    stripType:'grb',
                    gpio:18,
                    brightness:50,
                    dma:10
                },options.strip.options);
                // Configure ws281x
                this.strip.configure(this.strip_config);
            }
            self.canvas = options.canvas.createCanvas(self.size.width, self.size.height);
            self.canvas.offsetWidth = self.size.width;
            self.canvas.offsetHeight = self.size.height;
            self.context = self.canvas.getContext('2d');
        }
        if(options.config){
            self.setMode(options.config.mode,options.config.settings);
        }else{
            self.setMode(self.defaultMode);
        }
    }
    this.updateFrameRate=function(framerate){
        console.log('set framerate: '+framerate)
        self.framerate=parseInt(framerate,10);
        if(self.frameTimeout) clearTimeout(self.frameTimeout);
        self.updateFrame();
    }
    this.updateBoardSize=function(){
        this.pixelview.innerHTML='';
        self.pixelsLoaded=0;
        this.drawPixels();
    }
    this.getModeOptions=function(){
        var order=self.getModeOrder();
        var toptions='';
        for (var i = 0; i < order.length; i++) {
            var name=this.modes[order[i]].name;
            if(!name) name=order[i];
            toptions+='<option value="'+order[i]+'">'+name+'</value>';
        }
        return toptions;
    }
    this.getPixelsInRow=function(row,rtl){
        var startOffset=row*options.size.width;
        var pixels=[];
        var c=0;
        while(c<options.size.width){
            if(row%2==1){
                pixels.push({
                    x:c,
                    y:row,
                    address:startOffset+(options.size.width-c)-1
                });
            }else{
                pixels.push({
                    x:c,
                    y:row,
                    address:startOffset+c
                });
            }
            c++;
        }
        if(rtl) return pixels.reverse();
        return pixels;
    }
    this.getPixelsInColumn=function(column,topToBottom){
        var row=0;
        var pixels=[];
        while(row<options.size.height){
            if(row%2==1){
                pixels.push({
                    x:column,
                    y:row,
                    address:row*options.size.width+(options.size.width-column-1)
                });
            }else{
                pixels.push({
                    x:column,
                    y:row,
                    address:row*options.size.width+column
                });
            }
            row++;
        }
        if(topToBottom) return pixels.reverse();
        return pixels;
    }
    this.getModeOrder=function(){
        var c=Object.keys(this.modes);
        for (var k in c) {
            if(this.modeOrder.indexOf(c[k])==-1){
                this.modeOrder.push(c[k]);
            }
        }
        return this.modeOrder;
    }
    this.modeOrder=['gradient','rain'];
    this.modes={
        gradient:{
            name:'Gradient',
            frameCount:0,
            pause:function(){
                this.granimInstance.pause()
            },
            play:function(){
                this.granimInstance.play()
            },
            settings:{
                gradient:'default',
                direction:'diagonal'
            },
            getColorAt:function(x,y,addr){
                var color=self.context.getImageData(x*self.scale, y*self.scale, 1, 1).data;
                return {
                    rgb:'rgb('+color[0]+','+color[1]+','+color[2]+')',
                    hex:(color[0] << 16) | (color[1] << 8)| color[2]
                }
            },
            changeSettings:function(settings){
                if(settings.direction) this.setDirection(settings.direction)
                if(settings.gradient) this.setGradient(settings.gradient)
            },
            setDirection:function(dir){
                this.granimInstance.changeDirection(dir);
                this.settings.direction=dir;
                self.updateSettings();
            },
            setGradient:function(gradient){
                this.granimInstance.changeState(gradient);
                this.settings.gradient=gradient;
                self.updateSettings()
            },
            showSettings:function(){
                var tself=this;
                if(!self.container) return false;
                self.settingsArea.innerHTML='<div style="vertical-align:center;"><div class="optiontitle">Gradient</div><div><select id="gradientselector" class="optionselect">'+this.getOptions()+'</select></div></div>'+
                '<div style="vertical-align:center;"><div class="optiontitle">Direction</div><div><select id="directionselector" class="optionselect"><option value="diagonal">Diagonal</option><option value="top-bottom">Top to Bottom</option><option value="radial">Radial</option><option value="left-right">Left To Right</option></select></div></div>'+
                '<div style="vertical-align:center;"><div class="optiontitle">Pixels Only</div><div><input type="checkbox" id="pixeltoggle"></div></div>';
                $('#gradientselector').on('change', (event) => {
                    tself.setGradient(event.currentTarget.value);
                }).val(this.settings.gradient)
                 $('#directionselector').on('change', (event) => {
                    tself.setDirection(event.currentTarget.value);
                }).val(this.settings.direction)
                $('#pixeltoggle').on('change', (event) => {
                  if(event.currentTarget.checked){
                    $(self.container).addClass('hidegradient');
                  }else{
                    $(self.container).removeClass('hidegradient');
                  }
                })
            },
            start:function(){
                this.frameCount=0;
                self.updateFrame();
                this.showSettings()
            },
            updateFrame:function(){
                this.drawCanvas();
                return true;
            },
            getOptions:function(){
                var ret=''
                var modes=this.getModes();
                for (var i = 0; i < modes.order.length; i++) {
                    var item=modes.list[modes.order[i]];
                    ret+='<option value="'+modes.order[i]+'">'+item.name+'</option>';
                }
                return ret;
            },
            getModes:function(){
                return {
                    order:["default","mode_1","mode_2","rainbow","custom_gradient_1"],
                    list:{
                       "default": {
                            name:'Default',
                           gradients: [
                               ['#834D9B', '#D04ED6'],
                               ['#1CD8D2', '#93EDC7']
                           ],
                            transitionSpeed: 4000
                       },
                       "mode_1": {
                            name:'Orange / Red',
                            gradients: [ 
                                ['#FF4E50', '#F9D423'],
                                ['#F9D423','#FF4E50'] 
                            ],
                            transitionSpeed: 4000
                        },
                       "mode_2": {
                            name:'Blue / Purple',
                            gradients: [
                                ['#9D50BB', '#6E48AA'],
                                ['#4776E6', '#8E54E9']
                            ],
                            transitionSpeed: 4000
                        },
                        "custom_gradient_1": {
                            name:"Custom Gradient",
                            gradients: [
                                [
                                    { color: '#833ab4', pos: .2 },
                                    { color: '#fd1d1d', pos: .8 },
                                    { color: '#38ef7d', pos: 1 }
                                ], [
                                    { color: '#40e0d0', pos: 0 },
                                    { color: '#ff8c00', pos: .2 },
                                    { color: '#ff0080', pos: .75 }
                                ],
                            ]
                        },
                       "rainbow": {
                            name:'Rainbow',
                            gradients: [
                                ['#ff0000', '#ff7f00'],//'#ff0000','#00ff00','#0000ff','#4b0082','#9400D3'
                                ['#ff7f00','#ffff00'],
                                ['#ffff00','#00ff00'],
                                ['#00ff00','#4b0082'],
                                ['#0000ff','#4b0082'],
                                ['#4b0082','#9400D3'],
                                ['#9400D3','#ff0000']
                            ],
                            transitionSpeed: 8000
                        }
                    }
               }
            },
            drawCanvas:function(){
                if(!this.granimInstance){
                    this.granimInstance = new tools.Granim({
                       element: self.canvas,
                       defaultStateName:this.settings.gradient,
                       name: 'granim',
                       opacity: [1, 1],
                       states : this.getModes().list
                    });
                }
                if(options.emitFrame){
                    if(this.frameCount%2==0){
                        options.emitFrame({
                            img:self.canvas.toDataURL(),
                            framerate:self.getFrameRate()
                        })
                    }
                }
                this.frameCount++;
            },
            stop:function(){
                if(this.granimInstance) this.granimInstance.destroy();
                this.granimInstance=false;
            }
        },
        snake:{
            name:'Snake',
            settings:{
                duration:8000,
                color:'#ff0000',
                segmentLength:0,//ability to create segment snaking
                segments:'single',//single or quarter
                direction:'clockwise'//counterclockwise or clockwise
            },
            changeSettings:function(settings){
                console.log('change settings: '+JSON.stringify(settings))
                this.settings=Object.assign({},this.settings,settings);
                this.start();
            },
            showSettings:function(){
                var tself=this;
                if(!self.container) return false;
                self.settingsArea.innerHTML='<div style="vertical-align:center;"><div class="optiontitle">Direction</div><div><select id="directionselector" class="optionselect"><option value="clockwise">Clockwise</option><option value="counterclockwise">Counter-Clockwise</option></select></div></div>'+
                '<div style="vertical-align:center;"><div class="optiontitle">Segment Length</div><div><select id="segmentlength" class="optionselect"><option value="0">No Segments</option><option value="3">3</option><option value="5">5</option></select></div></div>';
                 $('#directionselector').on('change', (event) => {
                    tself.setDirection(event.currentTarget.value);
                }).val(this.settings.direction);
                 $('#segmentlength').on('change', (event) => {
                    tself.setSegmentLength(event.currentTarget.value);
                }).val(this.settings.segmentLength);
            },
            setSegmentLength:function(length){
                this.settings.segmentLength=parseInt(length,10);
                self.updateSettings();
                this.start();
            },
            setDirection:function(dir){
                this.settings.direction=dir;
                self.updateSettings();
                this.start();
            },
            updateFrame:function(){
                this.timeDiff=(new Date().getTime()-this.startTime);
                var percent=(this.timeDiff%this.settings.duration)*1.05/this.settings.duration;
                this.current={};
                var map=[];
                if(this.settings.segments=='single'){
                    var pixelCount=Math.floor(percent*this.totalPixels);
                    if(pixelCount>this.totalPixels) pixelCount=this.totalPixels;
                    var c=0;
                    var current={};
                    var side=0;
                    while(c<(pixelCount-1)){
                        if(this.settings.direction=='counterclockwise'){
                            if(!current.data){
                                current.type='row';
                                current.data=self.getPixelsInRow(0);
                            }
                        }
                        if(this.settings.direction=='clockwise'){
                            if(!current.data){
                                current.type='row';
                                current.data=self.getPixelsInColumn(0);
                            }
                        }
                        var cc=0;
                        while(cc<current.data.length){
                            var pixel=current.data[cc];
                            if(!this.current[pixel.address]){
                                this.current[pixel.address]={
                                    color:this.getColorAtProgress(c)
                                }
                                map.push(pixel.address);
                                current.last=pixel;
                                c++;
                            }
                            cc++
                            if(c>=(pixelCount)) break;
                        }
                        side++;
                        if(this.settings.direction=='counterclockwise'){
                            if(current.type=='row'){
                                current.type='column';
                                current.data=self.getPixelsInColumn(current.last.x,(side%4==3)?1:0);
                            }else{
                                current.type='row';
                                current.data=self.getPixelsInRow(current.last.y,(side%4==2)?1:0);
                            }
                        }
                        if(this.settings.direction=='clockwise'){
                            if(current.type=='row'){
                                current.type='column';
                                current.data=self.getPixelsInColumn(current.last.x,(side%4==3)?1:0);
                            }else{
                                current.type='row';
                                current.data=self.getPixelsInRow(current.last.y,(side%4==0)?1:0);
                            } 
                        }
                    }
                    if(this.settings.segmentLength){
                        var c=0;
                        var color=modules.tinycolor('#000000').toRgb();
                        for (var i = map.length - 1; i >= 0; i--) {
                            var addr=map[i];
                            if(Math.floor(c/this.settings.segmentLength)%2==0){//on

                            }else{//off
                                // this.current[addr]={
                                //     rgb:'rgb('+color.r+','+color.g+','+color.b+')',
                                //     hex:(color.r << 16) | (color.g << 8)| color.b
                                // };
                                this.current[addr]=false;
                            }
                            c++;
                        }
                    }
                    //console.log(map);
                    //console.log(this.current)
                }
                return true;
            },
            getColorAtProgress:function(progress){
                var color=modules.tinycolor(this.settings.color).toRgb();
                return {
                    rgb:'rgb('+color.r+','+color.g+','+color.b+')',
                    hex:(color.r << 16) | (color.g << 8)| color.b
                }
            },
            getColorAt:function(x,y,addr){
                //return false;
                if(this.current[addr]){
                    return this.current[addr].color
                }else{
                    var color=[0,0,0];
                    return {
                        rgb:'rgb('+color[0]+','+color[1]+','+color[2]+')',
                        hex:(color[0] << 16) | (color[1] << 8)| color[2]
                    }
                }
            },
            start:function(){
                this.showSettings();
                this.startTime=new Date().getTime();
                this.totalPixels=options.size.width*options.size.height;
            },
            stop:function(){

            }
        },
        rain:{
            name:'Rain',
            settings:{
                color:'#ff0000',
                style:'wave',//random
                waveAngle:.5,//[0-1] 0 flat, 1 diagonal
                waveType:'arrow',//line or arrow or splitarrow
                scale:1.5,
                cycleLength:1000//4 seconds per cycle
            },
            changeSettings:function(settings){
                var tself=this;
                if(settings.waveType){
                    tself.settings.waveType=settings.waveType
                }
                if(settings.style){
                    tself.settings.style=settings.style
                }
                if(settings.cycleLength){
                    tself.settings.cycleLength=settings.cycleLength
                }
                tself.start();
            },
            showSettings:function(){
                var tself=this;
                if(!self.container) return false;
                self.settingsArea.innerHTML='<div style="vertical-align:center;"><div class="optiontitle">Style</div><div><select id="rainstyle" class="optionselect"><option value="wave">Wave</option><option value="random">Random</option></select></div></div>';
                if(this.settings.style=='wave'){
                    self.settingsArea.innerHTML+='<div style="vertical-align:center;"><div class="optiontitle">Wave Type</div><div><select id="wavetype" class="optionselect"><option value="arrow">Arrow</option><option value="splitarrow">Split Arrow</option><option value="line">Line</option></select></div></div>';
                    //self.settingsArea.innerHTML+='<div style="vertical-align:center;"><div class="optiontitle">Wave Angle</div><div><select id="waveangle" class="optionselect"><option value="1">1</option><option value=".5">.5</option><option value="0">0</option></select></div></div>';
                }
                self.settingsArea.innerHTML+='<div style="vertical-align:center;"><div class="optiontitle">Speed</div><div><select id="speed" class="optionselect"><option value="500">.5 second</option><option value="1000">1 second</option><option value="2000">2 Seconds</option><option value="3000">3 Seconds</option><option value="4000">4 Seconds</option></select></div></div>';
                $('#rainstyle').on('change', (event) => {
                    tself.settings.style=event.currentTarget.value;
                    tself.start();
                    tself.showSettings();
                    self.updateSettings();
                }).val(this.settings.style)
                 $('#wavetype').on('change', (event) => {
                    tself.settings.waveType=event.currentTarget.value;
                    tself.start();
                    self.updateSettings();
                }).val(this.settings.waveType)  
                  $('#speed').on('change', (event) => {
                    tself.settings.cycleLength=parseInt(event.currentTarget.value,10);
                    tself.start();
                    self.updateSettings();
                }).val(this.settings.cycleLength)  
                  $('#waveangle').on('change', (event) => {
                    tself.settings.waveAngle=parseFloat(event.currentTarget.value,10);
                    tself.start();
                    self.updateSettings();
                }).val(this.settings.waveAngle)  
            },
            updateFrame:function(){
                //if(self.debugTime) console.time('rainFrame');
                //console.log('updateframe')
                this.period=(2*Math.PI)/this.settings.cycleLength;
                this.timeDiff=(new Date().getTime()-this.startTime);
                for (var ind in this.current) {
                    this.current[ind].color=this.getColorAtTime(this.current[ind],ind);
                }
                //if(self.debugTime) console.timeEnd('rainFrame');
                return true;
            },
            getColorAtTime:function(options,index){
                var darkenAmount=Math.cos(this.period*(this.timeDiff-options.timeOffset))*50-options.darknessOffset;
                //console.log(darkenAmount)
                // //if(index==0) console.log(darkenAmount)
                // if(darkenAmount<0){//lighten
                //     var color=modules.tinycolor(options.pixelColor()).brighten(Math.abs(darkenAmount)/this.settings.scale).toRgb();
                // }else{//darken!
                //     var color=modules.tinycolor(options.pixelColor()).darken(darkenAmount/this.settings.scale).toRgb();
                // }
                //var lightenAmount=Math.cos(this.period*(this.timeDiff-options.timeOffset))*100;
               // var color=modules.tinycolor(options.pixelColor()).brighten(lightenAmount/this.settings.scale).toRgb();
               var color=modules.tinycolor(options.pixelColor()).spin(darkenAmount/this.settings.scale).toRgb()
                //console.log(color)
                return {
                    rgb:'rgb('+color.r+','+color.g+','+color.b+')',
                    hex:(color.r << 16) | (color.g << 8)| color.b
                }
                //return darkenAmount;
            },
            getColorAt:function(x,y,addr){
                //return false;
                return this.current[addr].color
                // return {
                //     rgb:'rgb('+color[0]+','+color[1]+','+color[2]+')',
                //     hex:(color[0] << 16) | (color[1] << 8)| color[2]
                // }
            },
            start:function(){
                //make config for each pixel!
                this.showSettings()
                this.startTime=new Date().getTime();
                var total=options.size.width*options.size.height;
                var c=0;
                this.current={};
                if(this.settings.style=='random'){
                    while(c<total){
                        this.current[c]={
                            timeOffset:Math.floor((Math.random()*this.settings.cycleLength)),
                            darknessOffset:0,
                            pixelColor:(function(){return this.settings.color}).bind(this)
                        }
                        c++;
                    }
                }
                if(this.settings.style=='wave'){
                    while(c<options.size.width){
                        var offset=this.settings.cycleLength/options.size.width*c;
                        var arrowOffset=offset;
                        var column=self.getPixelsInColumn(c);
                        for (var i = 0; i < column.length; i++) {
                            var pixel=column[i].address;
                            if(this.settings.waveType=='line'){
                                this.current[pixel]={
                                    timeOffset:offset+(this.settings.cycleLength/options.size.height*i)*this.settings.waveAngle,
                                    darknessOffset:0,
                                    pixelColor:(function(){return this.settings.color}).bind(this)
                                }
                            }
                            if(this.settings.waveType=='splitarrow'){
                                if(i<(options.size.height/2)){
                                    this.current[pixel]={
                                        timeOffset:offset-(this.settings.cycleLength/options.size.height*i)*this.settings.waveAngle,
                                        darknessOffset:0,
                                        pixelColor:(function(){return this.settings.color}).bind(this)
                                    }
                                }else{
                                    this.current[pixel]={
                                        timeOffset:offset+(this.settings.cycleLength/options.size.height*i)*this.settings.waveAngle,
                                        darknessOffset:0,
                                        pixelColor:(function(){return this.settings.color}).bind(this)
                                    }
                                }
                            }
                            if(this.settings.waveType=='arrow'){
                                if(i<(options.size.height/2)){
                                    this.current[pixel]={
                                        timeOffset:offset+(this.settings.cycleLength/options.size.height*(options.size.height/2-i))*this.settings.waveAngle+this.settings.cycleLength*((options.size.width-2)/options.size.width)/2,
                                        darknessOffset:0,
                                        pixelColor:(function(){return this.settings.color}).bind(this)
                                    }
                                }else{
                                    this.current[pixel]={
                                        timeOffset:offset+(this.settings.cycleLength/options.size.height*(options.size.height/2+i))*this.settings.waveAngle,
                                        darknessOffset:0,
                                        pixelColor:(function(){return this.settings.color}).bind(this)
                                    }
                                }
                            }
                        }
                        c++;
                    }
                }
                //self.updateFrame();
            },
            stop:function(){
                
            }
        },
        fade:{
            name:'Fade',
            settings:{
                color:'#ff0000',
                colors:['#ff0000','#00ff00'],
                cycleLength:6000
            },
            changeSettings:function(settings){
                var tself=this;
                tself.start();
            },
            showSettings:function(){
                var tself=this;
                if(!self.container) return false;                
                self.settingsArea.innerHTML='';
                // if(this.settings.style=='wave'){
                //     self.settingsArea.innerHTML+='<div style="vertical-align:center;"><div class="optiontitle">Wave Type</div><div><select id="wavetype" class="optionselect"><option value="arrow">Arrow</option><option value="splitarrow">Split Arrow</option><option value="line">Line</option></select></div></div>';
                //     //self.settingsArea.innerHTML+='<div style="vertical-align:center;"><div class="optiontitle">Wave Angle</div><div><select id="waveangle" class="optionselect"><option value="1">1</option><option value=".5">.5</option><option value="0">0</option></select></div></div>';
                // }
                // self.settingsArea.innerHTML+='<div style="vertical-align:center;"><div class="optiontitle">Speed</div><div><select id="speed" class="optionselect"><option value="500">.5 second</option><option value="1000">1 second</option><option value="2000">2 Seconds</option><option value="3000">3 Seconds</option><option value="4000">4 Seconds</option></select></div></div>';
                // $('#rainstyle').on('change', (event) => {
                //     tself.settings.style=event.currentTarget.value;
                //     tself.start();
                //     tself.showSettings();
                //     self.updateSettings();
                // }).val(this.settings.style)
                //  $('#wavetype').on('change', (event) => {
                //     tself.settings.waveType=event.currentTarget.value;
                //     tself.start();
                //     self.updateSettings();
                // }).val(this.settings.waveType)  
                //   $('#speed').on('change', (event) => {
                //     tself.settings.cycleLength=parseInt(event.currentTarget.value,10);
                //     tself.start();
                //     self.updateSettings();
                // }).val(this.settings.cycleLength)  
                //   $('#waveangle').on('change', (event) => {
                //     tself.settings.waveAngle=parseFloat(event.currentTarget.value,10);
                //     tself.start();
                //     self.updateSettings();
                // }).val(this.settings.waveAngle)  
            },
            updateFrame:function(){
                //if(self.debugTime) console.time('rainFrame');
                //console.log('updateframe')
                this.period=(2*Math.PI)/this.settings.cycleLength;
                this.timeDiff=(new Date().getTime()-this.startTime);
                for (var ind in this.current) {
                    this.current[ind].color=this.getColorAtTime(this.current[ind],ind);
                }
                //if(self.debugTime) console.timeEnd('rainFrame');
                return true;
            },
            getColorAtTime:function(options,index){
                var darkenAmount=Math.cos(this.period*(this.timeDiff-options.timeOffset))*50-options.darknessOffset;
               var color=modules.tinycolor(options.pixelColor()).spin(darkenAmount).toRgb()
                return {
                    rgb:'rgb('+color.r+','+color.g+','+color.b+')',
                    hex:(color.r << 16) | (color.g << 8)| color.b
                }
                //return darkenAmount;
            },
            getColorAt:function(x,y,addr){
                //return false;
                return this.current[addr].color
                // return {
                //     rgb:'rgb('+color[0]+','+color[1]+','+color[2]+')',
                //     hex:(color[0] << 16) | (color[1] << 8)| color[2]
                // }
            },
            start:function(){
                //make config for each pixel!
                this.showSettings()
                this.startTime=new Date().getTime();
                var total=options.size.width*options.size.height;
                var c=0;
                this.current={};
                while(c<total){
                    this.current[c]={
                        timeOffset:0,
                        darknessOffset:0,
                        pixelColor:(function(){return this.settings.color}).bind(this)
                    }
                    c++;
                }
            },
            stop:function(){
                
            }
        }
    }
    this.setMode=function(mode,settings){
        if(self.frameTimeout) clearTimeout(self.frameTimeout);
        if(self.mode) self.modes[self.mode].stop()
        console.log('set mode: '+mode);
        self.mode=mode;
        if(settings){
            self.modes[mode].settings=Object.assign({},self.modes[mode].settings,settings);
        }
        if(self.debugTime) console.time('start');
        self.modes[mode].start();
        if(self.debugTime) console.timeEnd('start');
        if(self.debugTime) console.time('updateFrame');
        self.updateFrame();
        if(self.debugTime) console.timeEnd('updateFrame');
    }
    this.onSettingsChange=function(data){
        console.log('Settings change '+JSON.stringify(data));
        if(data.mode) self.setMode(data.mode);
        if(self.modes[self.mode].changeSettings) self.modes[self.mode].changeSettings(data.settings);
        if(data.framerate&&data.framerate!=self.framerate) self.updateFrameRate(data.framerate);
    }
    this.updateSettings=function(){
        if(this.container){//only emit in web!
            _socket.emit('settings_change',{
                mode:self.mode,
                settings:self.modes[self.mode].settings,
                framerate:self.framerate
            })
        }
    }
    this.setViewSource=function(type){
        if(type=='server'){
            $('#server_view').css('display','inline-block');
            $('#browser_view').css('display','none');
        }
        if(type=='browser'){
            $('#server_view').css('display','none');
            $('#browser_view').css('display','inline-block');
        }
    }
    this.onServerGradient=function(data){
        if(!self.hasServerView){
            self.hasServerView=1;
            $('#viewtype').show();
        }
        $('#server_gradient_img').attr('src',data.img);
        $('#server_gradient_framerate').html(data.framerate+' fps');
    }
    this.destroy=function(){
        if(self.strip) self.strip.reset()
    }
    this.setScale=function(scale){
        scale=parseFloat(scale);
        $('#canvas_view').css('transform','scale('+scale+')');
        if(scale<.8){
            $('#canvas_view').addClass('hidenumbers');
        }else{
            $('#canvas_view').removeClass('hidenumbers');
        }
    }
    this.frames=[];
    this.getFrameRate=function(){
        if(!self.frames.length) return 0;
        var diff=self.frames[0]-self.frames[self.frames.length-1];
        if(!diff) return 0;
        return parseFloat((self.frames.length/(diff/1000)).toFixed(2));
    }
    this.drawPixels=function(){
        //if(self.debugTime) console.time('drawPixels'
        self.pixelSize=self.scale*self.pixelScale;
        //console.log(self.spacing)
        var html='';
        for (var w = 0; w < options.size.width; w++) {
            for (var h = options.size.height-1; h >=0; h--) {
                var addr=self.getPixelAddress(w,h);
                var color=self.modes[self.mode].getColorAt(w,h,addr);
                //correct dead pixels
                var dead=0;
                if(options.skip){
                    var offset=0;
                    for (var i = 0; i < options.skip.length; i++) {
                        if(options.skip[i]==addr){
                            dead=1;
                        }else if(options.skip[i]<addr){
                            offset--;
                        }
                    }
                    addr+=offset;
                }
                if((options.debug||options.ele)&&this.pixelview&&color){
                    if(self.pixelsLoaded){
                        if(!dead) document.getElementById('pixel_'+self.uid+'_'+w+'_'+h).style.background=color.rgb
                    }else{
                        if(!dead){
                            if(options.ele){
                                html+='<div id="pixel_'+self.uid+'_'+w+'_'+h+'" class="" style="position:absolute;top:'+((h*self.ratio+1)*self.scale)+'px;left:'+((w*self.ratio+1)*self.scale)+'px;width:'+self.pixelSize+'px;height:'+self.pixelSize+'px;background:'+color.rgb+';margin-left:-'+(self.pixelSize/2+1)+'px;margin-top:-'+(self.pixelSize/2+1)+'px;text-align:center;font-size:11px;color:white;border:1px solid white;padding-top:1px" ><div class="numbers fasttransition"></div></div>'
                            }else{
                                html+='<div id="pixel_'+self.uid+'_'+w+'_'+h+'" class="" style="position:absolute;top:'+((h*self.ratio+1)*self.scale)+'px;left:'+((w*self.ratio+1)*self.scale)+'px;width:'+self.pixelSize+'px;height:'+self.pixelSize+'px;background:'+color.rgb+';margin-left:-'+(self.pixelSize/2+1)+'px;margin-top:-'+(self.pixelSize/2+1)+'px;text-align:center;font-size:11px;color:white;border:1px solid white;padding-top:1px" ><div class="numbers fasttransition">'+addr+'</div></div>'
                            }
                        }
                    }
                }
                self.pixels[addr]=color.hex;
            }
        }
        if(html) this.pixelview.innerHTML=html;
        self.pixelsLoaded=true;
        self.frames.unshift(new Date().getTime());
        self.frames=self.frames.slice(0,120);//keep last 120 frames
        if(self.strip) self.strip.render(self.pixels);
        //if(options.onFrame) options.onFrame(self.pixels,self.getFrameRate());
        //if(self.debugTime) console.timeEnd('drawPixels')
    }
    this.getPixelAddress=function(x,y){
        var index=0;
        var invertedY=(options.size.height-1)-y;
        if(invertedY%2==0){//left to right
            index=invertedY*options.size.width+x;
        }else{//right to left
            index=invertedY*options.size.width+(options.size.width-x)-1
        }
        //if(index>=99) index+=4;
        return index;
    }
    this.pause=function(){
        if(self.frameTimeout) clearTimeout(self.frameTimeout);
        self.paused=1;
        if(self.modes[self.mode].pause) self.modes[self.mode].pause()
    }
    this.play=function(){
        self.paused=0;
        if(self.modes[self.mode].play) self.modes[self.mode].play()
        self.updateFrame();
    }
    this.updateFrame=function(){
        var frameStart=new Date().getTime();
        // if(options.src) self.drawImageProp(self.context,self.img);
        // else self.drawCanvas();
        if(self.debugTime) console.time('updateFrame:'+self.mode);
        if(self.modes[self.mode].updateFrame()){
            if(self.debugTime) console.timeEnd('updateFrame:'+self.mode);
            if(self.debugTime) console.time('drawPixels:'+self.mode);
            self.drawPixels();
            if(self.debugTime) console.timeEnd('drawPixels:'+self.mode);
            var frameEnd=new Date().getTime();
            var diff=frameEnd-frameStart;
            if(options.framerate){
                var ms=(1000/self.framerate)-diff;
            }else{
                var ms=1000/30;
            }
        }
        if(ms<=0) ms=5;//give it some time
        self.frameTimeout=setTimeout(function(){
            if(!self.paused) self.updateFrame();
        },ms);
    }
    // this.loadImage=function(){
    //  if(options.src){
       //      if(this.container){
       //          this.img.addEventListener('load', function() {
       //              self.ready=true;
       //              self.updateFrame()
       //          }, false);
       //          this.img.src = options.src; // Set source path
       //      }else{
       //          options.canvas.loadImage(options.src).then((image) => {
       //              self.img=image;
       //              self.ready=true;
       //              self.updateFrame()
       //          })
       //      }
       //  }else{
       //   self.ready=true;
       //   self.updateFrame()
       //  }
    // }
    this.frameCount=0;
    this.toSave=[];
  //   this.animateCanvas=function(){
        // var col = function(x, y, r, g, b) {
        //   self.context.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
        //   self.context.fillRect(x*self.size.width/10, y*self.size.height/10, self.size.width,self.size.height);
        // }
        // var R = function(x, y, t) {
        //   return( Math.floor(192 + 64*Math.cos( (x*x-y*y)/300 + t )) );
        // }

        // var G = function(x, y, t) {
        //   return( Math.floor(192 + 64*Math.sin( (x*x*Math.cos(t/4)+y*y*Math.sin(t/3))/300 ) ) );
        // }

        // var B = function(x, y, t) {
        //   return( Math.floor(192 + 64*Math.sin( 5*Math.sin(t/9) + ((x-100)*(x-100)+(y-100)*(y-100))/1100) ));
        // }

        // if(!self.time) self.time=0;

        // var run = function() {
        //   for(var x=0;x<=35;x++) {
        //     for(var y=0;y<=35;y++) {
        //       col(x, y, R(x,y,self.time), G(x,y,self.time), B(x,y,self.time));
        //     }
        //   }
        //   self.time+= 0.120;
        // }
        // run();
  //       setTimeout(function(){
  //           self.nextFrame();
  //       },5);
  //   }
    this.drawImageProp=function(ctx, img, x, y, w, h, offsetX, offsetY) {
        if (arguments.length === 2) {
            x = y = 0;
            w = ctx.canvas.width;
            h = ctx.canvas.height;
        }
        // default offset is center
        offsetX = typeof offsetX === "number" ? offsetX : 0.5;
        offsetY = typeof offsetY === "number" ? offsetY : 0.5;

        // keep bounds [0.0, 1.0]
        if (offsetX < 0) offsetX = 0;
        if (offsetY < 0) offsetY = 0;
        if (offsetX > 1) offsetX = 1;
        if (offsetY > 1) offsetY = 1;

        var iw = img.width,
            ih = img.height,
            r = Math.min(w / iw, h / ih),
            nw = iw * r,   // new prop. width
            nh = ih * r,   // new prop. height
            cx, cy, cw, ch, ar = 1;

        // decide which gap to fill    
        if (nw < w) ar = w / nw;                             
        if (Math.abs(ar - 1) < 1e-14 && nh < h) ar = h / nh;  // updated
        nw *= ar;
        nh *= ar;

        // calc source rectangle
        cw = iw / (nw / w);
        ch = ih / (nh / h);

        cx = (iw - cw) * offsetX;
        cy = (ih - ch) * offsetY;

        // make sure source rectangle is valid
        if (cx < 0) cx = 0;
        if (cy < 0) cy = 0;
        if (cw > iw) cw = iw;
        if (ch > ih) ch = ih;
        //console.log('draw '+cy+', '+cw+', '+ch+',  '+x+', '+y+', '+w+', '+h)
        // fill image in dest. rectangle
        ctx.drawImage(img, cx, cy, cw, ch,  x, y, w, h);
        //console.log('<img src="' + self.canvas.toDataURL() + '" />')
    }
    this.init();
}
var tools={}
// if(typeof process !== 'undefined'){
//     alert('ok')
//     var requestAnimationFrame=function(func){
//         setTimeout(function(){
//             func();
//         },10)
//     }
// }
//for debugging server
var animationFrameTimeout=false;
 var requestAnimationFrame=function(func){
    animationFrameTimeout=setTimeout(function(){
        func(new Date().getTime());
    },10)
}
var cancelAnimationFrame=function(){
    if(animationFrameTimeout) clearTimeout(animationFrameTimeout);
}
//UUID
;(function(){var e="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split("");Math.uuid=function(t,n){var r=e,i=[],s;n=n||r.length;if(t){for(s=0;s<t;s++)i[s]=r[0|Math.random()*n]}else{var o;i[8]=i[13]=i[18]=i[23]="-";i[14]="4";for(s=0;s<36;s++){if(!i[s]){o=0|Math.random()*16;i[s]=r[s==19?o&3|8:o]}}}return i.join("")};Math.uuidFast=function(){var t=e,n=new Array(36),r=0,i;for(var s=0;s<36;s++){if(s==8||s==13||s==18||s==23){n[s]="-"}else if(s==14){n[s]="4"}else{if(r<=2)r=33554432+Math.random()*16777216|0;i=r&15;r=r>>4;n[s]=t[s==19?i&3|8:i]}}return n.join("")};Math.uuidCompact=function(){return"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,function(e){var t=Math.random()*16|0,n=e=="x"?t:t&3|8;return n.toString(16)})}})();

var modules={};
// TinyColor v1.4.1
// https://github.com/bgrins/TinyColor
// 2016-07-07, Brian Grinstead, MIT License
!function(a){function b(a,d){if(a=a?a:"",d=d||{},a instanceof b)return a;if(!(this instanceof b))return new b(a,d);var e=c(a);this._originalInput=a,this._r=e.r,this._g=e.g,this._b=e.b,this._a=e.a,this._roundA=P(100*this._a)/100,this._format=d.format||e.format,this._gradientType=d.gradientType,this._r<1&&(this._r=P(this._r)),this._g<1&&(this._g=P(this._g)),this._b<1&&(this._b=P(this._b)),this._ok=e.ok,this._tc_id=O++}function c(a){var b={r:0,g:0,b:0},c=1,e=null,g=null,i=null,j=!1,k=!1;return"string"==typeof a&&(a=K(a)),"object"==typeof a&&(J(a.r)&&J(a.g)&&J(a.b)?(b=d(a.r,a.g,a.b),j=!0,k="%"===String(a.r).substr(-1)?"prgb":"rgb"):J(a.h)&&J(a.s)&&J(a.v)?(e=G(a.s),g=G(a.v),b=h(a.h,e,g),j=!0,k="hsv"):J(a.h)&&J(a.s)&&J(a.l)&&(e=G(a.s),i=G(a.l),b=f(a.h,e,i),j=!0,k="hsl"),a.hasOwnProperty("a")&&(c=a.a)),c=z(c),{ok:j,format:a.format||k,r:Q(255,R(b.r,0)),g:Q(255,R(b.g,0)),b:Q(255,R(b.b,0)),a:c}}function d(a,b,c){return{r:255*A(a,255),g:255*A(b,255),b:255*A(c,255)}}function e(a,b,c){a=A(a,255),b=A(b,255),c=A(c,255);var d,e,f=R(a,b,c),g=Q(a,b,c),h=(f+g)/2;if(f==g)d=e=0;else{var i=f-g;switch(e=h>.5?i/(2-f-g):i/(f+g),f){case a:d=(b-c)/i+(c>b?6:0);break;case b:d=(c-a)/i+2;break;case c:d=(a-b)/i+4}d/=6}return{h:d,s:e,l:h}}function f(a,b,c){function d(a,b,c){return 0>c&&(c+=1),c>1&&(c-=1),1/6>c?a+6*(b-a)*c:.5>c?b:2/3>c?a+6*(b-a)*(2/3-c):a}var e,f,g;if(a=A(a,360),b=A(b,100),c=A(c,100),0===b)e=f=g=c;else{var h=.5>c?c*(1+b):c+b-c*b,i=2*c-h;e=d(i,h,a+1/3),f=d(i,h,a),g=d(i,h,a-1/3)}return{r:255*e,g:255*f,b:255*g}}function g(a,b,c){a=A(a,255),b=A(b,255),c=A(c,255);var d,e,f=R(a,b,c),g=Q(a,b,c),h=f,i=f-g;if(e=0===f?0:i/f,f==g)d=0;else{switch(f){case a:d=(b-c)/i+(c>b?6:0);break;case b:d=(c-a)/i+2;break;case c:d=(a-b)/i+4}d/=6}return{h:d,s:e,v:h}}function h(b,c,d){b=6*A(b,360),c=A(c,100),d=A(d,100);var e=a.floor(b),f=b-e,g=d*(1-c),h=d*(1-f*c),i=d*(1-(1-f)*c),j=e%6,k=[d,h,g,g,i,d][j],l=[i,d,d,h,g,g][j],m=[g,g,i,d,d,h][j];return{r:255*k,g:255*l,b:255*m}}function i(a,b,c,d){var e=[F(P(a).toString(16)),F(P(b).toString(16)),F(P(c).toString(16))];return d&&e[0].charAt(0)==e[0].charAt(1)&&e[1].charAt(0)==e[1].charAt(1)&&e[2].charAt(0)==e[2].charAt(1)?e[0].charAt(0)+e[1].charAt(0)+e[2].charAt(0):e.join("")}function j(a,b,c,d,e){var f=[F(P(a).toString(16)),F(P(b).toString(16)),F(P(c).toString(16)),F(H(d))];return e&&f[0].charAt(0)==f[0].charAt(1)&&f[1].charAt(0)==f[1].charAt(1)&&f[2].charAt(0)==f[2].charAt(1)&&f[3].charAt(0)==f[3].charAt(1)?f[0].charAt(0)+f[1].charAt(0)+f[2].charAt(0)+f[3].charAt(0):f.join("")}function k(a,b,c,d){var e=[F(H(d)),F(P(a).toString(16)),F(P(b).toString(16)),F(P(c).toString(16))];return e.join("")}function l(a,c){c=0===c?0:c||10;var d=b(a).toHsl();return d.s-=c/100,d.s=B(d.s),b(d)}function m(a,c){c=0===c?0:c||10;var d=b(a).toHsl();return d.s+=c/100,d.s=B(d.s),b(d)}function n(a){return b(a).desaturate(100)}function o(a,c){c=0===c?0:c||10;var d=b(a).toHsl();return d.l+=c/100,d.l=B(d.l),b(d)}function p(a,c){c=0===c?0:c||10;var d=b(a).toRgb();return d.r=R(0,Q(255,d.r-P(255*-(c/100)))),d.g=R(0,Q(255,d.g-P(255*-(c/100)))),d.b=R(0,Q(255,d.b-P(255*-(c/100)))),b(d)}function q(a,c){c=0===c?0:c||10;var d=b(a).toHsl();return d.l-=c/100,d.l=B(d.l),b(d)}function r(a,c){var d=b(a).toHsl(),e=(d.h+c)%360;return d.h=0>e?360+e:e,b(d)}function s(a){var c=b(a).toHsl();return c.h=(c.h+180)%360,b(c)}function t(a){var c=b(a).toHsl(),d=c.h;return[b(a),b({h:(d+120)%360,s:c.s,l:c.l}),b({h:(d+240)%360,s:c.s,l:c.l})]}function u(a){var c=b(a).toHsl(),d=c.h;return[b(a),b({h:(d+90)%360,s:c.s,l:c.l}),b({h:(d+180)%360,s:c.s,l:c.l}),b({h:(d+270)%360,s:c.s,l:c.l})]}function v(a){var c=b(a).toHsl(),d=c.h;return[b(a),b({h:(d+72)%360,s:c.s,l:c.l}),b({h:(d+216)%360,s:c.s,l:c.l})]}function w(a,c,d){c=c||6,d=d||30;var e=b(a).toHsl(),f=360/d,g=[b(a)];for(e.h=(e.h-(f*c>>1)+720)%360;--c;)e.h=(e.h+f)%360,g.push(b(e));return g}function x(a,c){c=c||6;for(var d=b(a).toHsv(),e=d.h,f=d.s,g=d.v,h=[],i=1/c;c--;)h.push(b({h:e,s:f,v:g})),g=(g+i)%1;return h}function y(a){var b={};for(var c in a)a.hasOwnProperty(c)&&(b[a[c]]=c);return b}function z(a){return a=parseFloat(a),(isNaN(a)||0>a||a>1)&&(a=1),a}function A(b,c){D(b)&&(b="100%");var d=E(b);return b=Q(c,R(0,parseFloat(b))),d&&(b=parseInt(b*c,10)/100),a.abs(b-c)<1e-6?1:b%c/parseFloat(c)}function B(a){return Q(1,R(0,a))}function C(a){return parseInt(a,16)}function D(a){return"string"==typeof a&&-1!=a.indexOf(".")&&1===parseFloat(a)}function E(a){return"string"==typeof a&&-1!=a.indexOf("%")}function F(a){return 1==a.length?"0"+a:""+a}function G(a){return 1>=a&&(a=100*a+"%"),a}function H(b){return a.round(255*parseFloat(b)).toString(16)}function I(a){return C(a)/255}function J(a){return!!V.CSS_UNIT.exec(a)}function K(a){a=a.replace(M,"").replace(N,"").toLowerCase();var b=!1;if(T[a])a=T[a],b=!0;else if("transparent"==a)return{r:0,g:0,b:0,a:0,format:"name"};var c;return(c=V.rgb.exec(a))?{r:c[1],g:c[2],b:c[3]}:(c=V.rgba.exec(a))?{r:c[1],g:c[2],b:c[3],a:c[4]}:(c=V.hsl.exec(a))?{h:c[1],s:c[2],l:c[3]}:(c=V.hsla.exec(a))?{h:c[1],s:c[2],l:c[3],a:c[4]}:(c=V.hsv.exec(a))?{h:c[1],s:c[2],v:c[3]}:(c=V.hsva.exec(a))?{h:c[1],s:c[2],v:c[3],a:c[4]}:(c=V.hex8.exec(a))?{r:C(c[1]),g:C(c[2]),b:C(c[3]),a:I(c[4]),format:b?"name":"hex8"}:(c=V.hex6.exec(a))?{r:C(c[1]),g:C(c[2]),b:C(c[3]),format:b?"name":"hex"}:(c=V.hex4.exec(a))?{r:C(c[1]+""+c[1]),g:C(c[2]+""+c[2]),b:C(c[3]+""+c[3]),a:I(c[4]+""+c[4]),format:b?"name":"hex8"}:(c=V.hex3.exec(a))?{r:C(c[1]+""+c[1]),g:C(c[2]+""+c[2]),b:C(c[3]+""+c[3]),format:b?"name":"hex"}:!1}function L(a){var b,c;return a=a||{level:"AA",size:"small"},b=(a.level||"AA").toUpperCase(),c=(a.size||"small").toLowerCase(),"AA"!==b&&"AAA"!==b&&(b="AA"),"small"!==c&&"large"!==c&&(c="small"),{level:b,size:c}}var M=/^\s+/,N=/\s+$/,O=0,P=a.round,Q=a.min,R=a.max,S=a.random;b.prototype={isDark:function(){return this.getBrightness()<128},isLight:function(){return!this.isDark()},isValid:function(){return this._ok},getOriginalInput:function(){return this._originalInput},getFormat:function(){return this._format},getAlpha:function(){return this._a},getBrightness:function(){var a=this.toRgb();return(299*a.r+587*a.g+114*a.b)/1e3},getLuminance:function(){var b,c,d,e,f,g,h=this.toRgb();return b=h.r/255,c=h.g/255,d=h.b/255,e=.03928>=b?b/12.92:a.pow((b+.055)/1.055,2.4),f=.03928>=c?c/12.92:a.pow((c+.055)/1.055,2.4),g=.03928>=d?d/12.92:a.pow((d+.055)/1.055,2.4),.2126*e+.7152*f+.0722*g},setAlpha:function(a){return this._a=z(a),this._roundA=P(100*this._a)/100,this},toHsv:function(){var a=g(this._r,this._g,this._b);return{h:360*a.h,s:a.s,v:a.v,a:this._a}},toHsvString:function(){var a=g(this._r,this._g,this._b),b=P(360*a.h),c=P(100*a.s),d=P(100*a.v);return 1==this._a?"hsv("+b+", "+c+"%, "+d+"%)":"hsva("+b+", "+c+"%, "+d+"%, "+this._roundA+")"},toHsl:function(){var a=e(this._r,this._g,this._b);return{h:360*a.h,s:a.s,l:a.l,a:this._a}},toHslString:function(){var a=e(this._r,this._g,this._b),b=P(360*a.h),c=P(100*a.s),d=P(100*a.l);return 1==this._a?"hsl("+b+", "+c+"%, "+d+"%)":"hsla("+b+", "+c+"%, "+d+"%, "+this._roundA+")"},toHex:function(a){return i(this._r,this._g,this._b,a)},toHexString:function(a){return"#"+this.toHex(a)},toHex8:function(a){return j(this._r,this._g,this._b,this._a,a)},toHex8String:function(a){return"#"+this.toHex8(a)},toRgb:function(){return{r:P(this._r),g:P(this._g),b:P(this._b),a:this._a}},toRgbString:function(){return 1==this._a?"rgb("+P(this._r)+", "+P(this._g)+", "+P(this._b)+")":"rgba("+P(this._r)+", "+P(this._g)+", "+P(this._b)+", "+this._roundA+")"},toPercentageRgb:function(){return{r:P(100*A(this._r,255))+"%",g:P(100*A(this._g,255))+"%",b:P(100*A(this._b,255))+"%",a:this._a}},toPercentageRgbString:function(){return 1==this._a?"rgb("+P(100*A(this._r,255))+"%, "+P(100*A(this._g,255))+"%, "+P(100*A(this._b,255))+"%)":"rgba("+P(100*A(this._r,255))+"%, "+P(100*A(this._g,255))+"%, "+P(100*A(this._b,255))+"%, "+this._roundA+")"},toName:function(){return 0===this._a?"transparent":this._a<1?!1:U[i(this._r,this._g,this._b,!0)]||!1},toFilter:function(a){var c="#"+k(this._r,this._g,this._b,this._a),d=c,e=this._gradientType?"GradientType = 1, ":"";if(a){var f=b(a);d="#"+k(f._r,f._g,f._b,f._a)}return"progid:DXImageTransform.Microsoft.gradient("+e+"startColorstr="+c+",endColorstr="+d+")"},toString:function(a){var b=!!a;a=a||this._format;var c=!1,d=this._a<1&&this._a>=0,e=!b&&d&&("hex"===a||"hex6"===a||"hex3"===a||"hex4"===a||"hex8"===a||"name"===a);return e?"name"===a&&0===this._a?this.toName():this.toRgbString():("rgb"===a&&(c=this.toRgbString()),"prgb"===a&&(c=this.toPercentageRgbString()),("hex"===a||"hex6"===a)&&(c=this.toHexString()),"hex3"===a&&(c=this.toHexString(!0)),"hex4"===a&&(c=this.toHex8String(!0)),"hex8"===a&&(c=this.toHex8String()),"name"===a&&(c=this.toName()),"hsl"===a&&(c=this.toHslString()),"hsv"===a&&(c=this.toHsvString()),c||this.toHexString())},clone:function(){return b(this.toString())},_applyModification:function(a,b){var c=a.apply(null,[this].concat([].slice.call(b)));return this._r=c._r,this._g=c._g,this._b=c._b,this.setAlpha(c._a),this},lighten:function(){return this._applyModification(o,arguments)},brighten:function(){return this._applyModification(p,arguments)},darken:function(){return this._applyModification(q,arguments)},desaturate:function(){return this._applyModification(l,arguments)},saturate:function(){return this._applyModification(m,arguments)},greyscale:function(){return this._applyModification(n,arguments)},spin:function(){return this._applyModification(r,arguments)},_applyCombination:function(a,b){return a.apply(null,[this].concat([].slice.call(b)))},analogous:function(){return this._applyCombination(w,arguments)},complement:function(){return this._applyCombination(s,arguments)},monochromatic:function(){return this._applyCombination(x,arguments)},splitcomplement:function(){return this._applyCombination(v,arguments)},triad:function(){return this._applyCombination(t,arguments)},tetrad:function(){return this._applyCombination(u,arguments)}},b.fromRatio=function(a,c){if("object"==typeof a){var d={};for(var e in a)a.hasOwnProperty(e)&&(d[e]="a"===e?a[e]:G(a[e]));a=d}return b(a,c)},b.equals=function(a,c){return a&&c?b(a).toRgbString()==b(c).toRgbString():!1},b.random=function(){return b.fromRatio({r:S(),g:S(),b:S()})},b.mix=function(a,c,d){d=0===d?0:d||50;var e=b(a).toRgb(),f=b(c).toRgb(),g=d/100,h={r:(f.r-e.r)*g+e.r,g:(f.g-e.g)*g+e.g,b:(f.b-e.b)*g+e.b,a:(f.a-e.a)*g+e.a};return b(h)},b.readability=function(c,d){var e=b(c),f=b(d);return(a.max(e.getLuminance(),f.getLuminance())+.05)/(a.min(e.getLuminance(),f.getLuminance())+.05)},b.isReadable=function(a,c,d){var e,f,g=b.readability(a,c);switch(f=!1,e=L(d),e.level+e.size){case"AAsmall":case"AAAlarge":f=g>=4.5;break;case"AAlarge":f=g>=3;break;case"AAAsmall":f=g>=7}return f},b.mostReadable=function(a,c,d){var e,f,g,h,i=null,j=0;d=d||{},f=d.includeFallbackColors,g=d.level,h=d.size;for(var k=0;k<c.length;k++)e=b.readability(a,c[k]),e>j&&(j=e,i=b(c[k]));return b.isReadable(a,i,{level:g,size:h})||!f?i:(d.includeFallbackColors=!1,b.mostReadable(a,["#fff","#000"],d))};var T=b.names={aliceblue:"f0f8ff",antiquewhite:"faebd7",aqua:"0ff",aquamarine:"7fffd4",azure:"f0ffff",beige:"f5f5dc",bisque:"ffe4c4",black:"000",blanchedalmond:"ffebcd",blue:"00f",blueviolet:"8a2be2",brown:"a52a2a",burlywood:"deb887",burntsienna:"ea7e5d",cadetblue:"5f9ea0",chartreuse:"7fff00",chocolate:"d2691e",coral:"ff7f50",cornflowerblue:"6495ed",cornsilk:"fff8dc",crimson:"dc143c",cyan:"0ff",darkblue:"00008b",darkcyan:"008b8b",darkgoldenrod:"b8860b",darkgray:"a9a9a9",darkgreen:"006400",darkgrey:"a9a9a9",darkkhaki:"bdb76b",darkmagenta:"8b008b",darkolivegreen:"556b2f",darkorange:"ff8c00",darkorchid:"9932cc",darkred:"8b0000",darksalmon:"e9967a",darkseagreen:"8fbc8f",darkslateblue:"483d8b",darkslategray:"2f4f4f",darkslategrey:"2f4f4f",darkturquoise:"00ced1",darkviolet:"9400d3",deeppink:"ff1493",deepskyblue:"00bfff",dimgray:"696969",dimgrey:"696969",dodgerblue:"1e90ff",firebrick:"b22222",floralwhite:"fffaf0",forestgreen:"228b22",fuchsia:"f0f",gainsboro:"dcdcdc",ghostwhite:"f8f8ff",gold:"ffd700",goldenrod:"daa520",gray:"808080",green:"008000",greenyellow:"adff2f",grey:"808080",honeydew:"f0fff0",hotpink:"ff69b4",indianred:"cd5c5c",indigo:"4b0082",ivory:"fffff0",khaki:"f0e68c",lavender:"e6e6fa",lavenderblush:"fff0f5",lawngreen:"7cfc00",lemonchiffon:"fffacd",lightblue:"add8e6",lightcoral:"f08080",lightcyan:"e0ffff",lightgoldenrodyellow:"fafad2",lightgray:"d3d3d3",lightgreen:"90ee90",lightgrey:"d3d3d3",lightpink:"ffb6c1",lightsalmon:"ffa07a",lightseagreen:"20b2aa",lightskyblue:"87cefa",lightslategray:"789",lightslategrey:"789",lightsteelblue:"b0c4de",lightyellow:"ffffe0",lime:"0f0",limegreen:"32cd32",linen:"faf0e6",magenta:"f0f",maroon:"800000",mediumaquamarine:"66cdaa",mediumblue:"0000cd",mediumorchid:"ba55d3",mediumpurple:"9370db",mediumseagreen:"3cb371",mediumslateblue:"7b68ee",mediumspringgreen:"00fa9a",mediumturquoise:"48d1cc",mediumvioletred:"c71585",midnightblue:"191970",mintcream:"f5fffa",mistyrose:"ffe4e1",moccasin:"ffe4b5",navajowhite:"ffdead",navy:"000080",oldlace:"fdf5e6",olive:"808000",olivedrab:"6b8e23",orange:"ffa500",orangered:"ff4500",orchid:"da70d6",palegoldenrod:"eee8aa",palegreen:"98fb98",paleturquoise:"afeeee",palevioletred:"db7093",papayawhip:"ffefd5",peachpuff:"ffdab9",peru:"cd853f",pink:"ffc0cb",plum:"dda0dd",powderblue:"b0e0e6",purple:"800080",rebeccapurple:"663399",red:"f00",rosybrown:"bc8f8f",royalblue:"4169e1",saddlebrown:"8b4513",salmon:"fa8072",sandybrown:"f4a460",seagreen:"2e8b57",seashell:"fff5ee",sienna:"a0522d",silver:"c0c0c0",skyblue:"87ceeb",slateblue:"6a5acd",slategray:"708090",slategrey:"708090",snow:"fffafa",springgreen:"00ff7f",steelblue:"4682b4",tan:"d2b48c",teal:"008080",thistle:"d8bfd8",tomato:"ff6347",turquoise:"40e0d0",violet:"ee82ee",wheat:"f5deb3",white:"fff",whitesmoke:"f5f5f5",yellow:"ff0",yellowgreen:"9acd32"},U=b.hexNames=y(T),V=function(){var a="[-\\+]?\\d+%?",b="[-\\+]?\\d*\\.\\d+%?",c="(?:"+b+")|(?:"+a+")",d="[\\s|\\(]+("+c+")[,|\\s]+("+c+")[,|\\s]+("+c+")\\s*\\)?",e="[\\s|\\(]+("+c+")[,|\\s]+("+c+")[,|\\s]+("+c+")[,|\\s]+("+c+")\\s*\\)?";return{CSS_UNIT:new RegExp(c),rgb:new RegExp("rgb"+d),rgba:new RegExp("rgba"+e),hsl:new RegExp("hsl"+d),hsla:new RegExp("hsla"+e),hsv:new RegExp("hsv"+d),hsva:new RegExp("hsva"+e),hex3:/^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,hex6:/^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/,hex4:/^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,hex8:/^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/}}();"undefined"!=typeof module&&module.exports?module.exports=b:"function"==typeof define&&define.amd?define(function(){return b}):modules.tinycolor=b}(Math)
/*!
 * TinyGradient 0.4.0
 * Copyright 2014-2018 Damien "Mistic" Sorel (http://www.strangeplanet.fr)
 * Licensed under MIT (http://opensource.org/licenses/MIT)
 */
!function(a,b){"undefined"!=typeof module&&module.exports?module.exports=b(require("tinycolor2")):"function"==typeof define&&define.amd?define(["tinycolor2"],b):modules.tinygradient=b(modules.tinycolor)}(this,function(a){"use strict";function b(a,b,c){var d={};for(var e in a)a.hasOwnProperty(e)&&(d[e]=0===c?0:(b[e]-a[e])/c);return d}function c(a,b,c,d){var e={};for(var f in b)b.hasOwnProperty(f)&&(e[f]=a[f]*c+b[f],e[f]=e[f]<0?e[f]+d[f]:1!==d[f]?e[f]%d[f]:e[f]);return e}function d(d,e,f){for(var g,i=d.color.toRgb(),j=e.color.toRgb(),k=[d.color],l=b(i,j,f),m=1;m<f;m++)g=c(l,i,m,h),k.push(a(g));return k}function e(d,e,f,g){var h,j,k=d.color.toHsv(),l=e.color.toHsv(),m=[d.color],n=b(k,l,f);h=k.h<=l.h&&!g||k.h>=l.h&&g?l.h-k.h:g?360-l.h+k.h:360-k.h+l.h,n.h=Math.pow(-1,g?1:0)*Math.abs(h)/f;for(var o=1;o<f;o++)j=c(n,k,o,i),m.push(a(j));return m}function f(a,b){var c=a.length;if(b=parseInt(b),isNaN(b)||b<2)throw new Error("Invalid number of steps (< 2)");if(b<c)throw new Error("Number of steps cannot be inferior to number of stops");for(var d=[],e=1;e<c;e++){var f=(b-1)*(a[e].pos-a[e-1].pos);d.push(Math.max(1,Math.round(f)))}for(var g=1,h=c-1;h--;)g+=d[h];for(;g!==b;)if(g<b){var i=Math.min.apply(null,d);d[d.indexOf(i)]++,g++}else{var j=Math.max.apply(null,d);d[d.indexOf(j)]--,g--}return d}function g(d,e,f,g){if(e<0||e>1)throw new Error("Position must be between 0 and 1");for(var h,i,j=0,k=d.length;j<k-1;j++)if(e>=d[j].pos&&e<d[j+1].pos){h=d[j],i=d[j+1];break}h||(h=i=d[d.length-1]);var l=b(h.color[f](),i.color[f](),100*(i.pos-h.pos)),m=c(l,h.color[f](),Math.round(100*(e-h.pos)),g);return a(m)}var h={r:256,g:256,b:256,a:1},i={h:360,s:1,v:1,a:1},j=function(b){if(1===arguments.length){if(!(arguments[0]instanceof Array))throw new Error('"stops" is not an array');b=arguments[0]}else b=Array.prototype.slice.call(arguments);if(!(this instanceof j))return new j(b);if(b.length<2)throw new Error("Invalid number of stops (< 2)");var c=void 0!==b[0].pos,d=b.length,e=-1;this.stops=b.map(function(b,f){var g=void 0!==b.pos;if(c^g)throw new Error("Cannot mix positionned and not posionned color stops");if(g){if(b={color:a(b.color),pos:b.pos},b.pos<0||b.pos>1)throw new Error("Color stops positions must be between 0 and 1");if(b.pos<=e)throw new Error("Color stops positions are not ordered");e=b.pos}else b={color:a(b),pos:f/(d-1)};return b}),0!==this.stops[0].pos&&this.stops.unshift({color:this.stops[0].color,pos:0}),1!==this.stops[this.stops.length-1].pos&&this.stops.push({color:this.stops[this.stops.length-1].color,pos:1})};j.prototype.reverse=function(){var a=[];return this.stops.forEach(function(b){a.push({color:b.color,pos:1-b.pos})}),new j(a.reverse())},j.prototype.rgb=function(a){for(var b=f(this.stops,a),c=[],e=0,g=this.stops.length;e<g-1;e++)c=c.concat(d(this.stops[e],this.stops[e+1],b[e]));return c.push(this.stops[g-1].color),c},j.prototype.hsv=function(a,b){for(var c,g,h,i=f(this.stops,a),j=b===!0,k="string"==typeof b,l=[],m=0,n=this.stops.length;m<n-1;m++)c=this.stops[m].color.toHsv(),g=this.stops[m+1].color.toHsv(),k&&(h=c.h<g.h&&g.h-c.h<180||c.h>g.h&&c.h-g.h>180),l=0===c.s||0===g.s?l.concat(d(this.stops[m],this.stops[m+1],i[m])):l.concat(e(this.stops[m],this.stops[m+1],i[m],"long"===b&&h||"short"===b&&!h||!k&&j));return l.push(this.stops[n-1].color),l},j.prototype.css=function(a,b){a=a||"linear",b=b||("linear"===a?"to right":"ellipse at center");var c=a+"-gradient("+b;return this.stops.forEach(function(a){c+=", "+a.color.toRgbString()+" "+100*a.pos+"%"}),c+=")"},j.prototype.rgbAt=function(a){return g(this.stops,a,"toRgb",h)},j.prototype.hsvAt=function(a){return g(this.stops,a,"toHsv",i)};var k={rgb:1,hsv:2,css:2,rgbAt:1,hsvAt:1};return Object.keys(k).forEach(function(a){j[a]=function(){var b=Array.prototype.slice.call(arguments),c=b.splice(-k[a]),d=new j(b);return d[a].apply(d,c)}}),j});