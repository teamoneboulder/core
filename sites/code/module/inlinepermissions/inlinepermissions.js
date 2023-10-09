if(!window.modules) window.modules={};
modules.inlinepermissions_global={
	getIcon:function(perms){
		if(!perms) return 'icon-globe';
		var icon='';
		if(perms[0]=='friends'){
			icon='icon-friends-nectar';
		}else if(perms[0]=='public'){
			icon='icon-globe';
		}else if(perms[0]=='followers'){
			icon='icon-rss';
		}else if(perms[0]=='members'){
			icon='icon-groups';
		}else if(perms[0]=='private'){
			icon='icon-lock';
		}else{
			icon='icon-gear';
		}
		return icon;
	},
	getLabel:function(perms){
		if(!perms) return 'Public';
		var icon='';
		if(perms[0]=='friends'){
			icon='Friends Only';
		}else if(perms[0]=='public'){
			icon='Public';
		}else if(perms[0]=='followers'){
			icon='Followers';
		}else if(perms[0]=='members'){
			icon='Members';
		}else if(perms[0]=='private'){
			icon='Only Me';
		}else{
			icon='Custom';
		}
		return icon;
	}
}
modules.inlinepermissions=function(options){
	var self=this;
	if(!options.data) options.data={};
	if(!options.limit) options.limit=false;
	if(options.page&&options.page[0]=='G') options.data.limit=['extra'];
	self.options=options;
	self.cacheId='inlineperm.'+options.cache;
	if(!self.options.data.permission||!self.options.data.permission.length&&options.cache){
		//self.options.data.permission=app.prefs.get('inlineperm_'+options.cache);
		self.options.data.permission=app.user.getSetting(self.cacheId);
	}
	this.show=function(){
		self.shown=1;
		self.render();
	}
	this.destroy=function(){
		delete self;
	}
	this.showPermissions=function(){
		modules.keyboard_global.hide();
		var top=self.ele.offset().top+self.ele.outerHeight()+30;
		var left=self.ele.offset().left+self.bele.outerWidth()/2;
		if(options.container){
			top=top-options.container.offset().top;
			left=left-options.container.offset().left;
		}
		var bleft=self.ele.offset().left;
		var rele=(options.container)?options.container:$('body');
		rele.render({
			template:'inlinepermissions_button_view',
			data:{
				top:top,
				left:left,
				data:self.options.data,
				bgclass:(options.bgclass)?options.bgclass:''
			},
			binding:function(ele){
				self.pele=ele;
				self.bind(ele);
				var h=ele.find('.permlist').outerHeight();
				var mh=rele.height()*.6;
				if(h>mh){
					ele.find('.permscroller').css('maxHeight',mh).addClass('scrollY')
				}
				self.place();
				ele.stap(function(){
					self.closePermissions();
				},1,'tapactive')
			}
		})
	}
	this.place=function(){
		//fit it!
		var rele=(options.container)?options.container:$('body');
		var left=self.ele.offset().left+self.bele.outerWidth()/2;
		if(options.container){
			left=left-options.container.offset().left;
		}
		var cl=((left)-250/2)
		var cr=cl+250;
		if(cl<10){
			var cl=10;
		}
		var w=rele.width();
		if(cr>w){
			var diff=cr-w+20;
			cl-=diff;
		}
		self.pele.find('.placer').css('left',cl);
		var left=self.ele.offset().left+self.bele.outerWidth()/2-10;
		if(options.container){
			left=left-options.container.offset().left;
		}
		self.pele.find('.arrow').css('left',left);
	}
	this.closePermissions=function(){
		self.pele.fadeOut(500,function(){
			$(this).remove();
		})
	}
	this.render=function(){
		if(self.options.button){
			//console.log(self.options.data)
			self.ele.render({
				template:'inlinepermissions_button',
				append:false,
				data:{
					data:self.options.data
				},
				binding:function(ele){
					self.bele=ele;
					self.setStatus();
					ele.stap(function(){
						self.showPermissions();
					},1,'tapactive')
				}
			})
		}else{
			if(self.shown&&!self.rendered&&self.options.data.group_list){
				self.ele.render({
					template:'inlinepermissions_rowview',
					append:false,
					data:{
						data:self.options.data
					},
					binding:function(ele){
						self.setStatus();
						self.bind(ele);
					}
				})
				self.rendered=true;
			}else{
				console.log('waiting...');
			}
		}
	}
	this.bind=function(ele){
		var h=ele.find('.extracontent').outerHeight();
		ele.find('.toprow').stap(function(e){
			phi.stop(e)
			if(self.showing){
				TweenLite.to(ele,.2,{y:0});
				ele.find('.listicon').removeClass('rotatearrow')
				self.showing=0;
			}else{
				if(self.showing2){
					TweenLite.to(ele,.2,{y:-(h+ele.find('.extralisttoggle').outerHeight())});
				}else{
					TweenLite.to(ele,.2,{y:-h});
				}
				ele.find('.listicon').addClass('rotatearrow')
				self.showing=1;
			}
		},1,'tapactive');
		ele.find('.listtoggle').stap(function(e){
			phi.stop(e)
			if(self.options.button){
				if(self.showing2){
					ele.find('.listicon2').removeClass('rotatearrow')
					ele.find('.extralist').hide();
					self.showing2=0;
				}else{
					ele.find('.listicon2').addClass('rotatearrow')
					ele.find('.extralist').show();
					self.showing2=1;
				}
			}else{
				if(self.showing2){
					TweenLite.to(ele,.2,{y:-(h)});
					//TweenLite.to(ele.find('.extralisttoggle'),.2,{marginTop:'-100%'});
					ele.find('.listicon2').removeClass('rotatearrow')
					self.showing2=0;
				}else{
					TweenLite.to(ele,.2,{y:-(h+ele.find('.extralisttoggle').outerHeight())});
					//TweenLite.to(ele.find('.extralisttoggle'),.2,{marginTop:0});
					ele.find('.listicon2').addClass('rotatearrow')
					self.showing2=1;
				}
			}
		},1,'tapactive');
		ele.find('.toggler').stap(function(e){
			if($(this).hasClass('checked')&&$(this).hasClass('maintoggler')) return false;
			if($(this).hasClass('checked')&&$(this).hasClass('listtoggler')&&ele.find('.listtoggler.checked').length==1) return false;
	    	//set proper state!
	    	var type=$(this).attr('data-type');
	  		var permission=[];
	    	if(type=='list'){
	    		$(this).toggleClass('checked');
	    		ele.find('.listtoggler').each(function(i,v){
	    			if($(v).hasClass('checked')) permission.push($(v).attr('data-list'));
	    		});
	    		ele.find('.maintoggler').removeClass('checked');
	    	}else{
	        	var permission=[];
	    		permission.push(type);
	    		ele.find('.listtoggler').removeClass('checked');
	    		ele.find('.maintoggler').removeClass('checked');
	    		$(this).addClass('checked');
	    	}
	    	self.options.data.permission=permission;
	    	if(options.cache){
	    		//console.log(self.cacheId,permission);
				app.user.setSetting(self.cacheId,permission);
			}
	    	self.setStatus();
	    	phi.stop(e);
	    },1,'tapactive');
	}
	this.getStatus=function(){
		var html='';
		if(self.options.button){
			if(self.options.data.permission&&self.options.data.permission.length){
				if(self.options.data.permission[0]=='public'){
					html='<i class="icon-globe"></i> Public';
				}else if(self.options.data.permission[0]=='friends'){
					html='<i class="icon-friends-nectar"></i> Friends';
				}else if(self.options.data.permission[0]=='private'){
					html='<i class="icon-lock"></i> Only Me';
				}else if(self.options.data.permission[0]=='followers'){
					html='<i class="icon-rss"></i> Followers';
				}else if(self.options.data.permission[0]=='members'){
					html='<i class="icon-groups"></i> Members';
				}else{//list mode!
					if(self.options.data.permission.length==1){
						html='<i class="icon-gear"></i> '+self.options.data.permission.length+' custom list';
					}else{
						html='<i class="icon-gear"></i> '+self.options.data.permission.length+' custom lists';
					}
				}
			}else{
				if(self.options.nodata){
					html=self.options.nodata;
				}else{
					html='<i class="icon-friends-nectar"></i> No Audience Set';
				}
			}
		}else{
			if(self.options.data.permission&&self.options.data.permission.length){
				if(self.options.data.permission[0]=='public'){
					html='<b>Visibility:</b> Public';
				}else if(self.options.data.permission[0]=='friends'){
					html='<b>Visibility:</b> Friends';
				}else if(self.options.data.permission[0]=='friends'){
					html='<b>Visibility:</b> Only Me';
				}else{//list mode!
					if(self.options.data.permission.length==1){
						html='<b>Visibility:</b> Custom from '+self.options.data.permission.length+' list';
					}else{
						html='<b>Visibility:</b> Custom from '+self.options.data.permission.length+' lists';
					}
				}
			}else{
				html='No Permission Set Yet';
			}
		}
		return html;
	}
	this.setStatus=function(){
		self.ele.find('.currentpermission').html(self.getStatus());
		if(self.options.button&&self.pele){//fix arrrow
			self.place();
		}
	}
	this.getPermissions=function(){
		var p=self.options.data.permission;
		return p;
	}
	this.ensureCachedValue=function(){
		var current=self.options.data.permission;
		//get valid permisions
		var valid=[];
		if(!self.options.data.group_list.noextra){
			valid.push('public');
			valid.push('friends');
			valid.push('private');
		}
		if(self.options.data.group_list){
			$.each(self.options.data.group_list.order,function(i,v){
				valid.push(v);
			})
		}
		if(valid.indexOf(current[0])==-1){//clear out
			self.options.data.permission=false;
		}
		if(typeof self.options.data.permission=='string') self.options.data.permission=false;
		if(!self.options.data.permission) self.options.data.permission=[valid[0]];//default to first permission available
	}
	this.load=function(){
		//show loader
		if(self.loading) return false;
		self.loading=1;
		self.ele.html('<table style="width:100%;height:100%;color:white;text-align:center"><tr><td><i class="icon-refresh animate-spin"></i></td></tr></table>');
		app.api({
            url:app.sapiurl+'/module/inlinepermissions/get',
            data:{
            	field:self.options.data.field,
            	identity:self.options.data.identity.id
            },
            timeout:5000,
            callback:function(resp){
            	self.loading=false;
            	if(resp.success){
            		if(self.options.data.field) self.options.data.permission=resp.data.permissions;
            		self.options.data.group_list=resp.data.groups;
            		self.options.data.group_main=(self.options.data.identity.id[0]=='G')?1:0;
            		self.ensureCachedValue()
            		self.render();
            	}else{
            		self.ele.html('<table style="width:100%;height:100%;color:white;text-align:center"><tr><td><span class="x_retry"><i class="icon-refresh"></i> Retry</span></td></tr></table>');
            		self.ele.find('.x_retry').stap(function(){
            			self.load();
            		},1,'tapactive');
            	}
            }
        });
	}
	if(!self.options.button){
		self.options.ele.render({
			template:'inlinepermissions_row',
			append:false,
			binding:function(ele){
				self.ele=ele.find('.renderto');
			}
		})
	}else{
		self.ele=self.options.ele;
	}
	if(self.options.load||!self.options.data.group_list){
		self.load();
	}else{
		self.shown=1;//render right away!
		self.render();
	}
}