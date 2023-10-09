modules.global_admin_notifications={
	getRawEmailSubject:function(content){
		var cp=content.split('\n');
		var subject='';
		for (var i = 0; i < cp.length; i++) {
			var line=cp[i];
			if(!subject){
				if(line.indexOf('Subject:')===0){
					subject=line.replace('Subject: ','');
				}
			}
		}
		return subject;
	},
	getRawEmailTo:function(content){
		var cp=content.split('\n');
		var to='';
		for (var i = 0; i < cp.length; i++) {
			var line=cp[i];
			if(!to){
				if(line.indexOf('To:')===0){
					var lp=line.replace('To: ','');
					var tp=lp.split('<');
					to=tp[1].replace('>','');
				}
			}
		}
		return to;
	}
}
modules.admin_notifications=function(options){
	var self=this;
	this.show=function(){
		options.ele.render({
			uid:'admin_notifications',
			force:1,
			template:'admin_notifications',
			binding:function(ele){
				self.ele=ele;
				ele.find('.x_email').on('keyup paste',function(){
                    var c=$(this).val();
                    if(c.length){
                        self.search.email=c;
                        self.refresh(1);
                    }else{
                        if(self.search.email) delete self.search.email;
                        self.refresh(1);
                    }
                });
                ele.find('.x_type').on('keyup paste',function(){
                    var c=$(this).val();
                    if(c.length){
                        self.search.notice_type=c;
                        self.refresh(1);
                    }else{
                        if(self.search.notice_type) delete self.search.notice_type;
                        self.refresh(1);
                    }
                });
                self.renderSearch();
                ele.find('.status').on('change',function(){
                    self.refresh(1);
                })
                ele.find('.refresh').stap(function(){
                    self.refresh(1);
                })
                ele.find('.navselect').stap(function(){
                    if(!$(this).hasClass('selected')){
                        ele.find('.navselect').removeClass('selected');
                        $(this).addClass('selected');
                        self.filter=$(this).attr('data-filter');
                        self.last=false;
                        self.listloaded=0;
                        self.refresh();
                    }
                })
                self.setScroller();
                ele.find('[data-filter=all]').stap();
			}
		})
	}
	this.getRawEmailHTML=function(content){
		/* First try to handle pages which are actually raw text of the email.
       Extract the HTML part and replace page with it */
    var orig_html = content;
    var extracted_html = orig_html;
    /* Try splitting it up if it's actually the multipart email. Otherwise, work
       on the document itself, leaving the orig_html in place */
    var pattern=/boundary\=\"([A-Za-z0-9 _]*)\"/;
    var res=content.match(pattern);
   	if(res.length){
   		var boundary_pattern =res[1];
   	}else{
    	var boundary_pattern = '--===============';
    }
    while (extracted_html.indexOf(boundary_pattern) != -1) {
        var next_boundary = extracted_html.indexOf(boundary_pattern);
        var next_block = extracted_html.substr(0, next_boundary);
        /* If this block contains the html use it */
        var html_pos = next_block.indexOf('<html');
        if (html_pos != -1) {
            var html_end_pos = next_block.indexOf('/html>');
            extracted_html = next_block.substr(html_pos, html_end_pos-html_pos+6);
            break;
        }
        /* Otherwise, continue on next block. We need to make sure we get rid of
           the boundary in the process */
        var new_start_idx = extracted_html.indexOf('\n', next_boundary);
        extracted_html = extracted_html.substr(new_start_idx+1);
    }
    /* Put the replacement in place*/
    if (extracted_html != orig_html) {
        return quotedPrintable.decode(extracted_html);
    }
    return orig_html;
    /*Now run through the document clearing out data we shouldn't have. Ideally
    this would match the process that email clients follow. Something like GMail
    or Yahoo Mail, where the data is embedded directly in another page, needs to
    do the most aggressive filtering, so we want to match something like
    that. Our first step is removing entire tags. */
    var excluded_tags = ['head', 'style', 'link'];
    for(var ex_i = 0; ex_i < excluded_tags.length; ex_i++) {
        var ex_elems = document.getElementsByTagName(excluded_tags[ex_i]);
        for (var exe_i = 0; exe_i < ex_elems.length; exe_i++) {
            var node = ex_elems[exe_i];
            node.parentNode.removeChild(node);
        }
    }

    /*And remove attributes that we can't verify. We don't have a complete
      list, so we filter out attributes only for tags we generate an explicit
      list for. A blacklist of attributes would be nice, but since the possible
      list of tags is ever growing and people generate non-conforming HTML for
      emails, we can't do that.
      Some global attributes are always permitted. Each attribute is
      treated as a prefix so we can match generic sets of tags. Finally, we also
      have list of globally explicitly  attributes that should always be
      stripped. */
    var global_attributes = ['accesskey', 'contenteditable',
      'contextmenu', 'data-', 'dir', 'draggable', 'dropzone', 'hidden',
      'itemid', 'itemprop', 'itemref', 'itemscope', 'itemtype', 'lang',
      'spellcheck', 'style', 'tabindex', 'title'];
    var valid_attributes = {
        'table': ['align', 'bgcolor', 'border', 'cellpadding', 'cellspacing',
                  'frame', 'rules', 'width'],
        'tbody': ['align', 'bgcolor', 'valign'],
        'tr': ['align', 'bgcolor', 'valign'],
        'td': ['align', 'bgcolor', 'colspan', 'rowspan', 'valign'],

        'img': ['align', 'alt', 'border', 'height', 'src', 'width'],
    };
    var always_strip_attributes = ['id', 'class'];

    var all_elems = document.getElementsByTagName('*');
    for(var elem_i = 0; elem_i < all_elems.length; elem_i++) {
        var elem = all_elems[elem_i];
        var attribs_to_remove = [];
        for(var i = 0; i < elem.attributes.length; i++) {
            var attrib = elem.attributes[i];
            var done = false;
            if (!attrib.specified)
                continue;
            /* First check if it's in the "always strip" list */
            for(var ai = 0; ai < always_strip_attributes.length; ai++) {
                if (always_strip_attributes[ai] == attrib.name) {
                    attribs_to_remove.push(attrib.name);
                    done = true;
                    break;
                }
            }
            if (done) continue;

            /* Next check if it's one of the valid global
               attributes. If it is, we let it pass */
            var tag_valid_attributes = valid_attributes[elem.tagName.toLowerCase()];
            if (!tag_valid_attributes) continue;
            for(var ai = 0; ai < global_attributes.length; ai++) {
                var global_attrib_prefix = global_attributes[ai];
                if (attrib.name.indexOf(global_attrib_prefix) == 0) {
                    /* Setting done & not adding to the list lets it
                       pass */
                    done = true;
                    break;
                }
            }
            if (done) continue;

            /* Finally, if we have a filter on the element, we can filter based
               on its valid elements */
            for(var ai = 0; ai < tag_valid_attributes.length; ai++) {
                var valid_attrib = tag_valid_attributes[ai];
                if (valid_attrib == attrib.name) {
                    done = true;
                    break;
                }
            }
            if (done) continue;
            /* If we didn't continue already, then the attribute wasn't in the
               safe list. */
            attribs_to_remove.push(attrib.name);
        }

        /* After finishing iterating over them, remove the ones we
           discovered */
        for(var ai = 0; ai < attribs_to_remove.length; ai++)
            elem.removeAttribute(attribs_to_remove[ai]);
    }

    /* And we need to remove any restricted styles. I haven't done any of this yet... */
	}
	this.setScroller=function(){
		self.inf=new modules.infinitescroll({
            ele:self.ele.find('.itemlist'),
            scroller:self.ele.find('.scroller'),
            endpoint:app.sapiurl+'/notifications/get',
            loaderClass:'lds-ellipsis-black',
            offset:'200%',
            checkNextPage:true,
            onInterval:{
            	time:3000,
            	callback:function(){
            		//pself.updateTimes();
            	}
            },
            waitForReload:true,
            opts:{},
            max:20,
            getTemplate:function(){
            	var tpl=''
            	switch(self.filter){
            		case 'all':
            		case 'email':
            		case 'push':
            		default:
            			tpl='admin_notifications_item';
            		break;
            		case 'campaigns':
            			tpl='admin_notifications_campaignitem';
            		break;
            	}
            	return tpl
            },
            nodata:'<div style="padding:20px;text-align:center;color:#888;margin-top:20px;"><div style="padding-bottom:10px;"><i class="icon-info" style="font-size:55px;"></i></div><div>You havent queued anything yet.</div></div>',
            onPageReady:function(ele){
              	ele.find('.preview_email').stap(function(){
              		self.showEmailInfo(self.inf.getById($(this).attr('data-id')));
              	},1,'tapactive');
              	ele.find('.preview_push').stap(function(){
              		self.showPushInfo(self.inf.getById($(this).attr('data-id')));
              	},1,'tapactive'); 
            },
            scrollBindings:{
                scrollStart:function(){
                },
                scroll:function(obj){
                }
            }
        });
	}
	this.loadHistory=function(id,cid,cb){
        modules.api({
            caller:'Get notifications',
            url: app.sapiurl+'/notifications/history', 
            data:{
                id:id,
                campaign:cid
            },
            callback: function(data){
                cb(data)
            }
        })
    }
    this.renderHistory=function(ele,data){
        ele.find('.history').render({
            template:'admin_notifications_email_history',
            append:false,
            data:data
        })
    }
    this.showPushInfo=function(data){
    	$('body').alert({
	        icon:false,
	        template:'admin_notifications_previewpush',
	        tempdata:data,
	        mobilize:1,
	        loc:'top',
	        width:800,
	        buttons:[{
	            btext:'Close',
	            bclass:'x_closer'
	        },{
	            btext:'<i class="icon-refresh retryicon"></i> Retry',
	            bclass:'x_retry'
	        }],
	        bindings:[{
	            type:'fn',
	            binding:function(ele){
	                ele.find('.x_retry').stap(function(){
	                     if(self.retrying) return false;
	                        self.retrying=1;
	                        ele.find('.retryicon').addClass('animate-spin')
	                        modules.api({
	                            caller:'retry push',
	                            url: app.sapiurl+'/notifications/resend', 
	                            data:{
	                                id:data._id
	                            },
	                            callback: function(data){
	                                ele.find('.retryicon').removeClass('animate-spin')
	                                self.retrying=0;
	                                if(data.success){
	                                    growl({
	                                        icon:'icon-thumbs-up',
	                                        content:'Success'
	                                    })
	                                }else{
	                                    growl({
	                                        icon:'icon-warning-sign',
	                                        content:'Error: '+data.error
	                                    })
	                                }
	                            }
	                        })
	                },1,'tapactive')
	            }
	        }]
	    })
    }
	this.showEmailInfo=function(data){
		$('body').alert({
	        icon:false,
	        template:'admin_notifications_previewemail',
	        tempdata:data,
	        mobilize:1,
	        loc:'top',
	        width:800,
	        buttons:[{
	            btext:'Close',
	            bclass:'x_closer'
	        },{
	            btext:'<i class="icon-refresh"></i> Resend',
	            bclass:'x_resend'
	        }],
	        bindings:[{
	            type:'fn',
	            binding:function(ele){
	                ele.find('.x_resend').stap(function(){
	                    var te=$(this);
	                    $('body').confirm({
	                        icon:'icon-help',
	                        text:'Are you sure you want to resend this?',
	                        buttons:[{
	                            btext:'Yes, Continue',
	                            bclass:'btn-danger yesbtn'
	                        },{
	                            btext:'Cancel',
	                            bclass:'cancelbtn'
	                        }],
	                        cb:function(success){
	                            if(success){
	                                if(te.hasClass('sending')) return false;
	                                te.addClass('sending');
	                                te.find('i').addClass('animate-spin');
	                                modules.api({
	                                    caller:'Get notifications',
	                                    url: app.sapiurl+'/notifications/resend', 
	                                    data:{
	                                        id:data._id
	                                    },
	                                    callback: function(data){
	                                        te.removeClass('sending');
	                                        te.find('i').removeClass('animate-spin');
	                                        growl({
	                                            icon:'icon-thumbs-up',
	                                            content:data.message,
	                                            time:app.getProcessTime(data)
	                                        });
	                                        setTimeout(function(){
	                                            $.fn.alert.closeAlert();
	                                            self.refresh(1);
	                                        },1500);
	                                    }
	                                })
	                            }
	                        }
	                    })
	                });
	                if(data.id){
	                    ele.find('.x_showmore').stap(function(){
	                        ele.find('.history').removeClass('truncatehistory')
	                        ele.find('.x_showless').show();
	                        ele.find('.x_showmore').hide()
	                    })
	                    ele.find('.x_showless').stap(function(){
	                        ele.find('.history').addClass('truncatehistory');
	                        ele.find('.x_showless').hide();
	                        ele.find('.x_showmore').show()
	                    })
	                    self.loadHistory(data.id,data.cid,function(data){
	                        if(!data.error){
	                            self.renderHistory(ele,data);
	                        }else{
	                            ele.find('.history').html(data.error);
	                        }
	                    });
	                }else{
	                    ele.find('.historyrow').hide();
	                }
	                if(data.opts){
	                    var doc = document.getElementById('email').contentWindow.document;
	                    doc.open();
	                    var s=app.sapiurl.replace(app.site,'email')+'/read.png?';
	                    var r=app.sapiurl.replace(app.site,'email')+'/read.png?preview=1&';
	                    if(data.raw){
	                        var write=self.getRawEmailHTML(data.opts.RawMessage.Data);
	                    }else{
	                        data.opts.Message.Body.Html.Data=data.opts.Message.Body.Html.Data.replace(s,r);
	                        var write=data.opts.Message.Body.Html.Data;
	                    }
	                    doc.write(write);
	                    doc.close();
	                }
	            }
	        }]
	    })
	}
	this.clearUserSearch=function(){
        var self=this;
        self.ele.find('.usersearchcontent').html('');
        self.ele.find('.usersearch').hide();
    }
    this.searchUsers=function(search){
        if(search.length){
            self.ele.find('.usersearchcontent').render({
                template:'admin_logs_searchloading',
                append:false
            })
            self.ele.find('.usersearch').show();
            modules.api({
                caller:'Action',
                url: app.sapiurl+'/search/user', 
                data:{
                    search:search
                },
                callback:function(data){
                    if(data.success){
                        self.ele.find('.usersearchcontent').render({
                            template:'admin_logs_searchusers',
                            append:false,
                            data:data,
                            binding:function(ele){
                                new modules.scroller(self.ele.find('.usersearch'));
                                ele.find('.item').stap(function(){
                                    var u=data.users.list[$(this).attr('data-id')];
                                    self.setUser(u);
                                },1,'tapactive')
                            }
                        })
                    }else{
                        _alert('error');
                    }
                }
            })
        }else{
            self.clearUserSearch()
        }
    }
    this.renderSearch=function(){
        self.ele.find('.usersearcharea').render({
            template:'admin_logs_usersearcharea',
            append:false,
            data:{
                user:(self.currentUser)?self.currentUser:false
            },
            binding:function(ele){
                ele.find('.x_user').on('keyup paste',function(){
                    var c=$(this).val();
                    self.searchUsers(c);
                });
                ele.find('.x_clear').stap(function(){
                    self.clearUser();
                },1,'tapactive')
            }
        });
    }
    this.refresh=function(){
		if(self.inf){
			self.inf.options.opts.filter=self.filter;
			self.inf.options.opts.search=self.search;
			if(window._reveal) self.inf.options.opts.reveal=1;
			self.inf.reload();
		}
	}
    this.clearUser=function(){
        if(self.search.user) delete self.search.user;
        self.currentUser=false
        //updat ui
        self.renderSearch();
        self.refresh(1);
    }
    this.search={};
    this.setUser=function(user){
        self.currentUser=user;
        self.search.user=user.id;
        self.refresh(1);
        //update ui
        self.clearUserSearch();
        self.renderSearch();
    }
	this.hide=function(){
		self.inf.stop();
		self.ele.hide();
	}
	this.destroy=function(){
    	self.inf.destroy();
		self.ele.remove();
    }
}