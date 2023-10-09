var page = require('webpage').create();
var system = require('system');
var debug=0;
var opts=JSON.parse(system.args[1]);
if(system.args[2]) debug=1;
page.settings.userAgent = 'Mozilla/5.0 (Windows NT 6.0; WOW64) AppleWebKit/535.7 (KHTML, like Gecko) Chrome/16.0.912.75 Safari/535.7';
page.customHeaders = {'Referer': opts.url};
if(debug){
    page.onConsoleMessage = function(msg) {
        console.log(msg);
    };
}
function tlog(msg){
    if(debug) console.log(msg);
}
function waitFor(testFx, onReady, timeOutMillis,debug) {
    var maxtimeOutMillis = timeOutMillis ? timeOutMillis : 10000, //< Default Max Timout is 3s
        start = new Date().getTime(),
        condition = false,
        interval = setInterval(function() {
            if ( (new Date().getTime() - start < maxtimeOutMillis) && !condition ) {
                // If not time-out yet and condition not yet fulfilled
                condition = (typeof(testFx) === "string" ? eval(testFx) : testFx()); //< defensive code
                if(debug) tlog('condition: '+condition);
            } else {
                if(!condition) {
                    // If condition still not fulfilled (timeout but condition is 'false')
                    tlog("'waitFor()' timeout");
                    phantom.exit(1);
                } else {
                    // Condition fulfilled (timeout and/or condition is 'true')
                    tlog("'waitFor()' finished in " + (new Date().getTime() - start) + "ms.");
                    typeof(onReady) === "string" ? eval(onReady) : onReady(); //< Do what it's supposed to do once the condition is fulfilled
                    clearInterval(interval); //< Stop this interval
                }
            }
        }, 100); //< repeat check every 100ms
};
var saved=[];
function renderPages(){
    var current=page.evaluate(function(){
        app.screenshot.next();
        return app.screenshot.current;
    })
    waitFor(function() {
        // Check in the page if a specific element is now visible
        return page.evaluate(function() {
            return app.screenshot.ready;
        });
    }, function() {
        tlog('rendering page ['+current.name+'] to '+opts.savepath+'/'+current.index+'_'+opts.platform+'_'+opts.type+'_'+opts.lang+'_'+current.name+'.png');
        setTimeout(function(){
            saved.push(opts.savepath+'/'+current.index+'_'+opts.platform+'_'+opts.type+'_'+opts.lang+'_'+current.name+'.png');
            page.render(opts.savepath+'/'+current.index+'_'+opts.platform+'_'+opts.type+'_'+opts.lang+'_'+current.name+'.png');
            if(current&&current.hasNext){
                renderPages();
            }else{
                tlog('Done Rendering Screenshots!');
                console.log(JSON.stringify(saved));
                page.release();
                phantom.exit();
            }
        },100)
    },10000);
}
page.open(opts.url, function(status) {
    if ( status === "success" ) {
        page.viewportSize = { width:opts.size.width,height:opts.size.height}
        page.physicalSize = { width:opts.size.width,height:opts.size.height}
        page.zoomFactor = 1;
        page.clipRect = { top: 0, left: 0, width:opts.size.width, height: opts.size.height};
        // if(opts.scale){
        //     page.evaluate(function(scale){
        //         document.body.style.webkitTransform = "scale("+scale+")";
        //         document.body.style.webkitTransformOrigin = "0% 0%";
        //         document.body.style.width = (100/scale)+"%";
        //         document.body.style.height = (100/scale)+"%";
        //     },opts.scale)
        // }
        waitFor(function() {
                // Check in the page if a specific element is now visible
                return page.evaluate(function(scale) {
                    if(window.app&&window.app.loaded){
                        window.app.setScale(scale);
                        //window.app.screenshot.scale=1/scale;
                        return 1;
                    }else{
                        return 0;
                    }
                },opts.scale);
        }, function() {
            tlog('Ready to render');
            setTimeout(function(){//wait for splash screen to get done hiding
                renderPages(); 
            },500)
        });
    }
    else
    {
    	tlog('Sorry, ['+address+'] could not be loaded')
    	phantom.exit();
    }
});