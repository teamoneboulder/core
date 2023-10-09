const phantom = require('phantom');
var mongojs = require('mongojs');
var datadb = mongojs('data');
var datacoll=datadb.collection('numundo');//only get collection once.
var markerdb = mongojs('groupup');
var markercoll=markerdb.collection('map_marker');//only get collection once
var async=require('async');
var queue = async.queue(function (marker, fin) {
    saveItem(marker,fin);
}, 10);
var count=0;
queue.drain = function() {
    console.log('successfully loaded ['+count+'] items');
    phInstance.exit();
    process.exit(0)
}
function saveItem(marker,fin){
    count++;
    markercoll.save(marker,function(){
        fin();
    });
}
phantom.create().then(instance => {
    phInstance = instance;
    return instance.createPage();
}).then(page => {
    page.open('https://numundo.org/centers').then(function(){
        page.evaluate(function() {
            return window.allCenters
        }).then(function(data){
            var c=0;
            while(data[c]){
                var doc=data[c];
                //datacoll.save(doc);
                if(doc.location&&doc.location.coords){
                    //create and save marker
                    var marker={
                        _id:'numundo_'+doc._id,
                        loc:{
                            lat:doc.location.coords[1],
                            lng:doc.location.coords[0]
                        },
                        description:doc.mission.en,
                        layer:'communities',
                        sub_layer:'numundo',
                        name:doc.title,
                        via:'numundo',
                        links:[{
                            name:'Numundo Page',
                            url:'https://numundo.org/center/'+doc.slug
                        }]
                    }
                    queue.push(marker)
                }
                c++;
            }
        });
    });
}).catch(error => {
    console.log(error);
    phInstance.exit();
});