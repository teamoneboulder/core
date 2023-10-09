;if(!window._ui) window._ui={};
if(!window._ui.events) window._ui.events={};
if(!window._ui.opts) window._ui.opts={};
window._ui.register=function(id,events){
	window._ui.events[id]=events;
};
window._ui.deregister=function(id){ 
	if(window._ui.events[id]) delete window._ui.events[id];
	if(window._ui.opts[id]) delete window._ui.opts[id];
};