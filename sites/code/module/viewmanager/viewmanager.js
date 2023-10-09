modules.viewdelegate={//
    getType:function(){
        //return 'viewmanager';
        return (modules.tools.isWebLayout())?'tabmanager':'viewmanager';
    },
    onResume:function(){
        return modules[this.getType()].onResume();
    },
    destroy:function(){
        return modules[this.getType()].destroy();
    },
    getView:function(view_id){
        return modules[this.getType()].getView(view_id);
    },
    setPageStatus:function(view_id,opts){
        if(this.getType()=='tabmanager') modules.tabmanager.setPageStatus(view_id,opts);
    },
    clear:function(){
        if(modules[this.getType()]&&modules[this.getType()].clear) return modules[this.getType()].clear();
    },
    onHotReload:function(view_id){
        if(this.getType()=='tabmanager') modules.tabmanager.onHotReload(view_id);
        if(this.getType()=='viewmanager') modules.viewmanager.onHotReload(view_id);
    },
    setPage:function(view_id,opts){
        if(this.getType()=='tabmanager') modules.tabmanager.setPage(view_id,opts);
    },
    load:function(path,reload_id){
        if(this.getType()=='tabmanager') modules.tabmanager.load(path,reload_id);
        if(this.getType()=='viewmanager') modules.viewmanager.load(path,reload_id);
    },
    getViewByHash:function(hash){
        if(this.getType()=='tabmanager') return modules.tabmanager.getViewByHash(hash);
    },
    setViewPage:function(view_id,opts){
        if(this.getType()=='tabmanager') modules.tabmanager.setViewPage(view_id,opts);
    },
    getCurrentView:function(){
        return modules[this.getType()].getCurrentView();
    },
    canGoBack:function(){
        return modules[this.getType()].canGoBack();
    },
    setStatView:function(){
        return modules[this.getType()].setStatView();
    },
    onBack:function(){
        return modules[this.getType()].onBack();
    },
    setLast:function(){
        return modules[this.getType()].setLast();
    },
    clearLast:function(){
        return modules[this.getType()].clearLast();
    },
    init:function(){
        return modules[this.getType()].init();
    },
    hasView:function(view_id){
        return modules[this.getType()].hasView(view_id);
    },
    setView:function(view_id){
        return modules[this.getType()].setView(view_id);
    },
    closeTab:function(view_id){
        if(modules[this.getType()].closeTab) return modules[this.getType()].closeTab(view_id);
    },
    ensureHeader:function(view){
        return modules[this.getType()].ensureHeader(view);
    },
    register:function(type,data,replace,home){
        if(!modules.tools.isWebLayout()&&home){
            app.home.manager.register(type,data,replace);
        }else{
            return modules[this.getType()].register(type,data,replace);
        }
    }
}
modules.tabmanager={
    views:{
        order:[],
        intents:{},
        list:{},
        tabele:{},
        data:{},
        settings:{},
        current:'',
        cached:{},
        viewOrder:[]
    },
    clear:function(){
        var self=this;
        self.views={
            order:[],
            intents:{},
            list:{},
            tabele:{},
            data:{},
            settings:{},
            current:'',
            cached:{},
            viewOrder:[]
        }
        self.lastStack=0;
        self.cacheTabs();
    },
    lastStack:0,
    stackTabs:function(skip_modal){
        var self=this;
        var neworder=self.getTabOrder();
        var oldorder=self.getTabOrder();
        if(oldorder.length){
            //move pinned tabs to front
            var pinned=[];
            var reg=[];
            var regTabWidth=0;
            var regTabCount=0;
            $.each(oldorder,function(i,v){
                if(v){      
                    if(self.isPinned(v)){
                        pinned.push(v);
                        neworder.splice(neworder.indexOf(v),1);
                    }else{
                        regTabCount++;
                        reg.push(v);
                        regTabWidth+=$('#tabcontent').find('[data-id='+v+']').outerWidth()+(-self.lastStack);
                    }
                }
            })
            //update order
            var pinnedLength=0;
            if(pinned.length){
                $.each(pinned.reverse(),function(i,v){
                    neworder.unshift(v);
                    $('#tabcontent').find('[data-id='+v+']').prependTo($('#tabcontent'));
                    pinnedLength+=$('#tabcontent').find('[data-id='+v+']').outerWidth()
                })
            }
            if(!app.deepCompare({order:oldorder},{order:neworder})){
                self.cacheTabs();//change made to order, ensure it caches!
            }
            //calculate width of pinned tabs
            var totalWidth=$('#tabcontent').width();
            //calculate remainder of width
            //de-compress if already collapsed
            var remainder=totalWidth-pinnedLength-regTabWidth;
            //calculate width of rest of tabs
            //if tabs width is greater than remainder,
            if(remainder<0){
                //divide remaineder of width by number of non-pinned tabs
                var perTab=Math.ceil(remainder/regTabCount)-1;
                $.each(reg,function(i,v){
                    $('#tabcontent').find('[data-id='+v+']').find('.tabname').css('marginRight',perTab);
                })
                self.lastStack=perTab;
                if(perTab<-50){
                    if(!skip_modal){
                        var ct=new Date().getTime();
                        if(!self.lastNotice||((ct-self.lastNotice)>5000)){
                            $('body').alert({
                                content:'<div style="padding:20px;font-size:18px;text-align:left">Wow, you\'ve got a lot going on!  It\'d probably be a good idea to start closing out some of your tabs to open up space in your tab-bar.</div>',
                                closer:false
                            });
                        }
                        self.lastNotice=ct;
                    }
                }else{
                    if(perTab<-30){
                        $('#tabcontent').addClass('ultracompressed')
                    }else{
                        $('#tabcontent').removeClass('ultracompressed')
                    }
                }
            }else{
                //console.log('fits without collapse')
            }

        }
    },
    load:function(path,reload_id){
        var self=this;
        //show loading with proper tab, etc
        if(!reload_id){
            var uid=Math.uuid(12);
            self.register('web_loading',{
                id:uid,
                data:{
                    id:uid,
                    currentPath:path
                }
            });
            self.setPageStatus(uid,{
                loading:true
            })
        }else{
            var uid=reload_id;
            self.setPageStatus(uid,{
                loading:true
            });
        }
        app.api({
            url:app.sapiurl+'/url_name',
            data:{
                path:path[0]
            },
            callback:function(resp){
                if(resp.success){
                    //replace temporary view with
                    self.clearView(uid);
                    modules.viewdelegate.register(resp.data.type,{
                        id:resp.data.id,
                        data:{
                            id:resp.data.id
                        }
                    })
                }else{
                    self.setPageStatus(uid,{
                        error:true
                    })
                    if(resp.error=='invalid_page'){
                        if(self.views.list[uid].notFound) self.views.list[uid].notFound();
                        else console.warn('Not Found not registered');
                    }else{
                        //bad network or some other error
                        if(self.views.list[uid].onError) self.views.list[uid].onError(resp);
                        else console.warn('Not Found not registered');
                    }
                }
            }
        })
    },
    clearView:function(view_id){
        var self=this;
        self.views.order.splice(self.views.order.indexOf(view_id),1);
         if(self.views.tabele[view_id]){
            self.views.tabele[view_id].remove();
            delete self.views.tabele[view_id];
        }
        if(self.views.list[view_id]){
             self.views.list[view_id].destroy();
             delete self.views.list[view_id];
         }
         if(self.views.intents[view_id]) delete self.views.intents[view_id];
    },
    getViewByHash:function(hash){
        var self=this;
        var match='';
        $.each(self.views.intents,function(i,v){
            if(v.indexOf(hash)===0) match=i;  
        })
        if(match){
            return {
                view:self.views.list[match],
                id:match
            }
        }else return false;
    },
    setViewPage:function(view_id,opts){
        var self=this;
        if(opts.intent){
            app.history.set({
                data:{},
                title:opts.name,
                intent:(opts.intent)?opts.intent:''
            })
            if(!self.views.intents[view_id]){
                if(self.views.list[view_id].state_manager){
                    //console.log('Registering a base url')
                    self.views.intents[view_id]=self.views.list[view_id].state_manager.getBaseIntent();//map for url to view id
                }else{
                    console.warn('no getBaseIntent for view ['+view_id+']')
                }
            }
        }else{
            console.warn('No intent set for ['+view_id+']')
        }
    },
    getTabOrder:function(){
        var order=[];
        $('#tabcontent').find('.hometab').each(function(i,v){
            order.push($(v).attr('data-id'))
        });
        return order;
    },
    cacheTabs:function(){
        var self=this;
        var data={};
        var tabs={};
        var settings={};
        var current=app.prefs.get('tabs');
        var order=self.getTabOrder();
        //try to use current info first
        $.each(order,function(i,v){
            if(self.views.list[v]){
                var tv=self.views.list[v];
                if(!tv._loadingPage){
                    if(tv.state_manager&&tv.state_manager.options.getTabData){
                        if(tv.state_manager.options.getTabData()){
                            tabs[v]=tv.state_manager.options.getTabData();
                        }else{
                            tabs[v]=self.views.data[v].data;
                        }
                    }else{
                        console.warn('No tabmanager or [getTabData] for view ['+v+']')
                        tabs[v]=self.views.data[v].data;
                    }
                    data[v]=self.views.data[v];
                }
            }else{//use previous cached values
                if(current&&current.data&&current.data[v]){
                    data[v]=current.data[v];
                    tabs[v]=current.tabs[v];
                }else{
                    console.warn('No data for view ['+v+'] *remove*');
                }
            }
            if(self.views.data[v]){
                settings[v]=$.extend(true,{},self.views.data[v].settings);
            }else{
                settings[v]=(current&&current.settings&&current.settings[v])?current.settings[v]:{};
            }
            if(data[v]&&data[v].data&&data[v].data.ele) delete data[v].data.ele;
        });
        var save={
            order:order,
            data:data,
            tabs:tabs,
            settings:settings
        }
        //console.log(save)
        app.prefs.set('tabs',save);
    },
    setPageStatus:function(view_id,opts){
        var self=this;
        if(!self.views.tabele[view_id]) return false;
        var settings=(self.views.data[view_id]&&self.views.data[view_id].settings)?self.views.data[view_id].settings:{};
        self.views.tabele[view_id].render({
            template:'home_tab',
            replace:true,
            uid:view_id,
            data:$.extend(true,{id:view_id,settings:settings,closer:true,icon:false,selected:(view_id==self.views.current),pinned:self.isPinned(view_id)},opts),
            binding:function(ele){
                self.bindTab(view_id,ele);
            }
        });
        self.cacheTabs();
        self.stackTabs();
    },
    getSettings:function(id){
        var self=this;
        var settings=false;
        if(self.views.data[id]){
            settings=self.views.data[id].settings;
        }else{//try from cache
            var tabs=app.prefs.get('tabs');
            if(tabs&&tabs.settings&&tabs.settings[id]) settings=tabs.settings[id];
        }
        if(!settings) settings={};
        return settings;
    },
    refreshView:function(id){
        var self=this;
        if(!id) id=self.views.current;
        var view=self.views.list[id];
        if(view.refresh) view.refresh();
        else console.warn('no refresh avail!');
    },
    bindTab:function(id,ele){
        var self=this;
        self.views.tabele[id]=ele;
        ele.find('.x_close').stap(function(e){
            phi.stop(e);
            self.exitView(id);
            self.disableTabClick=true;
            setTimeout(function(){
                self.disableTabClick=false;
            },500)
        },1,'tapactive')
        ele.stap(function(){
            if(self.preventClick) return false;
            if(self.views.cached[id]){
                self.register(self.views.cached[id].type,self.views.cached[id].data,false,self.views.cached[id].settings);
            }else{
                if(!self.disableTabClick) self.setPage(id);
            }
        },1,'tapactive')
        ele.on('contextmenu',function(e){
            self.preventClick=true;
            setTimeout(function(){
                self.preventClick=false;
            },300);
            phi.stop(e);//prevent click
            var settings=self.getSettings(id);
            var menu=[];
            if(settings.pinned){
                menu.push({
                    id:'unpin',
                    name:'Unpin Tab'
                })
            }else{
                menu.push({
                    id:'pin',
                    name:'Pin Tab'
                })
            }
            menu.push({
                id:'close',
                name:'Close Tab'
            })
            if(app.user.profile.admin){
                menu.push({
                    id:'refresh',
                    name:'Refresh Tab (Admins)'
                })   
            }
            var cmenu=modules.alertdelegate({
                display:{
                    ele:$(this),
                    container:$('body'),
                    locations:['topcenter'],
                    arrow:true
                },
                menu:menu,
                onSelect:function(rid){
                    if(rid=='refresh'){
                        //get view
                        self.refreshView(id);
                    }
                    if(rid=='close'){
                        self.exitView(id);
                    }
                    if(rid=='unpin'){
                        var tabs=app.prefs.get('tabs');
                        if(!self.views.data[id]) self.views.data[id]={};
                        var c=self.views.data[id];
                        if(!c.settings) c.settings={};
                        if(c.settings.pinned) delete c.settings.pinned;
                        self.views.data[id].settings=c.settings;
                        var tabdata=(tabs.tabs[id])?tabs.tabs[id]:c.data;
                        tabdata.id=id;
                        self.renderTab(c.type,c.data,tabdata,c.settings)
                        self.cacheTabs();
                        self.stackTabs();
                    }
                    if(rid=='pin'){
                        var tabs=app.prefs.get('tabs');
                        if(!self.views.data[id]) self.views.data[id]={};
                        var c=self.views.data[id];
                        if(!c.settings) c.settings={};
                        c.settings.pinned=true;
                        self.views.data[id].settings=c.settings;
                        var tabdata=(tabs.tabs[id])?tabs.tabs[id]:c.data;
                        tabdata.id=id;
                        self.renderTab(c.type,c.data,tabdata,c.settings)
                        self.cacheTabs();
                        self.stackTabs();
                    }
                }
            })
            cmenu.show();
            self.disableTabClick=true;
            if(self.dto) clearTimeout(self.dto);
            self.dto=setTimeout(function(){
                self.disableTabClick=false;
            },1000);
            phi.stop(e)
        })
        self.ensureTabs();
    },
    onResume:function(){},
    destroy:function(){},
    canGoBack:function(){},
    setStatView:function(){},
    onBack:function(){},
    setLast:function(){},
    clearLast:function(){},
    init:function(){
        var self=this;
        self.ensureAddTab();
        self.resetHistory();
        self.ensureTabs();
    },
    resetHistory:function(){
        var self=this;
        var tabs=app.prefs.get('tabs');
        if(tabs&&tabs.order){
            $.each(tabs.order,function(i,v){
                //render tabs
                if(tabs.data[v]){
                    var data=tabs.data[v].data;
                    var tabdata=(tabs.tabs[v])?tabs.tabs[v]:data;
                    var settings=(tabs.settings&&tabs.settings[v])?tabs.settings[v]:{};
                    self.renderTab(tabs.data[v].type,data,tabdata,settings,1);
                }
            })
            self.stackTabs();
        }
    },
    setView:function(){},
    getView:function(view_id){
        var self=this;
        if(self.views.list[view_id]) return self.views.list[view_id];
        return false;
    },
    getCurrentView:function(){
        var self=this;
        return self.views.current;
    },
    ensureHeader:function(){},
    ensureTabs:function(){
        var self=this;
        if(self.views.order.length||true){
            //ensure correctly set active tab!
            TweenLite.set($('#tabcontainer'),{top:30,onComplete:function(){

            }})
        }else{
            TweenLite.set($('#tabcontainer'),{top:0,onComplete:function(){

            }})
        }
        //bind draggablity!!!!
        if($('#tabcontent').hasClass('initd')) $('#tabcontent').sortable('destroy');
        $('#tabcontent').sortable({
            items: ".hometab",
            placeholder: "hometab_placeholder",
            forcePlaceholderSize:true,
            revert: true,
            update:function(){
                var order=[];
                $('#tabcontent').find('.hometab').each(function(i,v){
                    order.push($(v).attr('data-id'))
                })
                self.views.order=order;
                self.cacheTabs();
                //console.log(order)
            }
        });
        $('#tabcontent').addClass('initd');
        //ensure back/forward
        //self.ensureNav();
    },
    closeTab:function(view_id){
        var self=this;
        if(!view_id) view_id=self.views.current;
        self.exitView(view_id);
    },
    // ensureNav:function(){
    //     $('#webmenu').find('.x_webback')
    //     $('#webmenu').find('.x_webforward')
    //     $('#webmenu').find('.x_webrefresh')
    // },
    exitView:function(view_id){
        var self=this;
         self.views.order.splice(self.views.order.indexOf(view_id),1);
         self.views.viewOrder.splice(self.views.viewOrder.indexOf(view_id),1);
         self.views.tabele[view_id].fadeOut(300,function(){
            $(this).remove();
            delete self.views.tabele[view_id];
            self.cacheTabs();
            self.stackTabs(1);
         })
         if(self.views.list[view_id]&&self.views.list[view_id].destroy){
            self.views.list[view_id].destroy();
         }else console.warn('No Destroy for view ['+view_id+']')
         delete self.views.list[view_id];
         if(self.views.intents[view_id]) delete self.views.intents[view_id];
         if(modules.components[view_id]) delete modules.components[view_id];
         //set current to the last visible used tab, or 
         if(self.views.current==view_id){//otherwise view will already be correct
             if(self.views.order.length){
                if(self.views.viewOrder&&self.views.viewOrder.length){
                    self.setPage(self.views.viewOrder[0]);//use last visible tab at some point
                }else{
                    self.setPage(self.views.order[0]);//use last visible tab at some point
                }
             }else{
                var order=self.getTabOrder();
                var ind=order.indexOf(view_id);
                if(ind>=0) order.splice(ind,1);//ensure it doesnt choose this page
                if(order.length){
                    self.views.tabele[order[0]].stap()
                }else{
                    self.setPage('home');
                }
             }
         }
         self.ensureTabs();
    },
    ensureAddTab:function(){
        var self=this;
        if(self.views.tabele.home) return false;
        if(false) $('#tabcontent').render({
            template:'home_add_tab',
            data:{

            },
            binding:function(ele){
                self.views.tabele.home=ele;
                ele.stap(function(){
                    if(self.views.tabele.home.hasClass('menushowing_static')){
                        self.hideAddMenu();
                    }else{
                        self.showAddMenu();
                    }
                },1,'tapactive')
            }
        });
        $('#addmenu').render({
            template:'home_addmenu',
            data:{
                apps:app.home.getApps()
            },
            binding:function(ele){
                self.views.tabele.menu=ele;
                //self.showAddMenu();
                ele.find('.webdropdownnav').stap(function(){
                    app.home.setApp($(this).attr('data-id'))
                    self.hideAddMenu();
                },1,'tapactive');
            }
        })
    },
    showAddMenu:function(){
        var self=this;
        self.views.tabele.home.addClass('menushowing_static')
        //$('#addmenu').show();
        $('#pages').addClass('mainmenushowing')
    },
    hideAddMenu:function(){
        var self=this;
         self.views.tabele.home.removeClass('menushowing_static')
        //$('#addmenu').hide();
        $('#pages').removeClass('mainmenushowing')
    },
    setPage:function(view_id){
        var self=this;
        if(self.views.current==view_id) return console.warn('internal navigation in a page ['+view_id+']')
        if(!self.views.tabele[view_id]) return false;
        $('#tabcontent').find('.hometab').removeClass('selected');
        self.views.tabele[view_id].addClass('selected');
        if(self.views.current&&self.views.list[self.views.current]&&!self.views.list[self.views.current]._loadingPage){
            if(self.views.list[self.views.current].stop) self.views.list[self.views.current].stop();
            else console.warn('No view stop manager [stop]['+self.views.current+']')
            if(self.views.list[self.views.current].viewHide) self.views.list[self.views.current].viewHide();
            else console.warn('No view Hide manager [viewHide]['+self.views.current+']')
        }
        //also neet to update stats
        self.views.current=view_id;
        if(view_id=='home'){
            // $('#tabviews').hide();
            // $('#homeswiper').show();
            //if no home page running, default select
            setTimeout(function(){
                if(!app.home.manager.views.current){
                    app.home.setApp('streams');
                    var tapp='streams';
                }else{//st proper status
                    var tapp=app.home.manager.views.current;
                    app.history.set(app.home.getPath());
                }
                $('#webmenu').find('[data-app='+tapp+']').addClass('selected')
                //ensure nav is properly set!
            },50)
        }else{
            if(self.views.current&&self.views.list[self.views.current]&&!self.views.list[self.views.current]._loadingPage){
                if(self.views.list[self.views.current].viewShow) self.views.list[self.views.current].viewShow();
                else console.warn('No view show manager [viewShow]['+self.views.current+']')
                if(self.views.list[self.views.current].start) self.views.list[self.views.current].start();
                else console.warn('No view start manager [start]['+self.views.current+']');
                if(self.views.list[self.views.current].state_manager){
                    if(self.views.list[self.views.current].state_manager.getPath()){
                        app.history.set(self.views.list[self.views.current].state_manager.getPath());
                    }
                }else console.warn('No view manager [getPath]['+self.views.current+']');
            }
            $('#tabviews').show();
            $('#homeswiper').hide();
            $('#webmenu').find('.mainmenuitem').removeClass('selected');
            self.ensurePageOrder(view_id);
        }
    },
    isPinned:function(id){
        var self=this;
        var settings=self.getSettings(id);
        if(settings.pinned) return true;
        return false;
    },
    renderTab:function(type,data,cache,settings,init){
        var self=this;
        var udata=(cache)?cache:data;
        if((!data||!data.id)&&cache){
            data=cache;
        }
        $('#tabcontent').render({
            template:'home_tab',
            uid:data.id,
            data:{
                id:data.id,
                name:(udata.name)?udata.name:' ',
                icon:(udata.icon)?udata.icon:'',
                pic:(udata.pic)?udata.pic:'',
                settings:(settings)?settings:{},
                closer:true,
                pinned:self.isPinned(data.id),
                selected:(self.views.current==data.id)?true:false
            },
            binding:function(ele){
                if(init){
                    self.views.cached[data.id]={
                        type:type,
                        data:data,
                        settings:settings
                    }
                    // ele.stap(function(){
                    //     if(self.views.cached[data.id]){
                    //         self.register(type,data,false,settings);
                    //     }
                    // },1,'tapactive');
                    // //return false;
                }
                self.bindTab(data.id,ele);
            }
        })
    },
    showPage:function(type,data){
        data.page=true;
        var view=new modules[type](data);
        view.show();
    },
    ensurePageOrder:function(page_id){
        //set view order for this session
        var self=this;
        if(self.views.viewOrder.indexOf(page_id)>=0){
            self.views.viewOrder.splice(self.views.viewOrder.indexOf(page_id),1);
            self.views.viewOrder.unshift(page_id);
        }else{
            self.views.viewOrder.unshift(page_id);
        }
    },
    onHotReload:function(view_id){
        var c=modules.components[view_id];
        var options=c.view.options;
        var store=c.view.store;
        options.store=store;
        var self=this;
        if(self.views.list[view_id].stop) self.views.list[view_id].stop();//ensure stopped
        self.views.list[view_id].destroy();
        delete self.views.list[view_id];
        var view=new modules[c.type](options);
        if(view.onHotReload) view.onHotReload();
        modules.components[options.id]={
            type:c.type,
            view:view
        }
        if(!view._loadingPage){
            if(view.setStatView) view.setStatView();
            else console.warn('no stat view for view ['+c.type+']');
        }
        //self.ensureHeader(view);
        self.views.list[options.id]=view;
    },
    register:function(type,data,replace,settings){
        var self=this;
        if(data&&data.pageOnWeb){
            self.showPage(type,data);
            return false;
        }
        var cv=self.getView(data.id);
        $('#tabviews').show();//todo - more efficient
        if(!cv||self.views.cached[data.id]){
            if(self.views.cached[data.id]){
                settings=self.views.cached[data.id].settings;
                //console.log('HERE',settings)
            }
            //console.log('register ['+type+'] ['+data.id+']')
            self.views.cached[data.id]=false;
            // if(self.views.current&&self.views.list[self.views.current]&&self.views.list[self.views.current].stop) self.views.list[self.views.current].stop();
            // else console.warn('No view stop manager')
            // if(self.views.current&&self.views.list[self.views.current]&&self.views.list[self.views.current].viewHide) self.views.list[self.views.current].viewHide();
            // else console.warn('No view Hide manager')
            //create the tab
            self.renderTab(type,data,false,settings);
            self.views.order.push(data.id);
            self.views.data[data.id]={
                type:type,
                data:$.extend(true,{},data),
                settings:(settings)?settings:{}
            }
            if(!data.name) data.name=' ';
            //if(!data.pic&&!data.icon) data.icon='icon-ticket';
            //self.ensureAddTab();
            data.ele=$('#tabviews');
            data.inline=true;
            var view=new modules[type](data);
            view.show();
            modules.components[data.id]={
                type:type,
                view:view
            }
            if(!view._loadingPage){
                if(view.setStatView) view.setStatView();
                else console.warn('no stat view for view ['+type+']');
            }
            //self.ensureHeader(view);
            self.views.list[data.id]=view;
            self.setPage(data.id);
            self.cacheTabs();
            self.stackTabs();
        }else{
            self.setPage(data.id);
            if(data.state){//a state intent is heppening, ensure state is correct!
                if(cv.onStateUpdate) cv.onStateUpdate(data.state);
                else console.warn('no onStateUpdate for view ['+data.id+']')
            }
            console.warn('already has view!  Just show the tab!');
        }
        self.ensurePageOrder(data.id);
    }
}
modules.components={};
modules.viewmanager={
    views:{
        order:[],
        list:{},
        data:{},
        current:''
    },
    onResume:function(){
        var self=this;
        if(self.views.current){
            var current=self.views.list[self.views.current];
            if(current.onResume) current.onResume();
        }
    },
    onHotReload:function(view_id){
        var c=modules.components[view_id];
        var options=c.view.options;
        var store=c.view.store;
        options.store=store;
        var self=this;
        if(self.views.list[view_id].stop) self.views.list[view_id].stop();//ensure stopped
        self.views.list[view_id].destroy();
        delete self.views.list[view_id];
        var view=new modules[c.type](options);
        if(view.onHotReload) view.onHotReload();
        modules.components[options.id]={
            type:c.type,
            view:view
        }
        if(!view._loadingPage){
            if(view.setStatView) view.setStatView();
            else console.warn('no stat view for view ['+c.type+']');
        }
        //self.ensureHeader(view);
        self.views.list[options.id]=view;
    },
    load:function(path,reload_id){
        var self=this;
        //show loading with proper tab, etc
        if(!reload_id){
            var uid=Math.uuid(12);
            // self.register('web_loading',{
            //     id:uid,
            //     data:{
            //         id:uid,
            //         currentPath:path
            //     }
            // });
            // self.setPageStatus(uid,{
            //     loading:true
            // })
        }else{
            var uid=reload_id;
            // self.setPageStatus(uid,{
            //     loading:true
            // });
        }
        app.api({
            url:app.sapiurl+'/url_name',
            data:{
                path:path[0]
            },
            callback:function(resp){
                if(resp.success){
                    //replace temporary view with
                    //self.clearView(uid);
                    modules.viewdelegate.register(resp.data.type,{
                        id:resp.data.id,
                        data:{
                            id:resp.data.id
                        }
                    })
                }else{
                    // self.setPageStatus(uid,{
                    //     error:true
                    // })
                    if(resp.error=='invalid_page'){
                        if(self.views.list[uid]&&self.views.list[uid].notFound) self.views.list[uid].notFound();
                        else console.warn('Not Found not registered');
                    }else{
                        //bad network or some other error
                        if(self.views.list[uid]&&self.views.list[uid].onError) self.views.list[uid].onError(resp);
                        else console.warn('Not Found not registered');
                    }
                }
            }
        })
    },
    destroy:function(){//destroy and current instances...
        var self=this;
        console.log('destroying Outter views');
        $.each(self.views.list,function(i,v){
            if(v.destroy) v.destroy();
        });
        self.views={//clear
            order:[],
            list:{},
            data:{},
            current:''
        }
        self.clearLast();
    },
    canGoBack:function(){
        var self=this;
        if(self.views.current){
            var v=self.views.list[self.views.current];
            if(v.goBack){
                v.goBack();
            }else{
                onerror('no goBack for view ['+self.views.current+']');
                return false;
            }
        }else{
            return false;
        }
    },
    setStatView:function(){
        var self=this;
        if(self.views.current){
            var cv=self.views.list[self.views.current];
            if(cv.setStatView) cv.setStatView()
            else console.warn(self.views.current+ ' does not have a setStatView!');
        }else{
            app.home.setStatView();
        }
    },
    onBack:function(){//only handles
        var self=this;
        //remove last one from list
        var last=self.views.order[self.views.order.length-1];
        var prev=self.views.order[self.views.order.length-2];
        if(self.views.list[last]) delete self.views.list[last];
        if(self.views.data[last]) delete self.views.data[last];
        self.views.order.splice((self.views.order.length-1),1);
        //rebind last page
        if(prev){
            var lastpage=self.views.list[prev];
            if(lastpage.start) lastpage.start();//ensures that websockets are started
            else console.warn(prev +' does not have an onResume!')
            if(lastpage.onResume) lastpage.onResume();//ensures data is current!
            else console.warn(prev +' does not have an onResume!')
            if(lastpage.setStatView) lastpage.setStatView();
            else console.warn(prev+ ' does not have a setStatView!');
            self.views.current=prev;
            self.ensureHeader(lastpage); 
            self.setLast();
        }else{
            self.views.current='';
            //also set app to home
            app.home.setPage(false,1);
            app.home.onResume();
            self.ensureHeader() 
            self.clearLast();
            app.home.setStatView();
        }
    },
    setLast:function(){
        var self=this;
        if(!app.isdev) return false;//not ready for prime time yet...causes issues
        //1) if on a page that has a function passed as optinos
        //2) a chat/page that has keyboard default showing causes keyboard to show on loader screen
        if(self.views.data[self.views.current]){
            app.prefs.set('currentview',{
                id:self.views.current,
                opts:$.extend(true,{},self.views.data[self.views.current].opts,{ele:''}),//clear out ele
                type:self.views.data[self.views.current].type
            })
        }else{
            console.warn('['+self.views.current+'] does not have options!');
        }
    },
    clearLast:function(){
        var self=this;
        app.prefs.delete('currentview');
    },
    init:function(){//on app load, can show last viewed
        var self=this;
        var lastview=app.prefs.get('currentview');
        //console.log(lastview);
        if(lastview){
            lastview.opts.load=true;//if reloading it should fully reload...
            self.register(lastview.type,lastview.opts)
        }else{
            console.log('no previous page, show landing')
        }
    },
    getView:function(view_id){
        var self=this;
        if(self.views.list[view_id]) return self.views.list[view_id];
        return false;
    },
    getCurrentView:function(){
        var self=this;
        return self.views.current;
    },
    hasView:function(view_id){
        var self=this;
        if(self.views.order.indexOf(view_id)>=0){
            return true;
        }
        return false;
    },
    setView:function(view_id){
        var self=this;
        //re-arrange views if necessary!
        if(self.views.current!=view_id){
            if(self.views.current){
                if(self.views.list[self.views.current].stop) self.views.list[self.views.current].stop();
                else console.warn(self.views.current+' doesnt have a stop!');
            }
            //
            //_alert('re-arrange! coming soon');
            //get index of view that wants to go to
            var cid=self.views.order.indexOf(view_id);
            //for all views after, shift left 100%
            var debug=1;
            if(debug) console.log('current index:'+cid);
            var current=cid+1;//because home screen
            var children=$('#subpagewrapper').children();
            $.each(children,function(i,v){
                if(i>current){
                    var newleft=100*(i-1);
                    if(debug) console.log('newleft:'+newleft);
                    $(v).css('left',newleft+'%');   
                }else if(i==current){
                    //move to last position!
                    var moveto=self.views.order.length*100;
                    if(debug) console.log('moveto: '+moveto);
                    $(v).css('left',moveto+'%');   
                }
            });
            //app pages are in correct position, animate accordingly
            var setX=-((self.views.order.length-1)*100)+'%';
            var animateX=-((self.views.order.length)*100)+'%';
            if(debug) console.log('setX:'+setX);
            TweenLite.set($('#subpagewrapper'),{x:setX});
            TweenLite.to($('#subpagewrapper'),.3,{x:animateX,onComplete:function(){
                //fix order!
                self.views.order.splice(self.views.order.indexOf(view_id),1);
                self.views.order.push(view_id);
                self.views.current=view_id;
                if(self.views.current&&self.views.list[self.views.current].start) self.views.list[self.views.current].start();
                if(self.views.list[self.views.current].setStatView) self.views.list[self.views.current].setStatView();
                self.ensureHeader(self.views.list[self.views.current]) 
            }});
        }
    },
    ensureHeader:function(view){
        if(view&&view.headerStyle){
            app.statusBar.set(view.headerStyle());
        }else{//default to theme!
            app.statusBar.set()
        }
        if(view&&view.footerStyle){
            app.footerBar.setColor(view.footerStyle());
        }else{//default to theme!
            app.footerBar.setColor()
        }
    },
    register:function(type,data,replace){
        var self=this;
        //pause current!
        //check to see if view is or has already been show!
        if(self.hasView(data.id)){
            console.warn('Has View '+data.id);
            self.setView(data.id);
        }else{//create it!
            if(replace&&self.views.current&&self.views.list[self.views.current].destroy){
                console.log('===replace!!!')
                self.views.list[self.views.current].destroy();
                self.views.order.splice((self.views.order.length-1),1);//it will be the last one....
                delete self.views.list[self.views.current];
                self.views.current='';
            }else if(self.views.current&&self.views.list[self.views.current].stop){
                if(self.views.list[self.views.current].stop) self.views.list[self.views.current].stop();
                else console.warn(self.views.current+' doesnt have a stop!');
            }
            self.views.data[id]=$.extend(true,{},{
                opts:data,
                type:type
            });
            if(replace) data.replace=true;
            if(!data.ele) data.ele=$('#homecontainer');
            var view=new modules[type](data);
            view.show();
            modules.components[data.id]={
                type:type,
                view:view
            }
            if(view.setStatView) view.setStatView();
            else console.warn('no stat view for view ['+type+']');
            self.ensureHeader(view);
            var id=data.id;
            modules.keyboard_global.keyboardHeight=0;//reset keyboard height before going to next view!
            self.views.order.push(id);
            self.views.list[id]=view;
            self.views.current=id;
            self.setLast();
        }
    }
}
modules.manager=function(){//internal viewmanager!
    var self=this;
    var oself=this;
    this.views={
        order:[],
        list:{},
        data:{},
        current:'',
        intents:{}
    }
    this.getViewByHash=function(hash){
        var match='';
        $.each(self.views.intents,function(i,v){
            if(v.indexOf(hash)===0) match=i;  
        })
        if(match){
            return {
                view:self.views.list[match],
                id:match
            }
        }else return false;
    }
    this.setViewPage=function(view_id,opts){
        if(opts.intent){
            app.history.set({
                data:{},
                title:opts.name,
                intent:(opts.intent)?opts.intent:''
            })
            // if(!self.views.intents[view_id]){
            //     if(self.views.list[view_id].state_manager){
            //         console.log('Registering a base url')
            //         self.views.intents[view_id]=self.views.list[view_id].state_manager.getBaseIntent();//map for url to view id
            //     }else{
            //         console.warn('no getBaseIntent for view ['+view_id+']')
            //     }
            // }
        }else{
            console.warn('No intent set for ['+view_id+']')
        }
    }
    this.onResume=function(){
        if(self.views.current){
            var current=self.views.list[self.views.current];
            if(current.onResume) current.onResume();
        }
    }
    this.setStatView=function(){
        if(self.views.current){
            var view=self.views.list[self.views.current];
            if(view.setStatView) view.setStatView();
            else console.warn(self.views.current+ ' doesnt have setStatView');
        }else{
            app.home.setStatView(1);
        }
    }
    this.destroy=function(){//destroy and current instances...
        $.each(self.views.list,function(i,v){
            if(v.destroy) v.destroy();
        });
        self.views={//clear
            order:[],
            list:{},
            data:{},
            current:'',
            intents:{}
        }
        self.clearLast();
    }
    this.canGoBack=function(){
        var self=this;
        if(self.views.current){
            var v=self.views.list[self.views.current];
            if(v.goBack){
                v.goBack();
            }else{
                onerror('no goBack for view ['+self.views.current+']');
                return false;
            }
        }else{
            return false;
        }
    }
    this.onBack=function(){//only handles
        //remove last one from list
        var last=self.views.order[self.views.order.length-1];
        var prev=self.views.order[self.views.order.length-2];
        if(self.views.list[last]) delete self.views.list[last];
        if(self.views.data[last]) delete self.views.data[last];
        self.views.order.splice((self.views.order.length-1),1);
        //rebind last page
        if(prev){
            var lastpage=self.views.list[prev];
            if(lastpage.start) lastpage.start();//ensures that websockets are started
            else console.warn(prev +' does not have an onResume!')
            if(lastpage.onResume) lastpage.onResume();//ensures data is current!
            else console.warn(prev +' does not have an onResume!')
            if(lastpage.setStatView) lastpage.setStatView();
            else console.warn(prev+ ' does not have a setStatView!');
            self.views.current=prev;
            self.ensureHeader(lastpage);
            self.setHeader();
        }else{
            self.views.current='';
            //also set app to home
            app.home.setPage(false,1);
            app.home.onResume();
            self.ensureHeader() 
            app.home.setStatView();
            self.setHeader();
        }
    }
    this.setHeader=function(){
        if(self.views.current){
            app.home.setPageName(self.views.list[self.views.current],self.views.current);
        }else{
            app.home.setPageName();
        }
        app.home.header.ensureBack()
    }
    this.ensureHeader=function(view){
        if(view&&view.headerStyle){
            app.statusBar.set(view.headerStyle());
        }else{//default to theme!
            app.statusBar.set()
        }
        if(view&&view.footerStyle){
            app.footerBar.setColor(view.footerStyle());
        }else{//default to theme!
            app.footerBar.setColor()
        }
    }
    this.onNavClick=function(page){
        if(self.views.current){
            var cview=self.views.list[self.views.current];
            if(cview.goBack) cview.goBack();
            else console.warn('no goBack for view ['+self.views.current+']')
        }else{
            //console.trace()
            if(app.home.pages[page].onNavClick) app.home.pages[page].onNavClick();
        }
    }
    this.clear=function(){
        if(self.views.order){
            $.each(self.views.order.reverse(),function(i,v){
                if(self.views.list[v].destroy) self.views.list[v].destroy();
                else console.warn('no destroy for view ['+v+']');
            })
            self.views={
                current:'',
                list:{},
                order:[],
                data:{}
            }
        }
        TweenLite.set($('#homeswiper'),{x:'0%'})
    }
    this.destroy=function(){//close out all views!
        self.clear()
    }
    this.onHeaderClick=function(){
        if(self.views.current){
            if(self.views.list[self.views.current].onHeaderClick) self.views.list[self.views.current].onHeaderClick();
            else console.warn(self.views.current+' doesnt have a .onHeaderClick()!');
        }else{
            app.home.onHeaderClick();
        }
    }
    this.setView=function(view_id){
        //re-arrange views if necessary!
        if(self.views.current!=view_id){
            if(self.views.current){
                if(self.views.list[self.views.current].stop) self.views.list[self.views.current].stop();
                else console.warn(self.views.current+' doesnt have a stop!');
            }
            //
            //_alert('re-arrange! coming soon');
            //get index of view that wants to go to
            var cid=self.views.order.indexOf(view_id);
            //for all views after, shift left 100%
            var debug=1;
            if(debug) console.log('current index:'+cid);
            var current=cid+1;//because home screen
            var children=$('#homeswiper').children();
            $.each(children,function(i,v){
                if(i>current){
                    var newleft=100*(i-1);
                    if(debug) console.log('newleft:'+newleft);
                    $(v).css('left',newleft+'%');   
                }else if(i==current){
                    //move to last position!
                    var moveto=self.views.order.length*100;
                    if(debug) console.log('moveto: '+moveto);
                    $(v).css('left',moveto+'%');   
                }
            });
            //app pages are in correct position, animate accordingly
            var setX=-((self.views.order.length-1)*100)+'%';
            var animateX=-((self.views.order.length)*100)+'%';
            if(debug) console.log('setX:'+setX);
            TweenLite.set($('#homeswiper'),{x:setX});
            TweenLite.to($('#homeswiper'),.3,{x:animateX,onComplete:function(){
                //fix order!
                self.views.order.splice(self.views.order.indexOf(view_id),1);
                self.views.order.push(view_id);
                self.views.current=view_id;
                if(self.views.current&&self.views.list[self.views.current].start) self.views.list[self.views.current].start();
                if(self.views.list[self.views.current].setStatView) self.views.list[self.views.current].setStatView();
                self.ensureHeader(self.views.list[self.views.current]);
                self.setHeader();
            }});
        }
    }
    this.register=function(type,data,replace){
        //pause current!
        //check to see if view is or has already been show!
        //ensuer
        app.home.ensureHome();
        if(self.views.order.indexOf(data.id)>=0){
            console.warn('Internal view already has this!');
            self.setView(data.id);
            return false;
        }
        if(self.views.current){
            if(self.views.list[self.views.current].stop) self.views.list[self.views.current].stop();
            else console.warn(self.views.current+' doesnt have a stop!');
        }
        if(replace&&self.views.current&&self.views.list[self.views.current].destroy){
            self.views.list[self.views.current].destroy();
            self.views.order.splice((self.views.order.length-1),1);//it will be the last one....
            delete self.views.list[self.views.current];
            self.views.current='';
        }else if(self.views.current&&self.views.list[self.views.current].stop){
            if(self.views.list[self.views.current].stop) self.views.list[self.views.current].stop();
            else console.warn(self.views.current+' doesnt have a stop!');
        }
        if(replace) data.replace=true;
        if(!data.ele) data.ele=$('#homeappcontainer');
        data.subpage=true;//fair assumption for internal page
        var view=new modules[type](data);
        view.show();
        if(view.setStatView) view.setStatView();
        else console.warn('no stat view for view ['+type+']');
        self.ensureHeader(view);
        var id=data.id;
        modules.keyboard_global.keyboardHeight=0;//reset keyboard height before going to next view!
        self.views.order.push(id);
        self.views.list[id]=view;
        self.views.data[id]={
            opts:data,
            type:type
        }
        self.views.current=id;
        self.setHeader();
    }
}