;window.map=function(ele,options){
	var self=this;
    self.store=(options.store)?options.store:{};
	self.ele=ele;
    if(!options.parentEle) options.parentEle=ele;
	self.options=options;
	this.show=function(){
		//load settings based on conf
        options.parentEle.css('overflow','hidden');
		if(!self.confloaded){
			if(self.map) self.map.destroy()
			self.showLoading();
			modules.api({
		        caller:'Load Conf',
		        url:self.options.confurl, 
		        data:{},
		        failcallback:function(){
		            alert('todo: fail map conf load')
		        },
		        timeout:10000,
		        callback:function(data){
                    self.confloaded=1;
		            self.data=data.conf;
                    if(self.options.settings){
                        if(self.options.settings.search==true) delete self.options.settings.search;
                        if(self.options.settings) self.data.settings=$.extend(true,{},self.data.settings,self.options.settings);
                    }
                    if(self.data.settings.nomenu){
                        self.ele.addClass('nomenu')
                    }
                    if(self.data.settings.noadd){
                        self.ele.addClass('noadd')
                    }
                    if(self.data.settings.locate){
                        self.ele.addClass('locate')
                    }
                    self.ele.render({
                        template:'map_container',
                        data:{
                            settings:self.data.settings
                        },
                        bindings:[{
                            type:'fn',
                            binding:function(ele){

                                self.ele=ele;
                                self.options.parentEle.render({template:(modules.tools.isWebLayout&&modules.tools.isWebLayout())?'markerele_web':'markerele'});
                                self.options.parentEle.find('.map_markerview').on(self.getTransitionEvent('end'),function(e){
                                    self.transitioning=0;
                                    if(self.onTransitionEnd&&self.onTransitionEnd.length){
                                        $.each(self.onTransitionEnd,function(i,v){
                                            v();
                                        })
                                        self.onTransitionEnd=[];
                                    }
                                })
                                self.setMap();
                                ele.find('.map_nav').stap(function(){
                                    self.nav($(this).attr('data-menu'))
                                },'tapactive',1)
                                if(self.data.settings.add){
                                    ele.find('.x_add').stap(function(){
                                        //if they can!
                                        if(self.canEdit()){
                                            self.edit();
                                            // app().user.ensureLogin(function(){
                                            //     self.edit();
                                            // });
                                        }else{
                                            var email=(self.data.settings.adminEmail)?self.data.settings.adminEmail:'tom@groupup.me';
                                            $('body').alert({
                                                buttons:false,
                                                template:'admin_contact',
                                                tempdata:{
                                                    email:email
                                                },
                                                icon:'icon-warning-sign',
                                                bindings:[{
                                                    type:'fn',
                                                    binding:function(ele){
                                                        ele.find('.x_contact').stap(function(){
                                                            _.sendEmail({
                                                                to:email,
                                                                subject:'Contact for Map - '+self.data.name
                                                            })
                                                        })
                                                    }
                                                }]
                                            })
                                        }
                                    })
                                }
                                if(self.data.settings.search){
                                    modules.geocode.init();
                                    ele.find('.x_search').stap(function(){
                                        if(!self.ele.hasClass('searchshowing')){
                                            self.closeMenus();
                                            self.ele.addClass('searchshowing')
                                            self.search('');
                                            setTimeout(function(){
                                                ele.find('.x_locationsearch').focus();
                                            },100)
                                        }
                                    });
                                    ele.find('.togglesearchview').stap(function(){
                                        if($(this).hasClass('themecolordark')) return false;
                                        ele.find('.togglesearchview').removeClass('themecolordark');
                                        $(this).addClass('themecolordark');
                                        ele.find('.searchpage').hide();
                                        self.searchview=$(this).attr('data-view');
                                        ele.find('[data-viewarea='+$(this).attr('data-view')+']').show();
                                        self.search(self.cursearch);//trigger search on toggle
                                    })
                                    ele.find('.x_locationsearch').on('keyup',function(){
                                        self.search($(this).val())
                                    })
                                    ele.find('.moresearchcancel').stap(function(e){
                                        phi.stop(e);
                                        ele.find('.x_locationsearch').val('')
                                        self.closeMenus();
                                    })
                                }
                            }
                        }]
                    })
		        }
		    });
		}else{
			self.map.resize();
		}
	}
    this.renderFormObject=function(type,saveitem){
        var item=$.extend(true,{},self.data.schema.items.list[type]);
        if(!item) return console.warn('invalid items');
        //ensure layer gettag is correct
        item.fields.layer.getTag=function(tag){
            return self.data.layers[tag];
        }
        item.fields.layer.linkedTo=item.fields.layer.linkedTo+'/'+self.data.id;
        //set nav correct!
        self.aele.find('.additemname').html(item.name);
        self.aele.find('.menulist').removeClass('selected');
        self.aele.find('[data-nav='+item.id+']').addClass('selected')
        if(!item.options) item.options={};
        item.options.imageUploadPath=app.sapiurl+'/upload/image';
        if(saveitem) self.saveitem=saveitem;
        else self.saveitem={};
        self.aele.find('.formitem').formbuilder('build',$.extend(true,{
            editing:(saveitem)?1:0,
            onSave:function(item,failcb){
                self.save(type,item,function(resp){
                    if(type=='marker'){
                        if(!self.cmdata||self.cmdata.id!=resp.marker.id){//adding a new record...
                            self.map.flyTo({
                                pitch:0,
                                zoom:13,
                                center:[resp.marker.loc.lng,resp.marker.loc.lat]
                            })
                            self.loadIcon({
                                url:self.data.layers[resp.marker.layer].marker,
                                id:resp.marker.layer
                            },function(){
                                if(!self.cmarkers) self.cmarkers={};
                                if(!self.cmarkers.list) self.cmarkers.list={}
                                self.cmarkers.list[resp.marker.id]=resp.marker;
                                self.loadMarkers(self.cmarkers)
                            })
                        }else{
                            self.map.flyTo({
                                pitch:0,
                                center:[resp.marker.loc.lng,resp.marker.loc.lat]
                            })  
                        }
                        self.cmdata=resp.marker;
                        self.cmdata.loaded=1;
                        self.hideMarker();
                        self.viewMarker(resp.marker);
                    }
                },failcb);
            },
            onDelete:function(item,failcb){
               self.delete(type,item,failcb);
            }
        },item),self.saveitem);//include save/delete button here
    }
    this.delete=function(type,item,cb){
        modules.api({
            caller:'delete',
            url: app.sapiurl+'/delete/'+type, 
            data:{
                data:item
            },
            onecallback:1,
            callback:function(data){
                if(data.success){
                    if($.fn.alert.closeAlert) $.fn.alert.closeAlert();//close current edit alert
                    if(type=='marker'){
                        self.fetchMarkers(self.map.getBounds());//update markers!
                        //also take out of marker view!
                        self.hideMarker();
                    }
                }else{
                    if(cb) cb(data);
                }
            }
        });
    }
    this.save=function(type,item,scb,fcb){
         var self=this;
        modules.api({
            caller:'save',
            url: app.sapiurl+'/save/'+type, 
            data:{
                data:item
            },
            onecallback:1,
            callback:function(data){
                if(data.success){
                    if($.fn.alert.closeAlert) $.fn.alert.closeAlert();//close current edit alert
                    // if(type=='marker'){
                    //     self.fetchMarkers(self.map.getBounds());//update markers!
                    // }
                    scb(data);
                }else{
                    fcb(data);
                }
            }
        });
    }
    this.edit=function(type,data){
        self.closeMenus();
        if(!type) type='marker';
        $('body').alert({
            template:'editform',
            icon:false,
            closerColor:'white',
            nopadding:true,
            width:600,
            tempdata:{
                formitems:(!data)?{
                    order:self.data.schema.items.order,//['marker'],//based on user perm...
                    list:$.extend(true,self.data.schema.items.list)
                }:false,
                editing:(data)?1:0
            },
            buttons:false,
            bindings:[{
                type:'fn',
                binding:function(ele){
                    self.aele=ele;
                    ele.find('.x_closemenu').stap(function(){
                        ele.find('.morenav').hide()
                        ele.find('.navicon').removeClass('icon-down-open').addClass('icon-right')
                    })
                    ele.find('.navselector').stap(function(){
                        if(ele.find('.morenav').is(':visible')){
                            ele.find('.morenav').hide()
                            ele.find('.navicon').removeClass('icon-down-open').addClass('icon-right')
                        }else{
                            ele.find('.morenav').show()
                            ele.find('.navicon').addClass('icon-down-open').removeClass('icon-right')
                        }
                    },'tapactive',1);
                    ele.find('.menulist').stap(function(){
                        if(!$(this).hasClass('selected')){
                            self.renderFormObject($(this).attr('data-nav'));
                        }
                        ele.find('.morenav').hide()
                        ele.find('.navicon').removeClass('icon-down-open').addClass('icon-right')
                    },'tapactive',1)
                    self.renderFormObject(type,data);
                }
            }]
        })
    }
    this.canEdit=function(){
        if(app.isdev) return true;//everyone for nwo
        if(app.user.token&&app.user.profile&&self.data.admins.indexOf(app.user.profile.id)>=0) return true;
        else return false;
    }
    this.search=function(val){
        self.cursearch=val;
        if(val.length){
            if(!self.searchview){
                if(self.data.settings.search){
                    if(self.data.settings.search.markers) self.searchview='locations';
                    else{
                        self.ele.find('[data-viewarea=cities]').show();
                        self.ele.find('[data-viewarea=locations]').hide();
                        self.searchview='cities';
                    }
                }
            }
            //at same time, also seach locations
            if(self.searchview!='cities'){
                self.ele.find('.resultslist').html('<div style="padding:20px;text-align:center"><i class="icon-refresh animate-spin"></i> Searching</div>')
                modules.api({
                    caller:'search',
                    url: app.sapiurl+'/search', 
                    data:{
                        query:val,
                        id:self.data.id
                    },
                    onecallback:1,
                    callback:function(data){
                        self.ele.find('.resultslist2').html('')
                        if(data.success){
                            if(data.markers&&data.markers.order.length){
                                self.ele.find('.resultslist2').html('');
                                $.each(data.markers.order,function(i,v){
                                    var m=data.markers.list[v];
                                    self.ele.find('.resultslist2').render({
                                        template:'map_search_marker',
                                        data:m,
                                        bindings:[{
                                            type:'click',
                                            binding:function(){
                                                //go to location
                                                app.map.map.flyTo({
                                                    pitch:0,
                                                    center:[m.loc.lng,m.loc.lat],
                                                    zoom:17
                                                });
                                                self.cmdata=m;
                                                self.viewMarker();
                                                setTimeout(function(){
                                                    self.ele.removeClass('searchshowing')
                                                    self.ele.find('.x_locationsearch').val('')
                                                },1000)
                                            }
                                        }]
                                    })
                                })
                            }else{
                                self.ele.find('.resultslist2').html('<div style="padding:20px;text-align:center"><i class="icon-warning-sign"></i> No Results</div>')
                            }
                        }else{

                        }
                        self.ele.find('.results').show();
                    }
                });
            }else{
                self.ele.find('.resultslist2').html('<div style="padding:20px;text-align:center"><i class="icon-refresh animate-spin"></i> Searching</div>')
                 modules.geocode.search(val,{types: ['(cities)']},function(res){
                    if(res&&res.length){
                        self.ele.find('.resultslist').html('');
                        $.each(res,function(i,v){
                            v.display_name=modules.geocode.location.getName(v,'city');
                            self.ele.find('.resultslist').render({
                                template:'map_search_city',
                                data:v,
                                bindings:[{
                                    type:'click',
                                    binding:function(){
                                        self.ele.find('.resultslist').html('<div style="padding:20px;text-align:center"><i class="icon-refresh animate-spin"></i> Getting Location</div>')
                                        //geocode and center based on placeid
                                        modules.geocode.getLoc(v,function(loc){
                                            self.ele.find('.resultslist').html('<div style="padding:20px;text-align:center"><i class="icon-thumbs-up"></i> Lets Go!</div>')
                                            self.map.flyTo({
                                                pitch:0,
                                                center:[loc.lng,loc.lat],
                                                zoom:10
                                            });
                                            setTimeout(function(){
                                                self.ele.removeClass('searchshowing')
                                                self.ele.find('.x_locationsearch').val('')
                                            },1000)
                                        })
                                    }
                                }]
                            })
                        })
                    }else{
                        self.ele.find('.resultslist').html('<div style="padding:20px;text-align:center"><i class="icon-warning-sign"></i> No Results</div>')
                    }
                })
            }
        }else{
            //load other history tooo
            self.ele.find('.resultslist2,.resultslist').html('<div class="s-corner-all" style="margin:10px;padding:10px;text-align:center;">Search!</div>')
            // self.ele.find('.resultslist2,.resultslist').find('.x_mylocation').stap(function(){
            //     self.ele.find('.resultslist2,.resultslist').html('<div style="padding:20px;text-align:center"><i class="icon-refresh animate-spin"></i> Getting Location</div>')
            //     app().map.locate(function(loc,msg){
            //         if(loc){
            //             self.ele.find('.resultslist2,.resultslist').html('<div style="padding:20px;text-align:center"><i class="icon-thumbs-up"></i> Lets Go!</div>')
            //             self.map.flyTo({
            //                 pitch:0,
            //                 center:[loc.lng,loc.lat],
            //                 zoom:10
            //             });
            //             setTimeout(function(){
            //                 self.ele.removeClass('searchshowing')
            //                 self.ele.find('.x_locationsearch').val('')
            //             },1000)
            //         }else{
            //             self.ele.find('.resultslist2,.resultslist').html('<div style="padding:20px;text-align:center"><i class="icon-warning-sign"></i> '+msg+'</div>')
            //         }
            //     })
            // })
        }
    }
    this.nav=function(type){
        switch(type){
            case 'center':
                self.hideMarker();
                self.map.flyTo({
                    zoom:(self.data.settings.maptype=='aura')?1:12,
                    pitch:0,
                    bearing:0,
                    center:self.map.getCenter()
                })
            break;
            case 'locate':
                self.locateMe();
            break;
            case 'layers':
                self.ele.toggleClass('map_layersshowing')
            break;
            case 'help':
                self.ele.removeClass('map_layersshowing')
                self.ele.toggleClass('map_helpshowing')
            break;
        }
    }
    this.closeMenus=function(){
        self.ele.removeClass('helpshowing layersshowing profileshowing searchshowing')
    }
    this.renderMarkerPage=function(){
        if(self.transitioning){//register callback
            self.onTransitionEnd.push(function(){
                self.renderMarkerPage();
            })
        }else{
            var data={
                marker:$.extend(true,{},self.cmdata)
            }
            if(typeof data.marker.description=='object'){
                if(data.marker.description.template&&$.fn.render.getTempate(data.marker.description.template)){
                    if(!data.marker.description.data) data.marker.description.data={};
                    data.marker.description=$.fn.render.getTempate(data.marker.description.template).render(data.marker.description.data);
                }else{
                    data.marker.description='<i class="icon-warning-sign"></i> Invalid Template!';
                }
            }
            self.options.parentEle.find('.map_markerview').find('.markercontent').render({
                template:(modules.tools.isWebLayout())?'marker_info_web':'marker_info',
                data:data,
                append:false,
                bindings:[{
                    type:'fn',
                    binding:function(ele){
                        self.melep=ele;
                        ele.find('.imgarrows').stap(function(){
                            if($(this).attr('data-dir')=='-'){
                                self.cindex--;
                            }else{
                                self.cindex++;
                            }
                            var l=100*self.cindex;
                            //animate!
                            ele.find('#imgcontainer').css({"-webkit-transform":"translate(-"+l+"%,0)","transform":"translate(-"+l+"%,0)"})
                            self.setImageArrows();
                        },'tapactive',1);
                        self.cindex=0;
                        self.setImageArrows();
                    }
                }]
            })
        }
    }
    this.setImageArrows=function(){
        var len=(self.cmdata.images&&self.cmdata.images.length)?self.cmdata.images.length:0;
        if(self.cindex>0) self.melep.find('.leftimgarrow').show();
        else self.melep.find('.leftimgarrow').hide();
        if(self.cindex<(len-1)) self.melep.find('.rightimgarrow').show();
        else self.melep.find('.rightimgarrow').hide();
    }
    this.parseUrl=function(url){
        if(app.sapiurl.indexOf('/nectar')>=0) return url.replace('[sapiurl]',app.sapiurl.replace('/nectar',''));
        if(app.sapiurl.indexOf('/map')>=0) return url.replace('[sapiurl]',app.sapiurl.replace('/map',''));
        return url;
    }
    this.loadMarker=function(id,cb){
        var url=(self.data.settings.endpoint&&self.data.settings.endpoint.marker)?self.parseUrl(self.data.settings.endpoint.marker):app.mapurl+'/marker';
        self.showMarkerLoading()
        modules.api({
            caller:'Get marker',
            url: url+'/'+id, 
            data:{
                appid:(self.data.settings.appid)?self.data.settings.appid:''//used default if blank
            },
            onecallback:1,
            callback:function(data){
                self.clearMarkerLoading()
                if(data.success){
                    self.cmdata=data.data;
                    self.cmdata.loaded=1;
                    if(cb) cb(true);
                }else{
                    if(cb) cb(false)
                }
            }
        });
    };
    this.locateMe=function(){
        if(self.locating){
            self.locating=false;
        }else{
            self.locating=true;
            // app.growl({
            //     id:'locating',
            //     content:'Finding Location...',
            //     icon:'icon-refresh animate-spin',
            //     remove:false,
            //     closeable:false,
            //     ele:self.ele.find('.growlarea')
            // });
            self.ele.find('[data-menu=locate]').find('i').addClass('map_looking animate-spin')
            self.locate(function(pos,err){
                self.ele.find('[data-menu=locate]').find('i').removeClass('map_looking animate-spin')
                if(pos){
                    // app.growl({
                    //     id:'locating',
                    //     content:'Lets Go!',
                    //     icon:'icon-thumbs-up',
                    //     remove:1000,
                    //     closeable:false,
                    //     ele:self.ele.find('.growlarea')
                    // });
                    if(self.locating){
                        //add me to the map!
                        self.map.flyTo({
                            center:[pos.lng,pos.lat],
                            zoom:(self.data.settings.maptype=='aura')?11:15
                        })
                    }
                }else{
                    growl({
                        id:'locating',
                        content:err,
                        icon:'icon-warning-sign',
                        remove:false,
                        closeable:true,
                        ele:self.ele.find('.growlarea')
                    });
                }
            })
        }
    }
    this.destroy=function(){
        self.highlightMarker(false);
        if(self.aframe) window.cancelAnimationFrame(self.aframe);
        if(self.map) self.map.remove()
    }
	this.hide=function(){

	}
	this.showLoading=function(){
        if(self.options.noloader) return false;
        self.ele.render({
            template:'map_loading',
            bindings:[{
                type:'fn',
                binding:function(ele){
                    self.loadele=ele;
                    TweenLite.set(self.loadele,{opacity:1})
                }
            }]
        })
	}
    this.hideLoading=function(){
        if(self.options.noloader) return false;
        TweenLite.to(self.loadele,1,{opacity:0,onComplete:function(){
            self.loadele.remove();
        }});
    }
	this.setMap=function(){
		if(self.data.settings.accessToken) mapboxgl.accessToken = self.data.settings.accessToken;
		if(self.data.settings.maptype=='aura'){//if aura always start in large zoom
            var loc={
                center:[-105.2569788,40.0093894],//default
                zoom:1,
            }
        }else{
            var loc={
                center:[-105.2569788,40.0093894],//default
                zoom:11,
            }
            //dont enable for now
            // var lastloc=localStorage.getObject('location.'+self.data._id);
            // if(lastloc.center){
            //     loc=lastloc;
            // }
        }
        if(self.options.center){
            loc.center=self.options.center;
        }
		self.map = new mapboxgl.Map({
            container: self.ele.find('.map_maparea')[0],
            center:loc.center,//home
            minZoom:.5,
            maxZoom:18,
            zoom:loc.zoom,
            bearing:0,
            renderWorldCopies:true,
            attributionControl:false,
            dragRotate:false,
            attributionControl:false,
            style: self.data.settings.conf
        });
        console.log({
            container: self.ele.find('.map_maparea')[0],
            center:loc.center,//home
            minZoom:.5,
            maxZoom:18,
            zoom:loc.zoom,
            bearing:0,
            renderWorldCopies:true,
            attributionControl:false,
            dragRotate:false,
            attributionControl:false,
            style: self.data.settings.conf
        })
        self.map.dragRotate.disable();
        self.map.touchZoomRotate.disableRotation();
        self.map.on('load', function () {
            self.hideLoading();
	        self.updateMarkers(1);
            if(self.options.onLoad) self.options.onLoad();
	    }).on('rotateend',function(){
	        self.continuousUpdate();
	    }).on('pitchend',function(){
	        self.continuousUpdate();
	    }).on('moveend',function(){
	        self.continuousUpdate();
	        self.setLastLocation();
            self.onBoundsChange();
	    }).on('click',function(e){
	        self.handleClick(e);
	    }).on('zoomend',function(){
	        self.continuousUpdate();
	        self.setLastLocation();
            self.onBoundsChange();
	    })
        if(self.options.onReady) self.options.onReady();
        console.log(self.map)
	}
    this.onBoundsChange=function(){
        if(options.onBoundsChange) options.onBoundsChange(self.map.getBounds(),self.map);
    }
    this.handleClick=function(e){
        var self=this;
        var ts=new Date().getTime();
        var tfeatures=self.map.queryRenderedFeatures(e.point);
        var features=[];
        var allow=['icon'];
        $.each(tfeatures,function(i,v){
            if(v&&v.properties&&allow.indexOf(v.properties.type)>=0) features.push(v);
        })
        var feature=features[0];
        if(feature&&feature.properties&&feature.properties.type){
            switch(feature.properties.type){
                case 'icon':
                    if(!self.data.settings.noInfoOnClick) self.showFeature(features,0);
                break;
            }
        }else{
            self.hideMarker();
        }
    }
    this.hideMarker=function(){
        if(self.to) clearTimeout(self.to);
        self.options.parentEle.find('.map_markerview').hide();
        if(self.options.parentEle.hasClass('markershowing')){
            self.cmdata=false;
            self.options.parentEle.removeClass('markershowing');
            self.highlightMarker(false);
        }
    }
    this.viewMarker=function(){
        self.options.parentEle.addClass('markershowing');
        var data=$.extend(true,{admin:false},self.cmdata);
        // if(self.options.onMarkerSelect) self.options.onMarkerSelect();
        self.options.parentEle.find('.map_markerview').show();
        phi.render(self.options.parentEle.find('.map_markerview'),{
            template:(modules.tools.isWebLayout())?'markerview_web':'markerview',
            append:false,
            data:data,
            binding:function(ele){
                self.mele=ele;
                ele.find('.x_edit').stap(function(){
                    phi.registerView('add',{
                        renderTo:$('#wrapper')[0],
                        returnOnSave:true,
                        onSuccess:function(data){
                            //reload!
                            self.updateMarkers();
                            self.cmdata=data;
                            self.viewMarker();
                        },
                        data:{
                            schema:'map_marker',
                            title:'Edit Marker',
                            action:'Save',
                            current:data
                        }
                    });
                },1,'tapactive')
                ele.find('.x_hide').stap(function(){
                    self.hideMarker();
                },1,'tapactive');
                ele.find('.linkitem').stap(function(e){
                    phi.stop(e);
                    self.lasttap=new Date().getTime()
                    _.openLink({
                        intent:$(this).attr('data-href'),
                        type:'external'
                    })
                    return false;
                },1,'tapactive');
                //different binding here..
                if(modules.tools.isWebLayout()){
                }else{
                    self.bindDragger();
                }
            }
        })
        self.highlightMarker(self.cmdata);
    };
    this.showMoreMarkerDetails=function(){
        return false;//this info is already available!
        if(!self.cmdata.loaded){//only get data if new
            self.loadMarker(self.cmdata.id,function(){
                self.renderMarkerPage();
            });
        }else{
            self.renderMarkerPage();
        }
    }
    this.getBounds=function(){
        var bounds={};
        bounds.maxX=0;
        bounds.minX=0;
        //miny based on window
        bounds.minY=-self.getMovementHeight();//never swipe up...
        bounds.maxY=0;//always swipe to close
        return bounds;
    }
    this.getMovementHeight=function(){
        var imgh=$('body').height()*.3;
        var container=self.ele.height()-self.mele.find('.togglemore').outerHeight();
        var avail=container-imgh;
        return avail;
    }
    this.bindDragger=function(){
        self.drag=Draggable.create(self.mele, {
            type:"y",
            trigger:self.mele.find('.togglemore'),
            bounds:self.getBounds(),
            lockAxis:true,
            throwProps:true,//dont have this plugin...
            //force3D:true,//auto?
            cursor:'defualt',
            edgeResistance:1,
            onDrag:function(){
               // console.log('drag')
               //paralax the image cover
               var imgh=$('body').height()*.3;
               var avail=self.getMovementHeight();
               var speed=imgh/avail;
               var y=this.y*speed;//multiplier
               var pc=Math.abs(this.y/avail);
               var opacity=pc;
               TweenLite.set(self.mele.find('#markerimg'),{y:y,opacity:opacity});
            },
            onClick:function(e){
                var target=$(e.target);
                if(target.hasClass('_stap')){
                    return false;
                }
                var ct=new Date().getTime();
                if(self.lasttap){
                    var diff=ct-self.lasttap;
                    if(diff<200){
                        return false
                    }
                }
                self.lasttap=ct;
                var avail=self.getMovementHeight();
                if(!this._open){
                    this._open=true;
                    var imgh=$('body').height()*.3;
                    var speed=imgh/avail;
                    var y=avail*speed;
                    //self.drag[0].disable();
                    TweenLite.to(self.mele.find('#markerimg'),.2,{y:-y,opacity:1});
                    TweenLite.to(self.mele,.2,{y:-avail,onComplete:function(){
                        //self.drag[0].enable();
                        //console.log('hERE!')
                        self.showMoreMarkerDetails();
                    }});
                }else{
                    this._open=false;
                    //self.drag[0].disable();
                    TweenLite.to(self.mele.find('#markerimg'),.2,{y:0,opacity:0});
                    TweenLite.to(self.mele,.2,{y:0,onComplete:function(){
                        //self.drag[0].enable();
                    }});
                }
            },
            onDragStart:function(){
                self.startY=this.y;
            },
            onDragEnd:function(){
                //return false;
                if(this.y!=0){
                    var avail=self.getMovementHeight();
                    var absy=Math.abs(this.y);
                    var threshold=30;
                    if(this.y>self.startY){
                        if(absy>(avail-threshold)){
                            var imgh=$('body').height()*.3;
                            var speed=imgh/avail;
                            var y=avail*speed;
                            self.drag[0].disable();
                            TweenLite.to(self.mele,.2,{y:-avail,onComplete:function(){
                                self.drag[0].enable();
                            }});
                            TweenLite.to(self.mele.find('#markerimg'),.2,{y:-y,opacity:1});
                        }else{
                            self.drag[0].disable();
                            TweenLite.to(self.mele,.2,{y:0,onComplete:function(){
                                self.drag[0].enable();
                            }});
                            TweenLite.to(self.mele.find('#markerimg'),.2,{y:0,opacity:0});
                        }
                    }else{
                        if(absy<threshold){
                            self.drag[0].disable();
                            TweenLite.to(self.mele,.2,{y:0,onComplete:function(){
                                self.drag[0].enable();
                            }});
                            TweenLite.to(self.mele.find('#markerimg'),.2,{y:0,opacity:0});
                        }else{
                            var imgh=$('body').height()*.3;
                            var speed=imgh/avail;
                            var y=avail*speed;
                            TweenLite.to(self.mele,.2,{y:-avail});
                            self.drag[0].disable();
                            TweenLite.to(self.mele.find('#markerimg'),.2,{y:-y,opacity:1,onComplete:function(){
                                self.drag[0].enable();
                                self.showMoreMarkerDetails();
                            }});
                        }
                    }
                }
            }
        });
    }
    this.onTransitionEnd=[];
    this.getTransitionEvent=function(type){
      var t,
          el = document.createElement("fakeelement");
          switch(type){
            case 'end':
                var t1='end';
                var t2='End';
            break;
            case 'start':
                var t1='start';
                var t2='Start';
            break;
          }
      var transitions = {
        "transition"      : "transition"+t1,
        "OTransition"     : "oTransition"+t2,
        "MozTransition"   : "transition"+t1,
        "WebkitTransition": "webkitTransition"+t2
      }

      for (t in transitions){
        if (el.style[t] !== undefined){
          return transitions[t];
        }
      }
    }
    this.highlightMarker=function(marker){
        var self=this;
        var framesPerSecond = 24; 
        var initialOpacity = 1
        var opacity = initialOpacity;
        var initialRadius = 20;
        var radius = initialRadius;
        var maxRadius = 30;
        function animateMarker(timestamp) {
            self.cto=setTimeout(function(){
                self.aframe=requestAnimationFrame(animateMarker);
                radius += (maxRadius - radius) / framesPerSecond;
                opacity -= ( .9 / framesPerSecond );

                if (opacity <= 0) {
                    radius = initialRadius;
                    opacity = initialOpacity;
                } 
                if(self.map){
                    self.map.setPaintProperty('highlight', 'circle-radius', radius);
                    self.map.setPaintProperty('highlight', 'circle-opacity', opacity);
                }

            }, 1000 / framesPerSecond);
        }
        if(marker){
            var layer={
                "id": "highlight",
                "source": {
                    "type": "geojson",
                    "data": {}
                },
                "type": "circle",
                "paint": {
                    "circle-radius": initialRadius,
                    "circle-radius-transition": {duration: 0},
                    "circle-opacity-transition": {duration: 0},
                    "circle-color": "#007cbf"
                }
            }
            layer.source.data={
                "type": "Point",
                "coordinates": [marker.point.coordinates[0],marker.point.coordinates[1]],
            }
           if(!self.highlight){
                self.map.addSource('highlight_data',layer.source);
                layer.source='highlight_data';
                self.map.addLayer(layer);
                //move to back!
                self.highlight=true;
           }else{//update data
                self.map.getSource('highlight_data').setData(layer.source.data);
           }
            self.map.moveLayer('highlight',marker.layer)
           if(self.cto) clearTimeout(self.cto);
           if(self.aframe) window.cancelAnimationFrame(self.aframe);
           animateMarker(0);
        }else{
            if(self.highlight){
                if(self.cto) clearTimeout(self.cto);
                if(self.aframe) window.cancelAnimationFrame(self.aframe);
                self.map.removeLayer('highlight');
                self.map.removeSource('highlight_data');
                self.highlight=false;
            }
        }
    }
    this.showMarkerLoading=function(){
        return false;
        self.to=setTimeout(function(){
            self.ele.render({
                template:'marker_loading'
            })
        },500)
    },
    this.clearMarkerLoading=function(){
        if(self.to) clearTimeout(self.to)
        else{
            self.ele.find('#markerloading').fadeOut(500,function(){
                $(this).remove()
            })
        }
    },
    this.showFeature=function(features,index){
        var feature=features[index];
        var marker=JSON.parse(feature.properties.data);
        self.cmdata=marker;
        self.loadMarker(marker.id,function(){
            self.viewMarker();
            if(features.length>1){//overlapped, show toggleability
                //toggleability between features!
                self.ele.find('.map_layertoggle').render({
                    template:'layertoggle',
                    append:false,
                    uid:'layertoggle',
                    data:{
                        current:index,
                        total:features.length
                    },
                    bindings:[{
                        type:'fn',
                        binding:function(ele){
                            ele.find('.x_toggler').stap(function(){
                                if($(this).attr('data-dir')=='+'){
                                    var ni=index+1;
                                    if(ni<features.length) self.showFeature(features,ni);
                                }else{
                                    var ni=index-1;
                                    if(ni>=0) self.showFeature(features,ni);
                                }
                            })
                        }
                    }]
                })
            }else{
                self.ele.find('.map_layertoggle').html('');
            }
        })
    }
    this.locate=function(cb){
        if(navigator.geolocation){
            self.nto=setTimeout(function(){
                if(!self.geoloaded){
                   cb(false,'We could not find your location');
                }
            },10000);
            self.geoloaded=0;
            navigator.geolocation.getCurrentPosition(function(position){
                //override
                if(self.nto) clearTimeout(self.nto);
                self.geoloaded=1;
                if(position.coords){
                    if(position.coords.accuracy < 1000){
                        return cb({lat:position.coords.latitude,lng:position.coords.longitude})
                    }
                }
                return cb(false,'We could not find your location');
            });
        }else{
            cb(false,'We could not find your location');
        }
    }
	this.continuousUpdate=function(){
        if(self.data.settings.maptype!='viewport') return false;
        if(self.lto) clearTimeout(self.lto);
        self.lto=setTimeout(function(){
            self.updateMarkers();
        },50)
    }
    this.updateMarkers=function(load){
        var mz=(self.data.settings.maptype=='viewport')?6:1;
        if(self.map.getZoom()>=mz){//only do this if zoomed in far enough
            self.ele.find('[data-growl=zoomin]').fadeOut(800,function(){
                $(this).remove();
            })
            if(!self.delaying){
                self.waited=0;//clear out waiting flag
                self.fetchMarkers(self.map.getBounds());
                self.delaying=1;
                setTimeout(function(){
                    self.delaying=0;
                    if(self.waited) self.updateMarkers();
                },2000)
            }else{
                self.waited=1
            }
        }else{
            //load arua
            if(!self.ele.find('[data-growl=zoomin]').length&&self.data.settings.maptype=='viewport'){
                growl({
                    id:'zoomin',
                    content:'Zoom in to see markers',
                    icon:'icon-warning-sign',
                    remove:false,
                    closeable:false,
                    ele:self.ele.find('.growlarea')
                });
                // self.ele.find('.subtext').html('Zoom In To See Markers');//clear out
                // self.ele.find('.layercount').html('');
            }
            if(load&&self.data.settings.maptype!='viewport'){//still get markers if not viewport mode
               self.fetchMarkers(self.map.getBounds()); 
            }
        }
    }
    this.fetchMarkers=function(bounds){
        if(!self.markersloaded||bounds){
            if(!self.markersloaded){
                // growl({
                //     content:'Fetching Markers...',
                //     icon:'icon-refresh animate-spin',
                //     remove:false,
                //     closeable:false,
                //     id:'markersloading',
                //     ele:self.ele.find('.growlarea')
                // })
            }
            var url=(self.data.settings.endpoint&&self.data.settings.endpoint.markers)?self.parseUrl(self.data.settings.endpoint.markers):app.mapurl+'/markers';
            modules.api({
                caller:'Get markers',
                url: url,
                data:{
                    filter:self.filter,
                    bounds:(bounds)?[
                        [bounds._sw.lng,bounds._sw.lat],
                        [bounds._ne.lng,bounds._ne.lat]
                    ]:'',
                    type:self.data.settings.maptype,
                    id:self.data.id,
                    appid:(self.data.settings.appid)?self.data.settings.appid:''//used default if blank
                },
                timeout:30000,
                onecallback:1,
                callback:function(data){
                    self.loadMarkers(data);
                }
            });
        }else{
            self.loadMarkers();
        }
    }
    this.iconsloaded=[];
    this.loadIcon=function(obj,cb,retry){
        if(self.iconsloaded.indexOf(obj.id)>=0){//already loaded!
            cb();
        }else{
            var htmlimg=new Image();
            htmlimg.crossOrigin = "Anonymous";
            if(obj.url){
                var url=obj.url;
                if(url.indexOf('/')===0){
                    url=app.siteurl+url;
                }
                htmlimg.src=url;//ensure height is consistant across all markers
                htmlimg.onload = function(){
                    self.map.addImage(obj.id, htmlimg);
                    self.iconsloaded.push(obj.id);
                    //free resources
                    //delete htmlimg;
                    cb();     
                };
                htmlimg.onerror = function(e){
                    //delete htmlimg;
                    self.loadBlankIcon(obj,cb);
                }
            }else{
                console.warn('invaid object')
            }
        }
    }
    this.loadBlankIcon=function(obj,cb){
        var htmlimg=new Image();
        htmlimg.crossOrigin = "Anonymous";
        htmlimg.onload = function(){
            self.map.addImage(obj.id, htmlimg);
            //free resources
            //delete htmlimg;
            cb();     
        };
        htmlimg.src=app.idot;//use blank 1x1 px
    },
    this.loadedlayers={}
    this.setCluster=function(){
        var clusterRadius = 20;
        var clusterMaxZoom = 14;
        var propertyToAggregate='count';
        self.cluster = new Supercluster({
            radius: clusterRadius,
            maxZoom: clusterMaxZoom,
            initial: function() {
                return {
                    count: 0,
                    sum: 0,
                    min: Infinity,
                    max: -Infinity
                };
            },
            map: function(properties) {
                var c=properties.data.count;
                return {
                    count: 1,
                    sum: Number(c),
                    min: Number(c),
                    max: Number(c)
                };
            },
            reduce: function(accumulated, properties) {
                accumulated.sum += Math.round(properties.sum * 100) / 100;
                accumulated.count += properties.count;
                accumulated.min = Math.round(Math.min(accumulated.min, properties.min) * 100) / 100;
                accumulated.max = Math.round(Math.max(accumulated.max, properties.max) * 100) / 100;
                accumulated.avg = Math.round(100 * accumulated.sum / accumulated.count) / 100;
            }
        });
        self.cluster.load(self.markers[self.data.load].layer.source.data);
        self.rebuildCluster();
    }
    this.rebuildCluster=function(){
        var bounds=self.map.getBounds();
        var tobounds=[bounds._sw.lng,bounds._sw.lat,bounds._ne.lng,bounds._ne.lat];
        //console.log(tobounds,self.map.getZoom())
        var cluster=self.cluster.getClusters(tobounds,self.map.getZoom());
        //console.log(cluster)
    }
    this.loadMarkers=function(data){
        //remove
        self.cmarkers=data;//used for re-parse
        self.layersadded=0;
            var markers={};
            var layers=[];
            //clear old if they exist
            self.layersadded=0;
            var hmgeo={};
            if(data.list){
                $.each(data.list,function(i,v){
                    var layer=v.layer;
                    console.log(v)
                    // if(!self.data.layers[v.layer]) return true;
                    // var clayer=self.data.layers[v.layer].layer;//child referencing parent
                    if(!markers[layer]) markers[layer]={
                        layer:{
                            "id": layer,
                            "type": "symbol",
                            "source": {
                                "type": "geojson",
                                "data": {
                                    "type": "FeatureCollection",
                                    "features": []
                                }
                            },
                            "minzoom": (self.data.settings.maptype=='all')?1:6,
                            "layout": {
                                "icon-image": "{icon}",
                                "icon-size":.3,
                                "icon-allow-overlap":true,
                                "text-allow-overlap":false,
                                "text-optional":true,
                                "text-font": ["Open Sans Semibold"],
                                "text-size":11,
                                "text-anchor": "top",
                                "text-field":"{text}",
                                "text-offset":[0,1.1]
                            },
                            "paint":{
                                "text-color":"#000000"
                            }
                        },
                        icon:$.extend(true,{},{count:0},{
                            marker:_.getImg(v.layer_info.pic,'small') //"/pub/img/markers/festival_marker.png"
                        })
                    }
                    //console.log(v.layer_info.pic)
                    if(self.data.settings.maptype=='aura'&&!hmgeo[clayer]){
                        hmgeo[clayer]={
                            type: 'geojson',
                            data: {
                                type: "FeatureCollection",
                                features: []
                            }
                        }
                    }
                    markers[layer].layer.source.data.features.push({
                        "type": "Feature",
                        "properties": {
                            "icon": layer,
                            "type":"icon",
                            "text":(v.name)?v.name:"",
                            "data":v,
                            "_id":v.id
                        },
                        "geometry": {
                            "type": "Point",
                            "coordinates": [v.point.coordinates[0],v.point.coordinates[1]],
                        }
                    })
                    if(self.data.settings.maptype=='aura'){
                        hmgeo[clayer].data.features.push({
                            "type": "Feature",
                            "geometry": {
                                "type": "Point",
                                "coordinates": [v.point.coordinates[0],v.point.coordinates[1]]
                            }
                        })
                    }
                    if(!markers[layer].map) markers[layer].map={};
                    if(!markers[layer].data) markers[layer].data={};
                    markers[layer].map[v.id]=markers[layer].icon.count;
                    markers[layer].data[v.id]=v;
                    markers[layer].icon.count++;
                }); 
                if(self.data.settings.maptype=='aura'){
                    $.each(hmgeo,function(i,v){
                        if(self.map.getSource(i+'_heatmap')){//update it
                            self.map.getSource(i+'_heatmap').setData(v.data);
                        }else{
                            self.map.addSource(i+'_heatmap',v);
                            self.addHeatMap(i);
                        }
                    })
                }
                //also determine what layers need to have data removed!
                var clist=Object.keys(self.data.layers);
                if(self.data.settings.maptype!='cluster'){
                    $.each(markers,function(it,v){
                        if(clist.indexOf(it)>=0) clist.splice(clist.indexOf(it),1);
                        self.loadIcon({
                            url:v.icon.marker,
                            id:it
                        },function(){
                            if(v&&v.layer){
                                if(self.map.getSource(it+'_data')){//update data
                                    self.map.getSource(it+'_data').setData(v.layer.source.data);
                                }else{
                                    self.map.addSource(it+'_data',v.layer.source)
                                    v.layer.source=it+'_data';
                                    self.addLayer(v.layer);
                                }
                                //self.ele.find('[data-layer='+it+']').find('.subtext').html(v.icon.count.addCommas()+' Markers');
                            }else{
                                //self.ele.find('[data-layer='+it+']').find('.subtext').html('No Markers');
                            }
                            self.layersadded++;
                            if(self.layersadded==_.size(markers)){
                                if(!self.markersloaded){
                                    self.markersloaded=1;
                            //         growl({
                            //             content:'Successfully Loaded Markers!',
                            //             icon:'icon-thumbs-up',
                            //             remove:2500,
                            //             closeable:false,
                            //             id:'markersloading',
                        				// ele:self.ele.find('.growlarea')
                            //         })
                                }
                            }
                        });
                    })
                }
                if(clist.length) $.each(clist,function(i,v){
                    //self.ele.find('[data-layer='+v+']').find('.subtext').html('0 Markers');
                    if(self.map.getSource(v+'_data')){//update data
                        self.map.getSource(v+'_data').setData({//clear!!!
                            "type": "FeatureCollection",
                            "features": []
                        });
                    }
                })
                self.markers=markers;
                if(self.data.settings.maptype=='cluster'){
                    self.setCluster();
                }
            }else{
                // self.ele.find('.subtext').html('0 Markers');//clear out
                // growl({
                //     content:'No Markers',
                //     icon:'icon-warning-sign',
                //     remove:2500,
                //     closeable:false,
                //     id:'markersloading',
                //     ele:self.ele.find('.growlarea')
                // })
            }
    }
    this.markers={}
    this.addHeatMap=function(id){
        var self=this;
        // var color=new tinycolor(colorHex);
        // var hmc=color.toRgbString();
        // color.setAlpha(.5);
        // var hmc3=color.toRgbString();
        // color.setAlpha(0);
        // var hmc2=color.toRgbString();
        // var stops=[
        //     [0, hmc2],
        //     [.9, hmc3],
        //     [1, hmc]
        // ]
        self.addLayer({
            "id": id+'_heatmap',
            "type": "heatmap",
            "source": id+'_heatmap',
            "maxzoom": 9,
            "paint": {
                //Increase the heatmap weight based on frequency and property magnitude
                "heatmap-weight": [
                    "interpolate",
                    ["linear"],
                    ["get", "mag"],
                    0, 0,
                    6, 1
                ],
                //Increase the heatmap color weight weight by zoom level
                //heatmap-ntensity is a multiplier on top of heatmap-weight
                "heatmap-intensity": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    0, 1,
                    9, 3
                ],
                //Color ramp for heatmap.  Domain is 0 (low) to 1 (high).
                //Begin color ramp at 0-stop with a 0-transparancy color
                //to create a blur-like effect.
                "heatmap-color": [
                    "interpolate",
                    ["linear"],
                    ["heatmap-density"],
                    0, "rgba(33,102,172,0)",
                    0.2, "rgb(103,169,207)",
                    0.4, "rgb(209,229,240)",
                    0.6, "rgb(253,219,199)",
                    0.8, "rgb(239,138,98)",
                    1, "rgb(178,24,43)"
                ],
                //Adjust the heatmap radius by zoom level
                "heatmap-radius": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    0, 2,
                    9, 20
                ],
                //Transition from heatmap to circle layer by zoom level
                "heatmap-opacity": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    7, 1,
                    9, 0
                ],
            }
        }, true);
    },
    this.addLayer=function(layer,heatmap){
        var self=this;
        self.map.addLayer(layer);
        if(!heatmap){
            self.map.on('mouseenter', layer.id, function () {
                if(!self.hovercount) self.hovercount=0;
                else self.map.getCanvas().style.cursor = 'pointer';
                self.hovercount++;
            });

            // Change it back to a pointer when it leaves.
            self.map.on('mouseleave', layer.id, function () {
                self.hovercount--;
                if(self.hovercount==0){
                    self.candrag=0;
                    self.map.getCanvas().style.cursor = '';
                }
            });
        }
    },
    this.setLastLocation=function(){
        var loc={
            zoom:self.map.getZoom(),
            center:self.map.getCenter()
        }
        localStorage.setObject('location.'+self.data.id,loc);
    }
};