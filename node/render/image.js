var page = require('webpage').create();
var system = require('system');
var opts=JSON.parse(system.args[1]);
page.settings.userAgent = 'Mozilla/5.0 (Windows NT 6.0; WOW64) AppleWebKit/535.7 (KHTML, like Gecko) Chrome/16.0.912.75 Safari/535.7';
page.customHeaders = {'Referer': opts.url};
page.onConsoleMessage = function(msg) {
    console.log(msg);
};
page.open(opts.url, function(status) {
    if ( status === "success" ) {
        window.setTimeout(function(){
            page.viewportSize = { width:opts.size.width,height:opts.size.height}
            page.physicalSize = { width:opts.size.width,height:opts.size.height}
            page.zoomFactor = 1;
            page.clipRect = { top: 0, left: 0, width:opts.size.width, height: opts.size.height};
            //console.log('saving to: '+opts.save);
            page.render(opts.save);
            phantom.exit();
        },1000);
    }
    else
    {
    	console.log('Sorry, ['+opts.url+'] could not be loaded')
    	phantom.exit();
    }
});