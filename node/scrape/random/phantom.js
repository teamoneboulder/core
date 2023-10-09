const phantom = require('phantom');

(async function() {
    const instance = await phantom.create();
    const page = await instance.createPage();
    // await page.on("onResourceRequested", function(requestData) {
    //     console.info('Requesting', requestData.url)
    // });
    const status = await page.open('https://stackoverflow.com/');
    page.includeJs('http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js', function(err){
        console.log('HAS JQUERY')
        page.evaluate(function() {
            console.log($('a').length)
            var d=[];
            $('a').each(function(i,v){
                d.push(v.href)
            })
            return d;
        }).then(function(html){
            console.log(html);
        });
    })
    // const status = await page.open('https://stackoverflow.com/');
    // console.log(status);

    // const content = await page.property('content');
    // console.log(content);

    //await instance.exit();
}());