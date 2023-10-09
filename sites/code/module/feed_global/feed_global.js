if(!window.modules) window.modules={};
modules.feed_global={
    videoAutoPlay:0,
    render:function(post,opts,size){
        if(!opts) opts={};
        if(!size) size={};
        //console.log(post,opts,size);
        if(post.media.type&&post.media.data){//could be id...
            var tpl='';
            //console.log(post,opts,size);
            switch(post.media.type){
                case 'drive':
                    tpl=modules.drive_preview.render($.extend(true,{},{feed:true,postid:post.id},post.media.data));
                break;
                case 'video':
                    tpl=modules.video_preview.render($.extend(true,{},{feed:true,postid:post.id},post.media.data,size,opts));
                break;
                case 'audio':
                    tpl=modules.audio_preview.render($.extend(true,{},{feed:true,postid:post.id},post.media.data,size,opts));
                break;
                case 'images':
                    if(opts.homepage){
                        tpl=$.fn.render({template:'module_feed_imagemedia_homepage',data:$.extend(true,{},post.media,opts),returntemplate:true});
                    }else{
                        tpl=$.fn.render({template:'module_feed_imagemedia',data:$.extend(true,{},post.media,opts,{data:size}),returntemplate:true});
                    }
                break;
                case 'link':
                    tpl=modules.links_global.render($.extend(true,{},{feed:true,postid:post.id},post.media.data,opts),size.container);
                break;
            }
            return tpl;
        }else{
            //clear
            return '';
        }
    },
    getSearchType:function(type){
        var resp='';
        switch(type){
            case 'people':
                resp='Person'
            break;
            case 'page':
                resp='Page'
            break;
            case 'event':
                resp='Event'
            break;
            case 'fundraiser':
                resp='Fundraiser'
            break;
            default:
                onerror('Bad getSearchType ['+type+']');
            break;
        }
        return resp;
    },
    clear:function(self){
        if(self.videos){
            $.each(self.videos,function(i,v){
                if(v.video) v.video.destroy();
                if(v.topWaypoint) v.topWaypoint.destroy();
                if(v.bottomWaypoint) v.bottomWaypoint.destroy();
            })
            delete self.videos;
        }
    },
    getPostType:function(post,rkey){
        if(post.media&&post.media.type){
            var type='';
            var key='';
            switch(post.media.type){
                case 'images':
                    type='Photos';
                    key='photos';
                break;
                case 'video':
                    type='Video';
                    key='video';
                break;
                case 'link':
                    type='Link';
                    key='link';
                break;
                case 'drive':
                    type='Drive File';
                    key='drive';
                break;
                default:
                    key='media';
                    type='Media';
                break
            }
            if(rkey) return key;
            return type;
        }else{
            if(rkey) return 'post';
            return 'Post';
        }
    },
    getPostPic:function(post){
        if(post.media&&post.media.type){
            var pic='';
            if(post.media.data){
                switch(post.media.type){
                    case 'images':
                        pic=post.media.data.list[post.media.data.order[0]].pic;
                    break;
                    case 'video':
                        pic=post.media.data.poster;
                    break;
                    case 'link':
                        pic=post.media.data.image;
                    break;
                    default:
                        pic=post.media.data.image;
                    break
                }
            }
            if(pic) return pic;
        }
        if(post.by&&post.by.data){
            return post.by.data.pic;
        }else if(post.page&&post.page.data){
            return post.page.data.pic;
        }
    },
    placeContextMenu:function(cele,opts){
        var self=this;
        var pos=cele.offset().top - opts.scroller.getScroller().children().first().offset().top;
        var soff=opts.scroller.getScroller().offset();
        var scrollertop=opts.scroller.getScroller().offset().top- opts.scroller.getScroller().children().first().offset().top;
        var eheight=self.tagcontext.outerHeight();
        var top=pos-eheight;//100: height of element
        //ensure that its visible relative to BODY!
        if(top<scrollertop){//place underneath
            if(opts.freetag){
                top=pos+cele.outerHeight();//100: height of element
            }else{
                top=pos+cele.parent().outerHeight();//100: height of element
            }
        }
        self.tagcontext.css('top',top);
    },
    renderContextMenu:function(id,opts,copts){
        self.ctag=id;
        var menu=[];
        var cele=copts.display.ele;
        var cstate=(app.user.profile.tags&&app.user.profile.tags.indexOf(id)>=0)?1:0;
        menu.push({
            id:'people',
            icon:'icon-user-outline',
            name:'People interested in this'
        })
        menu.push({
            id:'posts',
            icon:'icon-blog',
            name:'Posts about this'
        })
        menu.push({
            id:'events',
            icon:'icon-calendar',
            name:'Events that tagged this'
        })
        // menu.push({
        //     id:'fundraisers',
        //     icon:'icon-hands_heart',
        //     name:'Fundraisers that tagged this'
        // })
        menu.push({
            id:'pages',
            icon:'icon-pages',
            name:'Pages that tagged this'
        })
        menu.push({
            id:'follow',
            toggle:true,
            icon:'icon-rss',
            state:cstate,
            opts:{
                1:{
                    name:"Remove this tag from your interests",
                    icon:'icon-rss highlighttext2'
                },
                0:{
                    name:"Add this tag to your interests",
                    icon:'icon-rss'
                }
            },
            onClick:function(){
                var cstate=(app.user.profile.tags&&app.user.profile.tags.indexOf(id)>=0)?1:0;
                if(cstate){
                    cstate=0;
                    if(app.user.profile.id==opts.page_id){
                        //hide original tag!
                        cele.fadeOut(500,function(){
                            $(this).remove();
                            modules.feed_global.hideContextMenu();
                        })
                    }else if(opts.onFollowChange){
                        opts.onFollowChange(cele,id,cstate);
                    }
                    if(app.user.profile.tags){
                        var ind=app.user.profile.tags.indexOf(id);
                        if(ind>=0) app.user.profile.tags.splice(ind,1);
                    }
                }else{
                    cstate=1;
                    if(app.user.profile.id==opts.page_id){
                    }else if(opts.onFollowChange){
                        opts.onFollowChange(cele,id,cstate);
                    }
                    if(!app.user.profile.tags) app.user.profile.tags=[];
                    if(app.user.profile.tags.indexOf(id)==-1) app.user.profile.tags.push(id);
                }
                modules.feed_global.toggleFollow(id,cstate);
                return cstate;
            }
        })
        //console.log(copts)
        var alert=new modules.alertdelegate({
            id:id,
            group:(copts.group)?copts.group:'',
            display:copts.display,
            menu:menu,
            title:(modules.tools.isWebLayout())?'':'Explore <span class="bold">'+((opts&&opts.info&&opts.info.name)?opts.info.name:'#'+id)+'</span>',
            template:(modules.tools.isWebLayout())?'':'mobilealert_contextmenu',
            closer:true,
            render_template:(modules.tools.isWebLayout())?'':'mobilealert_contextmenu_item',
            onEndAnimationSelect:function(tid){
                var l={};
                if(!opts||!opts.info){
                    l[id]={
                        id:id,
                        name:'#'+id
                    }
                }else{
                    l[id]=opts.info;
                }
                var cstate=(app.user.profile.tags&&app.user.profile.tags.indexOf(id)>=0)?1:0;
                switch(tid){
                    case 'people':
                        var topts={
                            id:'people_'+id,
                            data:{
                                id:id,
                                name:'People',
                                filter:{
                                    tag_person:{
                                        order:[id],
                                        list:l
                                    }
                                },
                                showFilter:'tag_person'
                            }
                        }
                        if(opts&&opts.settingsOpts) topts=$.extend(true,{},topts,opts.settingsOpts);
                        modules.viewdelegate.register('people',topts);
                    break;
                    case 'posts':
                        var topts={
                            id:'posts_'+id,
                            data:{
                                name:'Posts',
                                filter:{
                                    tag_post:{
                                        order:[id],
                                        list:l
                                    }
                                },
                                noDistance:true,
                                showFilter:'tag_post'
                            }
                        }
                        if(opts&&opts.settingsOpts) topts=$.extend(true,{},topts,opts.settingsOpts);
                        modules.viewdelegate.register('stream_browse',topts)
                    break;
                    case 'events':
                        var topts={
                            id:'events_'+id,
                            data:{
                                id:id,
                                name:'Events',
                                filter:{
                                    tag_post:{
                                        order:[id],
                                        list:l
                                    }
                                },
                                showFilter:'tag_post'
                            }
                        }
                        if(opts&&opts.settingsOpts) topts=$.extend(true,{},topts,opts.settingsOpts);
                        modules.viewdelegate.register('event_subpage',topts)
                    break;
                    // case 'fundraisers':
                    //     var topts={
                    //         id:'fundraiser_'+id,
                    //         data:{
                    //             id:id,
                    //             name:'Fundraisers',
                    //             filter:{
                    //                 tag_post:{
                    //                     order:[id],
                    //                     list:l
                    //                 }
                    //             },
                    //             showFilter:'tag_post'
                    //         }
                    //     }
                    //     if(opts&&opts.settingsOpts) topts=$.extend(true,{},topts,opts.settingsOpts);
                    //     modules.viewdelegate.register('event_subpage',topts)
                    // break;
                    case 'pages':
                        var topts={
                            id:'pages_'+id,
                            data:{
                                id:id,
                                name:'Pages',
                                filter:{
                                    tag_post:{
                                        order:[id],
                                        list:l
                                    }
                                },
                                noDistance:true,
                                showFilter:'tag_post'
                            }
                        }
                        if(opts&&opts.settingsOpts) topts=$.extend(true,{},topts,opts.settingsOpts);
                        modules.viewdelegate.register('directory_subpage',topts)
                    break;
                    case 'follow':
                        if(cstate){
                            cstate=0;
                            // tele.find('.following').hide();
                            // tele.find('.notfollowing').show();
                            if(app.user.profile.id==opts.page_id){
                                //hide original tag!
                                cele.fadeOut(500,function(){
                                    $(this).remove();
                                    modules.feed_global.hideContextMenu();
                                })
                            }else if(opts.onFollowChange){
                                opts.onFollowChange(cele,id,cstate);
                            }
                            if(app.user.profile.tags){
                                var ind=app.user.profile.tags.indexOf(id);
                                if(ind>=0) app.user.profile.tags.splice(ind,1);
                            }
                        }else{
                            cstate=1;
                            // tele.find('.following').show();
                            // tele.find('.notfollowing').hide();
                            if(app.user.profile.id==opts.page_id){
                            }else if(opts.onFollowChange){
                                opts.onFollowChange(cele,id,cstate);
                            }
                            if(!app.user.profile.tags) app.user.profile.tags=[];
                            if(app.user.profile.tags.indexOf(id)==-1) app.user.profile.tags.push(id);
                        }
                        modules.feed_global.toggleFollow(id,cstate);
                    break;
                }
            }
        });
        alert.show();
    },
    showContextMenu:function(id,cele,opts){
        var type='mobilealert';
        var self=this;
        self.ctag=id;
        var menu=[];
        var cstate=(app.user.profile.tags&&app.user.profile.tags.indexOf(id)>=0)?1:0;
        console.log(opts)
        if(type=='mobilealert'){
            modules.feed_global.renderContextMenu(id,opts,{
                group:(opts.group)?opts.group:false,
                display:{
                    ele:cele,
                    container:opts.scroller.getScroller(),
                    locations:(opts.locations)?opts.locations:['topleft']
                }
            })
        }else{
        if(self.tagcontext) self.tagcontext.remove();
        opts.scroller.getScroller().render({
            template:'modules_feed_tagcontext',
            data:{
                tag:id,
                name:(opts.info&&opts.info.name)?opts.info.name:'',
                tooltip:(app.user.profile.flags&&app.user.profile.flags.context)?0:1
            },
            binding:function(ele){
                ele.find('.x_cleartooltip').stap(function(){
                    app.user.setFlag('context',1);
                    ele.find('.tooltiparea').fadeOut(300,function(){
                        self.placeContextMenu(cele,opts);
                    })
                },1,'tapactive');
                self.tagcontext=ele;
                self.placeContextMenu(cele,opts);
                ele.find('.contextselect').stap(function(){
                    var cstate=(app.user.profile.tags&&app.user.profile.tags.indexOf(id)>=0)?1:0;
                    var tele=$(this);
                    
                    if(tele.attr('data-id')=='posts'){
                        modules.viewdelegate.register('stream_browse',{
                            id:'stream_browse',
                            data:{
                                name:'Posts',
                                filter:{
                                    tag_post:{
                                        order:[id],
                                        list:l
                                    }
                                },
                                showFilter:'tag_post'
                            }
                        })
                        modules.feed_global.hideContextMenu();
                    }else if(tele.attr('data-id')=='people'){
                        modules.viewdelegate.register('people',{
                            id:'people',
                            data:{
                                id:id,
                                name:'People',
                                filter:{
                                    tag_person:{
                                        order:[id],
                                        list:l
                                    }
                                },
                                showFilter:'tag_person'
                            }
                        })
                        modules.feed_global.hideContextMenu();
                    }else if(tele.attr('data-id')=='event'){
                        modules.viewdelegate.register('event_subpage',{
                            id:'event_subpage',
                            data:{
                                id:id,
                                name:'Events',
                                filter:{
                                    tag_post:{
                                        order:[id],
                                        list:l
                                    }
                                },
                                showFilter:'tag_post'
                            }
                        })
                        modules.feed_global.hideContextMenu();
                    }else if(tele.attr('data-id')=='page'){
                        modules.viewdelegate.register('directory_subpage',{
                            id:'directory_subpage',
                            data:{
                                id:id,
                                name:'Directory',
                                filter:{
                                    tag_post:{
                                        order:[id],
                                        list:l
                                    }
                                },
                                showFilter:'tag_post'
                            }
                        })
                        modules.feed_global.hideContextMenu();
                    }else if(tele.attr('data-id')=='follow'){
                        if(cstate){
                            cstate=0;
                            tele.find('.following').hide();
                            tele.find('.notfollowing').show();
                            if(app.user.profile.id==opts.page_id){
                                //hide original tag!
                                cele.fadeOut(500,function(){
                                    $(this).remove();
                                    modules.feed_global.hideContextMenu();
                                })
                            }else if(opts.onFollowChange){
                                opts.onFollowChange(cele,id,cstate);
                            }
                            if(app.user.profile.tags){
                                var ind=app.user.profile.tags.indexOf(id);
                                if(ind>=0) app.user.profile.tags.splice(ind,1);
                            }
                        }else{
                            cstate=1;
                            tele.find('.following').show();
                            tele.find('.notfollowing').hide();
                            if(app.user.profile.id==opts.page_id){
                            }else if(opts.onFollowChange){
                                opts.onFollowChange(cele,id,cstate);
                            }
                            if(!app.user.profile.tags) app.user.profile.tags=[];
                            if(app.user.profile.tags.indexOf(id)==-1) app.user.profile.tags.push(id);
                        }
                        modules.feed_global.toggleFollow(id,cstate);
                    }else{
                        modules.feed_global.hideContextMenu();
                        app.comingSoon();
                        return false;
                    }
                },1,'tapactive')
                TweenLite.set(self.tagcontext,{y:50,opacity:0});
                TweenLite.to(self.tagcontext, .1, {y:0,opacity:1,onComplete:function(){
                }});
            }
        })
        }
    },
    toggleFollow:function(id,cstate){
        app.api({
            url:app.sapiurl+'/user/updatetag',
            data:{
                id:id,
                value:(cstate)?1:0
            },
            timeout:5000,
            retry:4,
            callback:function(resp){
                
            }
        });
    },
    hideContextMenu:function(){
        return false;//now handled by mobilealert
        var self=this;
        if(self.tagcontext){
            TweenLite.to(self.tagcontext, .1, {scale:.5,opacity:0,onComplete:function(){
                self.tagcontext.remove();
            }});
        }
    },
    voteOnTag:function(post_id,tag_id,val,opts){
        //set state!
        var self=this;
        var current=opts.getPost(post_id);
        if(!current.user_votes) current.user_votes=[];
        if(val){
            opts.scroller.getScroller().find('.'+post_id+'_tags').find('[data-id='+tag_id+']').addClass('upvoted');
            current.user_votes.push(tag_id);
        }else{
            opts.scroller.getScroller().find('.'+post_id+'_tags').find('[data-id='+tag_id+']').removeClass('upvoted');
            current.user_votes.splice(current.user_votes.indexOf(tag_id),1);
        }
        opts.setPost(post_id,current);
        app.api({
            url:app.sapiurl+'/module/feed/vote',
            data:{
               post_id:post_id,
               tag_id:tag_id,
               val:val,
               context:(opts.context)?opts.context:''
            },
            timeout:5000,
            callback:function(resp){//fire and forget...
                //update stats!
                current.vote_stats=resp.data;
                opts.setPost(post_id,current);
                //re-render stats!
                self.updateTags(current,opts);
            }
        });
    },
    renderSelectedTags:function(ele){
        var self=this;
        ele.render({
            template:'module_feed_selectedtags',
            append:false,
            data:{
                postTags:self.editpost.tags,
                taginfo:self.editpost.tag_info,
                toTag:self.totag,
                isEditor:(app.user.profile.admin||self.editpost.by==app.user.profile.id)?1:0,
                isAdmin:(app.user.profile.admin&&self.editpost.by!=app.user.profile.id)?1:0
            },
            binding:function(tele){
                tele.find('.x_remove').stap(function(){
                    var id=$(this).attr('data-id');
                    var type=$(this).attr('data-type');
                    $(this).parent().fadeOut(500,function(){
                        $(this).remove();
                        if(type=='current'&&!self.editpost.tags.length){
                            ele.find('.currenttags').hide();
                        }
                        if(type=='editing'&&!self.totag.length){
                            ele.find('.newtags').hide();
                        }
                        if(!self.totag.length&&!self.editpost.tags.length){
                            ele.find('.notags').show();
                        }
                    })
                    if(type=='current'){
                        var cid=self.editpost.tags.indexOf(id);
                        if(cid!=-1){
                            self.editpost.tags.splice(cid,1);
                        }
                    }
                    if(type=='editing'){
                        var cid=self.totag.indexOf(id);
                        if(cid!=-1){
                            self.totag.splice(cid,1);
                        }
                    };
                    self.setTagHash();
                },1,'tapactive');
            }
        })
    },
    updateTags:function(current,opts){
        var self=this;
        if(opts.onTagUpdate) opts.onTagUpdate(current);
        modules.tagvote.render({
            ele:opts.scroller.getScroller().find('.'+current.id+'_tags'),
            id:current.id,
            data:{
                canAdd:true,
                eid:current.id,
                hashtag:true,
                tags:current.tags,
                tag_info:current.tag_info,
                selected:(current.user_votes)?current.user_votes:[],
                stats:(current.vote_stats)?current.vote_stats:{}
            },
            binding:function(ele){
                self.bindTags(ele,opts);
            }
        })
    },
    setTagHash:function(toreturn){
        var self=this;
         var tags=[];
         $.each(self.editpost.tags,function(i,v){
            tags.push(v);
         })
         $.each(self.totag,function(i,v){
            tags.push(v);
         })
         tags.sort();
        self.taghash=tags.join(',');
        if(!toreturn){
            if(self.taghash!=self.startHash){
                self.tagele.find('.x_add').removeClass('notavailable')
            }else{
                self.tagele.find('.x_add').addClass('notavailable')
            }
         }
         return self.taghash;
    },
    showEmojiStats:function(post){
        //mobile alert
        if(!app.onlyMembers()) return false;
        var self=this;
        var ems=new modules.emojistats({title:'',endpoint:app.sapiurl+'/module/feed/poststats',post:post,onProfileSelect:function(user){
            app.showProfile(user)
            // modules.viewdelegate.register('profile',{
            //     id:user.id,
            //     data:user
            // });
        }});
        ems.show();
    },
    showVoteStats:function(post){
        //mobile alert
        var self=this;
        var ems=new modules.votestats({title:'Votes',post:post,onProfileSelect:function(user){
            app.showProfile(user)
            // modules.viewdelegate.register('profile',{
            //     id:user.id,
            //     data:user
            // });
        }});
        ems.show();
    },
    bindTags:function(ele,opts){
        var self=this;
        ele.find('.addtag').stap(function(){
            if(!app.onlyMembers()) return false;
            self.editpost=self.getPostItem($(this),opts);
            self.totag=[];//clear out
            if(!self.editpost.tags) self.editpost.tags=[];//ensure array exists
            self.startHash=self.setTagHash(1);
            $('#wrapper').page({
                template:'module_feed_tag',
                uid:'feedtag',
                beforeClose:function(ele,cb){//eliminate all animation/timing/etc
                    self.searchbar.destroy();
                    setTimeout(function(){
                        cb();
                    },50)
                },
                overlay:true,
                onClose:function(){
                    self.tagele=false;
                },
                pageType:'static',
                data:{},
                onShow:function(ele){
                    self.tagele=ele;
                    ele.find('input').focus();
                    ele.find('.x_add').stap(function(){
                        if(self.saving) return false;
                        if(self.totag.length){
                            $.each(self.totag,function(i,v){
                                self.editpost.tags.push(v);
                            })
                        }
                        //save it!
                        ele.find('.x_add').html('<i class="icon-refresh animate-spin"></i>');
                        self.saving=true;
                        app.api({
                            url:app.sapiurl+'/module/feed/edittags',
                            data:{
                               tags:self.editpost.tags,
                               post_id:self.editpost.id,
                               context:(opts.context)?opts.context:''
                            },
                            timeout:5000,
                            callback:function(resp){
                                self.saving=false;
                                if(resp.success){
                                    ele.find('.x_add').html('<i class="icon-thumbs-up"></i>');//reset...
                                    var tcurrent=opts.getPost(self.editpost.id);
                                    tcurrent.tags=resp.tags;
                                    tcurrent.tag_info=self.editpost.tag_info;
                                    tcurrent.vote_stats=resp.vote_stats;
                                    tcurrent.user_votes=resp.user_votes;
                                    opts.setPost(self.editpost.id,tcurrent);
                                    self.updateTags(tcurrent,opts);
                                    $.fn.page.close();
                                }else{
                                    ele.find('.x_add').html('Set');//reset...
                                    modules.toast({
                                        content:'Error Saving, please try again.',
                                        remove:2500,
                                        icon:'icon-warning-sign'
                                    });
                                }
                            }
                        });
                    },1,'tapactive');
                    ele.find('.x_close').stap(function(){
                        $.fn.page.close();
                    },1,'tapactive');
                    self.renderSelectedTags(ele.find('.contentscroller'));
                    //bind search
                    new modules.scroller(ele.find('.contentscroller'),{
                        forceNative:1,
                        //hasCursor:1
                    })
                    self.searchbar=new modules.search({
                        input:ele.find('input'),
                        allowAdd:true,
                        multiple:true,
                        exclude:$.extend(true,[],self.editpost.tags),
                        endpoint:app.sapiurl+'/search/tags',
                        searchEle:ele.find('.searchele'),
                        cancelEle:ele.find('.x_clear'),
                        renderTemplate:'modules_search_tag',
                        onSelect:function(id,item){//might want or need full item.
                            self.totag.push(id);
                            if(!self.editpost.tag_info) self.editpost.tag_info={};
                            self.editpost.tag_info[id]=item;
                            self.renderSelectedTags(ele.find('.contentscroller'));
                            self.setTagHash();
                        }
                    });
                }
            });
        },1,'tapactive');
        ele.find('.tagitem').stap(function(){
            var post=self.getPostItem($(this),opts);
            var id=$(this).attr('data-id');
            if(id) self.voteOnTag(post.id,id,($(this).hasClass('upvoted'))?0:1,opts);
        },1,'tapactive',function(){
            var id=$(this).attr('data-id');
            //show context
            self.showContextMenu(id,$(this),opts);
        });
        // if(!isPhoneGap()&&!isMobile){
        //     ele.find('.tagitem').on('mouseover',function(){
        //         var p=$(this);
        //         var id=$(this).attr('data-id')
        //         $(this).data('to',setTimeout(function(){
        //             self.showContextMenu(id,p,opts);
        //         },500))
        //     }).on('mouseout',function(){
        //         if($(this).data('to')) clearTimeout($(this).data('to'));
        //     })
        // }
    },
    bindStats:function(ele,opts){
        var self=this;
        ele.find('.emojistats').stap(function(){
            var post=self.getPostItem($(this),opts);
            self.showEmojiStats(post);
        },1,'tapactive');
        ele.find('.votestats').stap(function(e){
            var post=self.getPostItem($(this),opts);
            self.showVoteStats(post);
            phi.stop(e);
        },1,'tapactive')
        ele.find('.showcomments').stap(function(){
            self.showPost(self.getPostItem($(this),opts),false,opts);
        },1,'tapactive')
    },
    updateStats:function(current,opts){
        var self=this;
        opts.scroller.getScroller().find('.'+current.id+'_stats').render({
            template:'module_feed_stats',
            append:false,
            data:{
                data:current
            }
        });
        self.bindStats(opts.scroller.getScroller().find('.'+current.id+'_stats'),opts);
        if(opts.onStatsUpdate){//from post.js
            opts.onStatsUpdate(current);
        }
    },
    showPost:function(data,focus,opts){
        var self=this;
        modules.viewdelegate.register('post',{
            id:data.id,
            data:data,
            noActionBar:opts.noActionBar,
            noPageLink:true,//never show a page link if coming from a feed
            focusOnLoad:(focus)?1:0,
            onStatsUpdate:function(data){
                opts.setPost(data.id,data);
                self.updateStats(data,opts);
                if(data.bookmark){
                    opts.scroller.getScroller().find('[data-bookmark='+data.id+']').addClass('bookmarked');
                }else{
                    opts.scroller.getScroller().find('[data-bookmark='+data.id+']').removeClass('bookmarked');
                }
                //self.bindStats(self.pele.find('.'+data.id+'_stats'));
            },
            onBeforeReturn:function(){
                //self.infinitescroller.ensure()
            },
            onReturn:function(){
                //self.infinitescroller.ensure()
            },
            onDelete:function(post){
                console.log('DELTE PIST',post);
                if(opts.infinitescroller) opts.infinitescroller.remove(post);
            },
            onTagUpdate:function(post){
                opts.setPost(post.id,post);
                self.updateTags(post,opts);
            },
            onReactionUpdate:function(post,newval){
                var fb=opts.scroller.getScroller().find('[data-id='+post.id+']').find('.nectar_reactions');
                fb.attr('data-emoji-class',newval);
                if(!newval) newval=modules.feed_global.reactions.default;
                fb.find('span').html(modules.feed_global.reactions.list[newval].name);
            }
        })
    },
    isAdmin:function(post){
        var pages=[];
        pages.push(app.user.profile.id);
        if(app.user.profile.pages){
            $.each(app.user.profile.pages.list,function(i,v){
                pages.push(v.id);
            })
        }
        if(post.by&&post.by.id&&pages.indexOf(post.by.id)>=0) return 1;
        return 0;
    },
    showMore:function(post,opts,ele){
        var self=this;
        var menu=[]
        if(self.isAdmin(post)){
            if(post.fbid){
                menu.push({
                    id:'refreshfb',
                    name:'Refresh FB Post',
                    icon:'icon-facebook-squared'
                }) 
            }
            menu.push({
                id:'delete',
                name:'Delete this post',
                icon:'icon-trash-empty'
            })
            menu.push({
                id:'edit',
                name:'Edit this post',
                icon:'icon-cog'
            })
        }else{
            menu.push({
                id:'report',
                name:'Report this post',
                icon:'icon-warning-sign'
            })
            if(app.user.profile.id!=post.by.id){
                menu.push({
                    id:'block',
                    name:'Block this user',
                    icon:'icon-ban'
                })
            }
            if(app.user.profile.admin){
                if(post.fbid){
                    menu.push({
                        id:'refreshfb',
                        name:'Refresh FB Post',
                        icon:'icon-facebook-squared'
                    }) 
                }
                menu.push({
                    id:'delete',
                    name:'Delete this post <span style="font-size:11px">(Admins only)</span>',
                    icon:'icon-trash-empty'
                })
            }
        }
        if(app.user.profile.admin&&!post.broadcasted){
            menu.push({
                id:'broadcast',
                name:'Broadcast <span style="font-size:11px">(Admins only)</span>',
                icon:'icon-megaphone'
            })
        }
        var alert=new modules.alertdelegate({
            menu:menu,
            display:{
                ele:ele,
                container:opts.scroller.getScroller()
            },
            onSelect:function(id){
                //console.log(id)
            },
            onEndAnimationSelect:function(id){
                if(id=='delete'){
                    var alert2=new modules.alertdelegate({
                        display:{
                            alert:{
                                content:'This will delete your post, are you sure you would like to do this?'
                            }
                        },
                        menu:[{
                            id:'yes',
                            name:'Yes, Delete Post',
                            icon:'icon-trash-empty'
                        },{
                            id:'no',
                            name:'No, Keep Post',
                            icon:'icon-down-open'
                        }],
                        onSelect:function(id){
                            if(id=='no'){
                                alert2.hide();
                            }else{
                                self.deletePost(post.id,opts);
                            }
                        }
                    });
                    alert2.show();
                }
                if(id=='edit'){
                    self.adder=new modules.add({
                        type:'post',
                        data:{
                            features:opts.options.features,
                            featureData:opts.options.featureData,
                            page:post.page,
                            reloadOnAdd:(opts.reloadOnAdd)?1:0,
                            headerText:opts.options.headerText,
                            context:opts.options.data.context,
                            onSuccess:function(post){
                                if(opts.options.onUpdate){
                                    opts.options.onUpdate(post);
                                }else{
                                    self.addPost(post,opts);//will re-render (feed)
                                }
                            },
                            current:post
                        }
                    });
                    self.adder.show();
                }
                if(id=='broadcast'){
                    self.broadcast(post,opts);
                }
                if(id=='refreshfb'){
                    self.refreshFB(post,opts);
                }
                if(id=='report'){
                    var report=new modules.report({
                        type:'post',
                        id:post.id,
                        data:post
                    })
                    report.show();
                }
                if(id=='block'){
                    var block=new modules.block({
                        type:'user',
                        id:post.by.id,
                        data:post.by.data,
                        onSuccess:function(){
                            self.removePostsBy(opts,post.by.id);
                        }
                    })
                    block.show();
                }
            }
        });
        alert.show();
    },
    removePostsBy:function(opts,uid){
        opts.scroller.getScroller().find('[data-by='+uid+']').fadeOut(500,function(){
            $(this).remove();
        })
    },
    refreshFB:function(post,opts){
        app.api({
            url:app.sapiurl+'/module/feed/refreshfb',
            data:{
               id:post.id,
            },
            timeout:5000,
            retry:5,
            callback:function(resp){
                if(resp.success){
                    modules.toast({
                        content:'Processing!',
                        remove:2500,
                        icon:'icon-thumbs-up'
                    });
                }else{
                    modules.toast({
                        content:'Error: '+resp.error,
                        remove:2500,
                        icon:'icon-warning-sign'
                    });
                }
            }
        });
    },
    deletePost:function(id,opts){
        app.api({
            url:app.sapiurl+'/module/feed/deletepost',
            data:{
               id:id,
               context:(opts.context)?opts.context:''
            },
            timeout:5000,
            retry:5,
            callback:function(resp){
                if(resp.success){
                    modules.toast({
                        content:'Successfully removed post!'
                    })
                    if(opts.onDelete) opts.onDelete();
                }else{
                    modules.toast({
                        content:'Error deleting post: '+resp.error
                    })
                }
            }
        });
        opts.scroller.getScroller().find('[data-id='+id+']').fadeOut(500,function(){
            $(this).remove();
        })
    },
    broadcast:function(post,opts){
        var self=this;
        $('body').alert({
            template:'push_broadcast',
            buttons:[{
                btext:'<i class="icon-megaphone"></i> Broadcast Post!',
                bclass:'x_send'
            }],
            binding:function(ele){
                ele.find('.alertbuttons').hide();
                self.getUserCount(function(resp){
                    ele.find('.content').render({
                        template:'push_broadcast_message',
                        data:resp,
                        append:false
                    })
                    ele.find('.alertbuttons').show();
                });
                ele.find('.x_send').stap(function(){
                    ele.find('.x_send').find('i').removeClass('icon-megaphone').addClass('icon-refresh animate-spin');
                    self.sendBroadcast(post,ele,opts);
                },1,'tapactive')
            }
        })
    },
    sendBroadcast:function(post,ele,opts){
        if(self.sending) return false;
        self.sending=true;
        app.api({
            url:app.sapiurl+'/module/feed/broadcast',
            data:{
                post_id:post.id,
                context:(opts.context)?opts.context:''
            },
            timeout:5000,
            callback:function(resp){
                self.sending=false;
                if(resp.success){
                    if(ele){
                        ele.find('.content').render({
                            template:'push_broadcast_message_success',
                            data:{},
                            append:false
                        });
                        ele.find('.alertbuttons').hide();
                        setTimeout(function(){
                            $.fn.alert.closeAlert();
                        },1500);
                    }
                }else{
                    ele.find('.x_send').find('i').addClass('icon-megaphone').removeClass('icon-refresh animate-spin');
                    _alert('error: '+resp.error);
                }
            }
        });
    },
    getUserCount:function(cb){
        app.api({
            url:app.sapiurl+'/usercount',
            data:{
            },
            timeout:5000,
            callback:function(resp){
                if(resp.success){
                    cb(resp);
                }else{
                    _alert('error');
                }
                console.log(resp);
            }
        });
    },
    addPost:function(data,opts){
        if(opts.onUpdate) opts.onUpdate(data);
        if(!opts.infinitescroller) return false;
        opts.infinitescroller.add(data);
    },
    getPostItem:function(ele,opts){
        var self=this;
        var p=ele.parents('.postitem').first();
        var id=p.attr('data-id');
        var post=opts.getPost(id);
        return post;
    },
    setReaction:function(data,opts){
        var self=this;
        app.api({
            url:app.sapiurl+'/module/feed/reaction',
            data:{data:data,context:(opts.context)?opts.context:''},
            timeout:5000,
            callback:function(resp){
                //fire and forget
                //console.log(resp)
                var current=opts.getPost(data.id);
                current.stats=resp.stats;
                if(data.v){
                    current.myreaction={
                        v:data.v,
                        post:data.id,
                        uid:app.user.profile.id
                    }
                }else{
                    if(current.myreaction) delete current.myreaction;
                }
                opts.setPost(data.id,current);
                self.updateStats(current,opts);
                if(opts.onReactionUpdate){//from post.js
                    opts.onReactionUpdate(current,data.v);
                }
            }
        });
    },
    showAuthor:function(p){
        var user=p.data;
        if(p.type=='unknown'){
            switch(user.id[0]){
                case 'U':
                    p.type='user';
                break;
                case 'G':
                    p.type='page';
                break;
            }
        }
        if(p.type=='user'){
            // modules.viewdelegate.register('profile',{
            //     id:user.id,
            //     data:user
            // });
            app.showProfile(user);
        }else if(p.type=='page'){
            modules.viewdelegate.register('page',{
                id:user.id,
                data:user
            });
        }else{
            if(app.isdev) _alert('invalid type!')
            onerror('invalid showAuthor in feed_global');
        }
    },
    bindLinks:function(ele,opts){
        var self=this;
        ele.find('.post_pagelink').stap(function(){
            var post=self.getPostItem($(this),opts);
            var page=post.page;
            switch(page.type){
                case 'fundraiser':
                    modules.viewdelegate.register('fundraiser',{
                        id:page.data.id,
                        data:page.data
                    })
                break;
                case 'event':
                    modules.viewdelegate.register('event',{
                        id:page.data.id,
                        data:page.data
                    })
                break;
                case 'user':
                    // modules.viewdelegate.register('profile',{
                    //     id:page.data.id,
                    //     data:page.data
                    // })
                    app.showProfile(page.data);
                break;
                case 'page':
                    modules.viewdelegate.register('page',{
                        id:page.data.id,
                        data:page.data
                    })
                break;
            }
        },1,'tapactive')
        ele.find('.post_newslink').stap(function(){
            app.comingSoon();
        },1,'tapactive')
        ele.find('.x_viewprofile').stap(function(){
            self.showAuthor(self.getPostItem($(this),opts).by);
        },1,'tapactive');
        ele.find('.post_userlink').stap(function(){
            var post=self.getPostItem($(this),opts)
            var uid=$(this).attr('data-id');
            if(uid.indexOf(':')>=0){
                app.comingSoon();
            }else if(uid!='others'){
                self.showAuthor({type:'unknown',data:{id:uid}});
            }else if(uid=='others'){
                var menu=[];
                $.each(post.with,function(i,v){
                    var info=post.with_info[v];
                    if(info){
                        menu.push({
                            id:info.id,
                            name:info.name,
                            pic:info.pic
                        })
                    }
                })
                var alert=new modules.mobilealert({
                    menu:menu,
                    display:{
                        ele:$(this),
                        container:opts.scroller.getScroller(),
                        locations:['topleft','topright']
                    },
                    render_template:'modules_mobilealert_peoplelist',
                    onEndAnimationSelect:function(id){
                        // modules.viewdelegate.register('profile',{
                        //     id:id,
                        //     data:{id:id}
                        // });
                        app.showProfile({id:id})
                    }
                });
                alert.show();
            }else{
                _alert('bad pathing!')
            }
        },1,'tapactive');
        ele.find('.post_highlight_feed').stap(function(){
            var uid=$(this).attr('data-id');
            app.showProfile({
                id:uid
            })
            // modules.viewdelegate.register('profile',{
            //     id:uid,
            //     data:{id:uid}
            // });
        },1,'tapactive');
        ele.find('.hash_tag_feed').stap(function(){
            var id=$(this).attr('data-id');
            id=id.replace('#','');
            //show context
            self.showContextMenu(id,$(this),opts);
        },1,'tapactive');
        ele.find('.linknav').stap(function(e){
            _.openLink({
                intent:app.wrapExternalLink($(this).attr('data-intent')),
                type:'external'
            })
        },1,'tapactive')
        ele.find('.feedlink').stap(function(){
            var post=self.getPostItem($(this),opts)
            var url=post.media.data.url;
            _.openLink({
                intent:app.wrapExternalLink(url),
                type:'external'
            })
        },1,'tapactive')
    },
    setSupportStatus:function(status,opts){
        var self=this;
        var post=opts.getPost();
        post.status=status;
        opts.setPost(post.id,post);
        self.updateStats(post,opts);
        app.api({
            url:app.sapiurl+'/module/support/setstatus',
            data:{
               post_id:post.id,
               status:status
            },
            timeout:5000,
            retry:5,
            callback:function(resp){
                console.log(resp)
            }
        });
    },
    ensureTagHeight2:function(opts){
        //set proper padding on tag input
        var p1=opts.scroller.getScroller().find('.tagrender_bottom_2').find('.tagcursor2').position();
        var p3={top:(p1.top),left:(p1.left+45)};
        opts.scroller.getScroller().find('.taginput2').css({paddingLeft:p3.left,paddingTop:p3.top});
        //set height
        var h=opts.scroller.getScroller().find('.tagrender_bottom_2').find('.tagaddbox2').outerHeight()+10;
        opts.scroller.getScroller().find('.tagbox2').css({height:h});
        //put closer to right height!
        opts.scroller.getScroller().find('.tagcancel2').css('top',h-35);
    },
    renderWithSelectedTags:function(opts){
        var self=this;
        var post=opts.getPost();
        opts.scroller.getScroller().find('.tagrender_top_2').render({
            template:'module_support_withadd',
            data:{
                top:true,
                tags:post.with,
                tag_info:post.with_info
            },
            append:false,
            binding:function(ele){
                ele.find('.x_remove').stap(function(){
                    var id=$(this).attr('data-id');
                    self.searchbar2.remove(id);
                    var current=opts.getPost();
                    current.with.splice(current.with.indexOf(id),1);
                    opts.setPost(current.id,current);
                    $(this).parent().fadeOut(500,function(){
                        opts.scroller.getScroller().find('[data-tag='+id+']').remove();
                        self.ensureTagHeight2(opts); 
                    })
                },1,'tapactive')
            }
        })
        opts.scroller.getScroller().find('.tagrender_bottom_2').render({
            template:'module_support_withadd',
            data:{
                top:false,
                tags:post.with,
                tag_info:post.with_info
            },
            append:false
        })
        self.ensureTagHeight2(opts);
    },
    keyboards:{},
    identityselectors:{},
    clearGroup:function(group){
        var self=this;
        if(group&&self.keyboards[group]&&self.keyboards[group]){
            $.each(self.keyboards[group],function(i,v){
                v.destroy();
            })
            console.log('Removed Keyboard Group ['+group+']')
            delete self.keyboards[group];
        }
    },
    bindPosts:function(ele,opts){
        var self=this;
        if(modules.tools.isWebLayout()) ele.find('.keyboardarea').each(function(i,v){
            var tele=$(this);
            var id=tele.attr('data-id');
            if(tele.data('bound')||!id) return true;
            tele.data('bound',true);
            var p=tele.parents('.postchatting').first();
            // tele.find('.x_identity').stap(function(){
            //     self.identityselectors[id]=new modules.alertdelegate({
            //         display:{
            //             ele:$(this)
            //         },
            //         menu:app.home.getIdentities(),
            //         onSelect:function(id){
            //             console.log(id)
            //         }
            //     })
            //     self.identityselectors[id].show();
            // },1,'tapactive')
            var kb=new modules.keyboard({
                ele:tele,
                renderEle:p.find('.comments'),
                scroller:opts.scroller,
                room:id,
                backgroundClass:'',
                enableIdentity:1,
                disableSockets:true,
                placeholder:'Enter comment...',
                renderTemplate:'module_post_item',
                readReceipts:false,
                keyboardOptions:{
                    //adjustOnKeyboardShow:true,
                    mode:'web_inline',
                    overlayWebEmoji:true,
                    overlayWebEmojiPlacement:'bottom',
                    disableNewMessageScroll:true,
                    noBorder:true,
                    inline:true,
                    tag:{},//just needs to exist, other settings can go here too
                    module:(opts.module)?opts.module:'feed'
                },
                onStatsUpdate:function(data){
                    //self.onStatsUpdate(data);
                },
                onMessage:function(msg){
                    //self.onMessage(msg);
                },
                // parseMessage:function(msg){
                //     //return self.parseMessage(msg);
                // },
                messageRenderBinding:function(ele){
                   // self.bindChatItems(ele);
                },
                // onRenderAreaHeightChange:function(){
                //     console.log('herere')
                //     console.log(p.find('.comments').height())
                //     var h=tele.find('.keyboardcontainer').height()+3+p.find('.comments').height();
                //     p.height(h);
                // },
                onHeightUpdate:function(){
                    //set height
                    var h=tele.find('.keyboardcontainer').height()+3;
                    p.find('.actionparent').height(h);
                    // if(!self.post.stats) self.post.stats={comments:0};
                    // self.post.stats.comments++;
                    // //re-render
                    // modules.feed_global.updateStats(self.post,self.getPostOpts())
                },
                scrollStart:function(){
                    //modules.feed_global.hideContextMenu();
                },
                //swipeContainer:$('#subpagewrapper')
            });
            if(!opts.group){
                opts.group=Math.uuid(12);
                console.log('create group '+opts.group);
            }
            if(!self.keyboards[opts.group]) self.keyboards[opts.group]=[];
            self.keyboards[opts.group].push(kb);
        })
        ele.find('.x_showfb').stap(function(){
            var alert=new modules.alertdelegate({
                display:{
                    alert:{
                        template:'feed_facebook_info'
                    }
                },
                closer:true,
                contentTemplate:'feed_facebook_info',
                data:{
                    mobilealert:true
                },
                title:'Facebook Linking',
                binding:function(ele){
                    ele.find('.x_learn').stap(function(){
                        alert.hide();
                        var onb=new modules.onboard({
                            ele:$('body'),
                            nocache:true,
                            canClose:true,
                            noLoad:true,
                            noAgreement:true,
                            animateShow:true,
                            noLogin:true,
                            //noSave:true,
                            pages:['link_fb'],
                            type:'simple',
                            onComplete:function(){
                            }
                        })
                        onb.show();
                    },1,'tapactive')
                },
                onSelect:function(id){
                    //console.log(id)
                }
            })
            alert.show();
        },1,'tapactive');
        modules.chat_global.bindItems(ele,{
            infinitescroll:opts.infinitescroller,
            getPost:opts.getPost
        },1);
        ele.find('.x_chatreply').stap(function(){
            var cpost=opts.getPost();
            var ch=new modules.chat_attachment({
                attachment:{
                    type:'post',
                    context:'post_response',
                    id:cpost.id,
                    data:cpost
                },
                to:cpost.by.data
            })
            ch.show();
        },1,'tapactive')
        ele.find('.x_view_qotd').stap(function(){
            var post=self.getPostItem($(this),opts)
            //cant assume in stream!
            modules.viewdelegate.register('stream_browse',{id:post.qotd_info.tag.id,data:$.extend(true,{},post.qotd_info.tag,{noDistance:true})});
            //app.home.pages.streams.showSubPage(post.qotd_info.tag);
        },1,'tapactive');
        ele.find('.x_respond_qotd').stap(function(){
            var post=self.getPostItem($(this),opts)
            modules.qotd_global.add({
                qotd_id:post.qotd_info.id,
                tag:post.qotd_info.tag.id,
                data:post.qotd_info,
                onSuccess:function(){}
            });
        },1,'tapactive');
        self.bindStats(ele,opts);
        self.bindTags(ele,opts);
        self.bindLinks(ele,opts);
        var cpost=opts.getPost();
        if((cpost&&(cpost.id[0]=='F'||cpost.id[0]=='S'))&&app.user.profile.admin){
            window._ui.register('supportstatus',{
                onSelect:function(cur,ele){
                    self.setSupportStatus(cur,opts);
                }
            })
            if(self.serachbar2) self.searchbar2.destroy();//only ever have 1 instance!
            var post=opts.getPost();//only happens from post.jss
            self.searchbar2=new modules.search({
                input:ele.find('.taginput2'),
                allowAdd:false,
                renderTemplate:'modules_search_user',
                exclude:$.extend(true,[],post.with),
                dontShow:[],
                endpoint:app.sapiurl+'/search/users',
                endpointData:{
                    admin:1
                },
                searchEle:ele.find('.searchele2'),
                cancelEle:ele.find('.tagcancel2'),
                onKeyUp:function(val){
                    if(val==''){
                        ele.find('.tagcursor2').show();
                    }else{
                        ele.find('.tagcursor2').hide();
                    }
                },
                onRemove:function(id){
                    self.removeSupportPerson(id,opts)
                },
                onSelect:function(id,item){//might want or need full item.
                    post.with.push(id);
                    if(!post.with_info) post.with_info={};
                    post.with_info[id]=item;
                    self.renderWithSelectedTags(opts);
                    self.addSupportPerson(id,opts)
                }
            });
            self.renderWithSelectedTags(opts);
        }
        ele.find('.x_more').stap(function(e){
            var post=self.getPostItem($(this),opts)
            self.showMore(post,opts,$(this));
            phi.stop(e)
        },1,'tapactive');
        if(!isMobile&&!isPhoneGap()){
            modules.tools.onHover(ele.find('.x_more'),function(te){
                var post=self.getPostItem(te,opts)
                self.showMore(post,opts,te);
            })
        }
        //add waypoints for video!
        ele.find('.videoitem').each(function(){
            var t=$(this);
            var autoplay=modules.feed_global.videoAutoPlay;
            //modules.video_preview.bind(t.find('video'))
            //var v=videojs(t.find('.video-js')[0],{muted:true});
            var id=t.attr('data-id');
            if(!opts.self.videos) opts.self.videos={};
            //add waypoints!
            opts.self.videos[id]={
                topEle:t.find('.videotop'),
                bottomEle:t.find('.videobottom'),
                video:new modules.video_player({
                    ele:t.find('.videoplayer'),
                    embed:(t.attr('data-embed'))?1:0,
                    youtube_id:(t.attr('data-youtube-id'))?t.attr('data-youtube-id'):0,
                })
            }
            if(autoplay){
                opts.self.videos[id].topWaypoint=new Waypoint({
                    element:opts.self.videos[id].topEle[0],
                    context: opts.scroller.getScroller()[0],
                    offset: '150%',
                    enabled: true, 
                    handler: function(dir) {
                        if(dir=='down'){//this will trigger a down on initalization
                            console.log('VIDEO:came into view, start playing video')
                            if(opts.self.videos&&opts.self.videos[id]) opts.self.videos[id].video.autoplay();
                        }
                    }
                });
                opts.self.videos[id].bottomWaypoint=new Waypoint({
                    element:opts.self.videos[id].bottomEle[0],
                    context: opts.scroller.getScroller()[0],
                    offset: '-50%',
                    enabled: true, 
                    handler: function(dir) {
                        if(dir=='up'){//this will trigger a down on initalization
                            console.log('VIDEO:came into view, start loading video')
                            if(opts.self.videos&&opts.self.videos[id]) opts.self.videos[id].video.autoplay();
                        }
                        if(dir=='down'){
                            console.log('VIDEO:left view, pause video')
                            //v.muted(true);
                            if(opts.self.videos&&opts.self.videos[id]) opts.self.videos[id].video.pause();
                        }
                    }
                });
                //now if within view, trigger load of video
                if(self.withinView(opts.self.videos[id],opts)){
                    console.log('VIDEO:in view: auto start video')
                    if(opts.self.videos&&opts.self.videos[id]) opts.self.videos[id].video.autoplay();
                };
            }
        })
        if(!opts.noCommentClick){
            ele.find('.x_viewpost').stap(function(){
                self.showPost(self.getPostItem($(this),opts),1,opts);
            },1,'tapactive');
        }
        $.each(ele.find('.nectar_reactions'),function(i,v){
            new modules.nectarfeedback({
                ele:$(this),
                scroller:opts.scroller.getScroller(),
                onMobileMenuShow:function(){
                    if(opts.infinitescroller) opts.infinitescroller.disable();
                },
                onMobileMenuHide:function(){
                    if(opts.infinitescroller) opts.infinitescroller.enable();
                },
                onChange:function(id,value){
                    if(!app.onlyMembers()) return false;
                    self.setReaction({
                        id:id,
                        v:value
                    },opts)
                }
            })
        })
        ele.find('.x_menu').stap(function(e){
            var post=self.getPostItem($(this),opts);
            self.showMore(post,opts,$(this));
            phi.stop(e)
        },1,'tapactive')
        ele.find('.feedimg').stap(function(){
            var post=self.getPostItem($(this),opts);
            if(opts.infinitescroller) opts.infinitescroller.disable();
            new modules.imageviewer({
                ele:$(this),
                index:parseInt($(this).attr('data-index'),10),
                data:post.media.data,
                onClose:function(){
                    if(opts.infinitescroller) opts.infinitescroller.enable();
                }
            })
        },1,'tapactive')
        if(false) ele.find('.attachments').stap(function(){
            var post=opts.getPost($(this).attr('data-postid'));
            switch(post.media.type){
                case 'drive':
                    var url='';
                    switch(post.media.data.mimeType){
                        case 'application/vnd.google-apps.spreadsheet':
                            var url='https://docs.google.com/spreadsheets/d/'+post.media.data.id;
                        break;
                        case 'application/vnd.google-apps.document':
                            var url='https://docs.google.com/document/d/'+post.media.data.id;
                        break;
                        case 'image/png':
                        case 'image/jpeg':
                            var img='https://drive.google.com/thumbnail?authuser=0&sz=w1000&id='+post.media.data.id;
                        break;
                        case 'application/vnd.google-apps.folder':
                            var url='https://docs.google.com/folder/d/'+post.media.data.id;
                        break;
                        default:
                            var url='https://drive.google.com/file/d/'+post.media.data.id+'/view?usp=sharing';
                        break;
                    }
                    if(url){
                        _.openLink({
                            intent:url
                        })
                    }else if(img){
                        new modules.imageviewer({//single image...
                            img:{
                                pic:img
                            },
                            spin:true
                        })
                    }else{
                        _alert('could not oppen attachment');
                    }
                break;
            }
        },1,'tapactive');
        ele.find('.timelineshare').stap(function(){
            _.openLink({
                intent:self.getAttachmentLink(self.getPostItem($(this),opts))
            })
        },1,'tapactive');
        ele.find('.x_share').stap(function(){
            if(!app.onlyMembers()) return false;
            var post=self.getPostItem($(this),opts);
            var share=new modules.share({
                ele:$(this),
                scroller:opts.scroller.getScroller(),
                post:post,
                type:'post',
                context:'post'
            });
        },1,'tapactive');
        ele.find('.x_queue').stap(function(){
            if(!app.onlyMembers()) return false;
            var te=$(this)
            var post=self.getPostItem(te,opts);
            self.queue(post,opts,te);
        },1,'tapactive');
        ele.find('.x_bookmark').stap(function(){
            if(!app.onlyMembers()) return false;
            var post=self.getPostItem($(this),opts);
            if(post.bookmark){
                var te=$(this);
                //show mobile aleart
                var alert2=new modules.mobilealert({
                    display:{
                        ele:$(this),
                        container:opts.scroller.getScroller()
                    },
                    menu:[{
                        id:'add',
                        name:'Add to folder',
                        icon:'icon-folder'
                    },{
                        id:'unbookmark',
                        name:'Unbookmark',
                        icon:'icon-bookmark-empty'
                    }],
                    onSelect:function(id){
                        console.log(id)
                        if(id=='unbookmark'){
                            te.removeClass('bookmarked')
                            post.bookmark=0;
                            if(!post.stats) post.stats={};
                            if(post.stats.bookmarks){
                                post.stats.bookmarks--;
                            }
                            self.unbookmark(post,opts);
                            opts.setPost(post.id,post);
                            self.updateStats(post,opts);
                        }
                        if(id=='add'){
                            var f=(post.bookmark.folders)?post.bookmark.folders:[];
                            var bm=new modules.bookmark_add({
                                post:post,
                                current:f,
                                context:opts.options.data.context,
                                onSetFolder:function(id){
                                    if(!post.bookmark) post.bookmark={};
                                    if(!post.bookmark.folders) post.bookmark.folders=[];
                                    post.bookmark.folders.push(id);
                                    //reload folders
                                    opts.setPost(post.id,post);
                                },
                                onDestroy:function(){
                                    delete bm;//delete the reference!
                                }
                            });
                            bm.showPicker();
                        }
                    }
                });
                alert2.show();
            }else{
                $(this).addClass('bookmarked')
                self.bookmark(post,opts);
                post.bookmark=1;
                if(!post.stats) post.stats={};
                if(!post.stats.bookmarks) post.stats.bookmarks=0;
                post.stats.bookmarks++;
                opts.setPost(post.id,post);
                self.updateStats(post,opts);
            }
        },1,'tapactive');
        ele.find('.timelineimg').stap(function(){
            new modules.imageviewer({
                ele:$(this),
                index:parseInt($(this).attr('data-index'),10),
                data:self.parseMediaData(self.getPostItem($(this),opts))
            })
        },1,'tapactive');
        ele.find('.readmore').stap(function(){
            var p=$(this).parents('.wrappedcontent').first();
            p.addClass('showtext')
        },1,'tapactive');
        ele.find('.showless').stap(function(){
            var p=$(this).parents('.wrappedcontent').first();
            p.removeClass('showtext')
        },1,'tapactive');
    },
    queue:function(post,opts,ele){
        ele.addClass('highlighttext')
        app.api({
            url:app.sapiurl+'/module/feed/addtoqueue',
            data:{
                context:opts.options.data.context,
                post_id:post.id
            },
            timeout:5000,
            callback:function(resp){
                if(resp.success){

                }else{
                    ele.removeClass('highlighttext')
                    modules.toast({
                        content:'Error Saving, please try again.',
                        remove:2500,
                        icon:'icon-warning-sign'
                    });
                }
            }
        });
    },
    withinView:function(obj,opts){
        var top={
            ele:obj.topEle,
            offset:obj.bottomWaypoint.options.offset
        }
        var bottom={
            ele:obj.bottomEle,
            offset:obj.topWaypoint.options.offset
        }
        var scrollerOffset=opts.scroller.getScroller().offset();
        var height=opts.scroller.getScroller().outerHeight();
        var pt=top.ele.offset();
        var diffpt=((pt.top-scrollerOffset.top)/height)*100;
        var pb=bottom.ele.offset();
        var diffpb=((pb.top-scrollerOffset.top)/height)*100;
        var topsetpoint=parseInt(top.offset,10);
        var bottomsetpoint=parseInt(bottom.offset,10);
        if(topsetpoint<diffpt&&bottomsetpoint>diffpb){
            return true;
        }
        return false;
    },
    unbookmark:function(post,opts){
       app.api({
            url:app.sapiurl+'/module/bookmark_add/unbookmark',
            data:{
                context:opts.options.data.context,
                post_id:post.id
            },
            retry:5,
            timeout:5000,
            callback:function(resp){
                console.log(resp)
            }
        });
    },
    bookmark:function(post,opts){
        var bm=new modules.bookmark_add({
            post:post,
            context:opts.options.data.context,
            onDestroy:function(){
                delete bm;//delete the reference!
            }
        });
        bm.save();
    },
    removeSupportPerson:function(id,opts){
        var post=opts.getPost();
        app.api({
            url:app.sapiurl+'/module/support/unassign',
            data:{
               post_id:post.id,
               user_id:id
            },
            retry:5,
            timeout:5000,
            callback:function(resp){
                console.log(resp)
            }
        });
    },
    addSupportPerson:function(id,opts){
        var post=opts.getPost();
        app.api({
            url:app.sapiurl+'/module/support/assign',
            data:{
               post_id:post.id,
               user_id:id
            },
            retry:5,
            timeout:5000,
            callback:function(resp){
                console.log(resp)
            }
        });
    },
    parseMessage:function(post,nowrap,feed){
        var message=post.message
        if(!message) return '';
        app.cpost=post;
        //if(!app.isdev) return message;
        if(post.at){
            var offset=0;
            //needs to be sorted by start!
            var tosort=[];
            $.each(post.at,function(i,v){
                post.at[i]=[parseInt(v[0],10),parseInt(v[1],10)];//ensure ints
            })
            $.each(post.at,function(i,v){
                tosort.push([v[0],i]);
            })
            tosort.sort(function(a,b){
                return a[0]-b[0];
            })
            $.each(tosort,function(si,sv){
                var v=post.at[sv[1]];
                var i=sv[1];
                //var info=post.at_info[v];
                // console.log(i,v)
                if(feed) var istring='<span class="post_highlight_feed" data-id="'+i+'">';
                else var istring='<span class="post_highlight" data-id="'+i+'">';
                message=message.insertAt(v[0]+offset,istring);
                offset+=istring.length;
                var estring='</span>';
                message=message.insertAt((v[0]+v[1]+offset),estring);
                offset+=estring.length;
            });
            //highlight any #hashtags_s

            //return message.ensureSpaces();
        }   
        //var regex = /(^|\s)(#[a-z\d-_]+)/gi;
        //var regex=new RegExp('(^|\s)(#[a-z\d-_]+)(?![^<]*>|[^<>]*<\/)','gi');
        var regex = /(^|\s)(#[a-z\d-_]+)(?![^<]*>|[^<>]*<\/)/gi;//dont allow to happen within a tag already
        if(feed) message=message.replace(regex,"$1<span class='hash_tag_feed' data-id='$2'>$2</span>");
        else message=message.replace(regex,"$1<span class='hash_tag'>$2</span>");
        return message;
    },
    getPageName:function(post){
        var name='';
        console.log(post)
        switch(post.page.type){
            case 'event':
            case 'fundraiser':
                name=post.page.data.name;
            break;
            case 'user':
                name=post.page.data.name;
            break;
        }
        return name;
    },
    getWith:function(post,support){
        if(post.with&&post.with.length){
            if(post.with_info){
                if(!post.with_info[post.with[0]]) return ''
                if(!support){
                    if(post.with.length==1){
                        return '- with <span class="post_userlink" data-id="'+post.with[0]+'">'+post.with_info[post.with[0]].name+'</span>.';
                    }else{
                        return '- with <span class="post_userlink" data-id="'+post.with[0]+'">'+post.with_info[post.with[0]].name+'</span> and <span class="post_userlink" data-id="others">'+(post.with.length-1)+' others</span>.';
                    }
                }else{
                    if(post.with.length==1){
                        return '- assigned to <span class="post_userlink" data-id="'+post.with[0]+'">'+post.with_info[post.with[0]].name+'</span>.';
                    }else{
                        return '- assigned to <span class="post_userlink" data-id="'+post.with[0]+'">'+post.with_info[post.with[0]].name+'</span> and <span class="post_userlink" data-id="others">'+(post.with.length-1)+' others</span>.';
                    }
                }
            }
        }
        return '';
    },
    getStatus:function(post,opts){
        if(!opts) opts={};
        if(post.type&&post.type=='intro_video'){
            return '<span class="post_userlink" data-id="'+post.by.data.id+'">'+post.by.data.name+'</span> updated their intro video!';
        }
        if(post.id[0]!='F'&&post.id[0]!='S'){//with field is used differently for support items.
            // if(post.with&&post.with.length){
            //     if(post.with.length==1){
            //         return '<span class="post_userlink" data-id="'+post.user.id+'">'+post.user.name+'</span> is with <span class="post_userlink" data-id="'+post.with[0]+'">'+post.with_info[post.with[0]].name+'</span>.';
            //     }else{
            //         return '<span class="post_userlink" data-id="'+post.user.id+'">'+post.user.name+'</span> is with <span class="post_userlink" data-id="'+post.with[0]+'">'+post.with_info[post.with[0]].name+'</span> and <span class="post_userlink" data-id="others">'+(post.with.length-1)+' others</span>.';
            //     }
            // }
            if(post.page&&post.page.id!=post.by.id){
                if(opts.page&&opts.page==post.page.id){//regular, im in the page, no need to show context
                    
                }else{
                    var name=modules.feed_global.getPageName(post);
                    if(name){
                        if(post.page.type=='event'){
                            return '<span class="post_userlink" data-id="'+post.by.data.id+'">'+post.by.data.name+'</span> posted to the event <span class="post_pagelink">'+name+'</span>.';
                        }
                        if(post.page.type=='fundraiser'){
                            return '<span class="post_userlink" data-id="'+post.by.data.id+'">'+post.by.data.name+'</span> posted to the fundraiser <span class="post_pagelink">'+name+'</span>.';
                        }
                        if(post.page.type=='user'){
                            return '<span class="post_userlink" data-id="'+post.by.data.id+'">'+post.by.data.name+'</span> to <span class="post_pagelink">'+name+'</span>.';                            
                        }
                        if(post.page.type=='page'){
                            return '<span class="post_userlink" data-id="'+post.by.data.id+'">'+post.by.data.name+'</span> to <span class="post_pagelink">'+name+'</span>.';                            
                        }
                    }
                }
            }
        }
        if(post.ask){
            var display=modules.ask_global.getDisplay(post.id,post.ask);
            if(display){
                return '<span class="post_userlink" data-id="'+post.by.data.id+'">'+post.by.data.name.firstName()+'</span> '+display;
            }
        }
        if(post.page.id!=post.by.id&&opts.page!=post.page.id&&post.page.data){
            return '<span class="post_userlink" data-id="'+post.by.data.id+'">'+post.by.data.name+'</span> to <span class="post_userlink" data-id="'+post.page.data.id+'">'+post.page.data.name+'</span>';
        }
        if(post.type=='photos'){
            if(post.media.data.order.length==1){
                return '<span class="post_userlink" data-id="'+post.by.data.id+'">'+post.by.data.name+'</span> added a photo!';
            }else{
                return '<span class="post_userlink" data-id="'+post.by.data.id+'">'+post.by.data.name+'</span> added '+post.media.data.order.length+' photos!';
            }
        }
        return '<span class="post_userlink" data-id="'+post.by.data.id+'">'+post.by.data.name+'</span>';
    },
    getEmoticonSvg:function(k){
        var self=this;
        return (self.reactions.list[k])?self.reactions.list[k].svg:'';
    },
    reactions:{
        default:'love',
        list:{
            love:{
                name:'Love',
                svg:'https://s3.amazonaws.com/wearenectar/emojis/pink_heart.svg?v=23',
                dark_svg:'https://s3.amazonaws.com/wearenectar/emojis/heart-empty-grey.svg?v=23'
            },
            riseup:{
                name:'Rise Up',
                svg:'https://s3.amazonaws.com/wearenectar/emojis/riseup.svg?v=23'
            },
            wisdom:{
                name:'Wisdom',
                svg:'https://s3.amazonaws.com/wearenectar/emojis/wisdom.svg?v=23'
            },
            inspiring:{
                name:'Inspiring',
                svg:'https://s3.amazonaws.com/wearenectar/emojis/magic.svg?v=23'
            },
            beautiful:{
                name:'Beautiful',
                svg:'https://s3.amazonaws.com/wearenectar/emojis/flower.svg?v=23'
            },
            funny:{
                name:'Funny',
                svg:'https://s3.amazonaws.com/wearenectar/emojis/haha.svg?v=23'
            },
            hands:{
                name:'Blessings',
                svg:'https://s3.amazonaws.com/wearenectar/emojis/hands.svg?v=23'
            },
            angry:{
                name:'Angry',
                svg:'https://wearenectar.s3.amazonaws.com/emojis/angry.svg?v=23'
            },
            sad:{
                name:'Sad',
                svg:'https://wearenectar.s3.amazonaws.com/emojis/sad.svg?v=23'
            },
            hug:{
                name:'Hugs',
                svg:'https://wearenectar.s3.amazonaws.com/emojis/hug.svg?v=23'
            },
            wow:{
                name:'Wow',
                svg:'https://wearenectar.s3.amazonaws.com/emojis/wow.png?v=24'
            }
        },
        //order:['love','inspiring','wisdom','riseup','beautiful','funny']
        order:['hug','sad','funny','angry','wow','hands','wisdom','riseup','beautiful','love','inspiring']
    },
    getReaction:function(id){
        var self=this;
        if(self.reactions.list[id]){
            return self.reactions.list[id].svg;
        }
        return '';
    },
    getMyReaction:function(post){
        var self=this;
        var reaction={
            class:'',
            name:'Love'
        };//default
        if(post.myreaction&&post.myreaction.v&&self.reactions.list[post.myreaction.v]){
            reaction={
                name:self.reactions.list[post.myreaction.v].name,
                class:post.myreaction.v
            }
        }else if(post.myreaction){
            console.log('INvalid reaction: '+JSON.stringify(post.myreaction))
        }
        // if(post.stats&&post.stats.reactions){
        //     $.each(post.stats.reactions,function(i,v){
        //         if(v.indexOf(app.user.profile.id)>=0){
        //             reaction={
        //                 name:self.reactions.list[i].name,
        //                 class:i
        //             }
        //         }
        //     })
        // }
        return reaction;
    }
}