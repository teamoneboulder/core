var beautify = require('js-beautify').js;
var request = require('request');
var url=process.argv[2];
var column=process.argv[3];
var line=(process.argv[4])?process.argv[4]:1;;
String.prototype.splice = function(start, delCount, newSubStr) {
    return this.slice(0, start) + newSubStr + this.slice(start + Math.abs(delCount));
};
request.get(url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
        var data = body;
        var dp=data.split(/\r?\n/);
        if(column){
            var linedata=dp[line-1];//line 1 will be 0 in array
        	var index=parseInt(column,10);
        	var p1=linedata.substr(0,index);
        	var p2=linedata.substr(index+1,linedata.length);
        	var no=p2.indexOf('}');//cant trust ;, will get scoped block
        	var insertAt=index+no+2;
        	linedata=linedata.splice(insertAt,0,'//******\r\n');
            dp[line-1]=linedata;
            //console.log((line-1)+' ' +linedata);
        }
        data=dp.join('\r\n');//put back
        // Continue with your processing here.
        console.log(Buffer.from(beautify(data, { indent_size: 2, space_in_empty_paren: true }), 'utf8').toString('hex'));
    }else{
    	console.log('error_loading');
    }
});