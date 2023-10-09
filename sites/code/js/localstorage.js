function isLocalStorageNameSupported() 
{
    var testKey = 'test', storage = window.localStorage;
    try 
    {
        storage.setItem(testKey, '1');
        storage.removeItem(testKey);
        return true;
    } 
    catch (error) 
    {
        return false;
    }
}
if(isLocalStorageNameSupported()){
	//Globals
	/* STORAGE PROTOTYPES*/
	window.localstoreenabled=1;
	Storage.prototype.setObject = function(key, value,onload) {
	    this.setItem(key, JSON.stringify(value));
	};
	Storage.prototype.getObject = function(key,ret) {
	    return (this.getItem(key))?JSON.parse(this.getItem(key)):(!ret)?{}:[];
	};
	Storage.prototype.getVar = function(key) {
	    var val=this.getItem(key);
	    if(val==='true') return true;
	    if(val==='false') return false;
	    else return val;
	};
	Storage.prototype.setVar = function(key, value,onload) {
	    this.setItem(key, value);
	};
}else{
	window.localstoreenabled=0;
	Storage.prototype.setObject = function(key, value) {
	    //this.setItem(key, JSON.stringify(value));
	};
	Storage.prototype.getObject = function(key,ret) {
		return (ret)?[]:{};
	    //return (this.getItem(key))?JSON.parse(this.getItem(key)):(!ret)?{}:[];
	};
	Storage.prototype.getVar = function(key) {
	    //return this.getItem(key);
	    return false;
	};
	Storage.prototype.setVar = function(key, value) {
	    //this.setItem(key, value);
	};
}