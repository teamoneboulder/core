if(!window.modules) window.modules={};
modules.map=function(options){
	var self=this;
	self.options=options;
    self.state_manager=new modules.state_manager({
        id:options.id,
        app:'map',
        getPages:function(){
            return ['all'];
        },
        getTabData:function(){
            return {
                name:'Map',
                icon:'icon-map-o'
            }
        },
        getPageName:function(){
            return 'Map';
        },
        getNavPath:function(){
            if(!self.cpage) self.cpage='all'
            return self.cpage;
        },
        getData:function(){
            if(self.loaded) return true;
        },
        defaultPage:function(){
            return 'all'
        }
    })
    this.viewHide=function(){
        self.ele.hide();
    }
    this.viewShow=function(){
        self.ele.show();
    }
    this.destroy=function(){
        if(self.map) self.map.destroy();
        self.ele.remove();
    }
    this.setPage=function(page,internal){
        self.cpage=page;
        if(!internal) self.state_manager.setState();
    }
    this.show=function(){
        self.showing=true;
        if(!self.ele){
            if(options.inline){
                options.ele.render({
                    template:'module_map_page',
                    data:{
                        inline:true,
                    },
                    binding:function(ele){
                        self.ele=ele;
                        self.loaded=true;
                        //app.setStatusBar(ele);
                        // ele.find('.topnav').stap(function(){
                        //     self.setPage($(this).attr('data-nav'))
                        // },1,'tapactive');
                        //self.setPage('social');
                        self.map=new map(self.ele.find('.content'),{
                            confurl:app.mapurl+'/conf/chakras',
                            noloader:true,
                            onLoad:function(){
                                window._ui.pageloader.hide(self.ele);
                            },
                            data:{
                                settings:{}
                            }
                            // onMarkerSelect:function(){
                            //     pageele.find('.appcontent').find('.content').css('zIndex',3);
                            //     pageele.find('.appcontent').find('.navarea').css('zIndex',2);
                            // },
                            // onMarkerUnselect:function(){
                            //     pageele.find('.appcontent').find('.content').css('zIndex',2);
                            //     pageele.find('.appcontent').find('.navarea').css('zIndex',3);
                            // }
                        });
                        self.map.show();
                        if(app.isWebLayout()){
                            setTimeout(function(){
                                self.loaded=true;
                                self.setPage(self.state_manager.getLoadPage());
                            },50)
                        }else{
                            self.setPage(self.state_manager.getLoadPage());
                        }
                        app.teach('map');
                    }
                })
            }else{
                options.ele.subpage({
                    loadtemplate:'module_map_page',
                    data:{
                        inline:false,
                        left:100
                    },
                    onPageRendered:function(ele){
                        self.ele=ele;
                        // ele.find('.topnav').stap(function(){
                        //     self.setPage($(this).attr('data-nav'))
                        // },1,'tapactive');
                        // self.setPage('social');
                    },
                    onPageReady:function(ele,onback){
                        self.onBack=onback;
                        self.map=new map(self.ele.find('.content'),{
                            confurl:app.mapurl+'/conf/chakras',
                            noloader:true,
                            onLoad:function(){
                                window._ui.pageloader.hide(self.ele);
                            },
                            data:{
                                settings:{}
                            }
                            // onMarkerSelect:function(){
                            //     pageele.find('.appcontent').find('.content').css('zIndex',3);
                            //     pageele.find('.appcontent').find('.navarea').css('zIndex',2);
                            // },
                            // onMarkerUnselect:function(){
                            //     pageele.find('.appcontent').find('.content').css('zIndex',2);
                            //     pageele.find('.appcontent').find('.navarea').css('zIndex',3);
                            // }
                        });
                        self.map.show();
                        if(app.isWebLayout()){
                            setTimeout(function(){
                                self.loaded=true;
                                self.setPage(self.state_manager.getLoadPage());
                            },50)
                        }else{
                            self.setPage(self.state_manager.getLoadPage());
                        }
                        app.teach('map');
                    },
                    onPageReturn:function(){
                        self.destroy();
                    }
                });
            }
        }else{
            self.ele.show();
            self.map.show();//will resize
            if(self.pages[self.cpage]&&self.pages[self.cpage].show){
                self.pages[self.cpage].show();
            }
        }
    }
    this.setStatView=function(){
        modules.stats.setPage('map');
    }
    this.goBack=function(){
        //self.stop();
        self.onBack(function(){
            modules.viewdelegate.onBack();//this will ensure that bindings get cleared/added in right order
        });
    }
	// this.show=function(){
	// 	//paralle
 //        console.log(options)
	// 	options.ele.show();
 //        options.ele.page({
 //            template:'module_map_page',
 //            beforeClose:function(ele,cb){//eliminate all animation/timing/etc
 //                // self.scroller.destroy();
 //                setTimeout(function(){
 //                    cb();
 //                },50)
 //            },
 //            onClose:function(){
 //                options.ele.hide();
 //            },
 //            pageType:'static',
 //            // pageType:'leftright',
 //            // pages:{left:true,right:true},
 //            data:$.extend(true,{},{
 //            },options.data),
 //            onShow:function(){
 //                self.map=new map(self.ele.find('.content'),{
 //                    confurl:app.mapurl+'/conf/chakras',
 //                    noloader:true,
 //                    onLoad:function(){
 //                        window._ui.pageloader.hide(self.ele);
 //                    }
 //                    // onMarkerSelect:function(){
 //                    //     pageele.find('.appcontent').find('.content').css('zIndex',3);
 //                    //     pageele.find('.appcontent').find('.navarea').css('zIndex',2);
 //                    // },
 //                    // onMarkerUnselect:function(){
 //                    //     pageele.find('.appcontent').find('.content').css('zIndex',2);
 //                    //     pageele.find('.appcontent').find('.navarea').css('zIndex',3);
 //                    // }
 //                });
 //                self.map.show();
 //            },
 //            bindings:[{
 //                type:'fn',
 //                binding:function(ele){
 //                    self.ele=ele;
 //                    self.ele.find('.x_closer').stap(function(){
 //                        self.map.hideMarker();//hide any actively viewing marker
 //                        $.fn.alert.getPage().data('data').close(function(){
 //                            self.map.destroy();
 //                        });//hidesplash
 //                    },1,'tapactive')
 //                }
 //            }]
 //        });
	// }
    this.getName=function(){
        return 'Map';
    }
    this.search={
        onKeyUp:function(rele,val){
            if(val==''){
                rele.render({
                    template:'module_feed_preview',
                    append:false,
                    data:{
                        filters:{
                            order:['inspiration','entertainment','learn','funny','causes'],
                            list:{
                                inspiration:{
                                    name:'Inspiration',
                                    icon:'icon-inspiration'
                                },
                                entertainment:{
                                    name:'Entertainment',
                                    icon:'icon-inspiration'
                                },
                                learn:{
                                    name:'Learn',
                                    icon:'icon-knowledge'
                                },
                                funny:{
                                    name:'Funny',
                                    icon:'icon-hero'
                                },
                                causes:{
                                    name:'Causes',
                                    icon:'icon-causes'
                                }
                            }
                        },
                        favorites:{
                            order:['technology','science','programming','boulder','environmental'],
                            list:{
                                technology:{
                                    name:'Technology',
                                    pic:'https://groot.s3.dualstack.us-west-2.amazonaws.com/p/group/Cts7oGw4j/flag/5d7ff21063/profile.jpeg'
                                },
                                science:{
                                    name:'Science',
                                    pic:'https://groot.s3.dualstack.us-west-2.amazonaws.com/p/group/Chru8kyy3/flag/b45aa0ac99/profile.png'
                                },
                                programming:{
                                    name:'Programming',
                                    pic:'https://groot.s3.dualstack.us-west-2.amazonaws.com/p/group/CtpueHj1w/flag/010306ae72/profile.jpeg'
                                },
                                boulder:{
                                    name:'Boulder',
                                    pic:'https://groot.s3.dualstack.us-west-2.amazonaws.com/p/group/CybGaqfRp/flag/238a5d2bcf/profile.png'
                                },
                                environmental:{
                                    name:'Environmental Action',
                                    pic:'https://groot.s3.dualstack.us-west-2.amazonaws.com/p/group/COrjT9jMh/flag/5c9eb9ede7/profile.png'
                                }
                            }
                        }
                    },
                    binding:function(ele){
                        new modules.scroller(ele,{},{
                            scrollStart:function(){
                                modules.keyboard_global.hide();
                            }
                        })
                    }
                });
            }else{

            }
        }
    }
}