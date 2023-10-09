;window.webworker={
    thread:'main',//worker
    id:'api_thread',
    load:function(func){
        var self=this;
        var entire = func.toString(); 
        var code=entire.slice(entire.indexOf('{') + 1, entire.lastIndexOf('}'));
        var wrapped="self.addEventListener('message', function(workerMsg) { "+code+"})";
        return self.make(wrapped)
    },
    make:function(script) {
        var URL = window.URL || window.webkitURL;
        var Blob = window.Blob;
        var Worker = window.Worker;
        if (!URL || !Blob || !Worker || !script) {
            alert('web workers not supported!');
            return null;
        }
        var blob = new Blob([script]);
        var url=URL.createObjectURL(blob);
        var worker = new Worker(url);
        URL.revokeObjectURL(url);
        return worker;
    },
    init:function(){
        var self=this;
        self.worker=self.load(self.api);
        self.worker.onmessage = function(e) {
            self.receive(e.data);
        };
    },
    destroy:function(){
        var self=this;
        if(self.thread=='worker'){//create web worker!!!
            self.worker.terminate();
        }else{
            if(self.worker) delete self.worker;//going to happen soon
        }
    },
    callbacks:{},
    run:function(obj,callback){
        //add in type
        var self=this;
        obj.thread=self.thread;
        obj.startTime=new Date().getTime();
        obj.id='cb'+Math.uuid(8);//create unique callback id
        if(callback) self.callbacks[obj.id]=callback;
        if(self.thread=='worker'){
            self.worker.postMessage(obj)
        }else{
            self.workerFn({data:obj})
        }
    },
    receive:function(obj){//standardized response, thread agnostic
        var self=this;
        obj.endTime=new Date().getTime();
        obj.processTime=(obj.endTime-obj.startTime)+' ms';
        switch(obj.action){
            case 'callback':
                if(self.callbacks[obj.id]){
                    console.log('Process Time '+obj.processTime,1);
                    self.callbacks[obj.id](obj.data);
                    delete self.callbacks[obj.id];   
                }
            break;
            default:
                if(window.isdev){
                    if(obj.alert||window.showalert) _alert(JSON.stringify(obj))
                    else console.log('======Message From Thread ['+self.id+'] ',obj);
                }
            break;
        }
    },
    workerFn:function(workerMsg){
        /////******API HELPER Functions******////
        if(workerMsg.data.thread=='worker'){//stores data within workerfn or worker thread
            var worker=self;
            var indexeddb = self.indexedDB || self.webkitIndexedDB || self.mozIndexedDB;
        }else{
            var worker=this;
            var indexeddb = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB;
        }
        function handleAction(workerMsg){
            console.log(workerMsg)
            var api={
                set:function(data){
                    if(data.variables) for(varname in data.variables){
                        worker[varname]=data.variables[varname];
                    }
                },
                send:function(response){
                    console.log(response)
                    response.startTime=workerMsg.data.startTime;//pass on timing
                    //after run, communicate properly...
                    response.id=workerMsg.data.id;
                    if(workerMsg.data.thread=='worker'){
                        if(workerMsg.data.thread=='worker'||response.error||response.message) postMessage(response);//send to parent
                        else if(worker.threads[workerMsg.data.thread]&&!response.message) worker.threads[workerMsg.data.thread].postMessage(response);
                        else{
                            postMessage({message:'Invalid Communication',response:response});//send to parent
                        }
                    }else{//ok to pass this way as it runs locally
                        worker.receive(response);
                    }
                }
            }
            switch(workerMsg.data.action){
                default:
                    var response={error:'Invalid Action',data:workerMsg};
                break;
            }
            ////////******END API******///
            if(response) api.send(response);
        }
        handleAction(workerMsg);
    }
};
webworker.init();//initalize