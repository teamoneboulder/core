modules.htmleditor=function(options){
	var self=this;
	self.options=options;
	this.plugins={
		'grapesjs-typed':{
			options:{}
		},
		'gjs-preset-webpage':{
			options:{
			}
		},
		testmodule:{
			init:function(editor){
				editor.BlockManager.add('parallax',{
					id:'parallax',
					label: 'Parallax Module',
  					category: 'modules',
  					content:{
  						type:'parallax'
  					}
				});
				// Do something on response
				editor.Commands.add('open-assets', {
				     run:function(editor, sender, opts = {}){
						if(!self.showingCropUploader){
							self.showingCropUploader=1;
					        phi.register('cropuploader',{
								directUpload:true,
								sizes:['small','full'],
								data:{
									title:'Upload Photo',
									crops:[{
										title:'Crop Photo',
										responsiveCrop:true,
										cropKey:'small'
									}]
								},
								onExit:function(){
									self.showingCropUploader=0;
								},
								onSuccess:function(img){
									self.cropuploader.destroy();
									var url=modules.tools.getImg(img,'small');
									// Get the View
									//var view = component.getView();
									opts.target.setAttributes({src:url});
									//target.set('src', url)
									//console.log(url,img)
								}
							},function(component){
					        	self.cropuploader=component;
					        	self.cropuploader.show();
					        })
					    }
				     }
				});
				editor.DomComponents.addType('parallax', {
				    isComponent: function(el){
				    	if(el.tagName=='parallax'){
				    		return true;
				    	}
				    },
				    model: {
				    	droppable: true,
				    	toHTML:function(isModel){
				    		var img=this.getAttributes().src;
				    		var speed=this.getAttributes().speed;
				    		if(isModel){
				    			var editor='data-gjs-highlightable="false" data-gjs-hoverable="false" data-gjs-selectable="false" data-gjs-dropable="false"';
				    			var dropable='data-gjs-dropable="true"'
				    			var style='<style>.parallax_container{height:80vh;overflow:hidden;position:relative;}.rellaxcontent{position:absolute;top:10px;left:10px;right:10px;bottom:10px;}</style>';
				    		}else{
				    			var editor='';
				    			var dropable='';
				    		}
				    		var str='<div speed="'+speed+'" class="parallax_container" '+editor+'><div class="rellaxcontent" '+editor+' '+dropable+'></div><div class="rellax rellaxcontainer" '+editor+'><div '+editor+' style="width:100%;height:100%;background-image:url('+img+');background-repeat:no-repeat;-webkit-background-size: cover;-moz-background-size: cover;-o-background-size: cover;background-size: cover;background-position:center;"></div></div></div>';
				    		if(isModel) return style+str;
				    		var attrs='';
				    		// var atrs=this.getAttributes();
				    		// for(var attrid in atrs){
				    		// 	var attr=atrs[attrid];
				    		// 	attrs+=attrid+'="'+attr+'" ';
				    		// }
				    		attrs='id="'+this.getAttributes().id+'"';
				    		str='<div '+attrs+'>'+str+'</div>';
				    		console.log(str)
				    		return str;
				    	},
				      defaults: {
				      	tagName: 'parallax',
				      	components:function(model){
				      		console.log('=====')
				    		return model.toHTML(1);
				    	},
				    	resizable:true,
				    	script:function(){
				    		var el = this;
				    		var transformProp = window.transformProp || (function(){
						        var testEl = document.createElement('div');
						        if (testEl.style.transform === null) {
						          var vendors = ['Webkit', 'Moz', 'ms'];
						          for (var vendor in vendors) {
						            if (testEl.style[ vendors[vendor] + 'Transform' ] !== undefined) {
						              return vendors[vendor] + 'Transform';
						            }
						          }
						        }
						        return 'transform';
						      })();
				    		if(!window._parallaxScrollers) window._parallaxScrollers={};//only one per scroller!
				    		if (!Element.prototype.closest) {
								  Element.prototype.closest = function(s) {
								    var el = this;

								    do {
								      if (el.matches(s)) return el;
								      el = el.parentElement || el.parentNode;
								    } while (el !== null && el.nodeType === 1);
								    return null;
								  };
								}
							 function setParallaxPosition(elements,scrollY){
				  				var mode='simple';
				  				var conf={
				  					speed:2,
				  					mode:'simple'
				  				}
						    	conf.speed=(elements.container.attributes['speed'])?parseFloat(elements.container.attributes['speed'].value):2;
				  				//var mode='collapse';
						    	var result={} 
						    	var viewportBottom=scrollY+elements.scroller.clientHeight;
						    	var viewportTop=scrollY;
						    	var containerTop=elements.container.getBoundingClientRect().top;
						    	var startCalc=containerTop-elements.scroller.clientHeight;//when top of element enters visible viewport
								var endCalc=containerTop+elements.container.clientHeight;//when bottom of element leaves top of viewport
						    	var boundedDiff=scrollY-startCalc;
						    	var distance=(endCalc-startCalc);
								var diffyp=boundedDiff/distance;
						    	containerTop+=scrollY;
						    	switch(mode){
						    		case 'simple':
						    			//ensure height of container
						    			var diffpx=conf.speed*distance*.2;//travel in pixels over 100 complete
								    	if(scrollY<startCalc){
								    		result.y = 0;
								    	}else if(scrollY>endCalc){
								    		result.y=-diffpx;
								    	}else{
								    		//console.log(diffyp)
								    		result.y=-diffpx*diffyp;
								    	}
								    	//console.log(container.clientHeight,diffpx)
								    	var newheight=(elements.container.clientHeight+diffpx);
								    	if(elements.block.style.height!=newheight){
								    		elements.block.style.height=newheight;
								    	}
								    	//result.y=0;
									    result.x =0;
								   	break;
								   	case 'collapse':

								   	break;
								
								}
								if(!zIndex) var zIndex=1;
								var translate = 'translate3d(' + (result.x) + 'px,' + result.y + 'px,' + zIndex + 'px)';
        						elements.block.style[transformProp] = translate;
							}
							  function updateParallaxView(id,scrollY){
							  	console.time('updateParallaxView')
							  	for (var item in window._parallaxScrollers[id]) {
							  		setParallaxPosition(window._parallaxScrollers[id][item],scrollY);
							  	}
							  	console.timeEnd('updateParallaxView')
							  }
							  if(el.querySelector('.rellax').className.indexOf('bound')==-1){
							  		el.querySelector('.rellax').className+=' bound';
							  		var elid=el.attributes.id.value;
							  		var scroller=el.closest('.scrollY');
							  		if(scroller.tagName=='BODY'){//in preview mode
							  			var id='window';
							  			var bindElement=document;	
							  		}else{
							  			var id=scroller.attributes.id;
							  			var bindElement=scroller;	
								  	}
								  	if(!window._parallaxScrollers[id]){
								  		bindElement.addEventListener('scroll',function(){
								  			window.requestAnimationFrame(function(){
								  				if(scroller.tagName=='BODY'){//in preview mode
								  					var top=window.scrollY;
								  				}else{
								  					var top=scroller.scrollTop;
								  				}
								  				updateParallaxView(id,top)
								  			})
								  		})
								  		window._parallaxScrollers[id]={};
								  	}
								  	window._parallaxScrollers[id][elid]={
							  			container:el.querySelector('.parallax_container'),
							  			block:el.querySelector('.rellax'),
							  			scroller:scroller
							  		}
								}
				    	},
				    	attributes:{
				    		speed:1,
				    		src:'https://wearenectar.s3.amazonaws.com/static/hummingbird.jpg'
				    	},
				        traits: [{	
				        	type:'number',
			        		name:'speed',
			        		label:'Speed',
			        		min: 0, // Minimum number value
							max: 10, // Maximum number value
							step: 1, // Number of steps
				        },{	
				        	type:'string',
			        		name:'src',
			        		label:'Image Source'
				        }]
				       },
				    },
				    view:{
				    	init:function(){
				    		this.on('change:attributes:speed', this.render);
				    	},
				    	events:{
				    		dblclick:function(e){
				    			editor.runCommand('open-assets',{
				    				target: editor.getSelected()
				    			});
				    		}
				    	}
				    }
				});
			},
			options:{

			}
		}
	};
	this.getGetPlugins=function(){
		var plugins=[];
		$.each(self.plugins,function(i,v){
			if(v.init) plugins.push(v.init);
			else plugins.push(i);
		})
		return plugins;
	}
	this.getGetPluginOpts=function(){
		var opts={};
		$.each(self.plugins,function(i,v){
			opts[i]=(v.options)?v.options:{}
		})
		console.log(opts)
		return opts;
	}
	this.show=function(){
		options.ele.render({
			template:'htmleditor',
			binding:function(ele){
				self.ele=ele;
				//bind editor
				self.editor = grapesjs.init({
				  // Indicate where to init the editor. You can also pass an HTMLElement
				  container: self.ele.find('.gjs')[0],
				  plugins:self.getGetPlugins(),
				  pluginOptions:self.getGetPluginOpts(),
				  deviceManager: {
				    devices: [{
				        name: 'Desktop',
				        width: '', // default size
				      }, {
				        name: 'Tablet',
				        width: '700px' // this value will be used on canvas width
				    },{
				        name: 'Mobile',
				        width: '320px' // this value will be used on canvas width
				    }]
				  },
				  layerManager: {
				    appendTo:self.ele.find('.layers-container')[0]
				  },
				  protectedCss: '* { box-sizing: border-box; }body{margin:0;}.sfit{position:absolute;top:0;left:0;right:0;bottom:0;}.scrollY{overflow-x: hidden;overflow-y:scroll !important;-webkit-overflow-scrolling: touch;}',
				  // Get the content for the canvas directly from the element
				  // As an alternative we could use: `components: '<h1>Hello World Component!</h1>'`,
				  fromElement: true,
				  // Size of the editor
				  height: '100%',
				  width: 'auto',
				  // Disable the storage manager for the moment
				storageManager: {
			      type: 'remote',
			      autosave: true,
			      storeComponents: true,  // Enable/Disable storing of components in JSON format
			      storeStyles: true,      // Enable/Disable storing of rules in JSON format
			      storeHtml: true,        // Enable/Disable storing of components as HTML string
			      storeCss: true,
			      autoload: true,
			      urlStore: app.sapiurl+'/module/htmleditor/save',
			      urlLoad: app.sapiurl+'/module/htmleditor/load/'+app.home.user.profile.id+'_about',
			      params: {
			      	appid:app.appid,
			      	token:app.home.user.token,
			      	view_id:'about',
			      	page_id:app.home.user.profile.id
			      }, // Custom parameters to pass with the remote storage request, eg. CSRF token
			      headers: {}, // Custom headers for the remote storage request
			    },
				});
				self.editor.Canvas.getBody().className+=' scrollY';//necessary for parallax
				self.editor.on('destroy', function(){
					//console.log('========')
				});
				self.editor.on('storage:end:store', function(response){
					if(response.error){
						growl({
							remove:2000,
							type:'warning',
							content:'Error: '+response.error
						})
					}
				});
				// self.editor.CssComposer.setRule('.scrollY', {
				//   'overflow-y': 'auto'
				// });
				// self.editor.CssComposer.setRule('.sfit', {
				//   'position': 'absolute',
				//   'top':0,
				//   'left':0,
				//   'right':0,
				//   'bottom':0
				// });
			}
		})
	}
	this.destroy=function(){
		if(self.editor){
			self.editor.trigger('destroy');
			self.editor.destroy()
		}
		self.ele.remove();
	}
}