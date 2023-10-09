modules.textarea_global={
	render:function(obj){
		return $.fn.render({
			template:'textarea',
			data:{
                fontSize:(obj.fontSize)?obj.fontSize:22,
				fontColor:(obj.fontColor)?obj.fontColor:'#888',
				minHeight:(obj.minHeight)?obj.minHeight:'80px',
				maxHeight:(obj.maxHeight)?obj.maxHeight:'',
                message:(obj.message)?obj.message:'',
				id:(obj.id)?obj.id:Math.uuid(12),
				placeholder:(obj.placeholder)?obj.placeholder:'What do you want to share?',
				debug:false//app.isdev
			},
			returntemplate:true
		})
	},
	onClick:function(ele){
		var page=ele.attr('data-id');
		var type=ele.attr('data-type');
		switch(type){
			case 'people':
                phi.registerView('profile',{
                    renderTo:$('#wrapper')[0],
                    data:{
                        id:page
                    }
                });
			break;
            case 'page':
                modules.viewdelegate.register('page',{
                    id:page,
                    data:{
                        id:page
                    }
                })
            break;
            case 'event':
                modules.viewdelegate.register('event',{
                    id:page,
                    data:{
                        id:page
                    }
                })
            break;
		}
	},
	parseMessage:function(post,nowrap,feed){
		var message=post.message
		if(!message) message=post.content;//for chat messages
        if(!message) return '';
        //app.cpost=post;
        //if(!app.isdev) return message;
        if(post.at){
            var offset=0;
            //needs to be sorted by start!
            var tosort=[];
            $.each(post.at,function(i,v){
                post.at[i].start=parseInt(post.at[i].start,10);
                post.at[i].length=parseInt(post.at[i].length,10);
            })
            $.each(post.at,function(i,v){
                tosort.push([v.start,i]);
            })
            tosort.sort(function(a,b){
                return a[0]-b[0];
            })
            $.each(tosort,function(si,sv){
                var v=post.at[sv[1]];
                var i=sv[1];
                //var info=post.at_info[v];
                // console.log(i,v)
                if(feed) var istring='<span class="bold" link="'+_.getLink({id:i})+'">';
                else var istring='<span class="textareabold" link="'+_.getLink({id:i})+'">';
                message=message.insertAt(v.start+offset,istring);
                offset+=istring.length;
                var estring='</span>';
                message=message.insertAt((v.start+v.length+offset),estring);
                offset+=estring.length;
            });
            //highlight any #hashtags_s

            //return message.ensureSpaces();
        }   
        //var regex = /(^|\s)(#[a-z\d-_]+)/gi;
        var regex = /(^|\s)(#[a-z\d-_]+)(?![^<]*>|[^<>]*<\/)/gi;//dont allow to happen within a tag already
        if(feed) message=message.replace(regex,"$1<span class='hash_tag_feed' data-id='$2'>$2</span>");
        else message=message.replace(regex,"$1<span class='hash_tag'>$2</span>");
        return message;
	}
}
modules.textarea=function(options){
	var self=this;
	if(!options.features) options.features=['at'];
	self.options=options;
	self.data={
		at:{},
		message:''
	}
	self.ele=options.ele;
	this.init=function(){
		//bind!
		self.ele.find('.inputarea').on('keyup input',function(e){
            var te=$(this);
            if(e.which!=27){
			     self.onKeyUp($(this));
            }
            if(self.onRelease&&e.which==13&&e.type=='keyup'){
                var ta=te.textareaHelper('caretPos');
                var ct=te.scrollTop();
                var h=te.height();
                var bottom=h+ct;
                var ttop=ta.top+ct;
                if(ttop>bottom){
                    var diff=ttop-bottom+20;
                    app.scroller.scrollBy(te,-diff,0);
                }
                self.onRelease=false;
            }
		}).on('keydown',function(e){
            if(!isPhoneGap()&&!isMobile){
                var te=$(this);
                if(self.searching){
                    if(e.which==38){//up
                        self.searchbar.incriment('-');
                        return false;
                    }
                    if(e.which==40){
                        self.searchbar.incriment('+');
                        return false;
                    }
                    if(e.which==27){
                        self.searchbar.clear();
                        return false;
                    }
                }
                if(e.which==13){
                    if(self.searching){
                        self.searchbar.keyboardSelect();
                    }else{
                        if(e.shiftKey){
                            //new line!
                            var ci=te.caret();
                            var newtext=self.data.message.insertAt(ci,'\n')
                            self.data.message=newtext;
                            te.val(newtext);
                            self.ensureTextArea(ci+1);
                            self.onRelease=true;
                        }else{
                            if(self.options.onSubmit) self.options.onSubmit();
                            phi.stop(e);
                        }
                    }
                    return false;
                }
            }
        }).on('change',function(){
            self.ensureHeight();//do asap!
        }).on('paste',function(e){
            //check content for links!
            if(options.onPaste) options.onPaste($(this).val(),e);
		}).on('focus',function(){
            self.isWindowActive=true;
        }).on('blur',function(){
            self.isWindowActive=false;
        })
		self.data.message=options.ele.find('.inputarea').val();
		if(options.autosize){
			self.tascroller=new modules.scroller(self.ele.find('.autosize'),{},{
				scroll:function(obj){
					TweenLite.set(self.ele.find('.renderedcontent'),{y:obj.currentY});
				}
			})
			self.ele.find('.autosize').autosize({
				//scroller:options.scroller
				onresize:function(){
					var st=self.ele.find('.autosize').scrollTop();
					TweenLite.set(self.ele.find('.renderedcontent'),{y:-st});
					if(app.scroller) app.scroller.refresh(self.ele.find('.autosize'));
				}
			});
		}
		if(self.hasFeature('at')){
			self.searchbar=new modules.search({
	            allowAdd:false,
	            noMinHeight:true,
                multiple:true,//hack
	            scroller:options.scroller,
                web_inline:true,
	            renderTemplate:'modules_search_multi',
                web_placement:(options.search_web_placement)?options.search_web_placement:'',
                web_container:(options.search_web_placement&&options.search_web_placement=='above')?self.ele:'',
	            exclude:$.extend(true,[],Object.keys(self.data.at)),
	            dontShow:[app.user.profile.id],
	            textarea:self.ele.find('.inputarea'),
	            endpoint:app.apiurl2+'/search/aggregate',
	            endpointData:{
	            	filters:(options.filters)?options.filters:['people']
	            },
	            keyOn:'_id',
	            disableLoading:true,
	            searchEle:options.searchEle,
	            fitSearch:(options.noFit)?false:true,
	            onKeyUp:function(val){
	            },
	            onRender:function(){
	            	if(options.onSearchUpdate) options.onSearchUpdate();
	            },
                enterSearch:function(){
                    self.searching=true;
                },
                exitSearch:function(){
                    self.searching=false;
                },
	            onSelect:function(id,item){//might want or need full item.
                    //modules.keyboard_global.preventHide();
	                item.name=$.trim(item.name);//remove white space, can cause issue if white space at end of name
	                self.data.at[id]={
	                	start:self.curat.start-1,
	                	length:item.name.length,
	                	type:item._type
	                }
	                var pstring=self.data.message.substr(0,self.curat.start-1);
	                var estring=self.data.message.substr(self.curat.start+self.curat.length);
	                pstring+=item.name+' '+estring;
	                self.data.message=pstring;
	                //update all at's past this start index!
	                var updatestart=self.curat.start+self.curat.length;
	                var diff=item.name.length-self.curat.length;
	                $.each(self.data.at,function(i,v){
	                    if(v.start>updatestart){
	                        self.data.at[i].start+=diff;
	                        console.log('add to ['+i+'] ['+diff+']');
	                    }
	                })
	                self.ele.find('.inputarea').val(self.data.message);//ensure diff doest screw things up!
	                self.ensureTextArea((self.curat.start+item.name.length));//re-render text area too!
	                self.onUpdate();
	            }
	        });
		}
	}
    this.insertAtCursor=function(val){
        var ta=self.ele.find('.inputarea');
        var cp=ta.caret();
        var c=self.getCurrent();
        if(!c.message) c.message='';
        c.message=c.message.insertAt(cp,val);
        self.set(c);
        ta.caret(cp+val.length);
    }
    this.isActive=function(){
        return self.isWindowActive;
    }
    this.startAt=function(){
        var cp=self.ele.find('.inputarea').caret();
        var cv=self.ele.find('.inputarea').val();
        var ns=cv.insertAt(cp,'@');
        self.ele.find('.inputarea').val(ns);
        self.onKeyUp(self.ele.find('.inputarea'));
        if(isPhoneGap()){
            self.ele.find('.inputarea').one('blur',function(){
                self.ele.find('.inputarea').focus().caret(cp+1);
            })
        }else{
            self.ele.find('.inputarea').focus().caret(cp+1);
        }
    }
	this.hasFeature=function(feature){
        if(options.disableFeatures&&options.disableFeatures.indexOf(feature)!=-1) return false;
        if(options.features.indexOf(feature)>=0) return true;
        else return false;
    }
    this.setMaxHeight=function(max){
    	if(self.cmax!=max){
    		self.ele.find('.inputarea').css('maxHeight',max+'px');
    	}
    	//_alert(max)
    	self.cmax=max;
    }
	this.onKeyUp=function(ele){
        var newval=ele.val();
        if(options.format){
            switch(options.format){
                case 'tag':
                    newval=newval.getTagId();
                break;
                case 'number':
                    newval=newval.replace(/\D+/g, '');
                break;
            }
        }
        var info=self.ensureAtIndexes(newval);
        self.data.message=info.val;
        self.ensureTextArea(info.index);
        self.onUpdate();
    }
	this.onUpdate=function(){
		if(options.onUpdate) options.onUpdate(self.data);
	}
	this.clear=function(){
		self.data={
			at:{},
			message:''
		}
		if(self.searchbar) self.searchbar.options.exclude=[];//reset exclude!
		self.searchbar.clear();
		self.ensureTextArea(0,1);
	}
	this.clearSearch=function(){
		self.searchbar.clear();
	}
	this.getCurrent=function(){
		return self.data;
	}
	this.removeAtTag=function(ti){
        delete self.data.at[ti];
        self.searchbar.remove(ti);
        self.onUpdate();
    }
    this.destroy=function(){
    	if(self.searchbar) self.searchbar.destroy();
    }
    this.set=function(data){
    	self.data=data;
    	if(!self.data.at) self.data.at={};
    	var exclude=(self.data.at&&_.size(self.data.at))?Object.keys(self.data.at):[];
    	self.searchbar.options.exclude=$.extend(true,[],exclude);
    	self.ensureTextArea(self.data.message.length);//put cursor at end!
    }
    this.ensureHeight=function(){
        var h=self.ele.find('.inputarea').outerHeight();
        self.ele.find('.inputheight').height(h-6);
        if(options.onHeightUpdate) options.onHeightUpdate(h);
    }
    this.ensureTextArea=function(putCursorAt,clear){
        var text=modules.textarea_global.parseMessage(self.data);
        self.ele.find('.renderedcontent').html(text);
        if(putCursorAt!=-1){
            self.ele.find('.inputarea').val(self.data.message);
            if(!clear){
                setTimeout(function(){
                    var ia=self.ele.find('.inputarea');
                    ia.focus();
                    ia.caret(putCursorAt);
                    self.ensureHeight();
                    self.ele.find('.autosize').trigger('refresh.autosize')
                    setTimeout(function(){
                        ia.trigger('keyup');
                    },20)
                },50)
            }else{
               self.ele.find('.autosize').trigger('refresh.autosize')
            }
        }
        self.ensureHeight();
        if(clear) return false;
        //if last 10 characters have @
        var search=false;
        var text=self.data.message;//reset text for serach!
        var c=1;
        if(!self.hasFeature('at')) return false;
        if(putCursorAt==-1){
            while(c<10){
                //get current currsor postion
                var checkat=self.ele.find('.inputarea').caret();
                if(text[checkat-c]=='@'){
                    var start=(checkat+1-c);
                    var length=c-1;
                    search=text.substr(start,length);
                    break;
                }
                c++;
            }
            if(search){
                self.curat={
                    start:start,
                    length:length
                }
               	self.searchbar.onKeyUp(search);
            }else{
                if(self.curat){
                    self.searchbar.clear();
                }
                self.curat=false;
            }
        }
    }
	this.ensureAtIndexes=function(newval){
        var dmp = new diff_match_patch();
        var diff=dmp.diff_main(self.data.message,newval, false);
        var cindex=0;
        var focusindex=-1;
        var remove=[];
        var add=[];
        $.each(diff,function(i,v){
            if(v[0]==-1){
                remove.push([cindex,v[1].length]);
            }
            if(v[0]==1){
                add.push([cindex,v[1].length]);
            }
            cindex+=v[1].length;
        });
        if(_.size(self.data.at)){
            if(remove.length){
                $.each(remove,function(i,v){//for single backspace...
                    var removedword=false;
                    var tstart=false;
                    $.each(self.data.at,function(ti,tv){
                        //test if remove happens in range!
                        if(v[0]>=tv.start&&v[0]<(tv.start+tv.length)){
                            //get word to delete and start index!
                            var changedindex=v[0];//go back 1 space as the char at this one got deleted
                            //pick name from original message!
                            var name=self.data.message.substr(self.data.at[ti].start,self.data.at[ti].length);
                            var np=name.split(' ');
                            var relindex=changedindex-self.data.at[ti].start;
                            var map={};
                            var ci=0;
                            $.each(np,function(ri,rv){
                                var wordstart=ci;
                                $.each(rv.split(''),function(di,dv){
                                    map[ci]={
                                        word:ri,
                                        start:wordstart
                                    }
                                    ci++;
                                })
                                if(np[ri+1]){
                                    map[ci]={
                                        word:ri
                                    }//space
                                    ci++;
                                }
                            })
                            //get word index!
                            var wordindex=map[relindex];
                            var shouldRemove=false;
                            var shouldCheck=['people'];
                            if(shouldCheck.indexOf(self.data.at[ti].type)>=0){
                                if(wordindex.word==0) shouldRemove=1;
                            }else{
                                shouldRemove=1;
                            }
                            if(wordindex&&shouldRemove){//first name! remove all reference!
                                newval=self.data.message.deleteAt(tv.start,tv.length);//remove entire remaining length
                                removedword=tv.length;
                                tstart=tv.start;
                                self.removeAtTag(ti);
                                focusindex=tv.start;
                            }else{
                                //remove just the word 
                                var l=np[wordindex.word].length;//length of this part of name
                                newval=self.data.message.deleteAt(wordindex.start+self.data.at[ti].start,l);//remove entire remaining length
                                self.data.at[ti].length-=(l+1);//also remove space!
                                tstart=wordindex.start+self.data.at[ti].start;
                                focusindex=wordindex.start+self.data.at[ti].start;
                                removedword=l;
                            }
                        }
                    })
                    if(removedword){
                        $.each(self.data.at,function(ti,tv){
                            if(tv.start>tstart){
                                self.data.at[ti].start-=removedword;
                            }
                        })
                    }else{
                        //simple offset!
                        $.each(self.data.at,function(ti,tv){
                            if(tv.start>v[0]){
                                self.data.at[ti].start-=v[1];
                            }
                        });
                    }
                })
            }
            if(add.length){
                $.each(add,function(i,v){
                    $.each(self.data.at,function(ti,tv){
                        //console.log(tv.start,v[0])
                        if(tv.start>=v[0]){
                            self.data.at[ti].start=tv.start+v[1];
                        }
                    })
                })
            }
        }
        var ret={
            val:newval,
            index:focusindex
        }
        if(options.prefix){
            ret.val=options.prefix+ret.val;
        }
        return ret;
    }
    self.init();
}