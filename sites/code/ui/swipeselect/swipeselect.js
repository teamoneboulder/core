$(function(){
	;window._ui.swipeselect={
		render:function(opts){
			if(!opts.width) opts.width=280;
			return $.fn.render({//return template
				returntemplate:true,
				template:'ui_swipeselect',
				data:opts
			})
		},
		bindings:[{
			type:'fn',
			binding:function(ele,opts){
				var w=0;
				$.each(ele.find('.swipeselect_width'),function(i,v){
					w+=$(v).outerWidth();
				});
				w+=10;
				ele.find('.swipeselect_parent').css('width',w);
				var swipeParent=ele.find('.swipeselect_parent');
				var snapTo=ele.find('.snapto');
				//set scroller!
				var lastX=0;
				var eid=ele.attr('id');
				var initX=0;
				if(opts.selected){
					$.each(ele.find('.swipeselect_item'),function(i,v){
						var cv=$(v).attr('data-val');
						if(parseInt(cv,10)==parseInt(opts.selected,10)){
							return false;
						}else{
							if(i!=0){
								initX-=$(v).outerWidth();
							}
						}
					});
				}
				new Impetus({
				    source: ele[0],
				    boundX:[-w+($('body').width()/2),0],
				    initialValues:[initX,0],
				    onEnd:function(x,y){
				    	//snap!
				    	var startIndex=Math.floor((Math.abs(x)/44))+2;
				    	var tc=0;
				    	var snapoffset=snapTo.offset();
				    	var diffs={};
				    	var mindiff=500;
				    	var index=false;
				    	while(tc<4){
				    		//calculate nearest!
				    		var i=startIndex+tc;
				    		var ele=swipeParent.find(':nth-child('+(i)+')');
				    		if(ele.length){
					    		var o=ele.offset();
					    		var diff=snapoffset.left-o.left;
					    		var adiff=Math.abs(diff);
					    		if(adiff<44){
					    			var nx=x+diff;
					    			diffs[i]={
					    				nx:nx,
					    				val:ele.attr('data-val'),
					    				diff:adiff
					    			}
					    			if(diffs[i].diff<mindiff){
					    				mindiff=diffs[i].diff
					    				index=i;
					    			}
					    		}
					    	}
				    		tc++;
				    	}
				    	if(index){
				    		var data=diffs[index];
		    				TweenLite.fromTo(swipeParent, .3, {x:lastX},{x:data.nx,onComplete:function(){
			    				if(eid&&window._ui.events&&window._ui.events[eid]&&window._ui.events[eid].onSelect){
									window._ui.events[eid].onSelect(data.val);
								}else{
									console.warn('no onSelect binding')
								}
		                    }})
				    	}
				    },
				    update: function(x, y) {
				        // whatever you want to do with the values
				        swipeParent[0].style.transform='matrix(1, 0, 0, 1, '+x+', 0)';
				        swipeParent[0].style.webkitTransform = 'matrix(1, 0, 0, 1, '+x+', 0)';
				        lastX=x;
				    }
				});
				//if there is a selected one, scroll to it!
				// app.setScroll(ele.find('.swipearea'),{momentum:true,eventPassthrough: true, scrollX: true, scrollY: false, preventDefault: false,snap:'.swipeselect_item'},{
				// 	scrollEnd:function(e){
				// 		console.log('end')
				// 	}
				// })
			}
		}]
	};
});