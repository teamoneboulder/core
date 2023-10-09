if(!window.modules) window.modules={};
;modules.search=function(opts){
	var self=this;
	if(!opts.renderOpts) opts.renderOpts={};
	if(!opts.exclude) opts.exclude=[];
	self.options=opts;
	if(opts.input){
		opts.input.on('keyup',function(e){
			var v=$(this).val();
			var ov=v;
			if(opts.format){
				switch(opts.format){
					case 'tag':
						v=v.replace(/[^0-9a-z_ ]/gi, '');
					break;
					case 'tag_pretty':
						v=v.replace(/#/gi, '');
					break;
				}
				if(v!=ov){
					$(this).val(v);
				}
			}
			self.onKeyUp(v,e)
		}).on('keydown',function(e){
			if(e.which==13){
				self.keyboardSelect();
			}
			if(e.which==27){
				self.clear();
			}
			if(e.which==38){//up
				self.incriment('-')
			}
			if(e.which==40){//down
				self.incriment('+')
			}
		}).on('focus',function(){
			if(opts.keyUpOnFocus){
				$(this).trigger('keyup');
			}
			if(opts.cancelOnBlank){
				opts.cancelEle.show()
			}
			if(opts.onFocus) opts.onFocus();
		}).on('blur',function(){
			if(opts.cancelOnBlank){
				opts.cancelEle.hide()
			}
			if(opts.onBlur) opts.onBlur();
		})
		// .on('paste',function(e){
		// 	e.preventDefault();
		// });
	}
	if(opts.cancelEle) opts.cancelEle.stap(function(e){
		var cv=self.current;
		self.clear();
		if(opts.onCancel) opts.onCancel(cv);
		phi.stop(e)
	},1,'tapactive')
	if(self.options.searchEle){
		self.scroller=new modules.scrolldelegate(self.options.searchEle,{},{
			scrollStart:function(){
				if(self.options.scrollStart) self.options.scrollStart();
			},
			scroll:function(){
				if(self.options.scroll) self.options.scroll();
			},
			scrollEnd:function(){
				if(self.options.scrollEnd) self.options.scrollEnd();
			}
		});
	}else{
		console.warn('No search element!')
	}
	if(opts.defaultSelection&&opts.onSelect){
		opts.onSelect(opts.defaultSelection.id,opts.defaultSelection);
	}
	this.getType=function(type){
		var ret='';
		switch(type){
			case 'event':
				ret='event';
			break;
			case 'page':
				ret='page';
			break;
			case 'people':
				ret='user';
			break;
		}
		return ret;
	}
	this.onKeyUp=function(val,e){
		if(self.options.searchDisabled&&self.options.searchDisabled()){
			if(self.options.onBlank) self.options.onBlank();
			return false;
		}
		if(self.options.onKeyUp) self.options.onKeyUp(val)
		self.search(val);
		if(self.options.inline){
			if(self.options.input){
				self.options.input.trigger('inline_search');
			}
			if(self.options.textarea){
				self.options.textarea.trigger('inline_search');
			}
		}
	}
	this.incriment=function(dir){
		if(dir=='+'){
			if(self.options.web_placement=='above'){
				self.searchIndex--;
			}else{
				self.searchIndex++;
			}
		}
		if(dir=='-'){
			if(self.options.web_placement=='above'){
				self.searchIndex++;
			}else{
				self.searchIndex--;
			}
		}
		if(self.options.web_placement=='above'){
			var order=$.extend(true,[],self.resp.data.order).reverse();//reverse already reversed
		}else{
			var order=self.resp.data.order;
		}
		var ind=self.searchIndex-1;
		if(self.options.allowAdd){
			ind--;//allowadd
			var min=-2;
		}else{
			var min=-1;
		}
		if(ind<min){
			ind=min;
			self.searchIndex=ind+1;
			return false;
		}
		var sel=(self.inlineSearchEle)?self.inlineSearchEle:self.options.searchEle;
		if(ind==-1){
			sel.find(self.getItemClass()).removeClass('hovering');
			sel.find('[data-id='+self.cval.getTagId()+']').addClass('hovering')
		}else{
			//console.log(ind)
			var current=self.resp.data.list[order[ind]];
			//console.log(current)
			sel.find(self.getItemClass()).removeClass('hovering');
			if(current){
				sel.find('[data-id='+current.id+']').addClass('hovering')
			}
		}
	}
	this.keyboardSelect=function(){
		var ind=self.searchIndex-1;
		if(self.options.allowAdd){
			ind--;//allowadd
		}
		if(ind==-1){
			if(self.options.allowAdd){
				var item={
					id:self.cval.getTagId(),
					name:self.cval
				};
				self.select(item.id,item);
			}else{
				console.warn('prevent add')
			}
		}else if(self.resp&&self.resp.data&&self.resp.data.list){
			if(self.options.web_placement=='above'){
				var r=$.extend(true,[],self.resp.data.order).reverse();
				var uid=r[ind];
				var current=self.resp.data.list[r[ind]];
			}else{
				var current=self.resp.data.list[self.resp.data.order[ind]];
				var uid=self.resp.data.order[ind];
			}
			if(current){
				self.select(uid,current);
			}else{
				console.warn('nothing selected in range');
			}
		}
	}
	this.renderLoading=function(){
		if(modules.tools.isWebLayout()&&self.options.web_inline){
			self.ensureSearchEle();
			self.inlineSearchEle.render({
				template:'modules_search_loading',
				append:false
			});
			self.placeInlineBox();
			//place it!
		}else{
			self.placeSeachEle();
			self.options.searchEle.render({
				template:'modules_search_loading',
				append:false
			});
			self.scroller.scrollToTop();
			self.options.searchEle.show();
		}
	}
	this.onShow=function(){
		if(opts.cancelEle) opts.cancelEle.show();
	}
	this.clear=function(noClearText){
		self.current='';
		self.searching=false;
		if(opts.cancelEle&&!opts.cancelOnBlank&&!opts.dontHideCancel) opts.cancelEle.hide();
		if(self.options.searchEle) self.options.searchEle.html('').hide();
		if(self.inlineSearchEle){
			self.inlineSearchEle.remove()
			self.inlineSearchEle=false;
			if(self.options.exitSearch) self.options.exitSearch();
		}
		if(!noClearText){
			if(self.options.input) self.options.input.val('');
			if(self.options.onKeyUp) self.options.onKeyUp('');
		}
		self.enableScroller();
	}
	this.getTagId=function(val){
		var nval=val.trim().replace(/ /g,'_').replace(/\W/g, '').toLowerCase();
		return nval;
	}
	this.remove=function(id){
		if(self.options.noExclude) return true;
		if(self.options.exclude.indexOf(id)>=0){
			self.options.exclude.splice(self.options.exclude.indexOf(id),1);
			if(self.options.onRemove) self.options.onRemove(id);
		}
	}
	this.placeSeachEle=function(){
		if(self.options.fitSearch){
			var kh=modules.keyboard_global.keyboardHeight;
			self.options.searchEle.css('bottom',kh+'px');
			var left=0;
			if(self.options.input){
				var top=false;
				if(self.options.getTop) top=self.options.getTop();
				if(top===false){
					if(self.options.fitPosition){
						var off=self.options.input.position();
					}else{
						var off=self.options.input.offset();
					}
					var top=off.top;
					top+=self.options.input.outerHeight()+5
				}
			}
			if(self.options.textarea){
				var off=self.options.textarea.offset();
				var caret=self.options.textarea.textareaHelper('caretPos');
	        	var ctop=caret.top;
	        	var top=off.top+ctop+parseInt(self.options.textarea.css('fontSize'),10)+5;//add line height of current
			}
			if(self.options.searchOffsetTop) top+=self.options.searchOffsetTop;
			if(self.options.searchOffsetLeft) left+=self.options.searchOffsetLeft;
			self.options.searchEle.css({
				top:top+'px',
				left:left+'px'
			});//guess for now...
		}
	}
	this.ensureSearchEle=function(){
		if(!self.inlineSearchEle){
			if(self.options.enterSearch) self.options.enterSearch();
			if(self.options.web_container){
				var re=self.options.web_container
			}else{
				var re=self.options.scroller.getScroller();
			}
			re.render({
				template:'search_inline',
				data:{
					width:(self.options.searchWidth)?self.options.searchWidth:false
				},
				binding:function(ele){
					self.inlineSearchEle=ele;
				}
			})
		}
	}
	this.getItem=function(id){
		if(self.resp.data&&self.resp.data.list&&self.resp.data.list[id]){
			var item=self.resp.data.list[id];
		}else{
			var item={
				id:id,
				name:self.cval
			};
		}
		return item;
	}
	this.select=function(id){
		var item=self.getItem(id);
		if(self.options.onSelect) self.options.onSelect(id,item);
		if(!self.options.noExclude) self.options.exclude.push(id);
		if(opts.multiple){
			if(modules.keyboard_global) modules.keyboard_global.preventHide();//prevents a jerky keyboard
			if(isPhoneGap()){
				if(opts.input){
					opts.input.one('blur',function(){
						opts.input.focus()
					})
				}
				if(opts.textarea){
					opts.textarea.one('blur',function(){
						opts.textarea.focus()
					})
				}
			}else{
				setTimeout(function(){
					if(opts.input){
						opts.input.focus()
					}
					if(opts.textarea){
						opts.textarea.focus();
					}
				},50)
			}
		}
		if(!self.options.dontClearOnSelect){
			setTimeout(function(){//prevents click from bleeding thru
				self.clear();
				//refocus on input!
				//fif(opts.input) opts.input.focus()
			},50);
		}
	}
	this.getItemClass=function(){
		if(opts.itemClass) return opts.itemClass;
		return '.tagitem';
	}
	this.getSelectClass=function(){
		return (self.options.selectedClass)?self.options.selectedClass:'tag_exclude';
	}
	this.bindElements=function(ele,resp,val){
		self.ele=ele;
		ele.find(self.getItemClass()).stap(function(e){
			var id=$(this).attr('data-id');
			if($(this).hasClass(self.getSelectClass())){
				//toggle off?
				if(self.options.onRemove){
					self.options.onRemove(id,self.getItem(id));
					$(this).removeClass(self.getSelectClass());
				}
			}else{
				self.select(id);
				$(this).addClass(self.getSelectClass())
			}
		},1,'tapactive');
		if(self.options.fixResultsHeight){
			self.options.fixResultsHeight.height(ele.height());
		}
	}
	this.placeInlineBox=function(){
		if(self.options.web_placement=='above'){
			var re=(self.options.web_container)?self.options.web_container:self.options.scroller.getScroller();
			if(self.options.textarea){
				var bottom=re.height();
				var offset=self.options.textarea.relativeOffset(self.options.scroller.getScroller());
				var caret=self.options.textarea.textareaHelper('caretPos');
	        	var ctop=caret.top;
	        	bottom=bottom-ctop+10;
	        	offset.bottom=bottom;
	        	offset.left=0;
	        	offset.top='';
	        	//get position of @ symbol
	        	var content=self.options.textarea.val();
	        	var ind=content.indexOf('@');
	        	if(ind){
	        		var ci=self.options.textarea.caret();
	        		self.options.textarea.caret(ind);
	        		var caretStart=self.options.textarea.textareaHelper('caretPos');
	        		offset.left+=(caretStart.left-5)+50;
	        		self.options.textarea.caret(ci);//put back!
	        	}
	        	// //set carot postition
	        	// offset.top=offset.top+ctop+parseInt(self.options.textarea.css('fontSize'),10)+5;//add line height of current
			}else if(self.options.input){
				var offset=self.options.input.relativeOffset(self.options.scroller.getScroller());
				offset.top+=self.options.input.outerHeight();
			}
		}else{
			if(self.options.textarea){
				var offset=self.options.textarea.relativeOffset(self.options.scroller.getScroller());
				var caret=self.options.textarea.textareaHelper('caretPos');
	        	var ctop=caret.top;
	        	//get position of @ symbol
	        	var content=self.options.textarea.val();
	        	var ind=content.indexOf('@');
	        	if(ind){
	        		var ci=self.options.textarea.caret();
	        		self.options.textarea.caret(ind);
	        		var caretStart=self.options.textarea.textareaHelper('caretPos');
	        		offset.left+=(caretStart.left-5);
	        		self.options.textarea.caret(ci);//put back!
	        	}
	        	//set carot postition
	        	offset.top=offset.top+ctop+parseInt(self.options.textarea.css('fontSize'),10)+5;//add line height of current
			}else if(self.options.input){
				if(self.options.scroller){
					var offset=self.options.input.relativeOffset(self.options.scroller.getScroller());
				}else{
					var offset={top:0,left:0};
				}
				offset.top+=self.options.input.outerHeight();
			}
		}
		if(self.options.searchOffsetTop) offset.top+=self.options.searchOffsetTop;
		if(self.options.searchOffsetLeft) offset.left+=self.options.searchOffsetLeft;
		offset.maxHeight='300px';
		self.inlineSearchEle.css(offset)
		self.inlinescroll=new modules.scrolldelegate(self.inlineSearchEle);
		// self.inlineSearchEle.addClass('scrollY');
	}
	this.parseData=function(resp){
		if(self.options.appendData){
			if(!resp.data) resp.data={};
			if(!resp.data.list) resp.data.list={};
			if(!resp.data.order) resp.data.order=[];
			//only append if more than 1 char
			if(self.cval&&self.cval.length>=1){
				$.each(self.options.appendData.order,function(i,v){
					if(resp.data.order.indexOf(v)==-1){
						resp.data.order.push(v);
						resp.data.list[v]=self.options.appendData.list[v];
					}
				})
				if(resp.error) delete resp.error;
				resp.success=true;
			}
		}
		return resp;
	}
	this.loadResults=function(resp,val){
		self.cval=val;
		resp=self.parseData(resp);
		if(resp.error){
			if(modules.tools.isWebLayout()&&self.options.web_inline){
				self.inlineSearchEle.html('<div style="padding:20px;text-align:center;background:white;"><i class="icon-warning-sign"></i> '+resp.error+'</div>');
			}else{
				self.options.searchEle.html('<div style="padding:20px;text-align:center;background:white;"><i class="icon-warning-sign"></i> '+resp.error+'</div>')
			}
			return false;
		}
		if(self.options.parseData){
			self.resp=self.options.parseData(resp);
		}else{
			self.resp=resp;//current response
		}
		if(resp.data||self.options.allowAdd||self.options.allowNoResults||self.options.web_inline){
			self.searchIndex=0;
			if(val||opts.allowBlank){
				self.searching=true;
				if(modules.tools.isWebLayout()&&self.options.web_inline){
					if(!self.resp.data||!self.resp.data.order||!self.resp.data.order.length){
						if(self.options.showNoResults){
							return self.inlineSearchEle.html('<div style="padding:20px;text-align:center;"><i class="icon-info-circled-alt"></i> No Results</div>');
						}else{
							if(!self.options.allowAdd) return self.clear(1);
						}
					}
					self.ensureSearchEle();
					if(self.options.web_placement=='above'){
						self.resp.data.order.reverse();
					}
					self.inlineSearchEle.render({
						template:(self.options.listTemplate)?self.options.listTemplate:'modules_search_list',
						append:false,
						data:$.extend(true,{},{opts:$.extend(true,{},{
							search:self.current
						},opts.renderOpts),minHeight:(self.options.noMinHeight)?'':'80vh',keyOn:(self.options.keyOn)?self.options.keyOn:'id',allowAdd:(self.options.allowAdd)?1:0,id:self.getTagId(val),name:val,render_template:((opts.renderTemplate)?opts.renderTemplate:'modules_search_item'),exclude:self.options.exclude},resp),
						binding:function(ele){
							self.bindElements(ele,resp,val);
							self.placeInlineBox();
							if(self.options.web_placement=='above'){
								self.inlinescroll.scrollToBottom(0);
							}
						}
					})
				}else{
					//place searchEle
					self.placeSeachEle();
					self.options.searchEle.render({
						template:(self.options.listTemplate)?self.options.listTemplate:'modules_search_list',
						append:false,
						data:$.extend(true,{},{opts:$.extend(true,{},{
							search:self.current
						},opts.renderOpts),minHeight:(self.options.noMinHeight)?'':'150vh',keyOn:(self.options.keyOn)?self.options.keyOn:'id',allowAdd:(self.options.allowAdd)?1:0,id:self.getTagId(val),name:val,render_template:((opts.renderTemplate)?opts.renderTemplate:'modules_search_item'),exclude:self.options.exclude},resp),
						binding:function(ele){
							self.bindElements(ele,resp,val);
						}
					})
					self.options.searchEle.show();
					self.disableScroller();
				}
			}else{
				if(self.options.searchEle){
					self.options.searchEle.html('').hide();
					self.searching=false;
					self.enableScroller();
				}
			}
		}else{
			if(resp.error){
				self.options.searchEle.html(resp.error).show();
				self.disableScroller();
			}else{
				if(self.options.showNoResults){
					self.options.searchEle.html('<div style="padding:20px;text-align:center;"><i class="icon-info-circled-alt"></i> No Results</div>');
				}else{
					self.options.searchEle.html('').hide();
					self.searching=false;
					self.enableScroller();
				}
			}
		}
		if(opts.onRender) opts.onRender();
	}
	this.enableScroller=function(){
		if(self.options.scroller) self.options.scroller.enable()
	}
	this.disableScroller=function(){
		if(self.options.scroller) self.options.scroller.disable()
	}
	this.search=function(val,force){
		if(val||opts.allowBlank){
			if(val!=self.current||force||(!val&&opts.allowBlank)){
				self.current=val;
				if(!opts.disableLoading) self.renderLoading();
				if(opts.cancelEle) opts.cancelEle.show();
				var data={
                    search:val,
                    dontShow:(self.options.dontShow)?self.options.dontShow:''
                }
                if(self.options.endpointData) data=$.extend(true,{},self.options.endpointData,data);
                if(self.options.getEndpointData) data=$.extend(true,{},self.options.getEndpointData(),data);
                if(self.options.getEndpointFormData){
                	var fd=self.options.getEndpointFormData();
                	if(!self.options.getEndpointFormData()) return false;//stop it!
                	if(fd!==true) data=$.extend(true,{},fd,data);
                }
                var api=(modules.api)?modules.api:app.api;
	            api({
	                url:self.options.endpoint,
	                type:'GET',
	                data:data,
	                success:function(resp){
	                	if(self.current==val){
	                    	self.loadResults(resp,val);
	                    }else{
	                    	console.log('val updated during request')
	                    }
	                }
	            })
	        }
	    }else{
	    	if(opts.onBlank){
	    		opts.onBlank();
	    	}else self.loadResults(false,val);
	    }
	}
	this.destroy=function(){
		delete self;
	}
}