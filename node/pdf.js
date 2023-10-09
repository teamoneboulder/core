const phantom = require('phantom');
var tools=require('./tools.js');
var fs=require('fs');
var opts=tools.getBase64(process.argv[2]);
// var opts={
//     url:'https://xxxx.earth/render/ticket/T6K1TBIWYN9SL?token=428e6f58d094df093fb47acbf6f2e8ce',
//     out:'/tmp/test_file.pdf'
// }
function waitfor(start,page,maxtimeOutMillis,testFx,onFail){
    if(!start) start=new Date().getTime();
    var self=this;
    if ( (new Date().getTime() - start < maxtimeOutMillis) ) {
        testFx(page,function(success){
            //do next!
            setTimeout(function(){
                waitfor(start,page,maxtimeOutMillis,testFx,onFail)
            },50);
        });
    } else {
        onFail();
    }
}
function onFail(){
    console.log('Failed to load');
    exit()
}
setTimeout(function(){
    console.log('timeout!');
    exit()
},10000)
console.log('starting');
var phInstance='';
function exit(){
    if(phInstance) phInstance.exit();
    process.exit(0);
}
phantom.create(['--ignore-ssl-errors=yes'])
.then(instance => {
    console.log('got instance');
    phInstance = instance;
    return instance.createPage();
})
.then(page => {
// use page
    //page.settings.resourceTimeout = 10000; // Avoid freeze!!!
    console.log('setting paper size');
    page.property('paperSize',{
        width: '8.5in',
        height: '11in',
        margin: {
            top: '.5in',
            left: '.5in',
            right: '.5in',
            bottom: '.5in'
          }
    });
    //opts.url='https://app.oneboulder.one/download';
    console.log('loading url: '+opts.url);
    console.log('Output to: '+opts.out);
    if(opts.debug||true){//debugging shit!
        page.on('onConsoleMessage', function (message) {
             console.log('page: '+message)
        });    
        page.on('onResourceRequested',function (request) {
            console.log('= onResourceRequested()');
            console.log('  request: ' + JSON.stringify(request, undefined, 4));
        })

        page.on('onResourceReceived',function(response) {
            console.log('= onResourceReceived()' );
            console.log('  id: ' + response.id + ', stage: "' + response.stage + '", response: ' + JSON.stringify(response));
        });

        page.on('onLoadStarted',function() {
            console.log('= onLoadStarted()');
            var currentUrl = page.evaluate(function() {
                return window.location.href;
            });
            console.log('  leaving url: ' + currentUrl);
        })

        page.on('onLoadFinished',function(status) {
            console.log('= onLoadFinished()');
            console.log('  status: ' + status);
        })

        page.on('onNavigationRequested',function(url, type, willNavigate, main) {
            console.log('= onNavigationRequested');
            console.log('  destination_url: ' + url);
            console.log('  type (cause): ' + type);
            console.log('  will navigate: ' + willNavigate);
            console.log('  from page\'s main frame: ' + main);
        })

        page.on('onResourceError',function(resourceError) {
            console.log('= onResourceError()');
            console.log('  - unable to load url: "' + resourceError.url + '"');
            console.log('  - error code: ' + resourceError.errorCode + ', description: ' + resourceError.errorString );
        })

        page.on('onError',function(msg, trace) {
            console.log('= onError()');
            var msgStack = ['  ERROR: ' + msg];
            if (trace) {
                msgStack.push('  TRACE:');
                trace.forEach(function(t) {
                    msgStack.push('    -> ' + t.file + ': ' + t.line + (t.function ? ' (in function "' + t.function + '")' : ''));
                });
            }
            console.log(msgStack.join('\n'));
        })
    }
    page.open(opts.url).then(function(){
        console.log('loaded page!');
        waitfor(0,page,10000,function(page,fcb){
             page.evaluate(function() {
                //return true;
                if(window._loaded) return true; // this isnt working...not sure why?
                return false;
            }).then(function(issuccess){
                if(issuccess){
                    console.log('successfully loaded!');
                    setTimeout(function(){//make sure any images or assests are loaded
                        page.render(opts.out, {format: 'pdf'});
                        //set perms
                        setTimeout(function(){
                            try{
                                fs.chmodSync(opts.out,0777);
                                exit();
                            }catch(e){
                                console.log('ERROR')
                                exit();
                            }
                        },1000)
                    },1000);
                }else{
                    console.log('waiting for load [window._loaded]=['+0+']');
                    fcb();
                }
            });
        },function(){
            console.log('Didnt finish loading');
            onFail()
        })
    })
})
.catch(error => {
    console.log(error);
    exit();
});