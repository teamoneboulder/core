modules.people=function(options){
	this.options=options;
	var self=this;
    self.state_manager=new modules.state_manager({
        id:options.id,
        app:'people',
        getPages:function(){
            return ['find'];
        },
        getTabData:function(){
            return {
                name:'People',
                icon:'icon-user-outline'
            }
        },
        getPageName:function(){
            return 'People';
        },
        getNavPath:function(){
            if(!self.cpage) self.cpage='find';
            return self.cpage;
        },
        getData:function(){
            if(self.loaded) return true;
        },
        defaultPage:function(){
            return 'find';
        }
    })
    this.viewHide=function(){
        self.ele.hide();
    }
    this.viewShow=function(){
        self.ele.show();
    }
	this.show=function(){
		if(!self.ele){
            if(options.subpage){
                if(options.inline){
        			options.ele.render({
        				template:'people_page',
                        data:{left:0,inline:true},
        				binding:function(ele){
        					self.ele=ele;
        					ele.find('.topnav').stap(function(){
                                self.setPage($(this).attr('data-nav'))
                            },1,'tapactive');
                            self.loaded=true;
                            self.setPage(self.state_manager.getLoadPage());
        				}
        			})
                }else{
                    options.ele.subpage({
                        loadtemplate:'people_page',
                        data:{
                            inline:false,
                            left:100
                        },
                        onPageRendered:function(ele){
                            self.ele=ele;
                            ele.find('.topnav').stap(function(){
                                self.setPage($(this).attr('data-nav'))
                            },1,'tapactive');
                            if(app.isWebLayout()){
                                setTimeout(function(){
                                    self.loaded=true;
                                    self.setPage(self.state_manager.getLoadPage());
                                },50)
                            }else{
                                self.setPage(self.state_manager.getLoadPage());
                            }
                        },
                        onPageReady:function(ele,onback){
                            self.onBack=onback;
                            app.teach('people');
                        },
                        onPageReturn:function(){
                            self.destroy();
                        }
                    });
                }
            }else if(options.inline){
                options.ele.render({
                    template:'people_page',
                    data:{left:0,inline:true},
                    binding:function(ele){
                        self.ele=ele;
                        ele.find('.topnav').stap(function(){
                            self.setPage($(this).attr('data-nav'))
                        },1,'tapactive');
                        self.loaded=true;
                        self.setPage(self.state_manager.getLoadPage());
                    }
                })
            }else{
                options.ele.subpage({
                    loadtemplate:'people_page_page',
                    data:{
                        name:options.data.name
                    },
                    onPageRendered:function(ele){
                        self.ele=ele;
                        self.setPage(self.state_manager.getLoadPage());
                    },
                    onPageReady:function(ele,onback){
                        self.onBack=onback;
                        ele.find('.backbtn').stap(function(){
                            self.goBack();
                        },1,'tapactive')
                        app.teach('people');
                    },
                    onPageReturn:function(){
                        self.destroy();
                    }
                });
            }
		}else{
			self.ele.show();
		}
        self.showing=true;
	}
    this.setStatView=function(){
        modules.stats.setPage('people',self.cpage);
    }
    this.getPage=function(){
        return self.cpage;
    }
    this.goBack=function(){
        if(options.subpage){
            self.onBack(function(){
                app.home.manager.onBack()
            });
        }else{
            self.onBack(function(){
                modules.viewdelegate.onBack();
            });
        }
    }
    this.getContainer=function(){
        return (self.options.subpage)?$('#homeswiper'):$('#subpagewrapper');
    }
    this.onNavClick=function(){
        self.goBack();
    }
	this.setPage=function(page,internal){
        self.ele.find('.topnav').removeClass('selected');
        self.ele.find('[data-nav='+page+']').addClass('selected');
        if(self.cpage&&self.pages[self.cpage]&&self.pages[self.cpage].hide) self.pages[self.cpage].hide(); 
        if(self.pages[page]&&self.pages[page].show) self.pages[page].show();
        self.cpage=page;
        self.setStatView();
        if(!internal) self.state_manager.setState()
    }
    this.pages={
        find:{
            show:function(){
                var pself=this;
                pself.ele=self.ele.find('[data-page=find]');
                pself.ele.show();
                if(!pself.feed){
                    // pself.filter=new modules.filter({
                    //     type:'people',
                    //      ele:self.ele.find('[data-page=find]'),
                    //      features:['distance','tag_person','tag_skills','gender','age','friends','sort'],
                    //      filter:(options.data&&options.data.filter)?options.data.filter:false,
                    //      showFilter:(options.data&&options.data.showFilter)?options.data.showFilter:false,
                    //      filterOpts:{
                    //         noDistance:(self.options.data&&self.options.data.noDistance)?1:0
                    //      },
                    //      previewCount:1,
                    //      onFilterChange:function(filter,preview){
                    //         if(preview){
                    //             pself.getCount(filter);
                    //         }else{
                    //             pself.setFilter(filter);
                    //         }
                    //      }
                    //  });
                    pself.load();
                }else{
                    pself.feed.start()
                }
            },
            getCount:function(filter){
                var pself=this;
                //pself.filter.counts.loading();
                app.api({
                    url:app.sapiurl+'/module/people/find',
                    data:{
                        filter:filter,
                        counts:1,
                        max:1000
                    },
                    callback:function(resp){
                        if(resp.success){
                            pself.filter.counts.set(resp.count);
                        }else{
                            pself.filter.counts.loadError();
                        }
                    }
                })
            },
            load:function(){
                var pself=this;
                pself.feed=new modules.infinitescroll({
                    ele:self.ele.find('.content'),
                    endpoint:app.sapiurl+'/module/people/find',
                    loaderClass:'lds-ellipsis-black',
                    offset:'200%',
                    clearOnResume:true,
                    swipeContainer:self.getContainer(),
                    opts:{
                        //filter:pself.filter.getFilter()
                    },
                    isFeed:function(){return 1},
                    filter2:{
                        nocache:true,
                        type:'people',
                        startVisible:true,
                        count:{
                            endpoint:app.sapiurl+'/module/people/find'
                        },
                        inlineFilter:true,
                        sidepane:pself.ele.find('.websidepane'),
                        ele:pself.ele.find('.scrollcontainer'),
                        conf:{
                            order:['distance','tag_person','tag_skills','gender','friends','age','sort'],
                            list:{
                                tag_person:{
                                    id:'tag_person',
                                    type:'tag',
                                    icon:'icon-hashtag',
                                    endpoint:app.sapiurl+'/search/tags'
                                },
                                tag_skills:{
                                    id:'tag_skills',
                                    type:'tag',
                                    icon:'icon-hero',
                                    endpoint:app.sapiurl+'/search/skills'
                                },
                                distance:{
                                    id:'distance',
                                    type:'distance'
                                },
                                age:{
                                    id:'age',
                                    type:'range',
                                    name:'Age',
                                    step:5,
                                    range:[20,100],
                                    default:[20,50]
                                },
                                gender:{
                                    id:'gender',
                                    type:'radio',
                                    icon:'icon-gender',
                                    default:'',
                                    types:{
                                        order:['male','female','nonbinary'],
                                        list:{
                                            male:{
                                                id:'male',
                                                name:'Male',
                                                display:'M'
                                            },
                                            female:{
                                                id:'female',
                                                name:'Female',
                                                display:'F'
                                            },
                                            nonbinary:{
                                                id:'nonbinary',
                                                name:'Non Binary',
                                                display:'NB'
                                            }
                                        }
                                    }
                                },
                                friends:{
                                    id:'friends',
                                    type:'radio',
                                    icon:'icon-friend-check',
                                    default:'',
                                    types:{
                                        order:['friends','notfriends'],
                                        list:{
                                            friends:{
                                                id:'friends',
                                                name:'Friends',
                                                display:'<i class="icon-friend-check"></i>'
                                            },
                                            notfriends:{
                                                id:'notfriends',
                                                name:'Not Friends',
                                                display:'<i class="icon-friends"></i>'
                                            }
                                        }
                                    }
                                },
                                sort:{
                                    id:'sort',
                                    type:'sort',
                                    default:'recent',
                                    types:{
                                        order:['closest','recent','mutual'],
                                        list:{
                                            closest:{
                                                id:'closest',
                                                name:'Closest',
                                                display:'Closest'
                                            },
                                            recent:{
                                                id:'recent',
                                                name:'Recent',
                                                display:'Recent'
                                            },
                                            mutual:{
                                                id:'mutual',
                                                name:'Mutual Friends',
                                                display:'Mutual'
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    max:12,//ensures grid
                    template:'people_find_user',
                    nodata:'<div style="padding:20px;text-align:center;color:#888;margin-top:20px;"><div style="padding-bottom:10px;"><i class="icon-info" style="font-size:55px;"></i></div><div>No matches, try refining your filters!</div></div>',
                    endOfList:' ',
                    handleError:function(ele,resp){
                        if(resp.error=='city_not_set'){
                            ele.render({
                                template:'connections_finish_profile',
                                append:false,
                                binding:function(ele){
                                    ele.find('.x_complete').stap(function(){
                                        app.user.completeOnboarding();
                                    },'tapactive')
                                }
                            })
                            return true;
                        }else{
                            return false;
                        }
                    },
                    onPageReady:function(ele){
                        ele.find('.rowitem').stap(function(){
                            app.showProfile(pself.feed.getById($(this).attr('data-id')));
                        },1,'tapactive');
                        ele.find('.x_chat').stap(function(e){
                            phi.stop(e);
                            app.showProfile(pself.feed.getById($(this).attr('data-id')),'chat');
                        },1,'tapactive')
                        ele.find('.x_arefriends').stap(function(e){
                            phi.stop(e);
                            var item=pself.feed.getById($(this).attr('data-id'));
                            var fr=new modules.permissions($.extend(true,{},item,{current:true,onSuccess:function(){
                                te.removeClass('icon-add-clean x_toaddfriend').addClass('icon-hourglass');
                                te.addClass('sent');
                            }}));
                            fr.show();
                        },1,'tapactive')
                        ele.find('.x_toaddfriend').stap(function(e){
                            var te=$(this);
                            if(te.hasClass('sent')) return true;//allow bubble
                            phi.stop(e);
                            var item=pself.feed.getById($(this).attr('data-id'));
                            var fr=new modules.permissions($.extend(true,{},item,{onSuccess:function(){
                                te.removeClass('icon-add-clean x_toaddfriend').addClass('icon-hourglass');
                                te.addClass('sent');
                            }}));
                            fr.show();
                        },1,'tapactive');
                    },
                    scrollBindings:{
                        scrollStart:function(){
                        },
                        scroll:function(obj){
                        }
                    }
                });
            },
            setFilter:function(){
                var pself=this;
                pself.feed.options.opts.filter=pself.filter.getFilter();
                pself.feed.clear();
                pself.feed.reload();
            },
            hide:function(){
                var pself=this;
                if(pself.feed){
                    pself.feed.stop();
                }
                pself.ele.hide();
            }
        },
    }
	this.getName=function(){
        return 'People';
	}
	this.hide=function(){
		self.ele.hide();
        self.showing=false;
	}
	this.start=function(){
		
	}
	this.stop=function(){
		
	}
	this.resume=function(){
		
	}
	this.destroy=function(){
		$.each(self.pages,function(i,v){
			if(v.destroy) v.destroy();
		})
        self.ele.remove();
		delete self;
	}
}