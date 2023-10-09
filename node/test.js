var tools = require('./tools.js');
tools.init();
var data=tools.getBase64(process.argv[2]);
if(data.link){
var result={hash:tools.db.getId({url:data.link},'link')};
console.log(tools.toBase64(result));
}else{
	var result={hash:tools.db.getId(data,'images')};
	console.log(tools.toBase64(result));
}
// var content='hello i am test content!';
// var e=tools.aes.encrypt(content);
// var res=tools.aes.decrypt(e);
// console.log(res);
// var original='EAARKBequANMBADvwJZBpxWT2B5y8ZAqADklxG3FgQAXpWgZADMbUNQOSq9mZC8eI2To79sSVcdEUH2ucrTN46Lw46TmfE8ZAUxJd98fsun1nndLZAit3U4ZAjPG0KeNzSoHGGf0yya16fiJ76tQZA3ZBIkD9ZAVjwPZA70xjJ0KYvED1gZDZD'
