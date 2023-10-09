/*! howler.js v2.1.2 | (c) 2013-2019, James Simpson of GoldFire Studios | MIT License | howlerjs.com */
!function(){"use strict";var e=function(){this.init()};e.prototype={init:function(){var e=this||n;return e._counter=1e3,e._html5AudioPool=[],e.html5PoolSize=10,e._codecs={},e._howls=[],e._muted=!1,e._volume=1,e._canPlayEvent="canplaythrough",e._navigator="undefined"!=typeof window&&window.navigator?window.navigator:null,e.masterGain=null,e.noAudio=!1,e.usingWebAudio=!0,e.autoSuspend=!0,e.ctx=null,e.autoUnlock=!0,e._setup(),e},volume:function(e){var o=this||n;if(e=parseFloat(e),o.ctx||_(),void 0!==e&&e>=0&&e<=1){if(o._volume=e,o._muted)return o;o.usingWebAudio&&o.masterGain.gain.setValueAtTime(e,n.ctx.currentTime);for(var t=0;t<o._howls.length;t++)if(!o._howls[t]._webAudio)for(var r=o._howls[t]._getSoundIds(),a=0;a<r.length;a++){var u=o._howls[t]._soundById(r[a]);u&&u._node&&(u._node.volume=u._volume*e)}return o}return o._volume},mute:function(e){var o=this||n;o.ctx||_(),o._muted=e,o.usingWebAudio&&o.masterGain.gain.setValueAtTime(e?0:o._volume,n.ctx.currentTime);for(var t=0;t<o._howls.length;t++)if(!o._howls[t]._webAudio)for(var r=o._howls[t]._getSoundIds(),a=0;a<r.length;a++){var u=o._howls[t]._soundById(r[a]);u&&u._node&&(u._node.muted=!!e||u._muted)}return o},unload:function(){for(var e=this||n,o=e._howls.length-1;o>=0;o--)e._howls[o].unload();return e.usingWebAudio&&e.ctx&&void 0!==e.ctx.close&&(e.ctx.close(),e.ctx=null,_()),e},codecs:function(e){return(this||n)._codecs[e.replace(/^x-/,"")]},_setup:function(){var e=this||n;if(e.state=e.ctx?e.ctx.state||"suspended":"suspended",e._autoSuspend(),!e.usingWebAudio)if("undefined"!=typeof Audio)try{var o=new Audio;void 0===o.oncanplaythrough&&(e._canPlayEvent="canplay")}catch(n){e.noAudio=!0}else e.noAudio=!0;try{var o=new Audio;o.muted&&(e.noAudio=!0)}catch(e){}return e.noAudio||e._setupCodecs(),e},_setupCodecs:function(){var e=this||n,o=null;try{o="undefined"!=typeof Audio?new Audio:null}catch(n){return e}if(!o||"function"!=typeof o.canPlayType)return e;var t=o.canPlayType("audio/mpeg;").replace(/^no$/,""),r=e._navigator&&e._navigator.userAgent.match(/OPR\/([0-6].)/g),a=r&&parseInt(r[0].split("/")[1],10)<33;return e._codecs={mp3:!(a||!t&&!o.canPlayType("audio/mp3;").replace(/^no$/,"")),mpeg:!!t,opus:!!o.canPlayType('audio/ogg; codecs="opus"').replace(/^no$/,""),ogg:!!o.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/,""),oga:!!o.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/,""),wav:!!o.canPlayType('audio/wav; codecs="1"').replace(/^no$/,""),aac:!!o.canPlayType("audio/aac;").replace(/^no$/,""),caf:!!o.canPlayType("audio/x-caf;").replace(/^no$/,""),m4a:!!(o.canPlayType("audio/x-m4a;")||o.canPlayType("audio/m4a;")||o.canPlayType("audio/aac;")).replace(/^no$/,""),mp4:!!(o.canPlayType("audio/x-mp4;")||o.canPlayType("audio/mp4;")||o.canPlayType("audio/aac;")).replace(/^no$/,""),weba:!!o.canPlayType('audio/webm; codecs="vorbis"').replace(/^no$/,""),webm:!!o.canPlayType('audio/webm; codecs="vorbis"').replace(/^no$/,""),dolby:!!o.canPlayType('audio/mp4; codecs="ec-3"').replace(/^no$/,""),flac:!!(o.canPlayType("audio/x-flac;")||o.canPlayType("audio/flac;")).replace(/^no$/,"")},e},_unlockAudio:function(){var e=this||n;if(!e._audioUnlocked&&e.ctx){e._audioUnlocked=!1,e.autoUnlock=!1,e._mobileUnloaded||44100===e.ctx.sampleRate||(e._mobileUnloaded=!0,e.unload()),e._scratchBuffer=e.ctx.createBuffer(1,1,22050);var o=function(n){for(var t=0;t<e.html5PoolSize;t++)try{var r=new Audio;r._unlocked=!0,e._releaseHtml5Audio(r)}catch(n){e.noAudio=!0}for(var t=0;t<e._howls.length;t++)if(!e._howls[t]._webAudio)for(var a=e._howls[t]._getSoundIds(),u=0;u<a.length;u++){var i=e._howls[t]._soundById(a[u]);i&&i._node&&!i._node._unlocked&&(i._node._unlocked=!0,i._node.load())}e._autoResume();var d=e.ctx.createBufferSource();d.buffer=e._scratchBuffer,d.connect(e.ctx.destination),void 0===d.start?d.noteOn(0):d.start(0),"function"==typeof e.ctx.resume&&e.ctx.resume(),d.onended=function(){d.disconnect(0),e._audioUnlocked=!0,document.removeEventListener("touchstart",o,!0),document.removeEventListener("touchend",o,!0),document.removeEventListener("click",o,!0);for(var n=0;n<e._howls.length;n++)e._howls[n]._emit("unlock")}};return document.addEventListener("touchstart",o,!0),document.addEventListener("touchend",o,!0),document.addEventListener("click",o,!0),e}},_obtainHtml5Audio:function(){var e=this||n;if(e._html5AudioPool.length)return e._html5AudioPool.pop();var o=(new Audio).play();return o&&"undefined"!=typeof Promise&&(o instanceof Promise||"function"==typeof o.then)&&o.catch(function(){console.warn("HTML5 Audio pool exhausted, returning potentially locked audio object.")}),new Audio},_releaseHtml5Audio:function(e){var o=this||n;return e._unlocked&&o._html5AudioPool.push(e),o},_autoSuspend:function(){var e=this;if(e.autoSuspend&&e.ctx&&void 0!==e.ctx.suspend&&n.usingWebAudio){for(var o=0;o<e._howls.length;o++)if(e._howls[o]._webAudio)for(var t=0;t<e._howls[o]._sounds.length;t++)if(!e._howls[o]._sounds[t]._paused)return e;return e._suspendTimer&&clearTimeout(e._suspendTimer),e._suspendTimer=setTimeout(function(){e.autoSuspend&&(e._suspendTimer=null,e.state="suspending",e.ctx.suspend().then(function(){e.state="suspended",e._resumeAfterSuspend&&(delete e._resumeAfterSuspend,e._autoResume())}))},3e4),e}},_autoResume:function(){var e=this;if(e.ctx&&void 0!==e.ctx.resume&&n.usingWebAudio)return"running"===e.state&&e._suspendTimer?(clearTimeout(e._suspendTimer),e._suspendTimer=null):"suspended"===e.state?(e.ctx.resume().then(function(){e.state="running";for(var n=0;n<e._howls.length;n++)e._howls[n]._emit("resume")}),e._suspendTimer&&(clearTimeout(e._suspendTimer),e._suspendTimer=null)):"suspending"===e.state&&(e._resumeAfterSuspend=!0),e}};var n=new e,o=function(e){var n=this;if(!e.src||0===e.src.length)return void console.error("An array of source files must be passed with any new Howl.");n.init(e)};o.prototype={init:function(e){var o=this;return n.ctx||_(),o._autoplay=e.autoplay||!1,o._format="string"!=typeof e.format?e.format:[e.format],o._html5=e.html5||!1,o._muted=e.mute||!1,o._loop=e.loop||!1,o._pool=e.pool||5,o._preload="boolean"!=typeof e.preload||e.preload,o._rate=e.rate||1,o._sprite=e.sprite||{},o._src="string"!=typeof e.src?e.src:[e.src],o._volume=void 0!==e.volume?e.volume:1,o._xhrWithCredentials=e.xhrWithCredentials||!1,o._duration=0,o._state="unloaded",o._sounds=[],o._endTimers={},o._queue=[],o._playLock=!1,o._onend=e.onend?[{fn:e.onend}]:[],o._onfade=e.onfade?[{fn:e.onfade}]:[],o._onload=e.onload?[{fn:e.onload}]:[],o._onloaderror=e.onloaderror?[{fn:e.onloaderror}]:[],o._onplayerror=e.onplayerror?[{fn:e.onplayerror}]:[],o._onpause=e.onpause?[{fn:e.onpause}]:[],o._onplay=e.onplay?[{fn:e.onplay}]:[],o._onstop=e.onstop?[{fn:e.onstop}]:[],o._onmute=e.onmute?[{fn:e.onmute}]:[],o._onvolume=e.onvolume?[{fn:e.onvolume}]:[],o._onrate=e.onrate?[{fn:e.onrate}]:[],o._onseek=e.onseek?[{fn:e.onseek}]:[],o._onunlock=e.onunlock?[{fn:e.onunlock}]:[],o._onresume=[],o._webAudio=n.usingWebAudio&&!o._html5,void 0!==n.ctx&&n.ctx&&n.autoUnlock&&n._unlockAudio(),n._howls.push(o),o._autoplay&&o._queue.push({event:"play",action:function(){o.play()}}),o._preload&&o.load(),o},load:function(){var e=this,o=null;if(n.noAudio)return void e._emit("loaderror",null,"No audio support.");"string"==typeof e._src&&(e._src=[e._src]);for(var r=0;r<e._src.length;r++){var u,i;if(e._format&&e._format[r])u=e._format[r];else{if("string"!=typeof(i=e._src[r])){e._emit("loaderror",null,"Non-string found in selected audio sources - ignoring.");continue}u=/^data:audio\/([^;,]+);/i.exec(i),u||(u=/\.([^.]+)$/.exec(i.split("?",1)[0])),u&&(u=u[1].toLowerCase())}if(u||console.warn('No file extension was found. Consider using the "format" property or specify an extension.'),u&&n.codecs(u)){o=e._src[r];break}}return o?(e._src=o,e._state="loading","https:"===window.location.protocol&&"http:"===o.slice(0,5)&&(e._html5=!0,e._webAudio=!1),new t(e),e._webAudio&&a(e),e):void e._emit("loaderror",null,"No codec support for selected audio sources.")},play:function(e,o){var t=this,r=null;if("number"==typeof e)r=e,e=null;else{if("string"==typeof e&&"loaded"===t._state&&!t._sprite[e])return null;if(void 0===e&&(e="__default",!t._playLock)){for(var a=0,u=0;u<t._sounds.length;u++)t._sounds[u]._paused&&!t._sounds[u]._ended&&(a++,r=t._sounds[u]._id);1===a?e=null:r=null}}var i=r?t._soundById(r):t._inactiveSound();if(!i)return null;if(r&&!e&&(e=i._sprite||"__default"),"loaded"!==t._state){i._sprite=e,i._ended=!1;var d=i._id;return t._queue.push({event:"play",action:function(){t.play(d)}}),d}if(r&&!i._paused)return o||t._loadQueue("play"),i._id;t._webAudio&&n._autoResume();var _=Math.max(0,i._seek>0?i._seek:t._sprite[e][0]/1e3),s=Math.max(0,(t._sprite[e][0]+t._sprite[e][1])/1e3-_),l=1e3*s/Math.abs(i._rate),c=t._sprite[e][0]/1e3,f=(t._sprite[e][0]+t._sprite[e][1])/1e3,p=!(!i._loop&&!t._sprite[e][2]);i._sprite=e,i._ended=!1;var m=function(){i._paused=!1,i._seek=_,i._start=c,i._stop=f,i._loop=p};if(_>=f)return void t._ended(i);var v=i._node;if(t._webAudio){var h=function(){t._playLock=!1,m(),t._refreshBuffer(i);var e=i._muted||t._muted?0:i._volume;v.gain.setValueAtTime(e,n.ctx.currentTime),i._playStart=n.ctx.currentTime,void 0===v.bufferSource.start?i._loop?v.bufferSource.noteGrainOn(0,_,86400):v.bufferSource.noteGrainOn(0,_,s):i._loop?v.bufferSource.start(0,_,86400):v.bufferSource.start(0,_,s),l!==1/0&&(t._endTimers[i._id]=setTimeout(t._ended.bind(t,i),l)),o||setTimeout(function(){t._emit("play",i._id),t._loadQueue()},0)};"running"===n.state?h():(t._playLock=!0,t.once("resume",h),t._clearTimer(i._id))}else{var y=function(){v.currentTime=_,v.muted=i._muted||t._muted||n._muted||v.muted,v.volume=i._volume*n.volume(),v.playbackRate=i._rate;try{var r=v.play();if(r&&"undefined"!=typeof Promise&&(r instanceof Promise||"function"==typeof r.then)?(t._playLock=!0,m(),r.then(function(){t._playLock=!1,v._unlocked=!0,o||(t._emit("play",i._id),t._loadQueue())}).catch(function(){t._playLock=!1,t._emit("playerror",i._id,"Playback was unable to start. This is most commonly an issue on mobile devices and Chrome where playback was not within a user interaction."),i._ended=!0,i._paused=!0})):o||(t._playLock=!1,m(),t._emit("play",i._id),t._loadQueue()),v.playbackRate=i._rate,v.paused)return void t._emit("playerror",i._id,"Playback was unable to start. This is most commonly an issue on mobile devices and Chrome where playback was not within a user interaction.");"__default"!==e||i._loop?t._endTimers[i._id]=setTimeout(t._ended.bind(t,i),l):(t._endTimers[i._id]=function(){t._ended(i),v.removeEventListener("ended",t._endTimers[i._id],!1)},v.addEventListener("ended",t._endTimers[i._id],!1))}catch(e){t._emit("playerror",i._id,e)}};"data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA"===v.src&&(v.src=t._src,v.load());var g=window&&window.ejecta||!v.readyState&&n._navigator.isCocoonJS;if(v.readyState>=3||g)y();else{t._playLock=!0;var A=function(){y(),v.removeEventListener(n._canPlayEvent,A,!1)};v.addEventListener(n._canPlayEvent,A,!1),t._clearTimer(i._id)}}return i._id},pause:function(e){var n=this;if("loaded"!==n._state||n._playLock)return n._queue.push({event:"pause",action:function(){n.pause(e)}}),n;for(var o=n._getSoundIds(e),t=0;t<o.length;t++){n._clearTimer(o[t]);var r=n._soundById(o[t]);if(r&&!r._paused&&(r._seek=n.seek(o[t]),r._rateSeek=0,r._paused=!0,n._stopFade(o[t]),r._node))if(n._webAudio){if(!r._node.bufferSource)continue;void 0===r._node.bufferSource.stop?r._node.bufferSource.noteOff(0):r._node.bufferSource.stop(0),n._cleanBuffer(r._node)}else isNaN(r._node.duration)&&r._node.duration!==1/0||r._node.pause();arguments[1]||n._emit("pause",r?r._id:null)}return n},stop:function(e,n){var o=this;if("loaded"!==o._state||o._playLock)return o._queue.push({event:"stop",action:function(){o.stop(e)}}),o;for(var t=o._getSoundIds(e),r=0;r<t.length;r++){o._clearTimer(t[r]);var a=o._soundById(t[r]);a&&(a._seek=a._start||0,a._rateSeek=0,a._paused=!0,a._ended=!0,o._stopFade(t[r]),a._node&&(o._webAudio?a._node.bufferSource&&(void 0===a._node.bufferSource.stop?a._node.bufferSource.noteOff(0):a._node.bufferSource.stop(0),o._cleanBuffer(a._node)):isNaN(a._node.duration)&&a._node.duration!==1/0||(a._node.currentTime=a._start||0,a._node.pause(),a._node.duration===1/0&&o._clearSound(a._node))),n||o._emit("stop",a._id))}return o},mute:function(e,o){var t=this;if("loaded"!==t._state||t._playLock)return t._queue.push({event:"mute",action:function(){t.mute(e,o)}}),t;if(void 0===o){if("boolean"!=typeof e)return t._muted;t._muted=e}for(var r=t._getSoundIds(o),a=0;a<r.length;a++){var u=t._soundById(r[a]);u&&(u._muted=e,u._interval&&t._stopFade(u._id),t._webAudio&&u._node?u._node.gain.setValueAtTime(e?0:u._volume,n.ctx.currentTime):u._node&&(u._node.muted=!!n._muted||e),t._emit("mute",u._id))}return t},volume:function(){var e,o,t=this,r=arguments;if(0===r.length)return t._volume;if(1===r.length||2===r.length&&void 0===r[1]){t._getSoundIds().indexOf(r[0])>=0?o=parseInt(r[0],10):e=parseFloat(r[0])}else r.length>=2&&(e=parseFloat(r[0]),o=parseInt(r[1],10));var a;if(!(void 0!==e&&e>=0&&e<=1))return a=o?t._soundById(o):t._sounds[0],a?a._volume:0;if("loaded"!==t._state||t._playLock)return t._queue.push({event:"volume",action:function(){t.volume.apply(t,r)}}),t;void 0===o&&(t._volume=e),o=t._getSoundIds(o);for(var u=0;u<o.length;u++)(a=t._soundById(o[u]))&&(a._volume=e,r[2]||t._stopFade(o[u]),t._webAudio&&a._node&&!a._muted?a._node.gain.setValueAtTime(e,n.ctx.currentTime):a._node&&!a._muted&&(a._node.volume=e*n.volume()),t._emit("volume",a._id));return t},fade:function(e,o,t,r){var a=this;if("loaded"!==a._state||a._playLock)return a._queue.push({event:"fade",action:function(){a.fade(e,o,t,r)}}),a;e=parseFloat(e),o=parseFloat(o),t=parseFloat(t),a.volume(e,r);for(var u=a._getSoundIds(r),i=0;i<u.length;i++){var d=a._soundById(u[i]);if(d){if(r||a._stopFade(u[i]),a._webAudio&&!d._muted){var _=n.ctx.currentTime,s=_+t/1e3;d._volume=e,d._node.gain.setValueAtTime(e,_),d._node.gain.linearRampToValueAtTime(o,s)}a._startFadeInterval(d,e,o,t,u[i],void 0===r)}}return a},_startFadeInterval:function(e,n,o,t,r,a){var u=this,i=n,d=o-n,_=Math.abs(d/.01),s=Math.max(4,_>0?t/_:t),l=Date.now();e._fadeTo=o,e._interval=setInterval(function(){var r=(Date.now()-l)/t;l=Date.now(),i+=d*r,i=Math.max(0,i),i=Math.min(1,i),i=Math.round(100*i)/100,u._webAudio?e._volume=i:u.volume(i,e._id,!0),a&&(u._volume=i),(o<n&&i<=o||o>n&&i>=o)&&(clearInterval(e._interval),e._interval=null,e._fadeTo=null,u.volume(o,e._id),u._emit("fade",e._id))},s)},_stopFade:function(e){var o=this,t=o._soundById(e);return t&&t._interval&&(o._webAudio&&t._node.gain.cancelScheduledValues(n.ctx.currentTime),clearInterval(t._interval),t._interval=null,o.volume(t._fadeTo,e),t._fadeTo=null,o._emit("fade",e)),o},loop:function(){var e,n,o,t=this,r=arguments;if(0===r.length)return t._loop;if(1===r.length){if("boolean"!=typeof r[0])return!!(o=t._soundById(parseInt(r[0],10)))&&o._loop;e=r[0],t._loop=e}else 2===r.length&&(e=r[0],n=parseInt(r[1],10));for(var a=t._getSoundIds(n),u=0;u<a.length;u++)(o=t._soundById(a[u]))&&(o._loop=e,t._webAudio&&o._node&&o._node.bufferSource&&(o._node.bufferSource.loop=e,e&&(o._node.bufferSource.loopStart=o._start||0,o._node.bufferSource.loopEnd=o._stop)));return t},rate:function(){var e,o,t=this,r=arguments;if(0===r.length)o=t._sounds[0]._id;else if(1===r.length){var a=t._getSoundIds(),u=a.indexOf(r[0]);u>=0?o=parseInt(r[0],10):e=parseFloat(r[0])}else 2===r.length&&(e=parseFloat(r[0]),o=parseInt(r[1],10));var i;if("number"!=typeof e)return i=t._soundById(o),i?i._rate:t._rate;if("loaded"!==t._state||t._playLock)return t._queue.push({event:"rate",action:function(){t.rate.apply(t,r)}}),t;void 0===o&&(t._rate=e),o=t._getSoundIds(o);for(var d=0;d<o.length;d++)if(i=t._soundById(o[d])){t.playing(o[d])&&(i._rateSeek=t.seek(o[d]),i._playStart=t._webAudio?n.ctx.currentTime:i._playStart),i._rate=e,t._webAudio&&i._node&&i._node.bufferSource?i._node.bufferSource.playbackRate.setValueAtTime(e,n.ctx.currentTime):i._node&&(i._node.playbackRate=e);var _=t.seek(o[d]),s=(t._sprite[i._sprite][0]+t._sprite[i._sprite][1])/1e3-_,l=1e3*s/Math.abs(i._rate);!t._endTimers[o[d]]&&i._paused||(t._clearTimer(o[d]),t._endTimers[o[d]]=setTimeout(t._ended.bind(t,i),l)),t._emit("rate",i._id)}return t},seek:function(){var e,o,t=this,r=arguments;if(0===r.length)o=t._sounds[0]._id;else if(1===r.length){var a=t._getSoundIds(),u=a.indexOf(r[0]);u>=0?o=parseInt(r[0],10):t._sounds.length&&(o=t._sounds[0]._id,e=parseFloat(r[0]))}else 2===r.length&&(e=parseFloat(r[0]),o=parseInt(r[1],10));if(void 0===o)return t;if("loaded"!==t._state||t._playLock)return t._queue.push({event:"seek",action:function(){t.seek.apply(t,r)}}),t;var i=t._soundById(o);if(i){if(!("number"==typeof e&&e>=0)){if(t._webAudio){var d=t.playing(o)?n.ctx.currentTime-i._playStart:0,_=i._rateSeek?i._rateSeek-i._seek:0;return i._seek+(_+d*Math.abs(i._rate))}return i._node.currentTime}var s=t.playing(o);s&&t.pause(o,!0),i._seek=e,i._ended=!1,t._clearTimer(o),t._webAudio||!i._node||isNaN(i._node.duration)||(i._node.currentTime=e);var l=function(){t._emit("seek",o),s&&t.play(o,!0)};if(s&&!t._webAudio){var c=function(){t._playLock?setTimeout(c,0):l()};setTimeout(c,0)}else l()}return t},playing:function(e){var n=this;if("number"==typeof e){var o=n._soundById(e);return!!o&&!o._paused}for(var t=0;t<n._sounds.length;t++)if(!n._sounds[t]._paused)return!0;return!1},duration:function(e){var n=this,o=n._duration,t=n._soundById(e);return t&&(o=n._sprite[t._sprite][1]/1e3),o},state:function(){return this._state},unload:function(){for(var e=this,o=e._sounds,t=0;t<o.length;t++)o[t]._paused||e.stop(o[t]._id),e._webAudio||(e._clearSound(o[t]._node),o[t]._node.removeEventListener("error",o[t]._errorFn,!1),o[t]._node.removeEventListener(n._canPlayEvent,o[t]._loadFn,!1),n._releaseHtml5Audio(o[t]._node)),delete o[t]._node,e._clearTimer(o[t]._id);var a=n._howls.indexOf(e);a>=0&&n._howls.splice(a,1);var u=!0;for(t=0;t<n._howls.length;t++)if(n._howls[t]._src===e._src||e._src.indexOf(n._howls[t]._src)>=0){u=!1;break}return r&&u&&delete r[e._src],n.noAudio=!1,e._state="unloaded",e._sounds=[],e=null,null},on:function(e,n,o,t){var r=this,a=r["_on"+e];return"function"==typeof n&&a.push(t?{id:o,fn:n,once:t}:{id:o,fn:n}),r},off:function(e,n,o){var t=this,r=t["_on"+e],a=0;if("number"==typeof n&&(o=n,n=null),n||o)for(a=0;a<r.length;a++){var u=o===r[a].id;if(n===r[a].fn&&u||!n&&u){r.splice(a,1);break}}else if(e)t["_on"+e]=[];else{var i=Object.keys(t);for(a=0;a<i.length;a++)0===i[a].indexOf("_on")&&Array.isArray(t[i[a]])&&(t[i[a]]=[])}return t},once:function(e,n,o){var t=this;return t.on(e,n,o,1),t},_emit:function(e,n,o){for(var t=this,r=t["_on"+e],a=r.length-1;a>=0;a--)r[a].id&&r[a].id!==n&&"load"!==e||(setTimeout(function(e){e.call(this,n,o)}.bind(t,r[a].fn),0),r[a].once&&t.off(e,r[a].fn,r[a].id));return t._loadQueue(e),t},_loadQueue:function(e){var n=this;if(n._queue.length>0){var o=n._queue[0];o.event===e&&(n._queue.shift(),n._loadQueue()),e||o.action()}return n},_ended:function(e){var o=this,t=e._sprite;if(!o._webAudio&&e._node&&!e._node.paused&&!e._node.ended&&e._node.currentTime<e._stop)return setTimeout(o._ended.bind(o,e),100),o;var r=!(!e._loop&&!o._sprite[t][2]);if(o._emit("end",e._id),!o._webAudio&&r&&o.stop(e._id,!0).play(e._id),o._webAudio&&r){o._emit("play",e._id),e._seek=e._start||0,e._rateSeek=0,e._playStart=n.ctx.currentTime;var a=1e3*(e._stop-e._start)/Math.abs(e._rate);o._endTimers[e._id]=setTimeout(o._ended.bind(o,e),a)}return o._webAudio&&!r&&(e._paused=!0,e._ended=!0,e._seek=e._start||0,e._rateSeek=0,o._clearTimer(e._id),o._cleanBuffer(e._node),n._autoSuspend()),o._webAudio||r||o.stop(e._id,!0),o},_clearTimer:function(e){var n=this;if(n._endTimers[e]){if("function"!=typeof n._endTimers[e])clearTimeout(n._endTimers[e]);else{var o=n._soundById(e);o&&o._node&&o._node.removeEventListener("ended",n._endTimers[e],!1)}delete n._endTimers[e]}return n},_soundById:function(e){for(var n=this,o=0;o<n._sounds.length;o++)if(e===n._sounds[o]._id)return n._sounds[o];return null},_inactiveSound:function(){var e=this;e._drain();for(var n=0;n<e._sounds.length;n++)if(e._sounds[n]._ended)return e._sounds[n].reset();return new t(e)},_drain:function(){var e=this,n=e._pool,o=0,t=0;if(!(e._sounds.length<n)){for(t=0;t<e._sounds.length;t++)e._sounds[t]._ended&&o++;for(t=e._sounds.length-1;t>=0;t--){if(o<=n)return;e._sounds[t]._ended&&(e._webAudio&&e._sounds[t]._node&&e._sounds[t]._node.disconnect(0),e._sounds.splice(t,1),o--)}}},_getSoundIds:function(e){var n=this;if(void 0===e){for(var o=[],t=0;t<n._sounds.length;t++)o.push(n._sounds[t]._id);return o}return[e]},_refreshBuffer:function(e){var o=this;return e._node.bufferSource=n.ctx.createBufferSource(),e._node.bufferSource.buffer=r[o._src],e._panner?e._node.bufferSource.connect(e._panner):e._node.bufferSource.connect(e._node),e._node.bufferSource.loop=e._loop,e._loop&&(e._node.bufferSource.loopStart=e._start||0,e._node.bufferSource.loopEnd=e._stop||0),e._node.bufferSource.playbackRate.setValueAtTime(e._rate,n.ctx.currentTime),o},_cleanBuffer:function(e){var o=this,t=n._navigator&&n._navigator.vendor.indexOf("Apple")>=0;if(n._scratchBuffer&&e.bufferSource&&(e.bufferSource.onended=null,e.bufferSource.disconnect(0),t))try{e.bufferSource.buffer=n._scratchBuffer}catch(e){}return e.bufferSource=null,o},_clearSound:function(e){/MSIE |Trident\//.test(n._navigator&&n._navigator.userAgent)||(e.src="data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA")}};var t=function(e){this._parent=e,this.init()};t.prototype={init:function(){var e=this,o=e._parent;return e._muted=o._muted,e._loop=o._loop,e._volume=o._volume,e._rate=o._rate,e._seek=0,e._paused=!0,e._ended=!0,e._sprite="__default",e._id=++n._counter,o._sounds.push(e),e.create(),e},create:function(){var e=this,o=e._parent,t=n._muted||e._muted||e._parent._muted?0:e._volume;return o._webAudio?(e._node=void 0===n.ctx.createGain?n.ctx.createGainNode():n.ctx.createGain(),e._node.gain.setValueAtTime(t,n.ctx.currentTime),e._node.paused=!0,e._node.connect(n.masterGain)):(e._node=n._obtainHtml5Audio(),e._errorFn=e._errorListener.bind(e),e._node.addEventListener("error",e._errorFn,!1),e._loadFn=e._loadListener.bind(e),e._node.addEventListener(n._canPlayEvent,e._loadFn,!1),e._node.src=o._src,e._node.preload="auto",e._node.volume=t*n.volume(),e._node.load()),e},reset:function(){var e=this,o=e._parent;return e._muted=o._muted,e._loop=o._loop,e._volume=o._volume,e._rate=o._rate,e._seek=0,e._rateSeek=0,e._paused=!0,e._ended=!0,e._sprite="__default",e._id=++n._counter,e},_errorListener:function(){var e=this;e._parent._emit("loaderror",e._id,e._node.error?e._node.error.code:0),e._node.removeEventListener("error",e._errorFn,!1)},_loadListener:function(){var e=this,o=e._parent;o._duration=Math.ceil(10*e._node.duration)/10,0===Object.keys(o._sprite).length&&(o._sprite={__default:[0,1e3*o._duration]}),"loaded"!==o._state&&(o._state="loaded",o._emit("load"),o._loadQueue()),e._node.removeEventListener(n._canPlayEvent,e._loadFn,!1)}};var r={},a=function(e){var n=e._src;if(r[n])return e._duration=r[n].duration,void d(e);if(/^data:[^;]+;base64,/.test(n)){for(var o=atob(n.split(",")[1]),t=new Uint8Array(o.length),a=0;a<o.length;++a)t[a]=o.charCodeAt(a);i(t.buffer,e)}else{var _=new XMLHttpRequest;_.open("GET",n,!0),_.withCredentials=e._xhrWithCredentials,_.responseType="arraybuffer",_.onload=function(){var n=(_.status+"")[0];if("0"!==n&&"2"!==n&&"3"!==n)return void e._emit("loaderror",null,"Failed loading audio file with status: "+_.status+".");i(_.response,e)},_.onerror=function(){e._webAudio&&(e._html5=!0,e._webAudio=!1,e._sounds=[],delete r[n],e.load())},u(_)}},u=function(e){try{e.send()}catch(n){e.onerror()}},i=function(e,o){var t=function(){o._emit("loaderror",null,"Decoding audio data failed.")},a=function(e){e&&o._sounds.length>0?(r[o._src]=e,d(o,e)):t()};"undefined"!=typeof Promise&&1===n.ctx.decodeAudioData.length?n.ctx.decodeAudioData(e).then(a).catch(t):n.ctx.decodeAudioData(e,a,t)},d=function(e,n){n&&!e._duration&&(e._duration=n.duration),0===Object.keys(e._sprite).length&&(e._sprite={__default:[0,1e3*e._duration]}),"loaded"!==e._state&&(e._state="loaded",e._emit("load"),e._loadQueue())},_=function(){if(n.usingWebAudio){try{"undefined"!=typeof AudioContext?n.ctx=new AudioContext:"undefined"!=typeof webkitAudioContext?n.ctx=new webkitAudioContext:n.usingWebAudio=!1}catch(e){n.usingWebAudio=!1}n.ctx||(n.usingWebAudio=!1);var e=/iP(hone|od|ad)/.test(n._navigator&&n._navigator.platform),o=n._navigator&&n._navigator.appVersion.match(/OS (\d+)_(\d+)_?(\d+)?/),t=o?parseInt(o[1],10):null;if(e&&t&&t<9){var r=/safari/.test(n._navigator&&n._navigator.userAgent.toLowerCase());(n._navigator&&n._navigator.standalone&&!r||n._navigator&&!n._navigator.standalone&&!r)&&(n.usingWebAudio=!1)}n.usingWebAudio&&(n.masterGain=void 0===n.ctx.createGain?n.ctx.createGainNode():n.ctx.createGain(),n.masterGain.gain.setValueAtTime(n._muted?0:1,n.ctx.currentTime),n.masterGain.connect(n.ctx.destination)),n._setup()}};"function"==typeof define&&define.amd&&define([],function(){return{Howler:n,Howl:o}}),"undefined"!=typeof exports&&(exports.Howler=n,exports.Howl=o),"undefined"!=typeof window?(window.HowlerGlobal=e,window.Howler=n,window.Howl=o,window.Sound=t):"undefined"!=typeof global&&(global.HowlerGlobal=e,global.Howler=n,global.Howl=o,global.Sound=t)}();
/*! Spatial Plugin */
!function(){"use strict";HowlerGlobal.prototype._pos=[0,0,0],HowlerGlobal.prototype._orientation=[0,0,-1,0,1,0],HowlerGlobal.prototype.stereo=function(e){var n=this;if(!n.ctx||!n.ctx.listener)return n;for(var t=n._howls.length-1;t>=0;t--)n._howls[t].stereo(e);return n},HowlerGlobal.prototype.pos=function(e,n,t){var r=this;return r.ctx&&r.ctx.listener?(n="number"!=typeof n?r._pos[1]:n,t="number"!=typeof t?r._pos[2]:t,"number"!=typeof e?r._pos:(r._pos=[e,n,t],void 0!==r.ctx.listener.positionX?(r.ctx.listener.positionX.setTargetAtTime(r._pos[0],Howler.ctx.currentTime,.1),r.ctx.listener.positionY.setTargetAtTime(r._pos[1],Howler.ctx.currentTime,.1),r.ctx.listener.positionZ.setTargetAtTime(r._pos[2],Howler.ctx.currentTime,.1)):r.ctx.listener.setPosition(r._pos[0],r._pos[1],r._pos[2]),r)):r},HowlerGlobal.prototype.orientation=function(e,n,t,r,o,i){var a=this;if(!a.ctx||!a.ctx.listener)return a;var s=a._orientation;return n="number"!=typeof n?s[1]:n,t="number"!=typeof t?s[2]:t,r="number"!=typeof r?s[3]:r,o="number"!=typeof o?s[4]:o,i="number"!=typeof i?s[5]:i,"number"!=typeof e?s:(a._orientation=[e,n,t,r,o,i],void 0!==a.ctx.listener.forwardX?(a.ctx.listener.forwardX.setTargetAtTime(e,Howler.ctx.currentTime,.1),a.ctx.listener.forwardY.setTargetAtTime(n,Howler.ctx.currentTime,.1),a.ctx.listener.forwardZ.setTargetAtTime(t,Howler.ctx.currentTime,.1),a.ctx.listener.upX.setTargetAtTime(e,Howler.ctx.currentTime,.1),a.ctx.listener.upY.setTargetAtTime(n,Howler.ctx.currentTime,.1),a.ctx.listener.upZ.setTargetAtTime(t,Howler.ctx.currentTime,.1)):a.ctx.listener.setOrientation(e,n,t,r,o,i),a)},Howl.prototype.init=function(e){return function(n){var t=this;return t._orientation=n.orientation||[1,0,0],t._stereo=n.stereo||null,t._pos=n.pos||null,t._pannerAttr={coneInnerAngle:void 0!==n.coneInnerAngle?n.coneInnerAngle:360,coneOuterAngle:void 0!==n.coneOuterAngle?n.coneOuterAngle:360,coneOuterGain:void 0!==n.coneOuterGain?n.coneOuterGain:0,distanceModel:void 0!==n.distanceModel?n.distanceModel:"inverse",maxDistance:void 0!==n.maxDistance?n.maxDistance:1e4,panningModel:void 0!==n.panningModel?n.panningModel:"HRTF",refDistance:void 0!==n.refDistance?n.refDistance:1,rolloffFactor:void 0!==n.rolloffFactor?n.rolloffFactor:1},t._onstereo=n.onstereo?[{fn:n.onstereo}]:[],t._onpos=n.onpos?[{fn:n.onpos}]:[],t._onorientation=n.onorientation?[{fn:n.onorientation}]:[],e.call(this,n)}}(Howl.prototype.init),Howl.prototype.stereo=function(n,t){var r=this;if(!r._webAudio)return r;if("loaded"!==r._state)return r._queue.push({event:"stereo",action:function(){r.stereo(n,t)}}),r;var o=void 0===Howler.ctx.createStereoPanner?"spatial":"stereo";if(void 0===t){if("number"!=typeof n)return r._stereo;r._stereo=n,r._pos=[n,0,0]}for(var i=r._getSoundIds(t),a=0;a<i.length;a++){var s=r._soundById(i[a]);if(s){if("number"!=typeof n)return s._stereo;s._stereo=n,s._pos=[n,0,0],s._node&&(s._pannerAttr.panningModel="equalpower",s._panner&&s._panner.pan||e(s,o),"spatial"===o?void 0!==s._panner.positionX?(s._panner.positionX.setValueAtTime(n,Howler.ctx.currentTime),s._panner.positionY.setValueAtTime(0,Howler.ctx.currentTime),s._panner.positionZ.setValueAtTime(0,Howler.ctx.currentTime)):s._panner.setPosition(n,0,0):s._panner.pan.setValueAtTime(n,Howler.ctx.currentTime)),r._emit("stereo",s._id)}}return r},Howl.prototype.pos=function(n,t,r,o){var i=this;if(!i._webAudio)return i;if("loaded"!==i._state)return i._queue.push({event:"pos",action:function(){i.pos(n,t,r,o)}}),i;if(t="number"!=typeof t?0:t,r="number"!=typeof r?-.5:r,void 0===o){if("number"!=typeof n)return i._pos;i._pos=[n,t,r]}for(var a=i._getSoundIds(o),s=0;s<a.length;s++){var p=i._soundById(a[s]);if(p){if("number"!=typeof n)return p._pos;p._pos=[n,t,r],p._node&&(p._panner&&!p._panner.pan||e(p,"spatial"),void 0!==p._panner.positionX?(p._panner.positionX.setValueAtTime(n,Howler.ctx.currentTime),p._panner.positionY.setValueAtTime(t,Howler.ctx.currentTime),p._panner.positionZ.setValueAtTime(r,Howler.ctx.currentTime)):p._panner.setPosition(n,t,r)),i._emit("pos",p._id)}}return i},Howl.prototype.orientation=function(n,t,r,o){var i=this;if(!i._webAudio)return i;if("loaded"!==i._state)return i._queue.push({event:"orientation",action:function(){i.orientation(n,t,r,o)}}),i;if(t="number"!=typeof t?i._orientation[1]:t,r="number"!=typeof r?i._orientation[2]:r,void 0===o){if("number"!=typeof n)return i._orientation;i._orientation=[n,t,r]}for(var a=i._getSoundIds(o),s=0;s<a.length;s++){var p=i._soundById(a[s]);if(p){if("number"!=typeof n)return p._orientation;p._orientation=[n,t,r],p._node&&(p._panner||(p._pos||(p._pos=i._pos||[0,0,-.5]),e(p,"spatial")),void 0!==p._panner.orientationX?(p._panner.orientationX.setValueAtTime(n,Howler.ctx.currentTime),p._panner.orientationY.setValueAtTime(t,Howler.ctx.currentTime),p._panner.orientationZ.setValueAtTime(r,Howler.ctx.currentTime)):p._panner.setOrientation(n,t,r)),i._emit("orientation",p._id)}}return i},Howl.prototype.pannerAttr=function(){var n,t,r,o=this,i=arguments;if(!o._webAudio)return o;if(0===i.length)return o._pannerAttr;if(1===i.length){if("object"!=typeof i[0])return r=o._soundById(parseInt(i[0],10)),r?r._pannerAttr:o._pannerAttr;n=i[0],void 0===t&&(n.pannerAttr||(n.pannerAttr={coneInnerAngle:n.coneInnerAngle,coneOuterAngle:n.coneOuterAngle,coneOuterGain:n.coneOuterGain,distanceModel:n.distanceModel,maxDistance:n.maxDistance,refDistance:n.refDistance,rolloffFactor:n.rolloffFactor,panningModel:n.panningModel}),o._pannerAttr={coneInnerAngle:void 0!==n.pannerAttr.coneInnerAngle?n.pannerAttr.coneInnerAngle:o._coneInnerAngle,coneOuterAngle:void 0!==n.pannerAttr.coneOuterAngle?n.pannerAttr.coneOuterAngle:o._coneOuterAngle,coneOuterGain:void 0!==n.pannerAttr.coneOuterGain?n.pannerAttr.coneOuterGain:o._coneOuterGain,distanceModel:void 0!==n.pannerAttr.distanceModel?n.pannerAttr.distanceModel:o._distanceModel,maxDistance:void 0!==n.pannerAttr.maxDistance?n.pannerAttr.maxDistance:o._maxDistance,refDistance:void 0!==n.pannerAttr.refDistance?n.pannerAttr.refDistance:o._refDistance,rolloffFactor:void 0!==n.pannerAttr.rolloffFactor?n.pannerAttr.rolloffFactor:o._rolloffFactor,panningModel:void 0!==n.pannerAttr.panningModel?n.pannerAttr.panningModel:o._panningModel})}else 2===i.length&&(n=i[0],t=parseInt(i[1],10));for(var a=o._getSoundIds(t),s=0;s<a.length;s++)if(r=o._soundById(a[s])){var p=r._pannerAttr;p={coneInnerAngle:void 0!==n.coneInnerAngle?n.coneInnerAngle:p.coneInnerAngle,coneOuterAngle:void 0!==n.coneOuterAngle?n.coneOuterAngle:p.coneOuterAngle,coneOuterGain:void 0!==n.coneOuterGain?n.coneOuterGain:p.coneOuterGain,distanceModel:void 0!==n.distanceModel?n.distanceModel:p.distanceModel,maxDistance:void 0!==n.maxDistance?n.maxDistance:p.maxDistance,refDistance:void 0!==n.refDistance?n.refDistance:p.refDistance,rolloffFactor:void 0!==n.rolloffFactor?n.rolloffFactor:p.rolloffFactor,panningModel:void 0!==n.panningModel?n.panningModel:p.panningModel};var c=r._panner;c?(c.coneInnerAngle=p.coneInnerAngle,c.coneOuterAngle=p.coneOuterAngle,c.coneOuterGain=p.coneOuterGain,c.distanceModel=p.distanceModel,c.maxDistance=p.maxDistance,c.refDistance=p.refDistance,c.rolloffFactor=p.rolloffFactor,c.panningModel=p.panningModel):(r._pos||(r._pos=o._pos||[0,0,-.5]),e(r,"spatial"))}return o},Sound.prototype.init=function(e){return function(){var n=this,t=n._parent;n._orientation=t._orientation,n._stereo=t._stereo,n._pos=t._pos,n._pannerAttr=t._pannerAttr,e.call(this),n._stereo?t.stereo(n._stereo):n._pos&&t.pos(n._pos[0],n._pos[1],n._pos[2],n._id)}}(Sound.prototype.init),Sound.prototype.reset=function(e){return function(){var n=this,t=n._parent;return n._orientation=t._orientation,n._stereo=t._stereo,n._pos=t._pos,n._pannerAttr=t._pannerAttr,n._stereo?t.stereo(n._stereo):n._pos?t.pos(n._pos[0],n._pos[1],n._pos[2],n._id):n._panner&&(n._panner.disconnect(0),n._panner=void 0,t._refreshBuffer(n)),e.call(this)}}(Sound.prototype.reset);var e=function(e,n){n=n||"spatial","spatial"===n?(e._panner=Howler.ctx.createPanner(),e._panner.coneInnerAngle=e._pannerAttr.coneInnerAngle,e._panner.coneOuterAngle=e._pannerAttr.coneOuterAngle,e._panner.coneOuterGain=e._pannerAttr.coneOuterGain,e._panner.distanceModel=e._pannerAttr.distanceModel,e._panner.maxDistance=e._pannerAttr.maxDistance,e._panner.refDistance=e._pannerAttr.refDistance,e._panner.rolloffFactor=e._pannerAttr.rolloffFactor,e._panner.panningModel=e._pannerAttr.panningModel,void 0!==e._panner.positionX?(e._panner.positionX.setValueAtTime(e._pos[0],Howler.ctx.currentTime),e._panner.positionY.setValueAtTime(e._pos[1],Howler.ctx.currentTime),e._panner.positionZ.setValueAtTime(e._pos[2],Howler.ctx.currentTime)):e._panner.setPosition(e._pos[0],e._pos[1],e._pos[2]),void 0!==e._panner.orientationX?(e._panner.orientationX.setValueAtTime(e._orientation[0],Howler.ctx.currentTime),e._panner.orientationY.setValueAtTime(e._orientation[1],Howler.ctx.currentTime),e._panner.orientationZ.setValueAtTime(e._orientation[2],Howler.ctx.currentTime)):e._panner.setOrientation(e._orientation[0],e._orientation[1],e._orientation[2])):(e._panner=Howler.ctx.createStereoPanner(),e._panner.pan.setValueAtTime(e._stereo,Howler.ctx.currentTime)),e._panner.connect(e._node),e._paused||e._parent.pause(e._id,!0).play(e._id,!0)}}();
/*!
 *  Howler.js Audio Player Demo
 *  howlerjs.com
 *
 *  (c) 2013-2017, James Simpson of GoldFire Studios
 *  goldfirestudios.com
 *
 *  MIT License
 */
// From: https://github.com/higuma/wav-audio-encoder-js
(function(n){var a=Math.min,s=Math.max;var e=function(n,a,e){var s=e.length;for(var t=0;t<s;++t)n.setUint8(a+t,e.charCodeAt(t))};var t=function(t,e){this.sampleRate=t;this.numChannels=e;this.numSamples=0;this.dataViews=[]};t.prototype.encode=function(r){var t=r[0].length,u=this.numChannels,h=new DataView(new ArrayBuffer(t*u*2)),o=0;for(var e=0;e<t;++e)for(var n=0;n<u;++n){var i=r[n][e]*32767;h.setInt16(o,i<0?s(i,-32768):a(i,32767),true);o+=2}this.dataViews.push(h);this.numSamples+=t};t.prototype.finish=function(s){var n=this.numChannels*this.numSamples*2,t=new DataView(new ArrayBuffer(44));e(t,0,"RIFF");t.setUint32(4,36+n,true);e(t,8,"WAVE");e(t,12,"fmt ");t.setUint32(16,16,true);t.setUint16(20,1,true);t.setUint16(22,this.numChannels,true);t.setUint32(24,this.sampleRate,true);t.setUint32(28,this.sampleRate*4,true);t.setUint16(32,this.numChannels*2,true);t.setUint16(34,16,true);e(t,36,"data");t.setUint32(40,n,true);this.dataViews.unshift(t);var a=new Blob(this.dataViews,{type:"audio/wav"});this.cleanup();return a};t.prototype.cancel=t.prototype.cleanup=function(){delete this.dataViews};n.WavAudioEncoder=t})(self);

modules.audio_controller={
	current:false,
	set:function(cur){
		var self=this;
		self.current=cur;
	},
	clear:function(){
		var self=this;
		if(self.current) self.current.pause(2)
		//self.current=false;
	},
	stop:function(){
		var self=this;
		if(self.current) self.current.pause(2)
	}
}
/**
 * Player class containing the state of our playlist and where we are in it.
 * Includes all methods for playing, skipping, updating the display, etc.
 * @param {Array} playlist Array of objects with playlist song details ({title, file, howl}).
 */
var Player = function(ele,playlist) {
  var self=this;
  this.playlist = playlist;
  this.index = 0;
  self.parent=ele;
  // Cache references to DOM elements.
  var elms = ['audio_track','audio_loading_box','audio_save','audio_waveform','audio_progressbar','audio_progresscontainer','audio_timer','audio_progressslider','audio_duration','audio_playBtn','audio_pauseBtn','audio_prevBtn','audio_nextBtn','audio_playlistBtn','audio_volumeBtn','audio_progress','audio_bar','audio_wave','audio_playlist','audio_list','audio_volume','audio_barEmpty','audio_barFull','audio_sliderBtn'];
  self.ele={};
  elms.forEach(function(elm) {
    self.ele[elm] = ele.find('.'+elm);
  });
  // Display the title of the first track.
  self.ele.audio_track.innerHTML = playlist[0].title;

  // // Setup the playlist display.
  // playlist.forEach(function(song) {
  //   var div = document.createElement('div');
  //   div.className = 'list-song';
  //   div.innerHTML = song.title;
  //   div.onclick = function() {
  //     player.skipTo(playlist.indexOf(song));
  //   };
  //   list.appendChild(div);
  // });
};
Player.prototype = {
	showLoading:function(){
		var self = this;
		self.ele.audio_loading_box.show();
		if(app.device!='iOS'){
			_ui.pageloader.render({theme:false,themeClass:'lds-ellipsis-black'},self.ele.audio_loading_box,1)
		}
	},
	showError:function(msg){
		var self = this;
		self.ele.audio_loading_box.show();
		self.ele.audio_loading_box.render({
			template:'audio_loadfail',
			append:false,
			binding:function(ele){
				ele.find('.x_retry').stap(function(e){
					phi.stop(e)
					if($(this).find('i').hasClass('animate-spin')) return false;
					$(this).find('i').addClass('animate-spin');
					self.load(0,1);
				},1,'tapactive')
			}
		})
	},
  /**
   * Play a song in the playlist.
   * @param  {Number} index Index of the song in the playlist (leave empty to play the first or current).
   */
  load: function(index,retry) {
    var self = this;
    var sound;
    if(!retry) self.showLoading();
    index = typeof index === 'number' ? index : self.index;
    var data = self.playlist[index];
    // If we already loaded this track, use the current one.
    // Otherwise, setup and load a new Howl.
    if (data.howl&&!retry) {
      sound = data.howl;
    } else {
      sound = data.howl = new Howl({
        src: [data.file],
        format:(data.format)?data.format:'mp3',
        loop: false,
        html5: true, // Force to HTML5 so that the audio can stream in (best for large files).
        onplay: function() {
          // Display the duration.

          // Start upating the progress of the track.
          requestAnimationFrame(self.step.bind(self));
          //self.wave.play(sound.seek());
          // Start the wave animation if we have already loaded
          //self.wave.container.style.display = 'block';
          self.ele.audio_bar[0].style.display = 'none';
          self.ele.audio_pauseBtn[0].style.display = 'inline';
        },
        onload: function(){
        	self.ele.audio_loading_box.hide();
        	self.ele.audio_duration[0].innerHTML = self.formatTime(Math.round(self.getDuration()));
          // Start the wave animation.
          //wave.container.style.display = 'block';
          // bar.style.display = 'none';
          // loading.style.display = 'none';
        },  
        onend: function() {
          // Stop the wave animation.
          //wave.container.style.display = 'none';
          //self.ele.audio_bar[0].style.display = 'block';
          self.pause(1);
          //self.skip('right');
        },
        onpause: function() {
          //self.wave.stop();
          // Stop the wave animation.
          //wave.container.style.display = 'none';
          //self.ele.audio_bar[0].style.display = 'block';
        },
        onstop: function() {
          // Stop the wave animation.
          //wave.container.style.display = 'none';
          //self.ele.audio_bar[0].style.display = 'block';
        }
      });
    }
    data.howl.on('loaderror', function (msg) {
	  //console.log('==>loaderror ' + msg);
	  self.showError('');
	});
    // Begin playing the sound.
    //sound.play();

    // Update the track display.
    self.ele.audio_track[0].innerHTML = data.title;

    // Show the pause button.
    // if (sound.state() === 'loaded') {
    //   playBtn.style.display = 'none';
    //   pauseBtn.style.display = 'block';
    // } else {
    //   loading.style.display = 'block';
    //   playBtn.style.display = 'none';
    //   pauseBtn.style.display = 'none';
    // }

    // Keep track of the index we are currently playing.
    self.index = index;

    //bind elelments
    // Bind our player controls.
    self.ele.audio_playBtn.on('touchstart',function(){
    	self.pressingPlay=true;
    }).on('touchend',function(){
    	self.pressingPlay=false;
    }).on('mousedown',function(){
    	self.pressingPlay=true;
    }).on('mouseup',function(){
    	self.pressingPlay=true;
    })
      self.ele.audio_playBtn.stap(function(e){
      	phi.stop(e)
      	if(window.AudioToggle) AudioToggle.setAudioMode(AudioToggle.SPEAKER);
      	modules.tools.audioContext.set();
        self.play();
      },1,'tapactive');
      self.ele.audio_save.stap(function(e){
      	phi.stop(e)
        self.save();
      },1,'tapactive');
      self.ele.audio_pauseBtn.stap(function(e){
      	phi.stop(e)
        self.pause();
        if(window.AudioToggle) AudioToggle.setAudioMode(AudioToggle.EARPIECE);
      },1,'tapactive');
      // waveform.addEventListener('click', function(event) {
      //   player.seek(event.clientX / window.innerWidth);
      // });
      // self.ele.audio_volumeBtn.stap(function(e) {
      //   self.toggleVolume();  
      // },1,'tapactive');
      // self.ele.audio_volume.stap(function(e) {
      //   if(self.sliderDown) return false;
      //     self.toggleVolume();
      // },1,'tapactive');

      // Setup the event listeners to enable dragging of volume slider.
      // self.ele.audio_barEmpty.stap(function(event) {
      //   var per = event.layerX / parseFloat(self.ele.audio_barEmpty.scrollWidth);
      //   self.volume(per);
      // },1,'tapactive');
      // self.ele.audio_sliderBtn[0].addEventListener('mousedown', function() {
      //   self.sliderDown = true;
      // });
      // self.ele.audio_sliderBtn[0].addEventListener('touchstart', function() {
      //   self.sliderDown = true;
      // });
      // self.ele.audio_sliderBtn.stap(function(e) {
      //   e.stopImmediatePropagation();
      //   e.stopPropagation();
      //   e.preventDefault();
      // },1,'tapactive');
      // self.parent[0].addEventListener('mousedown', function(event) {
      //   self.sliderDown2 = true;
      //   move2(event);
      // });
      // self.parent[0].addEventListener('touchstart', function(e) {
      // 	//get start
      // 	if(self.pressingPlay) return false;
      // 	self.startTouch=_.touchEvent.getCoords(e);
      //   self.sliderDown2 = true;
      // });
      // self.parent[0].addEventListener('mouseup', function(e) {
      //   self.sliderDown2 = false;
      // });
      // self.parent[0].addEventListener('touchend', function(e) {
      //   self.sliderDown2 = false;
      // });
      var move2 = function(event) {
      	if(self.pressingPlay) return false;
      	if(event.type=='touchmove'){
      		self.currentTouch=_.touchEvent.getCoords(event);
      		var dist=_.touchEvent.getInfo(self.startTouch,self.currentTouch);
      		if(dist.dist<10){
      			phi.stop(event)
      		}else{//dont do any movement until we know
      			if(Math.abs(dist.dy)>Math.abs(dist.dx)){
      				self.sliderDown2=false;//allows scroll to happen
      			}
      		}
      	}
        if (self.sliderDown2) {
          var x = event.clientX || event.touches[0].clientX;
          var startX = 0;
          var layerX = x - startX;
          var os=self.parent.offset();
          layerX=layerX-os.left;
          var width=parseFloat(self.parent.width());
          var per=1-((width-layerX)/width);
          if(per<0) per=0;
          if(per>1) per=1;
          self.seek(per);
          phi.stop(event)
        }
      };

      // self.parent[0].addEventListener('mousemove', move2);
      // self.parent[0].addEventListener('touchmove', move2);

      // Setup the "waveform" animation.
      // self.wave = new SiriWave({
      //     container: self.ele.audio_waveform,
      //     width: self.parent.width(),
      //     height: self.parent.height(),
      //     cover: true,
      //     speed: 0.03,
      //     amplitude: 0.7,
      //     frequency: 2
      // });
    //  self.wave.on('play',function(){
    // 	if(app.device=='iOS'){
    // 		data.howl.play()
    // 	}
    // })
    //  self.wave.on('pause',function(){
    //  	if(app.device=='iOS'){
    // 		data.howl.pause()
    // 	}
    // })
      // Load audio from URL
     // _alert('lOad: '+self.playlist[index].file)
      if(self.playlist[index].audio_array) window.current_audio_array=self.playlist[index].audio_array;
      else window.current_audio_array=false;
      if(false){
	      self.wave=WaveSurfer.create({
	      	audioContext:modules.tools.audioContext.get(),
	        container:self.ele.audio_waveform[0],
	        barWidth: 2,
	        scrollParent:true,
	        fillParent:true,
	        cursorColor:'#888',
	        barHeight: (isPhoneGap())?20:4, // the height of the wave
	        waveColor: '#ccc',
	        progressColor: '#f09',
	        barGap: null // the optional spacing between bars of the wave, if not provided will be calculated in legacy format
	    });
	      self.wave.on('error', function(e) {
        //console.warn(e);
        //_alert('Wave Error')
    	});
	      self.wave.on('ready',function(){
	      	self.ele.audio_duration[0].innerHTML = self.formatTime(Math.round(self.getDuration()));
	      	//console.log('duration: '+ self.wave.getDuration())
	      })
	      self.wave.load(self.playlist[index].file);
	  }
      window.addEventListener('resize', self.resize);
      self.resize();
  },
  getDuration:function(){
    var self=this;
    var sound = self.playlist[self.index].howl;
    if(self.playlist[self.index].recordTime){
      return self.playlist[self.index].recordTime;
    }else{
      if(self.wave&&self.wave.getDuration){
        return self.wave.getDuration()
      }else{
      	return sound._duration;
      }
    }
  },
  resize:function(){
    var self = this;
    if(!self.parent||!self.parent.height) return false;
    var height = self.parent.height();
    var width = self.parent.width();
    // self.wave.height = height;
    // self.wave.height_2 = height / 2;
    // self.wave.MAX = self.wave.height_2 - 4;
    // self.wave.width = width;
    // self.wave.width_2 = width / 2;
    // self.wave.width_4 = width / 4;
    // self.wave.canvas.height = height;
    // self.wave.canvas.width = width;
    // self.wave.container.style.margin = 0;

    // Update the position of the slider.
    var sound = self.playlist[self.index].howl;
    if (sound) {
      var vol = sound.volume();
      var barWidth = vol;
      self.ele.audio_barFull[0].style.width = (barWidth * 100) + '%';
      self.ele.audio_sliderBtn[0].style.left = (barWidth * 100) + '%';
    }
  },
  destroy:function(){
    var self = this;
    if(window.AudioToggle) AudioToggle.setAudioMode(AudioToggle.EARPIECE);
     window.removeEventListener('resize', self.resize);
     if(self.wave) self.wave.destroy();
     for (var i = 0; i < self.playlist.length; i++) {
       var item=self.playlist[i];
       if(item.howl){
        item.howl.unload()
       }
     }
  },
  /**
   * Pause the currently playing track.
   */
  pause: function(ended) {
    var self = this;
     var sound = self.playlist[self.index].howl;
    if(!ended||ended==2){
      // // Get the Howl we want to manipulate.

      // Puase the sound.
      sound.pause();

      // Show the play button.
      // if(self.wave){
      //   self.wave.playPause();
      // }
    }else{
      //self.wave.stop();
    }
    self.ele.audio_playBtn[0].style.display = 'inline';
    self.ele.audio_pauseBtn[0].style.display = 'none';
    if(ended!=2) modules.audio_controller.clear();
  },
  save: function() {
    var self = this;
    var sound = self.playlist[self.index];
    if(sound.onSave) sound.onSave();
  },
  play: function() {
    var self = this;
    modules.audio_controller.clear();
    var sound = self.playlist[self.index].howl;
	    // play the sound.
	    var sound = self.playlist[self.index].howl;
	    // play the sound.
	    sound.play();
 //    if(app.device=='iOS'&&false){
	//     // Get the Howl we want to manipulate.
	//     var sound = self.playlist[self.index].howl;
	//     // play the sound.
	//     sound.play();
	// }else{
 //    	if(self.wave) self.wave.play()
 //    }
    // Show the play button.
    self.ele.audio_playBtn[0].style.display = 'none';
    self.ele.audio_pauseBtn[0].style.display = 'inline';
    modules.audio_controller.set(self);
  },

  /**
   * Skip to the next or previous track.
   * @param  {String} direction 'next' or 'prev'.
   */
  skip: function(direction) {
    var self = this;

    // Get the next track based on the direction of the track.
    var index = 0;
    if (direction === 'prev') {
      index = self.index - 1;
      if (index < 0) {
        index = self.playlist.length - 1;
      }
    } else {
      index = self.index + 1;
      if (index >= self.playlist.length) {
        index = 0;
      }
    }

    self.skipTo(index);
  },

  /**
   * Skip to a specific track based on its playlist index.
   * @param  {Number} index Index in the playlist.
   */
  skipTo: function(index) {
    var self = this;

    // Stop the current track.
    if (self.playlist[self.index].howl) {
      self.playlist[self.index].howl.stop();
    }

    // Reset progress.
    self.ele.audio_progress[0].style.width = '0%';

    // Play the new track.
    self.play(index);
  },

  /**
   * Set the volume and update the volume slider display.
   * @param  {Number} val Volume between 0 and 1.
   */
  volume: function(val) {
    var self = this;

    // Update the global volume (affecting all Howls).
    Howler.volume(val);

    // Update the display on the slider.
    self.ele.audio_barFull[0].style.width = (val * 100) + '%';
    self.ele.audio_sliderBtn[0].style.left = (val * 100) + '%';
  },

  /**
   * Seek to a new position in the currently playing track.
   * @param  {Number} per Percentage through the song to skip.
   */
  seek: function(per) {
    var self = this;

    // Get the Howl we want to manipulate.
    var sound = self.playlist[self.index].howl;
    // Convert the percent into a seek position.
    //if (sound.playing()) {
      sound.seek(self.getDuration() * per);
    //}
    var seek = sound.seek() || 0;
    self.ele.audio_timer[0].innerHTML = self.formatTime(Math.round(seek));
    self.ele.audio_progress[0].style.width = (((seek / self.getDuration()) * 100) || 0) + '%';
    self.ele.audio_progressslider[0].style.left = (((seek / self.getDuration()) * 100) || 0) + '%';
    if(self.wave){
      //console.log(seek,self.getDuration())
      if(self.getDuration()) self.wave.seekTo((seek / self.getDuration()));
    }
  },

  /**
   * The step called within requestAnimationFrame to update the playback position.
   */
  step: function() {
    var self = this;

    // Get the Howl we want to manipulate.
    var sound = self.playlist[self.index].howl;
    // Determine our current seek position.
    var seek = sound.seek() || 0;
    self.ele.audio_timer[0].innerHTML = self.formatTime(Math.round(seek));
    // self.ele.audio_progress[0].style.width = (((seek / self.getDuration()) * 100) || 0) + '%';
    // self.ele.audio_progressslider[0].style.left = (((seek / self.getDuration()) * 100) || 0) + '%';
    if(self.wave){
      //console.log(seek,self.getDuration())
      if(self.getDuration()) self.wave.seekTo((seek / self.getDuration()));
    }
    // If the sound is still playing, continue stepping.
    if (sound.playing()) {
      requestAnimationFrame(self.step.bind(self));
    }
    self.ele.audio_progress[0].style.width=((seek / self.getDuration())*100)+'%';
  },

  /**
   * Toggle the playlist display on/off.
   */
  togglePlaylist: function() {
    var self = this;
    var display = (self.ele.audio_playlist[0].style.display === 'block') ? 'none' : 'block';

    setTimeout(function() {
      self.ele.audio_playlist[0].style.display = display;
    }, (display === 'block') ? 0 : 500);
    self.ele.audio_playlist.className = (display === 'block') ? 'fadein' : 'fadeout';
  },

  /**
   * Toggle the volume display on/off.
   */
  toggleVolume: function() {
    var self = this;
    var display = (self.ele.audio_volume[0].style.display === 'block') ? 'none' : 'block';

    setTimeout(function() {
      self.ele.audio_volume[0].style.display = display;
    }, (display === 'block') ? 0 : 500);
    self.ele.audio_volume[0].className = (display === 'block') ? 'fadein' : 'fadeout';
  },

  /**
   * Format the time from seconds to M:SS.
   * @param  {Number} secs Seconds to format.
   * @return {String}      Formatted time.
   */
  formatTime: function(secs) {
    var minutes = Math.floor(secs / 60) || 0;
    var seconds = (secs - minutes * 60) || 0;

    return minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
  }
};
/* Modified from https://github.com/CaffeinaLab/SiriWaveJS */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.SiriWave = factory());
}(this, (function () { 'use strict';

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  function createCommonjsModule(fn, module) {
    return module = { exports: {} }, fn(module, module.exports), module.exports;
  }

  var performanceNow = createCommonjsModule(function (module) {
  // Generated by CoffeeScript 1.12.2
  (function() {
    var getNanoSeconds, hrtime, loadTime, moduleLoadTime, nodeLoadTime, upTime;

    if ((typeof performance !== "undefined" && performance !== null) && performance.now) {
      module.exports = function() {
        return performance.now();
      };
    } else if ((typeof process !== "undefined" && process !== null) && process.hrtime) {
      module.exports = function() {
        return (getNanoSeconds() - nodeLoadTime) / 1e6;
      };
      hrtime = process.hrtime;
      getNanoSeconds = function() {
        var hr;
        hr = hrtime();
        return hr[0] * 1e9 + hr[1];
      };
      moduleLoadTime = getNanoSeconds();
      upTime = process.uptime() * 1e9;
      nodeLoadTime = moduleLoadTime - upTime;
    } else if (Date.now) {
      module.exports = function() {
        return Date.now() - loadTime;
      };
      loadTime = Date.now();
    } else {
      module.exports = function() {
        return new Date().getTime() - loadTime;
      };
      loadTime = new Date().getTime();
    }

  }).call(commonjsGlobal);


  });

  var root = typeof window === 'undefined' ? commonjsGlobal : window
    , vendors = ['moz', 'webkit']
    , suffix = 'AnimationFrame'
    , raf = root['request' + suffix]
    , caf = root['cancel' + suffix] || root['cancelRequest' + suffix];

  for(var i = 0; !raf && i < vendors.length; i++) {
    raf = root[vendors[i] + 'Request' + suffix];
    caf = root[vendors[i] + 'Cancel' + suffix]
        || root[vendors[i] + 'CancelRequest' + suffix];
  }

  // Some versions of FF have rAF but not cAF
  if(!raf || !caf) {
    var last = 0
      , id$1 = 0
      , queue = []
      , frameDuration = 1000 / 60;

    raf = function(callback) {
      if(queue.length === 0) {
        var _now = performanceNow()
          , next = Math.max(0, frameDuration - (_now - last));
        last = next + _now;
        setTimeout(function() {
          var cp = queue.slice(0);
          // Clear queue here to prevent
          // callbacks from appending listeners
          // to the current frame's queue
          queue.length = 0;
          for(var i = 0; i < cp.length; i++) {
            if(!cp[i].cancelled) {
              try{
                cp[i].callback(last);
              } catch(e) {
                setTimeout(function() { throw e }, 0);
              }
            }
          }
        }, Math.round(next));
      }
      queue.push({
        handle: ++id$1,
        callback: callback,
        cancelled: false
      });
      return id$1
    };

    caf = function(handle) {
      for(var i = 0; i < queue.length; i++) {
        if(queue[i].handle === handle) {
          queue[i].cancelled = true;
        }
      }
    };
  }

  var raf_1 = function(fn) {
    // Wrap in a new function to prevent
    // `cancel` potentially being assigned
    // to the native rAF function
    return raf.call(root, fn)
  };
  var cancel = function() {
    caf.apply(root, arguments);
  };
  var polyfill = function(object) {
    if (!object) {
      object = root;
    }
    object.requestAnimationFrame = raf;
    object.cancelAnimationFrame = caf;
  };
  raf_1.cancel = cancel;
  raf_1.polyfill = polyfill;

  function lerp(v0, v1, t) {
      return v0*(1-t)+v1*t
  }
  var lerp_1 = lerp;

  var Curve =
  /*#__PURE__*/
  function () {
    function Curve(opt) {
      _classCallCheck(this, Curve);

      this.ctrl = opt.ctrl;
      this.definition = opt.definition;
      this.ATT_FACTOR = 4;
      this.GRAPH_X = 2;
      this.AMPLITUDE_FACTOR = 0.6;
    }

    _createClass(Curve, [{
      key: "globalAttFn",
      value: function globalAttFn(x) {
        return Math.pow(this.ATT_FACTOR / (this.ATT_FACTOR + Math.pow(x, this.ATT_FACTOR)), this.ATT_FACTOR);
      }
    }, {
      key: "_xpos",
      value: function _xpos(i) {
        return this.ctrl.width * ((i + this.GRAPH_X) / (this.GRAPH_X * 2));
      }
    }, {
      key: "_ypos",
      value: function _ypos(i) {
        return this.AMPLITUDE_FACTOR * (this.globalAttFn(i) * (this.ctrl.heightMax * this.ctrl.amplitude) * (1 / this.definition.attenuation) * Math.sin(this.ctrl.opt.frequency * i - this.ctrl.phase));
      }
    }, {
      key: "draw",
      value: function draw() {
        var ctx = this.ctrl.ctx;
        ctx.moveTo(0, 0);
        ctx.beginPath();
        var color = this.ctrl.color.replace(/rgb\(/g, '').replace(/\)/g, '');
        ctx.strokeStyle = "rgba(".concat(color, ",").concat(this.definition.opacity, ")");
        ctx.lineWidth = this.definition.lineWidth; // Cycle the graph from -X to +X every PX_DEPTH and draw the line

        for (var i = -this.GRAPH_X; i <= this.GRAPH_X; i += this.ctrl.opt.pixelDepth) {
          ctx.lineTo(this._xpos(i), this.ctrl.heightMax + this._ypos(i));
        }

        ctx.stroke();
      }
    }], [{
      key: "getDefinition",
      value: function getDefinition() {
        return [{
          attenuation: -2,
          lineWidth: 1,
          opacity: 0.1
        }, {
          attenuation: -6,
          lineWidth: 1,
          opacity: 0.2
        }, {
          attenuation: 4,
          lineWidth: 1,
          opacity: 0.4
        }, {
          attenuation: 2,
          lineWidth: 1,
          opacity: 0.6
        }, {
          attenuation: 1,
          lineWidth: 1.5,
          opacity: 1
        }];
      }
    }]);

    return Curve;
  }();

  var iOS9Curve =
  /*#__PURE__*/
  function () {
    function iOS9Curve() {
      var opt = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      _classCallCheck(this, iOS9Curve);

      this.ctrl = opt.ctrl;
      this.definition = opt.definition;
      this.GRAPH_X = 25;
      this.AMPLITUDE_FACTOR = 0.8;
      this.SPEED_FACTOR = 1;
      this.DEAD_PX = 2;
      this.ATT_FACTOR = 4;
      this.DESPAWN_FACTOR = 0.02;
      this.NOOFCURVES_RANGES = [2, 5];
      this.AMPLITUDE_RANGES = [0.3, 1];
      this.OFFSET_RANGES = [-3, 3];
      this.WIDTH_RANGES = [1, 3];
      this.SPEED_RANGES = [0.5, 1];
      this.DESPAWN_TIMEOUT_RANGES = [500, 2000];
      this.respawn();
    }

    _createClass(iOS9Curve, [{
      key: "getRandomRange",
      value: function getRandomRange(e) {
        return e[0] + Math.random() * (e[1] - e[0]);
      }
    }, {
      key: "respawnSingle",
      value: function respawnSingle(ci) {
        this.phases[ci] = 0;
        this.amplitudes[ci] = 0;
        this.despawnTimeouts[ci] = this.getRandomRange(this.DESPAWN_TIMEOUT_RANGES);
        this.offsets[ci] = this.getRandomRange(this.OFFSET_RANGES);
        this.speeds[ci] = this.getRandomRange(this.SPEED_RANGES);
        this.finalAmplitudes[ci] = this.getRandomRange(this.AMPLITUDE_RANGES);
        this.widths[ci] = this.getRandomRange(this.WIDTH_RANGES);
        this.verses[ci] = this.getRandomRange([-1, 1]);
      }
    }, {
      key: "respawn",
      value: function respawn() {
        this.spawnAt = Date.now();
        this.noOfCurves = Math.floor(this.getRandomRange(this.NOOFCURVES_RANGES));
        this.phases = new Array(this.noOfCurves);
        this.offsets = new Array(this.noOfCurves);
        this.speeds = new Array(this.noOfCurves);
        this.finalAmplitudes = new Array(this.noOfCurves);
        this.widths = new Array(this.noOfCurves);
        this.amplitudes = new Array(this.noOfCurves);
        this.despawnTimeouts = new Array(this.noOfCurves);
        this.verses = new Array(this.noOfCurves);

        for (var ci = 0; ci < this.noOfCurves; ci++) {
          this.respawnSingle(ci);
        }
      }
    }, {
      key: "globalAttFn",
      value: function globalAttFn(x) {
        return Math.pow(this.ATT_FACTOR / (this.ATT_FACTOR + Math.pow(x, 2)), this.ATT_FACTOR);
      }
    }, {
      key: "sin",
      value: function sin(x, phase) {
        return Math.sin(x - phase);
      }
    }, {
      key: "_grad",
      value: function _grad(x, a, b) {
        if (x > a && x < b) return 1;
        return 1;
      }
    }, {
      key: "yRelativePos",
      value: function yRelativePos(i) {
        var y = 0;

        for (var ci = 0; ci < this.noOfCurves; ci++) {
          // Generate a static T so that each curve is distant from each oterh
          var t = 4 * (-1 + ci / (this.noOfCurves - 1) * 2); // but add a dynamic offset

          t += this.offsets[ci];
          var k = 1 / this.widths[ci];
          var x = i * k - t;
          y += Math.abs(this.amplitudes[ci] * this.sin(this.verses[ci] * x, this.phases[ci]) * this.globalAttFn(x));
        } // Divide for NoOfCurves so that y <= 1


        return y / this.noOfCurves;
      }
    }, {
      key: "_ypos",
      value: function _ypos(i) {
        return this.AMPLITUDE_FACTOR * this.ctrl.heightMax * this.ctrl.amplitude * this.yRelativePos(i) * this.globalAttFn(i / this.GRAPH_X * 2);
      }
    }, {
      key: "_xpos",
      value: function _xpos(i) {
        return this.ctrl.width * ((i + this.GRAPH_X) / (this.GRAPH_X * 2));
      }
    }, {
      key: "drawSupportLine",
      value: function drawSupportLine(ctx) {
        var coo = [0, this.ctrl.heightMax, this.ctrl.width, 1];
        var gradient = ctx.createLinearGradient.apply(ctx, coo);
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(0.1, 'rgba(255,255,255,.5)');
        gradient.addColorStop(1 - 0.1 - 0.1, 'rgba(255,255,255,.5)');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect.apply(ctx, coo);
      }
    }, {
      key: "draw",
      value: function draw() {
        var ctx = this.ctrl.ctx;
        ctx.globalAlpha = 0.7;
        ctx.globalCompositeOperation = 'lighter';

        if (this.definition.supportLine) {
          // Draw the support line
          return this.drawSupportLine(ctx);
        }

        for (var ci = 0; ci < this.noOfCurves; ci++) {
          if (this.spawnAt + this.despawnTimeouts[ci] <= Date.now()) {
            this.amplitudes[ci] -= this.DESPAWN_FACTOR;
          } else {
            this.amplitudes[ci] += this.DESPAWN_FACTOR;
          }

          this.amplitudes[ci] = Math.min(Math.max(this.amplitudes[ci], 0), this.finalAmplitudes[ci]);
          this.phases[ci] = (this.phases[ci] + this.ctrl.speed * this.speeds[ci] * this.SPEED_FACTOR) % (2 * Math.PI);
        }

        var maxY = -Infinity;

        var _arr = [1, -1];

        for (var _i = 0; _i < _arr.length; _i++) {
          var sign = _arr[_i];
          ctx.beginPath();

          for (var i = -this.GRAPH_X; i <= this.GRAPH_X; i += this.ctrl.opt.pixelDepth) {
            var x = this._xpos(i);

            var y = this._ypos(i);

            ctx.lineTo(x, this.ctrl.heightMax - sign * y);
            maxY = Math.max(maxY, y);
          }

          ctx.closePath();
          ctx.fillStyle = "rgba(".concat(this.definition.color, ", 1)");
          ctx.strokeStyle = "rgba(".concat(this.definition.color, ", 1)");
          ctx.fill();
        }

        if (maxY < this.DEAD_PX && this.prevMaxY > maxY) {
          this.respawn();
        }

        this.prevMaxY = maxY;
        return null;
      }
    }], [{
      key: "getDefinition",
      value: function getDefinition(waveColors) {
        return Object.assign([{
          color: '255,255,255',
          supportLine: true
        }, {
          // blue
          color: '15, 82, 169'
        }, {
          // red
          color: '173, 57, 76'
        }, {
          // green
          color: '48, 220, 155'
        }], waveColors);
      }
    }]);

    return iOS9Curve;
  }();

  var SiriWave =
  /*#__PURE__*/
  function () {
    /**
     * Build the SiriWave
     * @param {Object} opt
     * @param {DOMElement} [opt.container=document.body] The DOM container where the DOM canvas element will be added
     * @param {String} [opt.style='ios'] The style of the wave: `ios` or `ios9`
     * @param {Number} [opt.ratio=null] Ratio of the display to use. Calculated by default.
     * @param {Number} [opt.speed=0.2] The speed of the animation.
     * @param {Number} [opt.amplitude=1] The amplitude of the complete wave.
     * @param {Number} [opt.frequency=6] The frequency for the complete wave (how many waves). - Not available in iOS9 Style
     * @param {String} [opt.color='#fff'] The color of the wave, in hexadecimal form (`#336699`, `#FF0`). - Not available in iOS9 Style
     * @param {Boolean} [opt.cover=false] The `canvas` covers the entire width or height of the container.
     * @param {Number} [opt.width=null] Width of the canvas. Calculated by default.
     * @param {Number} [opt.height=null] Height of the canvas. Calculated by default.
     * @param {Boolean} [opt.autostart=false] Decide wether start the animation on boot.
     * @param {Number} [opt.pixelDepth=0.02] Number of step (in pixels) used when drawed on canvas.
     * @param {Number} [opt.lerpSpeed=0.1] Lerp speed to interpolate properties.
     */
    function SiriWave() {
      var opt = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      _classCallCheck(this, SiriWave);

      this.container = opt.container || document.body; // In this.opt you could find definitive opt with defaults values

      this.opt = Object.assign({
        style: 'ios',
        ratio: window.devicePixelRatio || 1,
        speed: 0.2,
        amplitude: 1,
        frequency: 6,
        color: '#fff',
        cover: false,
        width: window.getComputedStyle(this.container).width.replace('px', ''),
        height: window.getComputedStyle(this.container).height.replace('px', ''),
        autostart: false,
        pixelDepth: 0.02,
        lerpSpeed: 0.1
      }, opt);
      /**
       * Phase of the wave (passed to Math.sin function)
       */

      this.phase = 0;
      /**
       * Boolean value indicating the the animation is running
       */

      this.run = false;
      /**
       * Actual speed of the animation. Is not safe to change this value directly, use `setSpeed` instead.
       */

      this.speed = Number(this.opt.speed);
      /**
       * Actual amplitude of the animation. Is not safe to change this value directly, use `setAmplitude` instead.
       */

      this.amplitude = Number(this.opt.amplitude);
      /**
       * Width of the canvas multiplied by pixel ratio
       */

      this.width = Number(this.opt.ratio * this.opt.width);
      /**
       * Height of the canvas multiplied by pixel ratio
       */

      this.height = Number(this.opt.ratio * this.opt.height);
      /**
       * Maximum height for a single wave
       */

      this.heightMax = Number(this.height / 2) - 6;
      /**
       * Color of the wave (used in Classic iOS)
       */

      this.color = "rgb(".concat(this.hex2rgb(this.opt.color), ")");
      /**
       * An object containing controller variables that need to be interpolated
       * to an another value before to be actually changed
       */

      this.interpolation = {
        speed: this.speed,
        amplitude: this.amplitude
      };
      /**
       * Canvas DOM Element where curves will be drawn
       */

      this.canvas = document.createElement('canvas');
      /**
       * 2D Context from Canvas
       */

      this.ctx = this.canvas.getContext('2d'); // Set dimensions

      this.canvas.width = this.width;
      this.canvas.height = this.height; // By covering, we ensure the canvas is in the same size of the parent

      if (this.opt.cover === true) {
        this.canvas.style.width = this.canvas.style.height = '100%';
      } else {
        this.canvas.style.width = "".concat(this.width / this.opt.ratio, "px");
        this.canvas.style.height = "".concat(this.height / this.opt.ratio, "px");
      }
      /**
       * Curves objects to animate
       */


      this.curves = []; // Instantiate all curves based on the style

      if (this.opt.style === 'ios9') {
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = iOS9Curve.getDefinition(this.opt.waveColors || [])[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var def = _step.value;
            this.curves.push(new iOS9Curve({
              ctrl: this,
              definition: def
            }));
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return != null) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }
      } else {
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = Curve.getDefinition()[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var _def = _step2.value;
            this.curves.push(new Curve({
              ctrl: this,
              definition: _def
            }));
          }
        } catch (err) {
          _didIteratorError2 = true;
          _iteratorError2 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion2 && _iterator2.return != null) {
              _iterator2.return();
            }
          } finally {
            if (_didIteratorError2) {
              throw _iteratorError2;
            }
          }
        }
      } // Attach to the container


      this.container.appendChild(this.canvas); // Start the animation

      if (opt.autostart) {
        this.start();
      }
    }
    /**
     * Convert an HEX color to RGB
     * @param {String} hex
     * @returns RGB value that could be used
     * @memberof SiriWave
     */


    _createClass(SiriWave, [{
      key: "hex2rgb",
      value: function hex2rgb(hex) {
        var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, function (m, r, g, b) {
          return r + r + g + g + b + b;
        });
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? "".concat(parseInt(result[1], 16).toString(), ",").concat(parseInt(result[2], 16).toString(), ",").concat(parseInt(result[3], 16).toString()) : null;
      }
      /**
       * Interpolate a property to the value found in $.interpolation
       * @param {String} propertyStr
       * @returns
       * @memberof SiriWave
       */

    }, {
      key: "lerp",
      value: function lerp(propertyStr) {
        this[propertyStr] = lerp_1(this[propertyStr], this.interpolation[propertyStr], this.opt.lerpSpeed);

        if (this[propertyStr] - this.interpolation[propertyStr] === 0) {
          this.interpolation[propertyStr] = null;
        }

        return this[propertyStr];
      }
      /**
       * Clear the canvas
       * @memberof SiriWave
       */

    }, {
      key: "_clear",
      value: function _clear() {
        this.ctx.globalCompositeOperation = 'destination-out';
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.ctx.globalCompositeOperation = 'source-over';
      }
      /**
       * Draw all curves
       * @memberof SiriWave
       */

    }, {
      key: "_draw",
      value: function _draw() {
        var _iteratorNormalCompletion3 = true;
        var _didIteratorError3 = false;
        var _iteratorError3 = undefined;

        try {
          for (var _iterator3 = this.curves[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            var curve = _step3.value;
            curve.draw();
          }
        } catch (err) {
          _didIteratorError3 = true;
          _iteratorError3 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion3 && _iterator3.return != null) {
              _iterator3.return();
            }
          } finally {
            if (_didIteratorError3) {
              throw _iteratorError3;
            }
          }
        }
      }
      /**
       * Clear the space, interpolate values, calculate new steps and draws
       * @returns
       * @memberof SiriWave
       */

    }, {
      key: "startDrawCycle",
      value: function startDrawCycle() {
        if (this.run === false) return;

        this._clear(); // Interpolate values


        if (this.interpolation.amplitude !== null) this.lerp('amplitude');
        if (this.interpolation.speed !== null) this.lerp('speed');

        this._draw();

        this.phase = (this.phase + Math.PI / 2 * this.speed) % (2 * Math.PI);
        raf_1(this.startDrawCycle.bind(this), 20);
      }
      /* API */

      /**
       * Start the animation
       * @memberof SiriWave
       */

    }, {
      key: "start",
      value: function start() {
        this.phase = 0;
        this.run = true;
        this.startDrawCycle();
      }
      /**
       * Stop the animation
       * @memberof SiriWave
       */

    }, {
      key: "stop",
      value: function stop() {
        this.phase = 0;
        this.run = false;
      }
      /**
       * Set a new value for a property (interpolated)
       * @param {String} propertyStr
       * @param {Number} v
       * @memberof SiriWave
       */

    }, {
      key: "set",
      value: function set(propertyStr, v) {
        this.interpolation[propertyStr] = Number(v);
      }
      /**
       * Set a new value for the speed property (interpolated)
       * @param {Number} v
       * @memberof SiriWave
       */

    }, {
      key: "setSpeed",
      value: function setSpeed(v) {
        this.set('speed', v);
      }
      /**
       * Set a new value for the amplitude property (interpolated)
       * @param {Number} v
       * @memberof SiriWave
       */

    }, {
      key: "setAmplitude",
      value: function setAmplitude(v) {
        this.set('amplitude', v);
      }
    }]);

    return SiriWave;
  }();

  return SiriWave;

})));
/*!
 * wavesurfer.js 3.2.0 (2019-10-25)
 * https://github.com/katspaugh/wavesurfer.js
 * @license BSD-3-Clause
 */
(function webpackUniversalModuleDefinition(root, factory) {
  if(typeof exports === 'object' && typeof module === 'object')
    module.exports = factory();
  else if(typeof define === 'function' && define.amd)
    define("WaveSurfer", [], factory);
  else if(typeof exports === 'object')
    exports["WaveSurfer"] = factory();
  else
    root["WaveSurfer"] = factory();
})(window, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/  // The module cache
/******/  var installedModules = {};
/******/
/******/  // The require function
/******/  function __webpack_require__(moduleId) {
/******/
/******/    // Check if module is in cache
/******/    if(installedModules[moduleId]) {
/******/      return installedModules[moduleId].exports;
/******/    }
/******/    // Create a new module (and put it into the cache)
/******/    var module = installedModules[moduleId] = {
/******/      i: moduleId,
/******/      l: false,
/******/      exports: {}
/******/    };
/******/
/******/    // Execute the module function
/******/    modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/    // Flag the module as loaded
/******/    module.l = true;
/******/
/******/    // Return the exports of the module
/******/    return module.exports;
/******/  }
/******/
/******/
/******/  // expose the modules object (__webpack_modules__)
/******/  __webpack_require__.m = modules;
/******/
/******/  // expose the module cache
/******/  __webpack_require__.c = installedModules;
/******/
/******/  // define getter function for harmony exports
/******/  __webpack_require__.d = function(exports, name, getter) {
/******/    if(!__webpack_require__.o(exports, name)) {
/******/      Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/    }
/******/  };
/******/
/******/  // define __esModule on exports
/******/  __webpack_require__.r = function(exports) {
/******/    if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/      Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/    }
/******/    Object.defineProperty(exports, '__esModule', { value: true });
/******/  };
/******/
/******/  // create a fake namespace object
/******/  // mode & 1: value is a module id, require it
/******/  // mode & 2: merge all properties of value into the ns
/******/  // mode & 4: return value when already ns object
/******/  // mode & 8|1: behave like require
/******/  __webpack_require__.t = function(value, mode) {
/******/    if(mode & 1) value = __webpack_require__(value);
/******/    if(mode & 8) return value;
/******/    if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/    var ns = Object.create(null);
/******/    __webpack_require__.r(ns);
/******/    Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/    if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/    return ns;
/******/  };
/******/
/******/  // getDefaultExport function for compatibility with non-harmony modules
/******/  __webpack_require__.n = function(module) {
/******/    var getter = module && module.__esModule ?
/******/      function getDefault() { return module['default']; } :
/******/      function getModuleExports() { return module; };
/******/    __webpack_require__.d(getter, 'a', getter);
/******/    return getter;
/******/  };
/******/
/******/  // Object.prototype.hasOwnProperty.call
/******/  __webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/  // __webpack_public_path__
/******/  __webpack_require__.p = "";
/******/
/******/
/******/  // Load entry module and return exports
/******/  return __webpack_require__(__webpack_require__.s = "./src/wavesurfer.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./node_modules/debounce/index.js":
/*!****************************************!*\
  !*** ./node_modules/debounce/index.js ***!
  \****************************************/
/*! no static exports found */
/***/ (function(module, exports) {

/**
 * Returns a function, that, as long as it continues to be invoked, will not
 * be triggered. The function will be called after it stops being called for
 * N milliseconds. If `immediate` is passed, trigger the function on the
 * leading edge, instead of the trailing. The function also has a property 'clear' 
 * that is a function which will clear the timer to prevent previously scheduled executions. 
 *
 * @source underscore.js
 * @see http://unscriptable.com/2009/03/20/debouncing-javascript-methods/
 * @param {Function} function to wrap
 * @param {Number} timeout in ms (`100`)
 * @param {Boolean} whether to execute at the beginning (`false`)
 * @api public
 */
function debounce(func, wait, immediate){
  var timeout, args, context, timestamp, result;
  if (null == wait) wait = 100;

  function later() {
    var last = Date.now() - timestamp;

    if (last < wait && last >= 0) {
      timeout = setTimeout(later, wait - last);
    } else {
      timeout = null;
      if (!immediate) {
        result = func.apply(context, args);
        context = args = null;
      }
    }
  };

  var debounced = function(){
    context = this;
    args = arguments;
    timestamp = Date.now();
    var callNow = immediate && !timeout;
    if (!timeout) timeout = setTimeout(later, wait);
    if (callNow) {
      result = func.apply(context, args);
      context = args = null;
    }

    return result;
  };

  debounced.clear = function() {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };
  
  debounced.flush = function() {
    if (timeout) {
      result = func.apply(context, args);
      context = args = null;
      
      clearTimeout(timeout);
      timeout = null;
    }
  };

  return debounced;
};

// Adds compatibility for ES modules
debounce.debounce = debounce;

module.exports = debounce;


/***/ }),

/***/ "./src/drawer.canvasentry.js":
/*!***********************************!*\
  !*** ./src/drawer.canvasentry.js ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _style = _interopRequireDefault(__webpack_require__(/*! ./util/style */ "./src/util/style.js"));

var _getId = _interopRequireDefault(__webpack_require__(/*! ./util/get-id */ "./src/util/get-id.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * The `CanvasEntry` class represents an element consisting of a wave `canvas`
 * and an (optional) progress wave `canvas`.
 *
 * The `MultiCanvas` renderer uses one or more `CanvasEntry` instances to
 * render a waveform, depending on the zoom level.
 */
var CanvasEntry =
/*#__PURE__*/
function () {
  function CanvasEntry() {
    _classCallCheck(this, CanvasEntry);

    /**
     * The wave node
     *
     * @type {HTMLCanvasElement}
     */
    this.wave = null;
    /**
     * The wave canvas rendering context
     *
     * @type {CanvasRenderingContext2D}
     */

    this.waveCtx = null;
    /**
     * The (optional) progress wave node
     *
     * @type {HTMLCanvasElement}
     */

    this.progress = null;
    /**
     * The (optional) progress wave canvas rendering context
     *
     * @type {CanvasRenderingContext2D}
     */

    this.progressCtx = null;
    /**
     * Start of the area the canvas should render, between 0 and 1
     *
     * @type {number}
     * @private
     */

    this.start = 0;
    /**
     * End of the area the canvas should render, between 0 and 1
     *
     * @type {number}
     * @private
     */

    this.end = 1;
    /**
     * Unique identifier for this entry
     *
     * @type {string}
     */

    this.id = (0, _getId.default)(this.constructor.name.toLowerCase() + '_');
  }
  /**
   * Store the wave canvas element and create the 2D rendering context
   *
   * @param {HTMLCanvasElement} element The wave `canvas` element.
   */


  _createClass(CanvasEntry, [{
    key: "initWave",
    value: function initWave(element) {
      this.wave = element;
      this.waveCtx = this.wave.getContext('2d');
    }
    /**
     * Store the progress wave canvas element and create the 2D rendering
     * context
     *
     * @param {HTMLCanvasElement} element The progress wave `canvas` element.
     */

  }, {
    key: "initProgress",
    value: function initProgress(element) {
      this.progress = element;
      this.progressCtx = this.progress.getContext('2d');
    }
    /**
     * Update the dimensions
     *
     * @param {number} elementWidth Width of the entry
     * @param {number} totalWidth Total width of the multi canvas renderer
     * @param {number} width The new width of the element
     * @param {number} height The new height of the element
     */

  }, {
    key: "updateDimensions",
    value: function updateDimensions(elementWidth, totalWidth, width, height) {
      // where the canvas starts and ends in the waveform, represented as a
      // decimal between 0 and 1
      this.start = this.wave.offsetLeft / totalWidth || 0;
      this.end = this.start + elementWidth / totalWidth; // set wave canvas dimensions

      this.wave.width = width;
      this.wave.height = height;
      var elementSize = {
        width: elementWidth + 'px'
      };
      (0, _style.default)(this.wave, elementSize);

      if (this.hasProgressCanvas) {
        // set progress canvas dimensions
        this.progress.width = width;
        this.progress.height = height;
        (0, _style.default)(this.progress, elementSize);
      }
    }
    /**
     * Clear the wave and progress rendering contexts
     */

  }, {
    key: "clearWave",
    value: function clearWave() {
      // wave
      this.waveCtx.clearRect(0, 0, this.waveCtx.canvas.width, this.waveCtx.canvas.height); // progress

      if (this.hasProgressCanvas) {
        this.progressCtx.clearRect(0, 0, this.progressCtx.canvas.width, this.progressCtx.canvas.height);
      }
    }
    /**
     * Set the fill styles for wave and progress
     *
     * @param {string} waveColor Fill color for the wave canvas
     * @param {?string} progressColor Fill color for the progress canvas
     */

  }, {
    key: "setFillStyles",
    value: function setFillStyles(waveColor, progressColor) {
      this.waveCtx.fillStyle = waveColor;

      if (this.hasProgressCanvas) {
        this.progressCtx.fillStyle = progressColor;
      }
    }
    /**
     * Draw a rectangle for wave and progress
     *
     * @param {number} x X start position
     * @param {number} y Y start position
     * @param {number} width Width of the rectangle
     * @param {number} height Height of the rectangle
     * @param {number} radius Radius of the rectangle
     */

  }, {
    key: "fillRects",
    value: function fillRects(x, y, width, height, radius) {
      this.fillRectToContext(this.waveCtx, x, y, width, height, radius);

      if (this.hasProgressCanvas) {
        this.fillRectToContext(this.progressCtx, x, y, width, height, radius);
      }
    }
    /**
     * Draw the actual rectangle on a `canvas` element
     *
     * @private
     * @param {CanvasRenderingContext2D} ctx Rendering context of target canvas
     * @param {number} x X start position
     * @param {number} y Y start position
     * @param {number} width Width of the rectangle
     * @param {number} height Height of the rectangle
     * @param {number} radius Radius of the rectangle
     */

  }, {
    key: "fillRectToContext",
    value: function fillRectToContext(ctx, x, y, width, height, radius) {
      if (!ctx) {
        return;
      }

      if (radius) {
        this.drawRoundedRect(ctx, x, y, width, height, radius);
      } else {
        ctx.fillRect(x, y, width, height);
      }
    }
    /**
     * Draw a rounded rectangle on Canvas
     *
     * @private
     * @param {CanvasRenderingContext2D} ctx Canvas context
     * @param {number} x X-position of the rectangle
     * @param {number} y Y-position of the rectangle
     * @param {number} width Width of the rectangle
     * @param {number} height Height of the rectangle
     * @param {number} radius Radius of the rectangle
     *
     * @return {void}
     * @example drawRoundedRect(ctx, 50, 50, 5, 10, 3)
     */

  }, {
    key: "drawRoundedRect",
    value: function drawRoundedRect(ctx, x, y, width, height, radius) {
      if (height === 0) {
        return;
      } // peaks are float values from -1 to 1. Use absolute height values in
      // order to correctly calculate rounded rectangle coordinates


      if (height < 0) {
        height *= -1;
        y -= height;
      }

      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.fill();
    }
    /**
     * Render the actual wave and progress lines
     *
     * @param {number[]} peaks Array with peaks data
     * @param {number} absmax Maximum peak value (absolute)
     * @param {number} halfH Half the height of the waveform
     * @param {number} offsetY Offset to the top
     * @param {number} start The x-offset of the beginning of the area that
     * should be rendered
     * @param {number} end The x-offset of the end of the area that
     * should be rendered
     */

  }, {
    key: "drawLines",
    value: function drawLines(peaks, absmax, halfH, offsetY, start, end) {
      this.drawLineToContext(this.waveCtx, peaks, absmax, halfH, offsetY, start, end);

      if (this.hasProgressCanvas) {
        this.drawLineToContext(this.progressCtx, peaks, absmax, halfH, offsetY, start, end);
      }
    }
    /**
     * Render the actual waveform line on a `canvas` element
     *
     * @private
     * @param {CanvasRenderingContext2D} ctx Rendering context of target canvas
     * @param {number[]} peaks Array with peaks data
     * @param {number} absmax Maximum peak value (absolute)
     * @param {number} halfH Half the height of the waveform
     * @param {number} offsetY Offset to the top
     * @param {number} start The x-offset of the beginning of the area that
     * should be rendered
     * @param {number} end The x-offset of the end of the area that
     * should be rendered
     */

  }, {
    key: "drawLineToContext",
    value: function drawLineToContext(ctx, peaks, absmax, halfH, offsetY, start, end) {
      if (!ctx) {
        return;
      }

      var length = peaks.length / 2;
      var first = Math.round(length * this.start); // use one more peak value to make sure we join peaks at ends -- unless,
      // of course, this is the last canvas

      var last = Math.round(length * this.end) + 1;
      var canvasStart = first;
      var canvasEnd = last;
      var scale = this.wave.width / (canvasEnd - canvasStart - 1); // optimization

      var halfOffset = halfH + offsetY;
      var absmaxHalf = absmax / halfH;
      ctx.beginPath();
      ctx.moveTo((canvasStart - first) * scale, halfOffset);
      ctx.lineTo((canvasStart - first) * scale, halfOffset - Math.round((peaks[2 * canvasStart] || 0) / absmaxHalf));
      var i, peak, h;

      for (i = canvasStart; i < canvasEnd; i++) {
        peak = peaks[2 * i] || 0;
        h = Math.round(peak / absmaxHalf);
        ctx.lineTo((i - first) * scale + this.halfPixel, halfOffset - h);
      } // draw the bottom edge going backwards, to make a single
      // closed hull to fill


      var j = canvasEnd - 1;

      for (j; j >= canvasStart; j--) {
        peak = peaks[2 * j + 1] || 0;
        h = Math.round(peak / absmaxHalf);
        ctx.lineTo((j - first) * scale + this.halfPixel, halfOffset - h);
      }

      ctx.lineTo((canvasStart - first) * scale, halfOffset - Math.round((peaks[2 * canvasStart + 1] || 0) / absmaxHalf));
      ctx.closePath();
      ctx.fill();
    }
    /**
     * Destroys this entry
     */

  }, {
    key: "destroy",
    value: function destroy() {
      this.waveCtx = null;
      this.wave = null;
      this.progressCtx = null;
      this.progress = null;
    }
    /**
     * Return image data of the wave `canvas` element
     *
     * When using a `type` of `'blob'`, this will return a `Promise` that
     * resolves with a `Blob` instance.
     *
     * @param {string} format='image/png' An optional value of a format type.
     * @param {number} quality=0.92 An optional value between 0 and 1.
     * @param {string} type='dataURL' Either 'dataURL' or 'blob'.
     * @return {string|Promise} When using the default `'dataURL'` `type` this
     * returns a data URL. When using the `'blob'` `type` this returns a
     * `Promise` that resolves with a `Blob` instance.
     */

  }, {
    key: "getImage",
    value: function getImage(format, quality, type) {
      var _this = this;

      if (type === 'blob') {
        return new Promise(function (resolve) {
          _this.wave.toBlob(resolve, format, quality);
        });
      } else if (type === 'dataURL') {
        return this.wave.toDataURL(format, quality);
      }
    }
  }]);

  return CanvasEntry;
}();

exports.default = CanvasEntry;
module.exports = exports.default;

/***/ }),

/***/ "./src/drawer.js":
/*!***********************!*\
  !*** ./src/drawer.js ***!
  \***********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var util = _interopRequireWildcard(__webpack_require__(/*! ./util */ "./src/util/index.js"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; if (obj != null) { var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

/**
 * Parent class for renderers
 *
 * @extends {Observer}
 */
var Drawer =
/*#__PURE__*/
function (_util$Observer) {
  _inherits(Drawer, _util$Observer);

  /**
   * @param {HTMLElement} container The container node of the wavesurfer instance
   * @param {WavesurferParams} params The wavesurfer initialisation options
   */
  function Drawer(container, params) {
    var _this;

    _classCallCheck(this, Drawer);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(Drawer).call(this));
    /** @private */

    _this.container = container;
    /**
     * @type {WavesurferParams}
     * @private
     */

    _this.params = params;
    /**
     * The width of the renderer
     * @type {number}
     */

    _this.width = 0;
    /**
     * The height of the renderer
     * @type {number}
     */

    _this.height = params.height * _this.params.pixelRatio;
    /** @private */

    _this.lastPos = 0;
    /**
     * The `<wave>` element which is added to the container
     * @type {HTMLElement}
     */

    _this.wrapper = null;
    return _this;
  }
  /**
   * Alias of `util.style`
   *
   * @param {HTMLElement} el The element that the styles will be applied to
   * @param {Object} styles The map of propName: attribute, both are used as-is
   * @return {HTMLElement} el
   */


  _createClass(Drawer, [{
    key: "style",
    value: function style(el, styles) {
      return util.style(el, styles);
    }
    /**
     * Create the wrapper `<wave>` element, style it and set up the events for
     * interaction
     */

  }, {
    key: "createWrapper",
    value: function createWrapper() {
      this.wrapper = this.container.appendChild(document.createElement('wave'));
      this.style(this.wrapper, {
        display: 'block',
        position: 'relative',
        userSelect: 'none',
        webkitUserSelect: 'none',
        height: this.params.height + 'px'
      });

      if (this.params.fillParent || this.params.scrollParent) {
        this.style(this.wrapper, {
          width: '100%',
          overflowX: this.params.hideScrollbar ? 'hidden' : 'auto',
          overflowY: 'hidden'
        });
      }

      this.setupWrapperEvents();
    }
    /**
     * Handle click event
     *
     * @param {Event} e Click event
     * @param {?boolean} noPrevent Set to true to not call `e.preventDefault()`
     * @return {number} Playback position from 0 to 1
     */

  }, {
    key: "handleEvent",
    value: function handleEvent(e, noPrevent) {
      !noPrevent && e.preventDefault();
      var clientX = e.targetTouches ? e.targetTouches[0].clientX : e.clientX;
      var bbox = this.wrapper.getBoundingClientRect();
      var nominalWidth = this.width;
      var parentWidth = this.getWidth();
      var progress;

      if (!this.params.fillParent && nominalWidth < parentWidth) {
        progress = (this.params.rtl ? bbox.right - clientX : clientX - bbox.left) * (this.params.pixelRatio / nominalWidth) || 0;

        if (progress > 1) {
          progress = 1;
        }
      } else {
        progress = ((this.params.rtl ? bbox.right - clientX : clientX - bbox.left) + this.wrapper.scrollLeft) / this.wrapper.scrollWidth || 0;
      }

      return progress;
    }
    /**
     * @private
     */

  }, {
    key: "setupWrapperEvents",
    value: function setupWrapperEvents() {
      var _this2 = this;

      this.wrapper.addEventListener('click', function (e) {
        var scrollbarHeight = _this2.wrapper.offsetHeight - _this2.wrapper.clientHeight;

        if (scrollbarHeight !== 0) {
          // scrollbar is visible.  Check if click was on it
          var bbox = _this2.wrapper.getBoundingClientRect();

          if (e.clientY >= bbox.bottom - scrollbarHeight) {
            // ignore mousedown as it was on the scrollbar
            return;
          }
        }

        if (_this2.params.interact) {
          _this2.fireEvent('click', e, _this2.handleEvent(e));
        }
      });
      this.wrapper.addEventListener('dblclick', function (e) {
        if (_this2.params.interact) {
          _this2.fireEvent('dblclick', e);
        }
      });
      this.wrapper.addEventListener('scroll', function (e) {
        return _this2.fireEvent('scroll', e);
      });
    }
    /**
     * Draw peaks on the canvas
     *
     * @param {number[]|Number.<Array[]>} peaks Can also be an array of arrays
     * for split channel rendering
     * @param {number} length The width of the area that should be drawn
     * @param {number} start The x-offset of the beginning of the area that
     * should be rendered
     * @param {number} end The x-offset of the end of the area that should be
     * rendered
     */

  }, {
    key: "drawPeaks",
    value: function drawPeaks(peaks, length, start, end) {
      if (!this.setWidth(length)) {
        this.clearWave();
      }

      this.params.barWidth ? this.drawBars(peaks, 0, start, end) : this.drawWave(peaks, 0, start, end);
    }
    /**
     * Scroll to the beginning
     */

  }, {
    key: "resetScroll",
    value: function resetScroll() {
      if (this.wrapper !== null) {
        this.wrapper.scrollLeft = 0;
      }
    }
    /**
     * Recenter the view-port at a certain percent of the waveform
     *
     * @param {number} percent Value from 0 to 1 on the waveform
     */

  }, {
    key: "recenter",
    value: function recenter(percent) {
      var position = this.wrapper.scrollWidth * percent;
      this.recenterOnPosition(position, true);
    }
    /**
     * Recenter the view-port on a position, either scroll there immediately or
     * in steps of 5 pixels
     *
     * @param {number} position X-offset in pixels
     * @param {boolean} immediate Set to true to immediately scroll somewhere
     */

  }, {
    key: "recenterOnPosition",
    value: function recenterOnPosition(position, immediate) {
      var scrollLeft = this.wrapper.scrollLeft;
      var half = ~~(this.wrapper.clientWidth / 2);
      var maxScroll = this.wrapper.scrollWidth - this.wrapper.clientWidth;
      var target = position - half;
      var offset = target - scrollLeft;

      if (maxScroll == 0) {
        // no need to continue if scrollbar is not there
        return;
      } // if the cursor is currently visible...


      if (!immediate && -half <= offset && offset < half) {
        // set rate at which waveform is centered
        var rate = this.params.autoCenterRate; // make rate depend on width of view and length of waveform

        rate /= half;
        rate *= maxScroll;
        offset = Math.max(-rate, Math.min(rate, offset));
        target = scrollLeft + offset;
      } // limit target to valid range (0 to maxScroll)


      target = Math.max(0, Math.min(maxScroll, target)); // no use attempting to scroll if we're not moving

      if (target != scrollLeft) {
        this.wrapper.scrollLeft = target;
      }
    }
    /**
     * Get the current scroll position in pixels
     *
     * @return {number} Horizontal scroll position in pixels
     */

  }, {
    key: "getScrollX",
    value: function getScrollX() {
      var x = 0;

      if (this.wrapper) {
        var pixelRatio = this.params.pixelRatio;
        x = Math.round(this.wrapper.scrollLeft * pixelRatio); // In cases of elastic scroll (safari with mouse wheel) you can
        // scroll beyond the limits of the container
        // Calculate and floor the scrollable extent to make sure an out
        // of bounds value is not returned
        // Ticket #1312

        if (this.params.scrollParent) {
          var maxScroll = ~~(this.wrapper.scrollWidth * pixelRatio - this.getWidth());
          x = Math.min(maxScroll, Math.max(0, x));
        }
      }

      return x;
    }
    /**
     * Get the width of the container
     *
     * @return {number} The width of the container
     */

  }, {
    key: "getWidth",
    value: function getWidth() {
      return Math.round(this.container.clientWidth * this.params.pixelRatio);
    }
    /**
     * Set the width of the container
     *
     * @param {number} width The new width of the container
     * @return {boolean} Whether the width of the container was updated or not
     */

  }, {
    key: "setWidth",
    value: function setWidth(width) {
      if (this.width == width) {
        return false;
      }

      this.width = width;

      if (this.params.fillParent || this.params.scrollParent) {
        this.style(this.wrapper, {
          width: ''
        });
      } else {
        this.style(this.wrapper, {
          width: ~~(this.width / this.params.pixelRatio) + 'px'
        });
      }

      this.updateSize();
      return true;
    }
    /**
     * Set the height of the container
     *
     * @param {number} height The new height of the container.
     * @return {boolean} Whether the height of the container was updated or not
     */

  }, {
    key: "setHeight",
    value: function setHeight(height) {
      if (height == this.height) {
        return false;
      }

      this.height = height;
      this.style(this.wrapper, {
        height: ~~(this.height / this.params.pixelRatio) + 'px'
      });
      this.updateSize();
      return true;
    }
    /**
     * Called by wavesurfer when progress should be rendered
     *
     * @param {number} progress From 0 to 1
     */

  }, {
    key: "progress",
    value: function progress(_progress) {
      var minPxDelta = 1 / this.params.pixelRatio;
      var pos = Math.round(_progress * this.width) * minPxDelta;

      if (pos < this.lastPos || pos - this.lastPos >= minPxDelta) {
        this.lastPos = pos;

        if (this.params.scrollParent && this.params.autoCenter) {
          var newPos = ~~(this.wrapper.scrollWidth * _progress);
          this.recenterOnPosition(newPos, this.params.autoCenterImmediately);
        }

        this.updateProgress(pos);
      }
    }
    /**
     * This is called when wavesurfer is destroyed
     */

  }, {
    key: "destroy",
    value: function destroy() {
      this.unAll();

      if (this.wrapper) {
        if (this.wrapper.parentNode == this.container) {
          this.container.removeChild(this.wrapper);
        }

        this.wrapper = null;
      }
    }
    /* Renderer-specific methods */

    /**
     * Called after cursor related params have changed.
     *
     * @abstract
     */

  }, {
    key: "updateCursor",
    value: function updateCursor() {}
    /**
     * Called when the size of the container changes so the renderer can adjust
     *
     * @abstract
     */

  }, {
    key: "updateSize",
    value: function updateSize() {}
    /**
     * Draw a waveform with bars
     *
     * @abstract
     * @param {number[]|Number.<Array[]>} peaks Can also be an array of arrays for split channel
     * rendering
     * @param {number} channelIndex The index of the current channel. Normally
     * should be 0
     * @param {number} start The x-offset of the beginning of the area that
     * should be rendered
     * @param {number} end The x-offset of the end of the area that should be
     * rendered
     */

  }, {
    key: "drawBars",
    value: function drawBars(peaks, channelIndex, start, end) {}
    /**
     * Draw a waveform
     *
     * @abstract
     * @param {number[]|Number.<Array[]>} peaks Can also be an array of arrays for split channel
     * rendering
     * @param {number} channelIndex The index of the current channel. Normally
     * should be 0
     * @param {number} start The x-offset of the beginning of the area that
     * should be rendered
     * @param {number} end The x-offset of the end of the area that should be
     * rendered
     */

  }, {
    key: "drawWave",
    value: function drawWave(peaks, channelIndex, start, end) {}
    /**
     * Clear the waveform
     *
     * @abstract
     */

  }, {
    key: "clearWave",
    value: function clearWave() {}
    /**
     * Render the new progress
     *
     * @abstract
     * @param {number} position X-Offset of progress position in pixels
     */

  }, {
    key: "updateProgress",
    value: function updateProgress(position) {}
  }]);

  return Drawer;
}(util.Observer);

exports.default = Drawer;
module.exports = exports.default;

/***/ }),

/***/ "./src/drawer.multicanvas.js":
/*!***********************************!*\
  !*** ./src/drawer.multicanvas.js ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _drawer = _interopRequireDefault(__webpack_require__(/*! ./drawer */ "./src/drawer.js"));

var util = _interopRequireWildcard(__webpack_require__(/*! ./util */ "./src/util/index.js"));

var _drawer2 = _interopRequireDefault(__webpack_require__(/*! ./drawer.canvasentry */ "./src/drawer.canvasentry.js"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; if (obj != null) { var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

/**
 * MultiCanvas renderer for wavesurfer. Is currently the default and sole
 * builtin renderer.
 *
 * A `MultiCanvas` consists of one or more `CanvasEntry` instances, depending
 * on the zoom level.
 */
var MultiCanvas =
/*#__PURE__*/
function (_Drawer) {
  _inherits(MultiCanvas, _Drawer);

  /**
   * @param {HTMLElement} container The container node of the wavesurfer instance
   * @param {WavesurferParams} params The wavesurfer initialisation options
   */
  function MultiCanvas(container, params) {
    var _this;

    _classCallCheck(this, MultiCanvas);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(MultiCanvas).call(this, container, params));
    /**
     * @type {number}
     * @private
     */

    _this.maxCanvasWidth = params.maxCanvasWidth;
    /**
     * @private
     * @type {number}
     */

    _this.maxCanvasElementWidth = Math.round(params.maxCanvasWidth / params.pixelRatio);
    /**
     * Whether or not the progress wave is rendered. If the `waveColor`
     * and `progressColor` are the same color it is not.
     *
     * @type {boolean}
     */

    _this.hasProgressCanvas = params.waveColor != params.progressColor;
    /**
     * @private
     * @type {number}
     */

    _this.halfPixel = 0.5 / params.pixelRatio;
    /**
     * List of `CanvasEntry` instances.
     *
     * @private
     * @type {Array}
     */

    _this.canvases = [];
    /**
     * @private
     * @type {HTMLElement}
     */

    _this.progressWave = null;
    /**
     * Class used to generate entries.
     *
     * @private
     * @type {function}
     */

    _this.EntryClass = _drawer2.default;
    /**
     * Overlap added between entries to prevent vertical white stripes
     * between `canvas` elements.
     *
     * @type {number}
     */

    _this.overlap = 2 * Math.ceil(params.pixelRatio / 2);
    /**
     * The radius of the wave bars. Makes bars rounded
     *
     * @private
     * @type {number}
     */

    _this.barRadius = params.barRadius || 0;
    return _this;
  }
  /**
   * Initialize the drawer
   */


  _createClass(MultiCanvas, [{
    key: "init",
    value: function init() {
      this.createWrapper();
      this.createElements();
    }
    /**
     * Create the canvas elements and style them
     *
     * @private
     */

  }, {
    key: "createElements",
    value: function createElements() {
      this.progressWave = this.wrapper.appendChild(this.style(document.createElement('wave'), {
        position: 'absolute',
        zIndex: 3,
        left: 0,
        top: 0,
        bottom: 0,
        overflow: 'hidden',
        width: '0',
        display: 'none',
        boxSizing: 'border-box',
        borderRightStyle: 'solid',
        pointerEvents: 'none'
      }));
      this.addCanvas();
      this.updateCursor();
    }
    /**
     * Update cursor style
     */

  }, {
    key: "updateCursor",
    value: function updateCursor() {
      this.style(this.progressWave, {
        borderRightWidth: this.params.cursorWidth + 'px',
        borderRightColor: this.params.cursorColor
      });
    }
    /**
     * Adjust to the updated size by adding or removing canvases
     */

  }, {
    key: "updateSize",
    value: function updateSize() {
      var _this2 = this;

      var totalWidth = Math.round(this.width / this.params.pixelRatio);
      var requiredCanvases = Math.ceil(totalWidth / (this.maxCanvasElementWidth + this.overlap)); // add required canvases

      while (this.canvases.length < requiredCanvases) {
        this.addCanvas();
      } // remove older existing canvases, if any


      while (this.canvases.length > requiredCanvases) {
        this.removeCanvas();
      }

      var canvasWidth = this.maxCanvasWidth + this.overlap;
      var lastCanvas = this.canvases.length - 1;
      this.canvases.forEach(function (entry, i) {
        if (i == lastCanvas) {
          canvasWidth = _this2.width - _this2.maxCanvasWidth * lastCanvas;
        }

        _this2.updateDimensions(entry, canvasWidth, _this2.height);

        entry.clearWave();
      });
    }
    /**
     * Add a canvas to the canvas list
     *
     * @private
     */

  }, {
    key: "addCanvas",
    value: function addCanvas() {
      var entry = new this.EntryClass();
      entry.hasProgressCanvas = this.hasProgressCanvas;
      entry.halfPixel = this.halfPixel;
      var leftOffset = this.maxCanvasElementWidth * this.canvases.length; // wave

      entry.initWave(this.wrapper.appendChild(this.style(document.createElement('canvas'), {
        position: 'absolute',
        zIndex: 2,
        left: leftOffset + 'px',
        top: 0,
        bottom: 0,
        height: '100%',
        pointerEvents: 'none'
      }))); // progress

      if (this.hasProgressCanvas) {
        entry.initProgress(this.progressWave.appendChild(this.style(document.createElement('canvas'), {
          position: 'absolute',
          left: leftOffset + 'px',
          top: 0,
          bottom: 0,
          height: '100%'
        })));
      }

      this.canvases.push(entry);
    }
    /**
     * Pop single canvas from the list
     *
     * @private
     */

  }, {
    key: "removeCanvas",
    value: function removeCanvas() {
      var lastEntry = this.canvases[this.canvases.length - 1]; // wave

      lastEntry.wave.parentElement.removeChild(lastEntry.wave); // progress

      if (this.hasProgressCanvas) {
        lastEntry.progress.parentElement.removeChild(lastEntry.progress);
      } // cleanup


      if (lastEntry) {
        lastEntry.destroy();
        lastEntry = null;
      }

      this.canvases.pop();
    }
    /**
     * Update the dimensions of a canvas element
     *
     * @private
     * @param {CanvasEntry} entry Target entry
     * @param {number} width The new width of the element
     * @param {number} height The new height of the element
     */

  }, {
    key: "updateDimensions",
    value: function updateDimensions(entry, width, height) {
      var elementWidth = Math.round(width / this.params.pixelRatio);
      var totalWidth = Math.round(this.width / this.params.pixelRatio); // update canvas dimensions

      entry.updateDimensions(elementWidth, totalWidth, width, height); // style element

      this.style(this.progressWave, {
        display: 'block'
      });
    }
    /**
     * Clear the whole multi-canvas
     */

  }, {
    key: "clearWave",
    value: function clearWave() {
      this.canvases.forEach(function (entry) {
        return entry.clearWave();
      });
    }
    /**
     * Draw a waveform with bars
     *
     * @param {number[]|Number.<Array[]>} peaks Can also be an array of arrays
     * for split channel rendering
     * @param {number} channelIndex The index of the current channel. Normally
     * should be 0. Must be an integer.
     * @param {number} start The x-offset of the beginning of the area that
     * should be rendered
     * @param {number} end The x-offset of the end of the area that should be
     * rendered
     * @returns {void}
     */

  }, {
    key: "drawBars",
    value: function drawBars(peaks, channelIndex, start, end) {
      var _this3 = this;

      return this.prepareDraw(peaks, channelIndex, start, end, function (_ref) {
        var absmax = _ref.absmax,
            hasMinVals = _ref.hasMinVals,
            height = _ref.height,
            offsetY = _ref.offsetY,
            halfH = _ref.halfH,
            peaks = _ref.peaks;

        // if drawBars was called within ws.empty we don't pass a start and
        // don't want anything to happen
        if (start === undefined) {
          return;
        } // Skip every other value if there are negatives.


        var peakIndexScale = hasMinVals ? 2 : 1;
        var length = peaks.length / peakIndexScale;
        var bar = _this3.params.barWidth * _this3.params.pixelRatio;
        var gap = _this3.params.barGap === null ? Math.max(_this3.params.pixelRatio, ~~(bar / 2)) : Math.max(_this3.params.pixelRatio, _this3.params.barGap * _this3.params.pixelRatio);
        var step = bar + gap;
        var scale = length / _this3.width;
        var first = start;
        var last = end;
        var i = first;

        for (i; i < last; i += step) {
          var peak = peaks[Math.floor(i * scale * peakIndexScale)] || 0;
          var h = Math.round(peak / absmax * halfH);

          _this3.fillRect(i + _this3.halfPixel, halfH - h + offsetY, bar + _this3.halfPixel, h * 2, _this3.barRadius);
        }
      });
    }
    /**
     * Draw a waveform
     *
     * @param {number[]|Number.<Array[]>} peaks Can also be an array of arrays
     * for split channel rendering
     * @param {number} channelIndex The index of the current channel. Normally
     * should be 0
     * @param {number?} start The x-offset of the beginning of the area that
     * should be rendered (If this isn't set only a flat line is rendered)
     * @param {number?} end The x-offset of the end of the area that should be
     * rendered
     * @returns {void}
     */

  }, {
    key: "drawWave",
    value: function drawWave(peaks, channelIndex, start, end) {
      var _this4 = this;

      return this.prepareDraw(peaks, channelIndex, start, end, function (_ref2) {
        var absmax = _ref2.absmax,
            hasMinVals = _ref2.hasMinVals,
            height = _ref2.height,
            offsetY = _ref2.offsetY,
            halfH = _ref2.halfH,
            peaks = _ref2.peaks;

        if (!hasMinVals) {
          var reflectedPeaks = [];
          var len = peaks.length;
          var i = 0;

          for (i; i < len; i++) {
            reflectedPeaks[2 * i] = peaks[i];
            reflectedPeaks[2 * i + 1] = -peaks[i];
          }

          peaks = reflectedPeaks;
        } // if drawWave was called within ws.empty we don't pass a start and
        // end and simply want a flat line


        if (start !== undefined) {
          _this4.drawLine(peaks, absmax, halfH, offsetY, start, end);
        } // always draw a median line


        _this4.fillRect(0, halfH + offsetY - _this4.halfPixel, _this4.width, _this4.halfPixel, _this4.barRadius);
      });
    }
    /**
     * Tell the canvas entries to render their portion of the waveform
     *
     * @private
     * @param {number[]} peaks Peaks data
     * @param {number} absmax Maximum peak value (absolute)
     * @param {number} halfH Half the height of the waveform
     * @param {number} offsetY Offset to the top
     * @param {number} start The x-offset of the beginning of the area that
     * should be rendered
     * @param {number} end The x-offset of the end of the area that
     * should be rendered
     */

  }, {
    key: "drawLine",
    value: function drawLine(peaks, absmax, halfH, offsetY, start, end) {
      var _this5 = this;

      this.canvases.forEach(function (entry) {
        _this5.setFillStyles(entry);

        entry.drawLines(peaks, absmax, halfH, offsetY, start, end);
      });
    }
    /**
     * Draw a rectangle on the multi-canvas
     *
     * @param {number} x X-position of the rectangle
     * @param {number} y Y-position of the rectangle
     * @param {number} width Width of the rectangle
     * @param {number} height Height of the rectangle
     * @param {number} radius Radius of the rectangle
     */

  }, {
    key: "fillRect",
    value: function fillRect(x, y, width, height, radius) {
      var startCanvas = Math.floor(x / this.maxCanvasWidth);
      var endCanvas = Math.min(Math.ceil((x + width) / this.maxCanvasWidth) + 1, this.canvases.length);
      var i = startCanvas;

      for (i; i < endCanvas; i++) {
        var entry = this.canvases[i];
        var leftOffset = i * this.maxCanvasWidth;
        var intersection = {
          x1: Math.max(x, i * this.maxCanvasWidth),
          y1: y,
          x2: Math.min(x + width, i * this.maxCanvasWidth + entry.wave.width),
          y2: y + height
        };

        if (intersection.x1 < intersection.x2) {
          this.setFillStyles(entry);
          entry.fillRects(intersection.x1 - leftOffset, intersection.y1, intersection.x2 - intersection.x1, intersection.y2 - intersection.y1, radius);
        }
      }
    }
    /**
     * Performs preparation tasks and calculations which are shared by `drawBars`
     * and `drawWave`
     *
     * @private
     * @param {number[]|Number.<Array[]>} peaks Can also be an array of arrays for
     * split channel rendering
     * @param {number} channelIndex The index of the current channel. Normally
     * should be 0
     * @param {number?} start The x-offset of the beginning of the area that
     * should be rendered. If this isn't set only a flat line is rendered
     * @param {number?} end The x-offset of the end of the area that should be
     * rendered
     * @param {function} fn The render function to call, e.g. `drawWave`
     * @returns {void}
     */

  }, {
    key: "prepareDraw",
    value: function prepareDraw(peaks, channelIndex, start, end, fn) {
      var _this6 = this;

      return util.frame(function () {
        // Split channels and call this function with the channelIndex set
        if (peaks[0] instanceof Array) {
          var channels = peaks;

          if (_this6.params.splitChannels) {
            _this6.setHeight(channels.length * _this6.params.height * _this6.params.pixelRatio);

            return channels.forEach(function (channelPeaks, i) {
              return _this6.prepareDraw(channelPeaks, i, start, end, fn);
            });
          }

          peaks = channels[0];
        } // calculate maximum modulation value, either from the barHeight
        // parameter or if normalize=true from the largest value in the peak
        // set


        var absmax = 1 / _this6.params.barHeight;

        if (_this6.params.normalize) {
          var max = util.max(peaks);
          var min = util.min(peaks);
          absmax = -min > max ? -min : max;
        } // Bar wave draws the bottom only as a reflection of the top,
        // so we don't need negative values


        var hasMinVals = [].some.call(peaks, function (val) {
          return val < 0;
        });
        var height = _this6.params.height * _this6.params.pixelRatio;
        var offsetY = height * channelIndex || 0;
        var halfH = height / 2;
        return fn({
          absmax: absmax,
          hasMinVals: hasMinVals,
          height: height,
          offsetY: offsetY,
          halfH: halfH,
          peaks: peaks
        });
      })();
    }
    /**
     * Set the fill styles for a certain entry (wave and progress)
     *
     * @private
     * @param {CanvasEntry} entry Target entry
     */

  }, {
    key: "setFillStyles",
    value: function setFillStyles(entry) {
      entry.setFillStyles(this.params.waveColor, this.params.progressColor);
    }
    /**
     * Return image data of the multi-canvas
     *
     * When using a `type` of `'blob'`, this will return a `Promise`.
     *
     * @param {string} format='image/png' An optional value of a format type.
     * @param {number} quality=0.92 An optional value between 0 and 1.
     * @param {string} type='dataURL' Either 'dataURL' or 'blob'.
     * @return {string|string[]|Promise} When using the default `'dataURL'`
     * `type` this returns a single data URL or an array of data URLs,
     * one for each canvas. When using the `'blob'` `type` this returns a
     * `Promise` that resolves with an array of `Blob` instances, one for each
     * canvas.
     */

  }, {
    key: "getImage",
    value: function getImage(format, quality, type) {
      if (type === 'blob') {
        return Promise.all(this.canvases.map(function (entry) {
          return entry.getImage(format, quality, type);
        }));
      } else if (type === 'dataURL') {
        var images = this.canvases.map(function (entry) {
          return entry.getImage(format, quality, type);
        });
        return images.length > 1 ? images : images[0];
      }
    }
    /**
     * Render the new progress
     *
     * @param {number} position X-offset of progress position in pixels
     */

  }, {
    key: "updateProgress",
    value: function updateProgress(position) {
      this.style(this.progressWave, {
        width: position + 'px'
      });
    }
  }]);

  return MultiCanvas;
}(_drawer.default);

exports.default = MultiCanvas;
module.exports = exports.default;

/***/ }),

/***/ "./src/mediaelement-webaudio.js":
/*!**************************************!*\
  !*** ./src/mediaelement-webaudio.js ***!
  \**************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _mediaelement = _interopRequireDefault(__webpack_require__(/*! ./mediaelement */ "./src/mediaelement.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return _get(target, property, receiver || target); }

function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

/**
 * MediaElementWebAudio backend: allows to load audio as HTML5 audio tag and use it with WebAudio API.
 * Setting the MediaElementWebAudio backend, there is the possibility to load audio of big dimensions, using the WebAudio API features.
 * The audio to load is an HTML5 audio tag, so you have to use the same methods of MediaElement backend for loading and playback.
 * In this way, the audio resource is not loaded entirely from server, but in ranges, since you load an HTML5 audio tag.
 * In this way, filters and other functionalities can be performed like with WebAudio backend, but without decoding
 * internally audio data, that caused crashing of the browser. You have to give also peaks, so the audio data are not decoded.
 *
 * @since 3.2.0
 */
var MediaElementWebAudio =
/*#__PURE__*/
function (_MediaElement) {
  _inherits(MediaElementWebAudio, _MediaElement);

  /**
   * Construct the backend
   *
   * @param {WavesurferParams} params Wavesurfer parameters
   */
  function MediaElementWebAudio(params) {
    var _this;

    _classCallCheck(this, MediaElementWebAudio);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(MediaElementWebAudio).call(this, params));
    /** @private */

    _this.params = params;
    /** @private */

    _this.sourceMediaElement = null;
    return _this;
  }
  /**
   * Initialise the backend, called in `wavesurfer.createBackend()`
   */


  _createClass(MediaElementWebAudio, [{
    key: "init",
    value: function init() {
      this.setPlaybackRate(this.params.audioRate);
      this.createTimer();
      this.createVolumeNode();
      this.createScriptNode();
      this.createAnalyserNode();
    }
    /**
     * Private method called by both `load` (from url)
     * and `loadElt` (existing media element) methods.
     *
     * @param {HTMLMediaElement} media HTML5 Audio or Video element
     * @param {number[]|Number.<Array[]>} peaks Array of peak data
     * @private
     */

  }, {
    key: "_load",
    value: function _load(media, peaks) {
      _get(_getPrototypeOf(MediaElementWebAudio.prototype), "_load", this).call(this, media, peaks);

      this.createMediaElementSource(media);
    }
    /**
     * Create MediaElementSource node
     *
     * @since 3.2.0
     * @param {HTMLMediaElement} mediaElement HTML5 Audio to load
     */

  }, {
    key: "createMediaElementSource",
    value: function createMediaElementSource(mediaElement) {
      this.sourceMediaElement = this.ac.createMediaElementSource(mediaElement);
      this.sourceMediaElement.connect(this.analyser);
    }
  }]);

  return MediaElementWebAudio;
}(_mediaelement.default);

exports.default = MediaElementWebAudio;
module.exports = exports.default;

/***/ }),

/***/ "./src/mediaelement.js":
/*!*****************************!*\
  !*** ./src/mediaelement.js ***!
  \*****************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _webaudio = _interopRequireDefault(__webpack_require__(/*! ./webaudio */ "./src/webaudio.js"));

var util = _interopRequireWildcard(__webpack_require__(/*! ./util */ "./src/util/index.js"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; if (obj != null) { var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return _get(target, property, receiver || target); }

function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

/**
 * MediaElement backend
 */
var MediaElement =
/*#__PURE__*/
function (_WebAudio) {
  _inherits(MediaElement, _WebAudio);

  /**
   * Construct the backend
   *
   * @param {WavesurferParams} params Wavesurfer parameters
   */
  function MediaElement(params) {
    var _this;

    _classCallCheck(this, MediaElement);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(MediaElement).call(this, params));
    /** @private */

    _this.params = params;
    /**
     * Initially a dummy media element to catch errors. Once `_load` is
     * called, this will contain the actual `HTMLMediaElement`.
     * @private
     */

    _this.media = {
      currentTime: 0,
      duration: 0,
      paused: true,
      playbackRate: 1,
      play: function play() {},
      pause: function pause() {},
      volume: 0
    };
    /** @private */

    _this.mediaType = params.mediaType.toLowerCase();
    /** @private */

    _this.elementPosition = params.elementPosition;
    /** @private */

    _this.peaks = null;
    /** @private */

    _this.playbackRate = 1;
    /** @private */

    _this.volume = 1;
    /** @private */

    _this.isMuted = false;
    /** @private */

    _this.buffer = null;
    /** @private */

    _this.onPlayEnd = null;
    /** @private */

    _this.mediaListeners = {};
    return _this;
  }
  /**
   * Initialise the backend, called in `wavesurfer.createBackend()`
   */


  _createClass(MediaElement, [{
    key: "init",
    value: function init() {
      this.setPlaybackRate(this.params.audioRate);
      this.createTimer();
    }
    /**
     * Attach event listeners to media element.
     */

  }, {
    key: "_setupMediaListeners",
    value: function _setupMediaListeners() {
      var _this2 = this;

      this.mediaListeners.error = function () {
        _this2.fireEvent('error', 'Error loading media element');
      };

      this.mediaListeners.canplay = function () {
        _this2.fireEvent('canplay');
      };

      this.mediaListeners.ended = function () {
        _this2.fireEvent('finish');
      }; // listen to and relay play, pause and seeked events to enable
      // playback control from the external media element


      this.mediaListeners.play = function () {
        _this2.fireEvent('play');
      };

      this.mediaListeners.pause = function () {
        _this2.fireEvent('pause');
      };

      this.mediaListeners.seeked = function (event) {
        _this2.fireEvent('seek');
      };

      this.mediaListeners.volumechange = function (event) {
        _this2.isMuted = _this2.media.muted;

        if (_this2.isMuted) {
          _this2.volume = 0;
        } else {
          _this2.volume = _this2.media.volume;
        }

        _this2.fireEvent('volume');
      }; // reset event listeners


      Object.keys(this.mediaListeners).forEach(function (id) {
        _this2.media.removeEventListener(id, _this2.mediaListeners[id]);

        _this2.media.addEventListener(id, _this2.mediaListeners[id]);
      });
    }
    /**
     * Create a timer to provide a more precise `audioprocess` event.
     */

  }, {
    key: "createTimer",
    value: function createTimer() {
      var _this3 = this;

      var onAudioProcess = function onAudioProcess() {
        if (_this3.isPaused()) {
          return;
        }

        _this3.fireEvent('audioprocess', _this3.getCurrentTime()); // Call again in the next frame


        util.frame(onAudioProcess)();
      };

      this.on('play', onAudioProcess); // Update the progress one more time to prevent it from being stuck in
      // case of lower framerates

      this.on('pause', function () {
        _this3.fireEvent('audioprocess', _this3.getCurrentTime());
      });
    }
    /**
     * Create media element with url as its source,
     * and append to container element.
     *
     * @param {string} url Path to media file
     * @param {HTMLElement} container HTML element
     * @param {number[]|Number.<Array[]>} peaks Array of peak data
     * @param {string} preload HTML 5 preload attribute value
     * @throws Will throw an error if the `url` argument is not a valid media
     * element.
     */

  }, {
    key: "load",
    value: function load(url, container, peaks, preload) {
      var media = document.createElement(this.mediaType);
      media.controls = this.params.mediaControls;
      media.autoplay = this.params.autoplay || false;
      media.preload = preload == null ? 'auto' : preload;
      media.src = url;
      media.style.width = '100%';
      var prevMedia = container.querySelector(this.mediaType);

      if (prevMedia) {
        container.removeChild(prevMedia);
      }

      container.appendChild(media);

      this._load(media, peaks);
    }
    /**
     * Load existing media element.
     *
     * @param {HTMLMediaElement} elt HTML5 Audio or Video element
     * @param {number[]|Number.<Array[]>} peaks Array of peak data
     */

  }, {
    key: "loadElt",
    value: function loadElt(elt, peaks) {
      elt.controls = this.params.mediaControls;
      elt.autoplay = this.params.autoplay || false;

      this._load(elt, peaks);
    }
    /**
     * Method called by both `load` (from url)
     * and `loadElt` (existing media element) methods.
     *
     * @param {HTMLMediaElement} media HTML5 Audio or Video element
     * @param {number[]|Number.<Array[]>} peaks Array of peak data
     * @throws Will throw an error if the `media` argument is not a valid media
     * element.
     * @private
     */

  }, {
    key: "_load",
    value: function _load(media, peaks) {
      // verify media element is valid
      if (!(media instanceof HTMLMediaElement) || typeof media.addEventListener === 'undefined') {
        throw new Error('media parameter is not a valid media element');
      } // load must be called manually on iOS, otherwise peaks won't draw
      // until a user interaction triggers load --> 'ready' event


      if (typeof media.load == 'function') {
        // Resets the media element and restarts the media resource. Any
        // pending events are discarded. How much media data is fetched is
        // still affected by the preload attribute.
        media.load();
      }

      this.media = media;

      this._setupMediaListeners();

      this.peaks = peaks;
      this.onPlayEnd = null;
      this.buffer = null;
      this.isMuted = media.muted;
      this.setPlaybackRate(this.playbackRate);
      this.setVolume(this.volume);
    }
    /**
     * Used by `wavesurfer.isPlaying()` and `wavesurfer.playPause()`
     *
     * @return {boolean} Media paused or not
     */

  }, {
    key: "isPaused",
    value: function isPaused() {
      return !this.media || this.media.paused;
    }
    /**
     * Used by `wavesurfer.getDuration()`
     *
     * @return {number} Duration
     */

  }, {
    key: "getDuration",
    value: function getDuration() {
      if (this.explicitDuration) {
        return this.explicitDuration;
      }

      var duration = (this.buffer || this.media).duration;

      if (duration >= Infinity) {
        // streaming audio
        duration = this.media.seekable.end(0);
      }

      return duration;
    }
    /**
     * Returns the current time in seconds relative to the audio-clip's
     * duration.
     *
     * @return {number} Current time
     */

  }, {
    key: "getCurrentTime",
    value: function getCurrentTime() {
      return this.media && this.media.currentTime;
    }
    /**
     * Get the position from 0 to 1
     *
     * @return {number} Current position
     */

  }, {
    key: "getPlayedPercents",
    value: function getPlayedPercents() {
      return this.getCurrentTime() / this.getDuration() || 0;
    }
    /**
     * Get the audio source playback rate.
     *
     * @return {number} Playback rate
     */

  }, {
    key: "getPlaybackRate",
    value: function getPlaybackRate() {
      return this.playbackRate || this.media.playbackRate;
    }
    /**
     * Set the audio source playback rate.
     *
     * @param {number} value Playback rate
     */

  }, {
    key: "setPlaybackRate",
    value: function setPlaybackRate(value) {
      this.playbackRate = value || 1;
      this.media.playbackRate = this.playbackRate;
    }
    /**
     * Used by `wavesurfer.seekTo()`
     *
     * @param {number} start Position to start at in seconds
     */

  }, {
    key: "seekTo",
    value: function seekTo(start) {
      if (start != null) {
        this.media.currentTime = start;
      }

      this.clearPlayEnd();
    }
    /**
     * Plays the loaded audio region.
     *
     * @param {number} start Start offset in seconds, relative to the beginning
     * of a clip.
     * @param {number} end When to stop, relative to the beginning of a clip.
     * @emits MediaElement#play
     * @return {Promise} Result
     */

  }, {
    key: "play",
    value: function play(start, end) {
      this.seekTo(start);
      var promise = this.media.play();
      end && this.setPlayEnd(end);
      return promise;
    }
    /**
     * Pauses the loaded audio.
     *
     * @emits MediaElement#pause
     * @return {Promise} Result
     */

  }, {
    key: "pause",
    value: function pause() {
      var promise;

      if (this.media) {
        promise = this.media.pause();
      }

      this.clearPlayEnd();
      return promise;
    }
    /**
     * Set the play end
     *
     * @private
     * @param {number} end Where to end
     */

  }, {
    key: "setPlayEnd",
    value: function setPlayEnd(end) {
      var _this4 = this;

      this._onPlayEnd = function (time) {
        if (time >= end) {
          _this4.pause();

          _this4.seekTo(end);
        }
      };

      this.on('audioprocess', this._onPlayEnd);
    }
    /** @private */

  }, {
    key: "clearPlayEnd",
    value: function clearPlayEnd() {
      if (this._onPlayEnd) {
        this.un('audioprocess', this._onPlayEnd);
        this._onPlayEnd = null;
      }
    }
    /**
     * Compute the max and min value of the waveform when broken into
     * <length> subranges.
     *
     * @param {number} length How many subranges to break the waveform into.
     * @param {number} first First sample in the required range.
     * @param {number} last Last sample in the required range.
     * @return {number[]|Number.<Array[]>} Array of 2*<length> peaks or array of
     * arrays of peaks consisting of (max, min) values for each subrange.
     */

  }, {
    key: "getPeaks",
    value: function getPeaks(length, first, last) {
      if (this.buffer) {
        return _get(_getPrototypeOf(MediaElement.prototype), "getPeaks", this).call(this, length, first, last);
      }

      return this.peaks || [];
    }
    /**
     * Set the sink id for the media player
     *
     * @param {string} deviceId String value representing audio device id.
     * @returns {Promise} A Promise that resolves to `undefined` when there
     * are no errors.
     */

  }, {
    key: "setSinkId",
    value: function setSinkId(deviceId) {
      if (deviceId) {
        if (!this.media.setSinkId) {
          return Promise.reject(new Error('setSinkId is not supported in your browser'));
        }

        return this.media.setSinkId(deviceId);
      }

      return Promise.reject(new Error('Invalid deviceId: ' + deviceId));
    }
    /**
     * Get the current volume
     *
     * @return {number} value A floating point value between 0 and 1.
     */

  }, {
    key: "getVolume",
    value: function getVolume() {
      return this.volume;
    }
    /**
     * Set the audio volume
     *
     * @param {number} value A floating point value between 0 and 1.
     */

  }, {
    key: "setVolume",
    value: function setVolume(value) {
      this.volume = value; // no need to change when it's already at that volume

      if (this.media.volume !== this.volume) {
        this.media.volume = this.volume;
      }
    }
    /**
     * This is called when wavesurfer is destroyed
     *
     */

  }, {
    key: "destroy",
    value: function destroy() {
      var _this5 = this;

      this.pause();
      this.unAll();
      this.destroyed = true; // cleanup media event listeners

      Object.keys(this.mediaListeners).forEach(function (id) {
        if (_this5.media) {
          _this5.media.removeEventListener(id, _this5.mediaListeners[id]);
        }
      });

      if (this.params.removeMediaElementOnDestroy && this.media && this.media.parentNode) {
        this.media.parentNode.removeChild(this.media);
      }

      this.media = null;
    }
  }]);

  return MediaElement;
}(_webaudio.default);

exports.default = MediaElement;
module.exports = exports.default;

/***/ }),

/***/ "./src/peakcache.js":
/*!**************************!*\
  !*** ./src/peakcache.js ***!
  \**************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * Caches the decoded peaks data to improve rendering speed for large audio
 *
 * Is used if the option parameter `partialRender` is set to `true`
 */
var PeakCache =
/*#__PURE__*/
function () {
  /**
   * Instantiate cache
   */
  function PeakCache() {
    _classCallCheck(this, PeakCache);

    this.clearPeakCache();
  }
  /**
   * Empty the cache
   */


  _createClass(PeakCache, [{
    key: "clearPeakCache",
    value: function clearPeakCache() {
      /**
       * Flat array with entries that are always in pairs to mark the
       * beginning and end of each subrange.  This is a convenience so we can
       * iterate over the pairs for easy set difference operations.
       * @private
       */
      this.peakCacheRanges = [];
      /**
       * Length of the entire cachable region, used for resetting the cache
       * when this changes (zoom events, for instance).
       * @private
       */

      this.peakCacheLength = -1;
    }
    /**
     * Add a range of peaks to the cache
     *
     * @param {number} length The length of the range
     * @param {number} start The x offset of the start of the range
     * @param {number} end The x offset of the end of the range
     * @return {Number.<Array[]>} Array with arrays of numbers
     */

  }, {
    key: "addRangeToPeakCache",
    value: function addRangeToPeakCache(length, start, end) {
      if (length != this.peakCacheLength) {
        this.clearPeakCache();
        this.peakCacheLength = length;
      } // Return ranges that weren't in the cache before the call.


      var uncachedRanges = [];
      var i = 0; // Skip ranges before the current start.

      while (i < this.peakCacheRanges.length && this.peakCacheRanges[i] < start) {
        i++;
      } // If |i| is even, |start| falls after an existing range.  Otherwise,
      // |start| falls between an existing range, and the uncached region
      // starts when we encounter the next node in |peakCacheRanges| or
      // |end|, whichever comes first.


      if (i % 2 == 0) {
        uncachedRanges.push(start);
      }

      while (i < this.peakCacheRanges.length && this.peakCacheRanges[i] <= end) {
        uncachedRanges.push(this.peakCacheRanges[i]);
        i++;
      } // If |i| is even, |end| is after all existing ranges.


      if (i % 2 == 0) {
        uncachedRanges.push(end);
      } // Filter out the 0-length ranges.


      uncachedRanges = uncachedRanges.filter(function (item, pos, arr) {
        if (pos == 0) {
          return item != arr[pos + 1];
        } else if (pos == arr.length - 1) {
          return item != arr[pos - 1];
        }

        return item != arr[pos - 1] && item != arr[pos + 1];
      }); // Merge the two ranges together, uncachedRanges will either contain
      // wholly new points, or duplicates of points in peakCacheRanges.  If
      // duplicates are detected, remove both and extend the range.

      this.peakCacheRanges = this.peakCacheRanges.concat(uncachedRanges);
      this.peakCacheRanges = this.peakCacheRanges.sort(function (a, b) {
        return a - b;
      }).filter(function (item, pos, arr) {
        if (pos == 0) {
          return item != arr[pos + 1];
        } else if (pos == arr.length - 1) {
          return item != arr[pos - 1];
        }

        return item != arr[pos - 1] && item != arr[pos + 1];
      }); // Push the uncached ranges into an array of arrays for ease of
      // iteration in the functions that call this.

      var uncachedRangePairs = [];

      for (i = 0; i < uncachedRanges.length; i += 2) {
        uncachedRangePairs.push([uncachedRanges[i], uncachedRanges[i + 1]]);
      }

      return uncachedRangePairs;
    }
    /**
     * For testing
     *
     * @return {Number.<Array[]>} Array with arrays of numbers
     */

  }, {
    key: "getCacheRanges",
    value: function getCacheRanges() {
      var peakCacheRangePairs = [];
      var i;

      for (i = 0; i < this.peakCacheRanges.length; i += 2) {
        peakCacheRangePairs.push([this.peakCacheRanges[i], this.peakCacheRanges[i + 1]]);
      }

      return peakCacheRangePairs;
    }
  }]);

  return PeakCache;
}();

exports.default = PeakCache;
module.exports = exports.default;

/***/ }),

/***/ "./src/util/ajax.js":
/*!**************************!*\
  !*** ./src/util/ajax.js ***!
  \**************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = ajax;

var _observer = _interopRequireDefault(__webpack_require__(/*! ./observer */ "./src/util/observer.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Perform an ajax request using `XMLHttpRequest`.
 *
 * @deprecated Use `util.fetchFile` instead.
 *
 * @param {Object} options AJAX options to use. See example below for options.
 * @returns {Observer} Observer instance
 * @example
 * // default options
 * let options = {
 *     method: 'GET',
 *     url: undefined,
 *     responseType: 'json',
 *     xhr: {}
 * };
 *
 * // override default options
 * options.url = '../media/demo.wav';
 * options.responseType = 'arraybuffer';
 * options.xhr = {
 *     requestHeaders: [
 *         {
 *             key: 'Authorization',
 *             value: 'my-token'
 *         }
 *     ],
 *     withCredentials: true
 * };
 *
 * // make ajax call
 * let ajaxCall = util.ajax(options);
 * ajaxCall.on('progress', e => {
 *     console.log('progress', e);
 * });
 * ajaxCall.on('success', (data, e) => {
 *     console.log('success!', data);
 * });
 * ajaxCall.on('error', e => {
 *     console.warn('ajax error: ' + e.target.statusText);
 * });
 */
function ajax(options) {
  var instance = new _observer.default();
  var xhr = new XMLHttpRequest();
  var fired100 = false;
  xhr.open(options.method || 'GET', options.url, true);
  xhr.responseType = options.responseType || 'json';

  if (options.xhr) {
    if (options.xhr.requestHeaders) {
      // add custom request headers
      options.xhr.requestHeaders.forEach(function (header) {
        xhr.setRequestHeader(header.key, header.value);
      });
    }

    if (options.xhr.withCredentials) {
      // use credentials
      xhr.withCredentials = true;
    }
  }

  xhr.addEventListener('progress', function (e) {
    instance.fireEvent('progress', e);

    if (e.lengthComputable && e.loaded == e.total) {
      fired100 = true;
    }
  });
  xhr.addEventListener('load', function (e) {
    if (!fired100) {
      instance.fireEvent('progress', e);
    }

    instance.fireEvent('load', e);

    if (200 == xhr.status || 206 == xhr.status) {
      instance.fireEvent('success', xhr.response, e);
    } else {
      instance.fireEvent('error', e);
    }
  });
  xhr.addEventListener('error', function (e) {
    return instance.fireEvent('error', e);
  });
  xhr.send();
  instance.xhr = xhr;
  return instance;
}

module.exports = exports.default;

/***/ }),

/***/ "./src/util/extend.js":
/*!****************************!*\
  !*** ./src/util/extend.js ***!
  \****************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = extend;

/**
 * Extend an object shallowly with others
 *
 * @param {Object} dest The target object
 * @param {Object[]} sources The objects to use for extending
 *
 * @return {Object} Merged object
 */
function extend(dest) {
  for (var _len = arguments.length, sources = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    sources[_key - 1] = arguments[_key];
  }

  sources.forEach(function (source) {
    Object.keys(source).forEach(function (key) {
      dest[key] = source[key];
    });
  });
  return dest;
}

module.exports = exports.default;

/***/ }),

/***/ "./src/util/fetch.js":
/*!***************************!*\
  !*** ./src/util/fetch.js ***!
  \***************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = fetchFile;

var _observer = _interopRequireDefault(__webpack_require__(/*! ./observer */ "./src/util/observer.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var ProgressHandler =
/*#__PURE__*/
function () {
  /**
   * Instantiate ProgressHandler
   *
   * @param {Observer} instance The `fetchFile` observer instance.
   * @param {Number} contentLength Content length.
   * @param {Response} response Response object.
   */
  function ProgressHandler(instance, contentLength, response) {
    _classCallCheck(this, ProgressHandler);

    this.instance = instance;
    this.instance._reader = response.body.getReader();
    this.total = parseInt(contentLength, 10);
    this.loaded = 0;
  }
  /**
   * A method that is called once, immediately after the `ReadableStream``
   * is constructed.
   *
   * @param {ReadableStreamDefaultController} controller Controller instance
   *     used to control the stream.
   */


  _createClass(ProgressHandler, [{
    key: "start",
    value: function start(controller) {
      var _this = this;

      var read = function read() {
        // instance._reader.read() returns a promise that resolves
        // when a value has been received
        _this.instance._reader.read().then(function (_ref) {
          var done = _ref.done,
              value = _ref.value;

          // result objects contain two properties:
          // done  - true if the stream has already given you all its data.
          // value - some data. Always undefined when done is true.
          if (done) {
            // ensure onProgress called when content-length=0
            if (_this.total === 0) {
              _this.instance.onProgress.call(_this.instance, {
                loaded: _this.loaded,
                total: _this.total,
                lengthComputable: false
              });
            } // no more data needs to be consumed, close the stream


            controller.close();
            return;
          }

          _this.loaded += value.byteLength;

          _this.instance.onProgress.call(_this.instance, {
            loaded: _this.loaded,
            total: _this.total,
            lengthComputable: !(_this.total === 0)
          }); // enqueue the next data chunk into our target stream


          controller.enqueue(value);
          read();
        }).catch(function (error) {
          controller.error(error);
        });
      };

      read();
    }
  }]);

  return ProgressHandler;
}();
/**
 * Load a file using `fetch`.
 *
 * @param {object} options Request options to use. See example below.
 * @returns {Observer} Observer instance
 * @example
 * // default options
 * let options = {
 *     url: undefined,
 *     method: 'GET',
 *     mode: 'cors',
 *     credentials: 'same-origin',
 *     cache: 'default',
 *     responseType: 'json',
 *     requestHeaders: [],
 *     redirect: 'follow',
 *     referrer: 'client'
 * };
 *
 * // override some options
 * options.url = '../media/demo.wav';

 * // available types: 'arraybuffer', 'blob', 'json' or 'text'
 * options.responseType = 'arraybuffer';
 *
 * // make fetch call
 * let request = util.fetchFile(options);
 *
 * // listen for events
 * request.on('progress', e => {
 *     console.log('progress', e);
 * });
 *
 * request.on('success', data => {
 *     console.log('success!', data);
 * });
 *
 * request.on('error', e => {
 *     console.warn('fetchFile error: ', e);
 * });
 */


function fetchFile(options) {
  if (!options) {
    throw new Error('fetch options missing');
  } else if (!options.url) {
    throw new Error('fetch url missing');
  }

  var instance = new _observer.default();
  var fetchHeaders = new Headers();
  var fetchRequest = new Request(options.url); // add ability to abort

  instance.controller = new AbortController(); // check if headers have to be added

  if (options && options.requestHeaders) {
    // add custom request headers
    options.requestHeaders.forEach(function (header) {
      fetchHeaders.append(header.key, header.value);
    });
  } // parse fetch options
  // console.log(this);
  // console.log(options);
  // if(options.url.indexOf('file://')==0){
  //   if(isPhoneGap()){
  //     if(window.current_audio_array){
  //       instance.fireEvent('success', window.current_audio_array);
  //     }
  //     // window.requestFileSystem(LocalFileSystem.TEMPORARY, 0, function (fs) {
  //     //     fs.root.getFile(file, { exclusive: false }, function (fileEntry) {
             
  //     //     }, function(){
  //     //     });

  //     // },function(){
  //     //   _alert('filesystem error')
  //     // });
  //     return false;
  //   }
  // }
  var responseType = options.responseType || 'json';
  var fetchOptions = {
    method: options.method || 'GET',
    headers: fetchHeaders,
    mode: options.mode || 'cors',
    credentials: options.credentials || 'same-origin',
    cache: options.cache || 'default',
    redirect: options.redirect || 'follow',
    referrer: options.referrer || 'client',
    signal: instance.controller.signal
  };
  fetch(fetchRequest, fetchOptions).then(function (response) {
    // store response reference
    instance.response = response;
    var progressAvailable = true;

    if (!response.body) {
      // ReadableStream is not yet supported in this browser
      // see https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream
      progressAvailable = false;
    } // Server must send CORS header "Access-Control-Expose-Headers: content-length"


    var contentLength = response.headers.get('content-length');

    if (contentLength === null) {
      // Content-Length server response header missing.
      // Don't evaluate download progress if we can't compare against a total size
      // see https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#Access-Control-Expose-Headers
      progressAvailable = false;
    }

    if (!progressAvailable) {
      // not able to check download progress so skip it
      return response;
    } // fire progress event when during load


    instance.onProgress = function (e) {
      instance.fireEvent('progress', e);
    };

    return new Response(new ReadableStream(new ProgressHandler(instance, contentLength, response)), fetchOptions);
  }).then(function (response) {
    var errMsg;

    if (response.ok) {
      switch (responseType) {
        case 'arraybuffer':
          return response.arrayBuffer();

        case 'json':
          return response.json();

        case 'blob':
          return response.blob();

        case 'text':
          return response.text();

        default:
          errMsg = 'Unknown responseType: ' + responseType;
          break;
      }
    }

    if (!errMsg) {
      errMsg = 'HTTP error status: ' + response.status;
    }

    throw new Error(errMsg);
  }).then(function (response) {
    instance.fireEvent('success', response);
  }).catch(function (error) {
    if(isPhoneGap()){
      if(window.current_audio_array){
        instance.fireEvent('success', window.current_audio_array);
      }
    }else{
      instance.fireEvent('error', error);
    }
  }); // return the fetch request

  instance.fetchRequest = fetchRequest;
  return instance;
}

module.exports = exports.default;

/***/ }),

/***/ "./src/util/frame.js":
/*!***************************!*\
  !*** ./src/util/frame.js ***!
  \***************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = frame;

var _requestAnimationFrame = _interopRequireDefault(__webpack_require__(/*! ./request-animation-frame */ "./src/util/request-animation-frame.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Create a function which will be called at the next requestAnimationFrame
 * cycle
 *
 * @param {function} func The function to call
 *
 * @return {func} The function wrapped within a requestAnimationFrame
 */
function frame(func) {
  return function () {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return (0, _requestAnimationFrame.default)(function () {
      return func.apply(void 0, args);
    });
  };
}

module.exports = exports.default;

/***/ }),

/***/ "./src/util/get-id.js":
/*!****************************!*\
  !*** ./src/util/get-id.js ***!
  \****************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getId;

/**
 * Get a random prefixed ID
 *
 * @param {String} prefix Prefix to use. Default is `'wavesurfer_'`.
 * @returns {String} Random prefixed ID
 * @example
 * console.log(getId()); // logs 'wavesurfer_b5pors4ru6g'
 *
 * let prefix = 'foo-';
 * console.log(getId(prefix)); // logs 'foo-b5pors4ru6g'
 */
function getId(prefix) {
  if (prefix === undefined) {
    prefix = 'wavesurfer_';
  }

  return prefix + Math.random().toString(32).substring(2);
}

module.exports = exports.default;

/***/ }),

/***/ "./src/util/index.js":
/*!***************************!*\
  !*** ./src/util/index.js ***!
  \***************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "ajax", {
  enumerable: true,
  get: function get() {
    return _ajax.default;
  }
});
Object.defineProperty(exports, "getId", {
  enumerable: true,
  get: function get() {
    return _getId.default;
  }
});
Object.defineProperty(exports, "max", {
  enumerable: true,
  get: function get() {
    return _max.default;
  }
});
Object.defineProperty(exports, "min", {
  enumerable: true,
  get: function get() {
    return _min.default;
  }
});
Object.defineProperty(exports, "Observer", {
  enumerable: true,
  get: function get() {
    return _observer.default;
  }
});
Object.defineProperty(exports, "extend", {
  enumerable: true,
  get: function get() {
    return _extend.default;
  }
});
Object.defineProperty(exports, "style", {
  enumerable: true,
  get: function get() {
    return _style.default;
  }
});
Object.defineProperty(exports, "requestAnimationFrame", {
  enumerable: true,
  get: function get() {
    return _requestAnimationFrame.default;
  }
});
Object.defineProperty(exports, "frame", {
  enumerable: true,
  get: function get() {
    return _frame.default;
  }
});
Object.defineProperty(exports, "debounce", {
  enumerable: true,
  get: function get() {
    return _debounce.default;
  }
});
Object.defineProperty(exports, "preventClick", {
  enumerable: true,
  get: function get() {
    return _preventClick.default;
  }
});
Object.defineProperty(exports, "fetchFile", {
  enumerable: true,
  get: function get() {
    return _fetch.default;
  }
});

var _ajax = _interopRequireDefault(__webpack_require__(/*! ./ajax */ "./src/util/ajax.js"));

var _getId = _interopRequireDefault(__webpack_require__(/*! ./get-id */ "./src/util/get-id.js"));

var _max = _interopRequireDefault(__webpack_require__(/*! ./max */ "./src/util/max.js"));

var _min = _interopRequireDefault(__webpack_require__(/*! ./min */ "./src/util/min.js"));

var _observer = _interopRequireDefault(__webpack_require__(/*! ./observer */ "./src/util/observer.js"));

var _extend = _interopRequireDefault(__webpack_require__(/*! ./extend */ "./src/util/extend.js"));

var _style = _interopRequireDefault(__webpack_require__(/*! ./style */ "./src/util/style.js"));

var _requestAnimationFrame = _interopRequireDefault(__webpack_require__(/*! ./request-animation-frame */ "./src/util/request-animation-frame.js"));

var _frame = _interopRequireDefault(__webpack_require__(/*! ./frame */ "./src/util/frame.js"));

var _debounce = _interopRequireDefault(__webpack_require__(/*! debounce */ "./node_modules/debounce/index.js"));

var _preventClick = _interopRequireDefault(__webpack_require__(/*! ./prevent-click */ "./src/util/prevent-click.js"));

var _fetch = _interopRequireDefault(__webpack_require__(/*! ./fetch */ "./src/util/fetch.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/***/ }),

/***/ "./src/util/max.js":
/*!*************************!*\
  !*** ./src/util/max.js ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = max;

/**
 * Get the largest value
 *
 * @param   {Array} values Array of numbers
 * @returns {Number} Largest number found
 * @example console.log(max([1, 2, 3])); // logs 3
 */
function max(values) {
  var largest = -Infinity;
  Object.keys(values).forEach(function (i) {
    if (values[i] > largest) {
      largest = values[i];
    }
  });
  return largest;
}

module.exports = exports.default;

/***/ }),

/***/ "./src/util/min.js":
/*!*************************!*\
  !*** ./src/util/min.js ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = min;

/**
 * Get the smallest value
 *
 * @param   {Array} values Array of numbers
 * @returns {Number} Smallest number found
 * @example console.log(min([1, 2, 3])); // logs 1
 */
function min(values) {
  var smallest = Number(Infinity);
  Object.keys(values).forEach(function (i) {
    if (values[i] < smallest) {
      smallest = values[i];
    }
  });
  return smallest;
}

module.exports = exports.default;

/***/ }),

/***/ "./src/util/observer.js":
/*!******************************!*\
  !*** ./src/util/observer.js ***!
  \******************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * @typedef {Object} ListenerDescriptor
 * @property {string} name The name of the event
 * @property {function} callback The callback
 * @property {function} un The function to call to remove the listener
 */

/**
 * Observer class
 */
var Observer =
/*#__PURE__*/
function () {
  /**
   * Instantiate Observer
   */
  function Observer() {
    _classCallCheck(this, Observer);

    /**
     * @private
     * @todo Initialise the handlers here already and remove the conditional
     * assignment in `on()`
     */
    this.handlers = null;
  }
  /**
   * Attach a handler function for an event.
   *
   * @param {string} event Name of the event to listen to
   * @param {function} fn The callback to trigger when the event is fired
   * @return {ListenerDescriptor} The event descriptor
   */


  _createClass(Observer, [{
    key: "on",
    value: function on(event, fn) {
      var _this = this;

      if (!this.handlers) {
        this.handlers = {};
      }

      var handlers = this.handlers[event];

      if (!handlers) {
        handlers = this.handlers[event] = [];
      }

      handlers.push(fn); // Return an event descriptor

      return {
        name: event,
        callback: fn,
        un: function un(e, fn) {
          return _this.un(e, fn);
        }
      };
    }
    /**
     * Remove an event handler.
     *
     * @param {string} event Name of the event the listener that should be
     * removed listens to
     * @param {function} fn The callback that should be removed
     */

  }, {
    key: "un",
    value: function un(event, fn) {
      if (!this.handlers) {
        return;
      }

      var handlers = this.handlers[event];
      var i;

      if (handlers) {
        if (fn) {
          for (i = handlers.length - 1; i >= 0; i--) {
            if (handlers[i] == fn) {
              handlers.splice(i, 1);
            }
          }
        } else {
          handlers.length = 0;
        }
      }
    }
    /**
     * Remove all event handlers.
     */

  }, {
    key: "unAll",
    value: function unAll() {
      this.handlers = null;
    }
    /**
     * Attach a handler to an event. The handler is executed at most once per
     * event type.
     *
     * @param {string} event The event to listen to
     * @param {function} handler The callback that is only to be called once
     * @return {ListenerDescriptor} The event descriptor
     */

  }, {
    key: "once",
    value: function once(event, handler) {
      var _this2 = this;

      var fn = function fn() {
        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        /*  eslint-disable no-invalid-this */
        handler.apply(_this2, args);
        /*  eslint-enable no-invalid-this */

        setTimeout(function () {
          _this2.un(event, fn);
        }, 0);
      };

      return this.on(event, fn);
    }
    /**
     * Manually fire an event
     *
     * @param {string} event The event to fire manually
     * @param {...any} args The arguments with which to call the listeners
     */

  }, {
    key: "fireEvent",
    value: function fireEvent(event) {
      for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        args[_key2 - 1] = arguments[_key2];
      }

      if (!this.handlers) {
        return;
      }

      var handlers = this.handlers[event];
      handlers && handlers.forEach(function (fn) {
        fn.apply(void 0, args);
      });
    }
  }]);

  return Observer;
}();

exports.default = Observer;
module.exports = exports.default;

/***/ }),

/***/ "./src/util/prevent-click.js":
/*!***********************************!*\
  !*** ./src/util/prevent-click.js ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = preventClick;

/**
 * Stops propagation of click event and removes event listener
 *
 * @private
 * @param {object} event The click event
 */
function preventClickHandler(event) {
  event.stopPropagation();
  document.body.removeEventListener('click', preventClickHandler, true);
}
/**
 * Starts listening for click event and prevent propagation
 *
 * @param {object} values Values
 */


function preventClick(values) {
  document.body.addEventListener('click', preventClickHandler, true);
}

module.exports = exports.default;

/***/ }),

/***/ "./src/util/request-animation-frame.js":
/*!*********************************************!*\
  !*** ./src/util/request-animation-frame.js ***!
  \*********************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

/* eslint-disable valid-jsdoc */

/**
 * Returns the `requestAnimationFrame` function for the browser, or a shim with
 * `setTimeout` if the function is not found
 *
 * @return {function} Available `requestAnimationFrame` function for the browser
 */
var _default = (window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function (callback, element) {
  return setTimeout(callback, 1000 / 60);
}).bind(window);

exports.default = _default;
module.exports = exports.default;

/***/ }),

/***/ "./src/util/style.js":
/*!***************************!*\
  !*** ./src/util/style.js ***!
  \***************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = style;

/**
 * Apply a map of styles to an element
 *
 * @param {HTMLElement} el The element that the styles will be applied to
 * @param {Object} styles The map of propName: attribute, both are used as-is
 *
 * @return {HTMLElement} el
 */
function style(el, styles) {
  Object.keys(styles).forEach(function (prop) {
    if (el.style[prop] !== styles[prop]) {
      el.style[prop] = styles[prop];
    }
  });
  return el;
}

module.exports = exports.default;

/***/ }),

/***/ "./src/wavesurfer.js":
/*!***************************!*\
  !*** ./src/wavesurfer.js ***!
  \***************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var util = _interopRequireWildcard(__webpack_require__(/*! ./util */ "./src/util/index.js"));

var _drawer = _interopRequireDefault(__webpack_require__(/*! ./drawer.multicanvas */ "./src/drawer.multicanvas.js"));

var _webaudio = _interopRequireDefault(__webpack_require__(/*! ./webaudio */ "./src/webaudio.js"));

var _mediaelement = _interopRequireDefault(__webpack_require__(/*! ./mediaelement */ "./src/mediaelement.js"));

var _peakcache = _interopRequireDefault(__webpack_require__(/*! ./peakcache */ "./src/peakcache.js"));

var _mediaelementWebaudio = _interopRequireDefault(__webpack_require__(/*! ./mediaelement-webaudio */ "./src/mediaelement-webaudio.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; if (obj != null) { var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/*
 * This work is licensed under a BSD-3-Clause License.
 */

/** @external {HTMLElement} https://developer.mozilla.org/en/docs/Web/API/HTMLElement */

/** @external {OfflineAudioContext} https://developer.mozilla.org/en-US/docs/Web/API/OfflineAudioContext */

/** @external {File} https://developer.mozilla.org/en-US/docs/Web/API/File */

/** @external {Blob} https://developer.mozilla.org/en-US/docs/Web/API/Blob */

/** @external {CanvasRenderingContext2D} https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D */

/** @external {MediaStreamConstraints} https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamConstraints */

/** @external {AudioNode} https://developer.mozilla.org/de/docs/Web/API/AudioNode */

/**
 * @typedef {Object} WavesurferParams
 * @property {AudioContext} audioContext=null Use your own previously
 * initialized AudioContext or leave blank.
 * @property {number} audioRate=1 Speed at which to play audio. Lower number is
 * slower.
 * @property {ScriptProcessorNode} audioScriptProcessor=null Use your own previously
 * initialized ScriptProcessorNode or leave blank.
 * @property {boolean} autoCenter=true If a scrollbar is present, center the
 * waveform on current progress
 * @property {number} autoCenterRate=5 If autoCenter is active, rate at which the
 * waveform is centered
 * @property {boolean} autoCenterImmediately=false If autoCenter is active, immediately
 * center waveform on current progress
 * @property {string} backend='WebAudio' `'WebAudio'|'MediaElement'|'MediaElementWebAudio'` In most cases
 * you don't have to set this manually. MediaElement is a fallback for unsupported browsers.
 * MediaElementWebAudio allows to use WebAudio API also with big audio files, loading audio like with
 * MediaElement backend (HTML5 audio tag). You have to use the same methods of MediaElement backend for loading and
 * playback, giving also peaks, so the audio data are not decoded. In this way you can use WebAudio features, like filters,
 * also with audio with big duration. For example:
 * ` wavesurfer.load(url | HTMLMediaElement, peaks, preload, duration);
 *   wavesurfer.play();
 *   wavesurfer.setFilter(customFilter);
 * `
 * @property {string} backgroundColor=null Change background color of the
 * waveform container.
 * @property {number} barHeight=1 The height of the wave bars.
 * @property {number} barRadius=0 The radius of the wave bars. Makes bars rounded
 * @property {number} barGap=null The optional spacing between bars of the wave,
 * if not provided will be calculated in legacy format.
 * @property {number} barWidth=null Draw the waveform using bars.
 * @property {boolean} closeAudioContext=false Close and nullify all audio
 * contexts when the destroy method is called.
 * @property {!string|HTMLElement} container CSS selector or HTML element where
 * the waveform should be drawn. This is the only required parameter.
 * @property {string} cursorColor='#333' The fill color of the cursor indicating
 * the playhead position.
 * @property {number} cursorWidth=1 Measured in pixels.
 * @property {number} duration=null Optional audio length so pre-rendered peaks
 * can be display immediately for example.
 * @property {boolean} fillParent=true Whether to fill the entire container or
 * draw only according to `minPxPerSec`.
 * @property {boolean} forceDecode=false Force decoding of audio using web audio
 * when zooming to get a more detailed waveform.
 * @property {number} height=128 The height of the waveform. Measured in
 * pixels.
 * @property {boolean} hideScrollbar=false Whether to hide the horizontal
 * scrollbar when one would normally be shown.
 * @property {boolean} interact=true Whether the mouse interaction will be
 * enabled at initialization. You can switch this parameter at any time later
 * on.
 * @property {boolean} loopSelection=true (Use with regions plugin) Enable
 * looping of selected regions
 * @property {number} maxCanvasWidth=4000 Maximum width of a single canvas in
 * pixels, excluding a small overlap (2 * `pixelRatio`, rounded up to the next
 * even integer). If the waveform is longer than this value, additional canvases
 * will be used to render the waveform, which is useful for very large waveforms
 * that may be too wide for browsers to draw on a single canvas.
 * @property {boolean} mediaControls=false (Use with backend `MediaElement` or `MediaElementWebAudio`)
 * this enables the native controls for the media element
 * @property {string} mediaType='audio' (Use with backend `MediaElement` or `MediaElementWebAudio`)
 * `'audio'|'video'` ('video' only for `MediaElement`)
 * @property {number} minPxPerSec=20 Minimum number of pixels per second of
 * audio.
 * @property {boolean} normalize=false If true, normalize by the maximum peak
 * instead of 1.0.
 * @property {boolean} partialRender=false Use the PeakCache to improve
 * rendering speed of large waveforms
 * @property {number} pixelRatio=window.devicePixelRatio The pixel ratio used to
 * calculate display
 * @property {PluginDefinition[]} plugins=[] An array of plugin definitions to
 * register during instantiation, they will be directly initialised unless they
 * are added with the `deferInit` property set to true.
 * @property {string} progressColor='#555' The fill color of the part of the
 * waveform behind the cursor. When `progressColor` and `waveColor` are the same
 * the progress wave is not rendered at all.
 * @property {boolean} removeMediaElementOnDestroy=true Set to false to keep the
 * media element in the DOM when the player is destroyed. This is useful when
 * reusing an existing media element via the `loadMediaElement` method.
 * @property {Object} renderer=MultiCanvas Can be used to inject a custom
 * renderer.
 * @property {boolean|number} responsive=false If set to `true` resize the
 * waveform, when the window is resized. This is debounced with a `100ms`
 * timeout by default. If this parameter is a number it represents that timeout.
 * @property {boolean} rtl=false If set to `true`, renders waveform from
 * right-to-left.
 * @property {boolean} scrollParent=false Whether to scroll the container with a
 * lengthy waveform. Otherwise the waveform is shrunk to the container width
 * (see fillParent).
 * @property {number} skipLength=2 Number of seconds to skip with the
 * skipForward() and skipBackward() methods.
 * @property {boolean} splitChannels=false Render with separate waveforms for
 * the channels of the audio
 * @property {string} waveColor='#999' The fill color of the waveform after the
 * cursor.
 * @property {object} xhr={} XHR options. For example:
 * `let xhr = {
 *     cache: 'default',
 *     mode: 'cors',
 *     method: 'GET',
 *     credentials: 'same-origin',
 *     redirect: 'follow',
 *     referrer: 'client',
 *     headers: [
 *         {
 *             key: 'Authorization',
 *             value: 'my-token'
 *         }
 *     ]
 * };`
 */

/**
 * @typedef {Object} PluginDefinition
 * @desc The Object used to describe a plugin
 * @example wavesurfer.addPlugin(pluginDefinition);
 * @property {string} name The name of the plugin, the plugin instance will be
 * added as a property to the wavesurfer instance under this name
 * @property {?Object} staticProps The properties that should be added to the
 * wavesurfer instance as static properties
 * @property {?boolean} deferInit Don't initialise plugin
 * automatically
 * @property {Object} params={} The plugin parameters, they are the first parameter
 * passed to the plugin class constructor function
 * @property {PluginClass} instance The plugin instance factory, is called with
 * the dependency specified in extends. Returns the plugin class.
 */

/**
 * @interface PluginClass
 *
 * @desc This is the interface which is implemented by all plugin classes. Note
 * that this only turns into an observer after being passed through
 * `wavesurfer.addPlugin`.
 *
 * @extends {Observer}
 */
var PluginClass =
/*#__PURE__*/
function () {
  _createClass(PluginClass, [{
    key: "create",

    /**
     * Plugin definition factory
     *
     * This function must be used to create a plugin definition which can be
     * used by wavesurfer to correctly instantiate the plugin.
     *
     * It returns a `PluginDefinition` object representing the plugin.
     *
     * @param {Object} params={} The plugin params (specific to the plugin)
     */
    value: function create(params) {}
    /**
     * Construct the plugin
     *
     * @param {Object} params={} The plugin params (specific to the plugin)
     * @param {Object} ws The wavesurfer instance
     */

  }]);

  function PluginClass(params, ws) {
    _classCallCheck(this, PluginClass);
  }
  /**
   * Initialise the plugin
   *
   * Start doing something. This is called by
   * `wavesurfer.initPlugin(pluginName)`
   */


  _createClass(PluginClass, [{
    key: "init",
    value: function init() {}
    /**
     * Destroy the plugin instance
     *
     * Stop doing something. This is called by
     * `wavesurfer.destroyPlugin(pluginName)`
     */

  }, {
    key: "destroy",
    value: function destroy() {}
  }]);

  return PluginClass;
}();
/**
 * WaveSurfer core library class
 *
 * @extends {Observer}
 * @example
 * const params = {
 *   container: '#waveform',
 *   waveColor: 'violet',
 *   progressColor: 'purple'
 * };
 *
 * // initialise like this
 * const wavesurfer = WaveSurfer.create(params);
 *
 * // or like this ...
 * const wavesurfer = new WaveSurfer(params);
 * wavesurfer.init();
 *
 * // load audio file
 * wavesurfer.load('example/media/demo.wav');
 */


var WaveSurfer =
/*#__PURE__*/
function (_util$Observer) {
  _inherits(WaveSurfer, _util$Observer);

  _createClass(WaveSurfer, null, [{
    key: "create",

    /** @private */

    /** @private */

    /**
     * Instantiate this class, call its `init` function and returns it
     *
     * @param {WavesurferParams} params The wavesurfer parameters
     * @return {Object} WaveSurfer instance
     * @example const wavesurfer = WaveSurfer.create(params);
     */
    value: function create(params) {
      var wavesurfer = new WaveSurfer(params);
      return wavesurfer.init();
    }
    /**
     * The library version number is available as a static property of the
     * WaveSurfer class
     *
     * @type {String}
     * @example
     * console.log('Using wavesurfer.js ' + WaveSurfer.VERSION);
     */

  }]);

  /**
   * Initialise wavesurfer instance
   *
   * @param {WavesurferParams} params Instantiation options for wavesurfer
   * @example
   * const wavesurfer = new WaveSurfer(params);
   * @returns {this} Wavesurfer instance
   */
  function WaveSurfer(params) {
    var _this;

    _classCallCheck(this, WaveSurfer);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(WaveSurfer).call(this));
    /**
     * Extract relevant parameters (or defaults)
     * @private
     */

    _this.defaultParams = {
      audioContext: null,
      audioScriptProcessor: null,
      audioRate: 1,
      autoCenter: true,
      autoCenterRate: 5,
      autoCenterImmediately: false,
      backend: 'WebAudio',
      backgroundColor: null,
      barHeight: 1,
      barRadius: 0,
      barGap: null,
      container: null,
      cursorColor: '#333',
      cursorWidth: 1,
      dragSelection: true,
      duration: null,
      fillParent: true,
      forceDecode: false,
      height: 128,
      hideScrollbar: false,
      interact: true,
      loopSelection: true,
      maxCanvasWidth: 4000,
      mediaContainer: null,
      mediaControls: false,
      mediaType: 'audio',
      minPxPerSec: 20,
      normalize: false,
      partialRender: false,
      pixelRatio: window.devicePixelRatio || screen.deviceXDPI / screen.logicalXDPI,
      plugins: [],
      progressColor: '#555',
      removeMediaElementOnDestroy: true,
      renderer: _drawer.default,
      responsive: false,
      rtl: false,
      scrollParent: false,
      skipLength: 2,
      splitChannels: false,
      waveColor: '#999',
      xhr: {}
    };
    _this.backends = {
      MediaElement: _mediaelement.default,
      WebAudio: _webaudio.default,
      MediaElementWebAudio: _mediaelementWebaudio.default
    };
    _this.util = util;
    _this.params = util.extend({}, _this.defaultParams, params);
    /** @private */

    _this.container = 'string' == typeof params.container ? document.querySelector(_this.params.container) : _this.params.container;

    if (!_this.container) {
      throw new Error('Container element not found');
    }

    if (_this.params.mediaContainer == null) {
      /** @private */
      _this.mediaContainer = _this.container;
    } else if (typeof _this.params.mediaContainer == 'string') {
      /** @private */
      _this.mediaContainer = document.querySelector(_this.params.mediaContainer);
    } else {
      /** @private */
      _this.mediaContainer = _this.params.mediaContainer;
    }

    if (!_this.mediaContainer) {
      throw new Error('Media Container element not found');
    }

    if (_this.params.maxCanvasWidth <= 1) {
      throw new Error('maxCanvasWidth must be greater than 1');
    } else if (_this.params.maxCanvasWidth % 2 == 1) {
      throw new Error('maxCanvasWidth must be an even number');
    }

    if (_this.params.rtl === true) {
      util.style(_this.container, {
        transform: 'rotateY(180deg)'
      });
    }

    if (_this.params.backgroundColor) {
      _this.setBackgroundColor(_this.params.backgroundColor);
    }
    /**
     * @private Used to save the current volume when muting so we can
     * restore once unmuted
     * @type {number}
     */


    _this.savedVolume = 0;
    /**
     * @private The current muted state
     * @type {boolean}
     */

    _this.isMuted = false;
    /**
     * @private Will hold a list of event descriptors that need to be
     * canceled on subsequent loads of audio
     * @type {Object[]}
     */

    _this.tmpEvents = [];
    /**
     * @private Holds any running audio downloads
     * @type {Observer}
     */

    _this.currentRequest = null;
    /** @private */

    _this.arraybuffer = null;
    /** @private */

    _this.drawer = null;
    /** @private */

    _this.backend = null;
    /** @private */

    _this.peakCache = null; // cache constructor objects

    if (typeof _this.params.renderer !== 'function') {
      throw new Error('Renderer parameter is invalid');
    }
    /**
     * @private The uninitialised Drawer class
     */


    _this.Drawer = _this.params.renderer;
    /**
     * @private The uninitialised Backend class
     */
    // Back compat

    if (_this.params.backend == 'AudioElement') {
      _this.params.backend = 'MediaElement';
    }

    if ((_this.params.backend == 'WebAudio' || _this.params.backend === 'MediaElementWebAudio') && !_webaudio.default.prototype.supportsWebAudio.call(null)) {
      _this.params.backend = 'MediaElement';
    }

    _this.Backend = _this.backends[_this.params.backend];
    /**
     * @private map of plugin names that are currently initialised
     */

    _this.initialisedPluginList = {};
    /** @private */

    _this.isDestroyed = false;
    /**
     * Get the current ready status.
     *
     * @example const isReady = wavesurfer.isReady;
     * @return {boolean}
     */

    _this.isReady = false; // responsive debounced event listener. If this.params.responsive is not
    // set, this is never called. Use 100ms or this.params.responsive as
    // timeout for the debounce function.

    var prevWidth = 0;
    _this._onResize = util.debounce(function () {
      if (prevWidth != _this.drawer.wrapper.clientWidth && !_this.params.scrollParent) {
        prevWidth = _this.drawer.wrapper.clientWidth;

        _this.drawer.fireEvent('redraw');
      }
    }, typeof _this.params.responsive === 'number' ? _this.params.responsive : 100);
    return _possibleConstructorReturn(_this, _assertThisInitialized(_this));
  }
  /**
   * Initialise the wave
   *
   * @example
   * var wavesurfer = new WaveSurfer(params);
   * wavesurfer.init();
   * @return {this} The wavesurfer instance
   */


  _createClass(WaveSurfer, [{
    key: "init",
    value: function init() {
      this.registerPlugins(this.params.plugins);
      this.createDrawer();
      this.createBackend();
      this.createPeakCache();
      return this;
    }
    /**
     * Add and initialise array of plugins (if `plugin.deferInit` is falsey),
     * this function is called in the init function of wavesurfer
     *
     * @param {PluginDefinition[]} plugins An array of plugin definitions
     * @emits {WaveSurfer#plugins-registered} Called with the array of plugin definitions
     * @return {this} The wavesurfer instance
     */

  }, {
    key: "registerPlugins",
    value: function registerPlugins(plugins) {
      var _this2 = this;

      // first instantiate all the plugins
      plugins.forEach(function (plugin) {
        return _this2.addPlugin(plugin);
      }); // now run the init functions

      plugins.forEach(function (plugin) {
        // call init function of the plugin if deferInit is falsey
        // in that case you would manually use initPlugins()
        if (!plugin.deferInit) {
          _this2.initPlugin(plugin.name);
        }
      });
      this.fireEvent('plugins-registered', plugins);
      return this;
    }
    /**
     * Get a map of plugin names that are currently initialised
     *
     * @example wavesurfer.getPlugins();
     * @return {Object} Object with plugin names
     */

  }, {
    key: "getActivePlugins",
    value: function getActivePlugins() {
      return this.initialisedPluginList;
    }
    /**
     * Add a plugin object to wavesurfer
     *
     * @param {PluginDefinition} plugin A plugin definition
     * @emits {WaveSurfer#plugin-added} Called with the name of the plugin that was added
     * @example wavesurfer.addPlugin(WaveSurfer.minimap());
     * @return {this} The wavesurfer instance
     */

  }, {
    key: "addPlugin",
    value: function addPlugin(plugin) {
      var _this3 = this;

      if (!plugin.name) {
        throw new Error('Plugin does not have a name!');
      }

      if (!plugin.instance) {
        throw new Error("Plugin ".concat(plugin.name, " does not have an instance property!"));
      } // staticProps properties are applied to wavesurfer instance


      if (plugin.staticProps) {
        Object.keys(plugin.staticProps).forEach(function (pluginStaticProp) {
          /**
           * Properties defined in a plugin definition's `staticProps` property are added as
           * staticProps properties of the WaveSurfer instance
           */
          _this3[pluginStaticProp] = plugin.staticProps[pluginStaticProp];
        });
      }

      var Instance = plugin.instance; // turn the plugin instance into an observer

      var observerPrototypeKeys = Object.getOwnPropertyNames(util.Observer.prototype);
      observerPrototypeKeys.forEach(function (key) {
        Instance.prototype[key] = util.Observer.prototype[key];
      });
      /**
       * Instantiated plugin classes are added as a property of the wavesurfer
       * instance
       * @type {Object}
       */

      this[plugin.name] = new Instance(plugin.params || {}, this);
      this.fireEvent('plugin-added', plugin.name);
      return this;
    }
    /**
     * Initialise a plugin
     *
     * @param {string} name A plugin name
     * @emits WaveSurfer#plugin-initialised
     * @example wavesurfer.initPlugin('minimap');
     * @return {this} The wavesurfer instance
     */

  }, {
    key: "initPlugin",
    value: function initPlugin(name) {
      if (!this[name]) {
        throw new Error("Plugin ".concat(name, " has not been added yet!"));
      }

      if (this.initialisedPluginList[name]) {
        // destroy any already initialised plugins
        this.destroyPlugin(name);
      }

      this[name].init();
      this.initialisedPluginList[name] = true;
      this.fireEvent('plugin-initialised', name);
      return this;
    }
    /**
     * Destroy a plugin
     *
     * @param {string} name A plugin name
     * @emits WaveSurfer#plugin-destroyed
     * @example wavesurfer.destroyPlugin('minimap');
     * @returns {this} The wavesurfer instance
     */

  }, {
    key: "destroyPlugin",
    value: function destroyPlugin(name) {
      if (!this[name]) {
        throw new Error("Plugin ".concat(name, " has not been added yet and cannot be destroyed!"));
      }

      if (!this.initialisedPluginList[name]) {
        throw new Error("Plugin ".concat(name, " is not active and cannot be destroyed!"));
      }

      if (typeof this[name].destroy !== 'function') {
        throw new Error("Plugin ".concat(name, " does not have a destroy function!"));
      }

      this[name].destroy();
      delete this.initialisedPluginList[name];
      this.fireEvent('plugin-destroyed', name);
      return this;
    }
    /**
     * Destroy all initialised plugins. Convenience function to use when
     * wavesurfer is removed
     *
     * @private
     */

  }, {
    key: "destroyAllPlugins",
    value: function destroyAllPlugins() {
      var _this4 = this;

      Object.keys(this.initialisedPluginList).forEach(function (name) {
        return _this4.destroyPlugin(name);
      });
    }
    /**
     * Create the drawer and draw the waveform
     *
     * @private
     * @emits WaveSurfer#drawer-created
     */

  }, {
    key: "createDrawer",
    value: function createDrawer() {
      var _this5 = this;

      this.drawer = new this.Drawer(this.container, this.params);
      this.drawer.init();
      this.fireEvent('drawer-created', this.drawer);

      if (this.params.responsive !== false) {
        window.addEventListener('resize', this._onResize, true);
        window.addEventListener('orientationchange', this._onResize, true);
      }

      this.drawer.on('redraw', function () {
        _this5.drawBuffer();

        _this5.drawer.progress(_this5.backend.getPlayedPercents());
      }); // Click-to-seek

      this.drawer.on('click', function (e, progress) {
        setTimeout(function () {
          return _this5.seekTo(progress);
        }, 0);
      }); // Relay the scroll event from the drawer

      this.drawer.on('scroll', function (e) {
        if (_this5.params.partialRender) {
          _this5.drawBuffer();
        }

        _this5.fireEvent('scroll', e);
      });
    }
    /**
     * Create the backend
     *
     * @private
     * @emits WaveSurfer#backend-created
     */

  }, {
    key: "createBackend",
    value: function createBackend() {
      var _this6 = this;

      if (this.backend) {
        this.backend.destroy();
      }

      this.backend = new this.Backend(this.params);
      this.backend.init();
      this.fireEvent('backend-created', this.backend);
      this.backend.on('finish', function () {
        _this6.drawer.progress(_this6.backend.getPlayedPercents());

        _this6.fireEvent('finish');
      });
      this.backend.on('play', function () {
        return _this6.fireEvent('play');
      });
      this.backend.on('pause', function () {
        return _this6.fireEvent('pause');
      });
      this.backend.on('audioprocess', function (time) {
        _this6.drawer.progress(_this6.backend.getPlayedPercents());

        _this6.fireEvent('audioprocess', time);
      }); // only needed for MediaElement and MediaElementWebAudio backend

      if (this.params.backend === 'MediaElement' || this.params.backend === 'MediaElementWebAudio') {
        this.backend.on('seek', function () {
          _this6.drawer.progress(_this6.backend.getPlayedPercents());
        });
        this.backend.on('volume', function () {
          var newVolume = _this6.getVolume();

          _this6.fireEvent('volume', newVolume);

          if (_this6.backend.isMuted !== _this6.isMuted) {
            _this6.isMuted = _this6.backend.isMuted;

            _this6.fireEvent('mute', _this6.isMuted);
          }
        });
      }
    }
    /**
     * Create the peak cache
     *
     * @private
     */

  }, {
    key: "createPeakCache",
    value: function createPeakCache() {
      if (this.params.partialRender) {
        this.peakCache = new _peakcache.default();
      }
    }
    /**
     * Get the duration of the audio clip
     *
     * @example const duration = wavesurfer.getDuration();
     * @return {number} Duration in seconds
     */

  }, {
    key: "getDuration",
    value: function getDuration() {
      return this.backend.getDuration();
    }
    /**
     * Get the current playback position
     *
     * @example const currentTime = wavesurfer.getCurrentTime();
     * @return {number} Playback position in seconds
     */

  }, {
    key: "getCurrentTime",
    value: function getCurrentTime() {
      return this.backend.getCurrentTime();
    }
    /**
     * Set the current play time in seconds.
     *
     * @param {number} seconds A positive number in seconds. E.g. 10 means 10
     * seconds, 60 means 1 minute
     */

  }, {
    key: "setCurrentTime",
    value: function setCurrentTime(seconds) {
      if (seconds >= this.getDuration()) {
        this.seekTo(1);
      } else {
        this.seekTo(seconds / this.getDuration());
      }
    }
    /**
     * Starts playback from the current position. Optional start and end
     * measured in seconds can be used to set the range of audio to play.
     *
     * @param {?number} start Position to start at
     * @param {?number} end Position to end at
     * @emits WaveSurfer#interaction
     * @return {Promise} Result of the backend play method
     * @example
     * // play from second 1 to 5
     * wavesurfer.play(1, 5);
     */

  }, {
    key: "play",
    value: function play(start, end) {
      var _this7 = this;

      this.fireEvent('interaction', function () {
        return _this7.play(start, end);
      });
      return this.backend.play(start, end);
    }
    /**
     * Stops and pauses playback
     *
     * @example wavesurfer.pause();
     * @return {Promise} Result of the backend pause method
     */

  }, {
    key: "pause",
    value: function pause() {
      if (!this.backend.isPaused()) {
        return this.backend.pause();
      }
    }
    /**
     * Toggle playback
     *
     * @example wavesurfer.playPause();
     * @return {Promise} Result of the backend play or pause method
     */

  }, {
    key: "playPause",
    value: function playPause() {
      return this.backend.isPaused() ? this.play() : this.pause();
    }
    /**
     * Get the current playback state
     *
     * @example const isPlaying = wavesurfer.isPlaying();
     * @return {boolean} False if paused, true if playing
     */

  }, {
    key: "isPlaying",
    value: function isPlaying() {
      return !this.backend.isPaused();
    }
    /**
     * Skip backward
     *
     * @param {?number} seconds Amount to skip back, if not specified `skipLength`
     * is used
     * @example wavesurfer.skipBackward();
     */

  }, {
    key: "skipBackward",
    value: function skipBackward(seconds) {
      this.skip(-seconds || -this.params.skipLength);
    }
    /**
     * Skip forward
     *
     * @param {?number} seconds Amount to skip back, if not specified `skipLength`
     * is used
     * @example wavesurfer.skipForward();
     */

  }, {
    key: "skipForward",
    value: function skipForward(seconds) {
      this.skip(seconds || this.params.skipLength);
    }
    /**
     * Skip a number of seconds from the current position (use a negative value
     * to go backwards).
     *
     * @param {number} offset Amount to skip back or forwards
     * @example
     * // go back 2 seconds
     * wavesurfer.skip(-2);
     */

  }, {
    key: "skip",
    value: function skip(offset) {
      var duration = this.getDuration() || 1;
      var position = this.getCurrentTime() || 0;
      position = Math.max(0, Math.min(duration, position + (offset || 0)));
      this.seekAndCenter(position / duration);
    }
    /**
     * Seeks to a position and centers the view
     *
     * @param {number} progress Between 0 (=beginning) and 1 (=end)
     * @example
     * // seek and go to the middle of the audio
     * wavesurfer.seekTo(0.5);
     */

  }, {
    key: "seekAndCenter",
    value: function seekAndCenter(progress) {
      this.seekTo(progress);
      this.drawer.recenter(progress);
    }
    /**
     * Seeks to a position
     *
     * @param {number} progress Between 0 (=beginning) and 1 (=end)
     * @emits WaveSurfer#interaction
     * @emits WaveSurfer#seek
     * @example
     * // seek to the middle of the audio
     * wavesurfer.seekTo(0.5);
     */

  }, {
    key: "seekTo",
    value: function seekTo(progress) {
      var _this8 = this;

      // return an error if progress is not a number between 0 and 1
      if (typeof progress !== 'number' || !isFinite(progress) || progress < 0 || progress > 1) {
        throw new Error('Error calling wavesurfer.seekTo, parameter must be a number between 0 and 1!');
      }

      this.fireEvent('interaction', function () {
        return _this8.seekTo(progress);
      });
      var paused = this.backend.isPaused(); // avoid draw wrong position while playing backward seeking

      if (!paused) {
        this.backend.pause();
      } // avoid small scrolls while paused seeking


      var oldScrollParent = this.params.scrollParent;
      this.params.scrollParent = false;
      this.backend.seekTo(progress * this.getDuration());
      this.drawer.progress(progress);

      if (!paused) {
        this.backend.play();
      }

      this.params.scrollParent = oldScrollParent;
      this.fireEvent('seek', progress);
    }
    /**
     * Stops and goes to the beginning.
     *
     * @example wavesurfer.stop();
     */

  }, {
    key: "stop",
    value: function stop() {
      this.pause();
      this.seekTo(0);
      this.drawer.progress(0);
    }
    /**
     * Sets the ID of the audio device to use for output and returns a Promise.
     *
     * @param {string} deviceId String value representing underlying output
     * device
     * @returns {Promise} `Promise` that resolves to `undefined` when there are
     * no errors detected.
     */

  }, {
    key: "setSinkId",
    value: function setSinkId(deviceId) {
      return this.backend.setSinkId(deviceId);
    }
    /**
     * Set the playback volume.
     *
     * @param {number} newVolume A value between 0 and 1, 0 being no
     * volume and 1 being full volume.
     * @emits WaveSurfer#volume
     */

  }, {
    key: "setVolume",
    value: function setVolume(newVolume) {
      this.backend.setVolume(newVolume);
      this.fireEvent('volume', newVolume);
    }
    /**
     * Get the playback volume.
     *
     * @return {number} A value between 0 and 1, 0 being no
     * volume and 1 being full volume.
     */

  }, {
    key: "getVolume",
    value: function getVolume() {
      return this.backend.getVolume();
    }
    /**
     * Set the playback rate.
     *
     * @param {number} rate A positive number. E.g. 0.5 means half the normal
     * speed, 2 means double speed and so on.
     * @example wavesurfer.setPlaybackRate(2);
     */

  }, {
    key: "setPlaybackRate",
    value: function setPlaybackRate(rate) {
      this.backend.setPlaybackRate(rate);
    }
    /**
     * Get the playback rate.
     *
     * @return {number} The current playback rate.
     */

  }, {
    key: "getPlaybackRate",
    value: function getPlaybackRate() {
      return this.backend.getPlaybackRate();
    }
    /**
     * Toggle the volume on and off. If not currently muted it will save the
     * current volume value and turn the volume off. If currently muted then it
     * will restore the volume to the saved value, and then rest the saved
     * value.
     *
     * @example wavesurfer.toggleMute();
     */

  }, {
    key: "toggleMute",
    value: function toggleMute() {
      this.setMute(!this.isMuted);
    }
    /**
     * Enable or disable muted audio
     *
     * @param {boolean} mute Specify `true` to mute audio.
     * @emits WaveSurfer#volume
     * @emits WaveSurfer#mute
     * @example
     * // unmute
     * wavesurfer.setMute(false);
     * console.log(wavesurfer.getMute()) // logs false
     */

  }, {
    key: "setMute",
    value: function setMute(mute) {
      // ignore all muting requests if the audio is already in that state
      if (mute === this.isMuted) {
        this.fireEvent('mute', this.isMuted);
        return;
      }

      if (mute) {
        // If currently not muted then save current volume,
        // turn off the volume and update the mute properties
        this.savedVolume = this.backend.getVolume();
        this.backend.setVolume(0);
        this.isMuted = true;
        this.fireEvent('volume', 0);
      } else {
        // If currently muted then restore to the saved volume
        // and update the mute properties
        this.backend.setVolume(this.savedVolume);
        this.isMuted = false;
        this.fireEvent('volume', this.savedVolume);
      }

      this.fireEvent('mute', this.isMuted);
    }
    /**
     * Get the current mute status.
     *
     * @example const isMuted = wavesurfer.getMute();
     * @return {boolean} Current mute status
     */

  }, {
    key: "getMute",
    value: function getMute() {
      return this.isMuted;
    }
    /**
     * Get the list of current set filters as an array.
     *
     * Filters must be set with setFilters method first
     *
     * @return {array} List of enabled filters
     */

  }, {
    key: "getFilters",
    value: function getFilters() {
      return this.backend.filters || [];
    }
    /**
     * Toggles `scrollParent` and redraws
     *
     * @example wavesurfer.toggleScroll();
     */

  }, {
    key: "toggleScroll",
    value: function toggleScroll() {
      this.params.scrollParent = !this.params.scrollParent;
      this.drawBuffer();
    }
    /**
     * Toggle mouse interaction
     *
     * @example wavesurfer.toggleInteraction();
     */

  }, {
    key: "toggleInteraction",
    value: function toggleInteraction() {
      this.params.interact = !this.params.interact;
    }
    /**
     * Get the fill color of the waveform after the cursor.
     *
     * @return {string} A CSS color string.
     */

  }, {
    key: "getWaveColor",
    value: function getWaveColor() {
      return this.params.waveColor;
    }
    /**
     * Set the fill color of the waveform after the cursor.
     *
     * @param {string} color A CSS color string.
     * @example wavesurfer.setWaveColor('#ddd');
     */

  }, {
    key: "setWaveColor",
    value: function setWaveColor(color) {
      this.params.waveColor = color;
      this.drawBuffer();
    }
    /**
     * Get the fill color of the waveform behind the cursor.
     *
     * @return {string} A CSS color string.
     */

  }, {
    key: "getProgressColor",
    value: function getProgressColor() {
      return this.params.progressColor;
    }
    /**
     * Set the fill color of the waveform behind the cursor.
     *
     * @param {string} color A CSS color string.
     * @example wavesurfer.setProgressColor('#400');
     */

  }, {
    key: "setProgressColor",
    value: function setProgressColor(color) {
      this.params.progressColor = color;
      this.drawBuffer();
    }
    /**
     * Get the background color of the waveform container.
     *
     * @return {string} A CSS color string.
     */

  }, {
    key: "getBackgroundColor",
    value: function getBackgroundColor() {
      return this.params.backgroundColor;
    }
    /**
     * Set the background color of the waveform container.
     *
     * @param {string} color A CSS color string.
     * @example wavesurfer.setBackgroundColor('#FF00FF');
     */

  }, {
    key: "setBackgroundColor",
    value: function setBackgroundColor(color) {
      this.params.backgroundColor = color;
      util.style(this.container, {
        background: this.params.backgroundColor
      });
    }
    /**
     * Get the fill color of the cursor indicating the playhead
     * position.
     *
     * @return {string} A CSS color string.
     */

  }, {
    key: "getCursorColor",
    value: function getCursorColor() {
      return this.params.cursorColor;
    }
    /**
     * Set the fill color of the cursor indicating the playhead
     * position.
     *
     * @param {string} color A CSS color string.
     * @example wavesurfer.setCursorColor('#222');
     */

  }, {
    key: "setCursorColor",
    value: function setCursorColor(color) {
      this.params.cursorColor = color;
      this.drawer.updateCursor();
    }
    /**
     * Get the height of the waveform.
     *
     * @return {number} Height measured in pixels.
     */

  }, {
    key: "getHeight",
    value: function getHeight() {
      return this.params.height;
    }
    /**
     * Set the height of the waveform.
     *
     * @param {number} height Height measured in pixels.
     * @example wavesurfer.setHeight(200);
     */

  }, {
    key: "setHeight",
    value: function setHeight(height) {
      this.params.height = height;
      this.drawer.setHeight(height * this.params.pixelRatio);
      this.drawBuffer();
    }
    /**
     * Get the correct peaks for current wave view-port and render wave
     *
     * @private
     * @emits WaveSurfer#redraw
     */

  }, {
    key: "drawBuffer",
    value: function drawBuffer() {
      var nominalWidth = Math.round(this.getDuration() * this.params.minPxPerSec * this.params.pixelRatio);
      var parentWidth = this.drawer.getWidth();
      var width = nominalWidth; // always start at 0 after zooming for scrolling : issue redraw left part

      var start = 0;
      var end = Math.max(start + parentWidth, width); // Fill container

      if (this.params.fillParent && (!this.params.scrollParent || nominalWidth < parentWidth)) {
        width = parentWidth;
        start = 0;
        end = width;
      }

      var peaks;

      if (this.params.partialRender) {
        var newRanges = this.peakCache.addRangeToPeakCache(width, start, end);
        var i;

        for (i = 0; i < newRanges.length; i++) {
          peaks = this.backend.getPeaks(width, newRanges[i][0], newRanges[i][1]);
          this.drawer.drawPeaks(peaks, width, newRanges[i][0], newRanges[i][1]);
        }
      } else {
        peaks = this.backend.getPeaks(width, start, end);
        this.drawer.drawPeaks(peaks, width, start, end);
      }

      this.fireEvent('redraw', peaks, width);
    }
    /**
     * Horizontally zooms the waveform in and out. It also changes the parameter
     * `minPxPerSec` and enables the `scrollParent` option. Calling the function
     * with a falsey parameter will reset the zoom state.
     *
     * @param {?number} pxPerSec Number of horizontal pixels per second of
     * audio, if none is set the waveform returns to unzoomed state
     * @emits WaveSurfer#zoom
     * @example wavesurfer.zoom(20);
     */

  }, {
    key: "zoom",
    value: function zoom(pxPerSec) {
      if (!pxPerSec) {
        this.params.minPxPerSec = this.defaultParams.minPxPerSec;
        this.params.scrollParent = false;
      } else {
        this.params.minPxPerSec = pxPerSec;
        this.params.scrollParent = true;
      }

      this.drawBuffer();
      this.drawer.progress(this.backend.getPlayedPercents());
      this.drawer.recenter(this.getCurrentTime() / this.getDuration());
      this.fireEvent('zoom', pxPerSec);
    }
    /**
     * Decode buffer and load
     *
     * @private
     * @param {ArrayBuffer} arraybuffer Buffer to process
     */

  }, {
    key: "loadArrayBuffer",
    value: function loadArrayBuffer(arraybuffer) {
      var _this9 = this;

      this.decodeArrayBuffer(arraybuffer, function (data) {
        if (!_this9.isDestroyed) {
          _this9.loadDecodedBuffer(data);
        }
      });
    }
    /**
     * Directly load an externally decoded AudioBuffer
     *
     * @private
     * @param {AudioBuffer} buffer Buffer to process
     * @emits WaveSurfer#ready
     */

  }, {
    key: "loadDecodedBuffer",
    value: function loadDecodedBuffer(buffer) {
      this.backend.load(buffer);
      this.drawBuffer();
      this.isReady = true;
      this.fireEvent('ready');
    }
    /**
     * Loads audio data from a Blob or File object
     *
     * @param {Blob|File} blob Audio data
     * @example
     */

  }, {
    key: "loadBlob",
    value: function loadBlob(blob) {
      var _this10 = this;

      // Create file reader
      var reader = new FileReader();
      reader.addEventListener('progress', function (e) {
        return _this10.onProgress(e);
      });
      reader.addEventListener('load', function (e) {
        return _this10.loadArrayBuffer(e.target.result);
      });
      reader.addEventListener('error', function () {
        return _this10.fireEvent('error', 'Error reading file');
      });
      reader.readAsArrayBuffer(blob);
      this.empty();
    }
    /**
     * Loads audio and re-renders the waveform.
     *
     * @param {string|HTMLMediaElement} url The url of the audio file or the
     * audio element with the audio
     * @param {number[]|Number.<Array[]>} peaks Wavesurfer does not have to decode
     * the audio to render the waveform if this is specified
     * @param {?string} preload (Use with backend `MediaElement` and `MediaElementWebAudio`)
     * `'none'|'metadata'|'auto'` Preload attribute for the media element
     * @param {?number} duration The duration of the audio. This is used to
     * render the peaks data in the correct size for the audio duration (as
     * befits the current `minPxPerSec` and zoom value) without having to decode
     * the audio.
     * @returns {void}
     * @throws Will throw an error if the `url` argument is empty.
     * @example
     * // uses fetch or media element to load file (depending on backend)
     * wavesurfer.load('http://example.com/demo.wav');
     *
     * // setting preload attribute with media element backend and supplying
     * // peaks
     * wavesurfer.load(
     *   'http://example.com/demo.wav',
     *   [0.0218, 0.0183, 0.0165, 0.0198, 0.2137, 0.2888],
     *   true
     * );
     */

  }, {
    key: "load",
    value: function load(url, peaks, preload, duration) {
      if (!url) {
        throw new Error('url parameter cannot be empty');
      }

      this.empty();

      if (preload) {
        // check whether the preload attribute will be usable and if not log
        // a warning listing the reasons why not and nullify the variable
        var preloadIgnoreReasons = {
          "Preload is not 'auto', 'none' or 'metadata'": ['auto', 'metadata', 'none'].indexOf(preload) === -1,
          'Peaks are not provided': !peaks,
          "Backend is not of type 'MediaElement' or 'MediaElementWebAudio'": ['MediaElement', 'MediaElementWebAudio'].indexOf(this.params.backend) === -1,
          'Url is not of type string': typeof url !== 'string'
        };
        var activeReasons = Object.keys(preloadIgnoreReasons).filter(function (reason) {
          return preloadIgnoreReasons[reason];
        });

        if (activeReasons.length) {
          // eslint-disable-next-line no-console
          console.warn('Preload parameter of wavesurfer.load will be ignored because:\n\t- ' + activeReasons.join('\n\t- ')); // stop invalid values from being used

          preload = null;
        }
      }

      switch (this.params.backend) {
        case 'WebAudio':
          return this.loadBuffer(url, peaks, duration);

        case 'MediaElement':
        case 'MediaElementWebAudio':
          return this.loadMediaElement(url, peaks, preload, duration);
      }
    }
    /**
     * Loads audio using Web Audio buffer backend.
     *
     * @private
     * @param {string} url URL of audio file
     * @param {number[]|Number.<Array[]>} peaks Peaks data
     * @param {?number} duration Optional duration of audio file
     * @returns {void}
     */

  }, {
    key: "loadBuffer",
    value: function loadBuffer(url, peaks, duration) {
      var _this11 = this;

      var load = function load(action) {
        if (action) {
          _this11.tmpEvents.push(_this11.once('ready', action));
        }

        return _this11.getArrayBuffer(url, function (data) {
          return _this11.loadArrayBuffer(data);
        });
      };

      if (peaks) {
        this.backend.setPeaks(peaks, duration);
        this.drawBuffer();
        this.tmpEvents.push(this.once('interaction', load));
      } else {
        return load();
      }
    }
    /**
     * Either create a media element, or load an existing media element.
     *
     * @private
     * @param {string|HTMLMediaElement} urlOrElt Either a path to a media file, or an
     * existing HTML5 Audio/Video Element
     * @param {number[]|Number.<Array[]>} peaks Array of peaks. Required to bypass web audio
     * dependency
     * @param {?boolean} preload Set to true if the preload attribute of the
     * audio element should be enabled
     * @param {?number} duration Optional duration of audio file
     */

  }, {
    key: "loadMediaElement",
    value: function loadMediaElement(urlOrElt, peaks, preload, duration) {
      var _this12 = this;

      var url = urlOrElt;

      if (typeof urlOrElt === 'string') {
        this.backend.load(url, this.mediaContainer, peaks, preload);
      } else {
        var elt = urlOrElt;
        this.backend.loadElt(elt, peaks); // If peaks are not provided,
        // url = element.src so we can get peaks with web audio

        url = elt.src;
      }

      this.tmpEvents.push(this.backend.once('canplay', function () {
        // ignore when backend was already destroyed
        if (!_this12.backend.destroyed) {
          _this12.drawBuffer();

          _this12.isReady = true;

          _this12.fireEvent('ready');
        }
      }), this.backend.once('error', function (err) {
        return _this12.fireEvent('error', err);
      })); // If no pre-decoded peaks provided or pre-decoded peaks are
      // provided with forceDecode flag, attempt to download the
      // audio file and decode it with Web Audio.

      if (peaks) {
        this.backend.setPeaks(peaks, duration);
      }

      if ((!peaks || this.params.forceDecode) && this.backend.supportsWebAudio()) {
        this.getArrayBuffer(url, function (arraybuffer) {
          _this12.decodeArrayBuffer(arraybuffer, function (buffer) {
            _this12.backend.buffer = buffer;

            _this12.backend.setPeaks(null);

            _this12.drawBuffer();

            _this12.fireEvent('waveform-ready');
          });
        });
      }
    }
    /**
     * Decode an array buffer and pass data to a callback
     *
     * @private
     * @param {Object} arraybuffer The array buffer to decode
     * @param {function} callback The function to call on complete
     */

  }, {
    key: "decodeArrayBuffer",
    value: function decodeArrayBuffer(arraybuffer, callback) {
      var _this13 = this;

      this.arraybuffer = arraybuffer;
      this.backend.decodeArrayBuffer(arraybuffer, function (data) {
        // Only use the decoded data if we haven't been destroyed or
        // another decode started in the meantime
        if (!_this13.isDestroyed && _this13.arraybuffer == arraybuffer) {
          callback(data);
          _this13.arraybuffer = null;
        }
      }, function () {
        return _this13.fireEvent('error', 'Error decoding audiobuffer');
      });
    }
    /**
     * Load an array buffer using fetch and pass the result to a callback
     *
     * @param {string} url The URL of the file object
     * @param {function} callback The function to call on complete
     * @returns {util.fetchFile} fetch call
     * @private
     */

  }, {
    key: "getArrayBuffer",
    value: function getArrayBuffer(url, callback) {
      var _this14 = this;

      var options = util.extend({
        url: url,
        responseType: 'arraybuffer'
      }, this.params.xhr);
      var request = util.fetchFile(options);
      this.currentRequest = request;
      this.tmpEvents.push(request.on('progress', function (e) {
        _this14.onProgress(e);
      }), request.on('success', function (data) {
        callback(data);
        _this14.currentRequest = null;
      }), request.on('error', function (e) {
        _this14.fireEvent('error', e);

        _this14.currentRequest = null;
      }));
      return request;
    }
    /**
     * Called while the audio file is loading
     *
     * @private
     * @param {Event} e Progress event
     * @emits WaveSurfer#loading
     */

  }, {
    key: "onProgress",
    value: function onProgress(e) {
      var percentComplete;

      if (e.lengthComputable) {
        percentComplete = e.loaded / e.total;
      } else {
        // Approximate progress with an asymptotic
        // function, and assume downloads in the 1-3 MB range.
        percentComplete = e.loaded / (e.loaded + 1000000);
      }

      this.fireEvent('loading', Math.round(percentComplete * 100), e.target);
    }
    /**
     * Exports PCM data into a JSON array and opens in a new window.
     *
     * @param {number} length=1024 The scale in which to export the peaks. (Integer)
     * @param {number} accuracy=10000 (Integer)
     * @param {?boolean} noWindow Set to true to disable opening a new
     * window with the JSON
     * @param {number} start Start index
     * @todo Update exportPCM to work with new getPeaks signature
     * @return {string} JSON of peaks
     */

  }, {
    key: "exportPCM",
    value: function exportPCM(length, accuracy, noWindow, start) {
      length = length || 1024;
      start = start || 0;
      accuracy = accuracy || 10000;
      noWindow = noWindow || false;
      var peaks = this.backend.getPeaks(length, start);
      var arr = [].map.call(peaks, function (val) {
        return Math.round(val * accuracy) / accuracy;
      });
      var json = JSON.stringify(arr);

      if (!noWindow) {
        window.open('data:application/json;charset=utf-8,' + encodeURIComponent(json));
      }

      return json;
    }
    /**
     * Save waveform image as data URI.
     *
     * The default format is `'image/png'`. Other supported types are
     * `'image/jpeg'` and `'image/webp'`.
     *
     * @param {string} format='image/png' A string indicating the image format.
     * The default format type is `'image/png'`.
     * @param {number} quality=1 A number between 0 and 1 indicating the image
     * quality to use for image formats that use lossy compression such as
     * `'image/jpeg'`` and `'image/webp'`.
     * @param {string} type Image data type to return. Either 'dataURL' (default)
     * or 'blob'.
     * @return {string|string[]|Promise} When using `'dataURL'` type this returns
     * a single data URL or an array of data URLs, one for each canvas. When using
     * `'blob'` type this returns a `Promise` resolving with an array of `Blob`
     * instances, one for each canvas.
     */

  }, {
    key: "exportImage",
    value: function exportImage(format, quality, type) {
      if (!format) {
        format = 'image/png';
      }

      if (!quality) {
        quality = 1;
      }

      if (!type) {
        type = 'dataURL';
      }

      return this.drawer.getImage(format, quality, type);
    }
    /**
     * Cancel any fetch request currently in progress
     */

  }, {
    key: "cancelAjax",
    value: function cancelAjax() {
      if (this.currentRequest && this.currentRequest.controller) {
        this.currentRequest.controller.abort();
        this.currentRequest = null;
      }
    }
    /**
     * @private
     */

  }, {
    key: "clearTmpEvents",
    value: function clearTmpEvents() {
      this.tmpEvents.forEach(function (e) {
        return e.un();
      });
    }
    /**
     * Display empty waveform.
     */

  }, {
    key: "empty",
    value: function empty() {
      if (!this.backend.isPaused()) {
        this.stop();
        this.backend.disconnectSource();
      }

      this.isReady = false;
      this.cancelAjax();
      this.clearTmpEvents(); // empty drawer

      this.drawer.progress(0);
      this.drawer.setWidth(0);
      this.drawer.drawPeaks({
        length: this.drawer.getWidth()
      }, 0);
    }
    /**
     * Remove events, elements and disconnect WebAudio nodes.
     *
     * @emits WaveSurfer#destroy
     */

  }, {
    key: "destroy",
    value: function destroy() {
      this.destroyAllPlugins();
      this.fireEvent('destroy');
      this.cancelAjax();
      this.clearTmpEvents();
      this.unAll();

      if (this.params.responsive !== false) {
        window.removeEventListener('resize', this._onResize, true);
        window.removeEventListener('orientationchange', this._onResize, true);
      }

      if (this.backend) {
        this.backend.destroy();
      }

      if (this.drawer) {
        this.drawer.destroy();
      }

      this.isDestroyed = true;
      this.isReady = false;
      this.arraybuffer = null;
    }
  }]);

  return WaveSurfer;
}(util.Observer);

exports.default = WaveSurfer;
WaveSurfer.VERSION = "3.2.0";
WaveSurfer.util = util;
module.exports = exports.default;

/***/ }),

/***/ "./src/webaudio.js":
/*!*************************!*\
  !*** ./src/webaudio.js ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var util = _interopRequireWildcard(__webpack_require__(/*! ./util */ "./src/util/index.js"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; if (obj != null) { var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

// using constants to prevent someone writing the string wrong
var PLAYING = 'playing';
var PAUSED = 'paused';
var FINISHED = 'finished';
/**
 * WebAudio backend
 *
 * @extends {Observer}
 */

var WebAudio =
/*#__PURE__*/
function (_util$Observer) {
  _inherits(WebAudio, _util$Observer);

  _createClass(WebAudio, [{
    key: "supportsWebAudio",

    /** scriptBufferSize: size of the processing buffer */

    /** audioContext: allows to process audio with WebAudio API */

    /** @private */

    /** @private */

    /**
     * Does the browser support this backend
     *
     * @return {boolean} Whether or not this browser supports this backend
     */
    value: function supportsWebAudio() {
      return !!(window.AudioContext || window.webkitAudioContext);
    }
    /**
     * Get the audio context used by this backend or create one
     *
     * @return {AudioContext} Existing audio context, or creates a new one
     */

  }, {
    key: "getAudioContext",
    value: function getAudioContext() {
      if (!window.WaveSurferAudioContext) {
        window.WaveSurferAudioContext = new (window.AudioContext || window.webkitAudioContext)();
      }

      return window.WaveSurferAudioContext;
    }
    /**
     * Get the offline audio context used by this backend or create one
     *
     * @param {number} sampleRate The sample rate to use
     * @return {OfflineAudioContext} Existing offline audio context, or creates
     * a new one
     */

  }, {
    key: "getOfflineAudioContext",
    value: function getOfflineAudioContext(sampleRate) {
      if (!window.WaveSurferOfflineAudioContext) {
        window.WaveSurferOfflineAudioContext = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, 2, sampleRate);
      }

      return window.WaveSurferOfflineAudioContext;
    }
    /**
     * Construct the backend
     *
     * @param {WavesurferParams} params Wavesurfer parameters
     */

  }]);

  function WebAudio(params) {
    var _this$stateBehaviors, _this$states;

    var _this;

    _classCallCheck(this, WebAudio);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(WebAudio).call(this));
    /** @private */

    _this.audioContext = null;
    _this.offlineAudioContext = null;
    _this.stateBehaviors = (_this$stateBehaviors = {}, _defineProperty(_this$stateBehaviors, PLAYING, {
      init: function init() {
        this.addOnAudioProcess();
      },
      getPlayedPercents: function getPlayedPercents() {
        var duration = this.getDuration();
        return this.getCurrentTime() / duration || 0;
      },
      getCurrentTime: function getCurrentTime() {
        return this.startPosition + this.getPlayedTime();
      }
    }), _defineProperty(_this$stateBehaviors, PAUSED, {
      init: function init() {
        this.removeOnAudioProcess();
      },
      getPlayedPercents: function getPlayedPercents() {
        var duration = this.getDuration();
        return this.getCurrentTime() / duration || 0;
      },
      getCurrentTime: function getCurrentTime() {
        return this.startPosition;
      }
    }), _defineProperty(_this$stateBehaviors, FINISHED, {
      init: function init() {
        this.removeOnAudioProcess();
        this.fireEvent('finish');
      },
      getPlayedPercents: function getPlayedPercents() {
        return 1;
      },
      getCurrentTime: function getCurrentTime() {
        return this.getDuration();
      }
    }), _this$stateBehaviors);
    _this.params = params;
    /** ac: Audio Context instance */

    _this.ac = params.audioContext || (_this.supportsWebAudio() ? _this.getAudioContext() : {});
    /**@private */

    _this.lastPlay = _this.ac.currentTime;
    /** @private */

    _this.startPosition = 0;
    /** @private  */

    _this.scheduledPause = null;
    /** @private */

    _this.states = (_this$states = {}, _defineProperty(_this$states, PLAYING, Object.create(_this.stateBehaviors[PLAYING])), _defineProperty(_this$states, PAUSED, Object.create(_this.stateBehaviors[PAUSED])), _defineProperty(_this$states, FINISHED, Object.create(_this.stateBehaviors[FINISHED])), _this$states);
    /** @private */

    _this.buffer = null;
    /** @private */

    _this.filters = [];
    /** gainNode: allows to control audio volume */

    _this.gainNode = null;
    /** @private */

    _this.mergedPeaks = null;
    /** @private */

    _this.offlineAc = null;
    /** @private */

    _this.peaks = null;
    /** @private */

    _this.playbackRate = 1;
    /** analyser: provides audio analysis information */

    _this.analyser = null;
    /** scriptNode: allows processing audio */

    _this.scriptNode = null;
    /** @private */

    _this.source = null;
    /** @private */

    _this.splitPeaks = [];
    /** @private */

    _this.state = null;
    /** @private */

    _this.explicitDuration = params.duration;
    /**
     * Boolean indicating if the backend was destroyed.
     */

    _this.destroyed = false;
    return _this;
  }
  /**
   * Initialise the backend, called in `wavesurfer.createBackend()`
   */


  _createClass(WebAudio, [{
    key: "init",
    value: function init() {
      this.createVolumeNode();
      this.createScriptNode();
      this.createAnalyserNode();
      this.setState(PAUSED);
      this.setPlaybackRate(this.params.audioRate);
      this.setLength(0);
    }
    /** @private */

  }, {
    key: "disconnectFilters",
    value: function disconnectFilters() {
      if (this.filters) {
        this.filters.forEach(function (filter) {
          filter && filter.disconnect();
        });
        this.filters = null; // Reconnect direct path

        this.analyser.connect(this.gainNode);
      }
    }
    /**
     * @private
     *
     * @param {string} state The new state
     */

  }, {
    key: "setState",
    value: function setState(state) {
      if (this.state !== this.states[state]) {
        this.state = this.states[state];
        this.state.init.call(this);
      }
    }
    /**
     * Unpacked `setFilters()`
     *
     * @param {...AudioNode} filters One or more filters to set
     */

  }, {
    key: "setFilter",
    value: function setFilter() {
      for (var _len = arguments.length, filters = new Array(_len), _key = 0; _key < _len; _key++) {
        filters[_key] = arguments[_key];
      }

      this.setFilters(filters);
    }
    /**
     * Insert custom Web Audio nodes into the graph
     *
     * @param {AudioNode[]} filters Packed filters array
     * @example
     * const lowpass = wavesurfer.backend.ac.createBiquadFilter();
     * wavesurfer.backend.setFilter(lowpass);
     */

  }, {
    key: "setFilters",
    value: function setFilters(filters) {
      // Remove existing filters
      this.disconnectFilters(); // Insert filters if filter array not empty

      if (filters && filters.length) {
        this.filters = filters; // Disconnect direct path before inserting filters

        this.analyser.disconnect(); // Connect each filter in turn

        filters.reduce(function (prev, curr) {
          prev.connect(curr);
          return curr;
        }, this.analyser).connect(this.gainNode);
      }
    }
    /** Create ScriptProcessorNode to process audio */

  }, {
    key: "createScriptNode",
    value: function createScriptNode() {
      if (this.params.audioScriptProcessor) {
        this.scriptNode = this.params.audioScriptProcessor;
      } else {
        if (this.ac.createScriptProcessor) {
          this.scriptNode = this.ac.createScriptProcessor(WebAudio.scriptBufferSize);
        } else {
          this.scriptNode = this.ac.createJavaScriptNode(WebAudio.scriptBufferSize);
        }
      }

      this.scriptNode.connect(this.ac.destination);
    }
    /** @private */

  }, {
    key: "addOnAudioProcess",
    value: function addOnAudioProcess() {
      var _this2 = this;

      this.scriptNode.onaudioprocess = function () {
        var time = _this2.getCurrentTime();

        if (time >= _this2.getDuration()) {
          _this2.setState(FINISHED);

          _this2.fireEvent('pause');
        } else if (time >= _this2.scheduledPause) {
          _this2.pause();
        } else if (_this2.state === _this2.states[PLAYING]) {
          _this2.fireEvent('audioprocess', time);
        }
      };
    }
    /** @private */

  }, {
    key: "removeOnAudioProcess",
    value: function removeOnAudioProcess() {
      this.scriptNode.onaudioprocess = function () {};
    }
    /** Create analyser node to perform audio analysis */

  }, {
    key: "createAnalyserNode",
    value: function createAnalyserNode() {
      this.analyser = this.ac.createAnalyser();
      this.analyser.connect(this.gainNode);
    }
    /**
     * Create the gain node needed to control the playback volume.
     *
     */

  }, {
    key: "createVolumeNode",
    value: function createVolumeNode() {
      // Create gain node using the AudioContext
      if (this.ac.createGain) {
        this.gainNode = this.ac.createGain();
      } else {
        this.gainNode = this.ac.createGainNode();
      } // Add the gain node to the graph


      this.gainNode.connect(this.ac.destination);
    }
    /**
     * Set the sink id for the media player
     *
     * @param {string} deviceId String value representing audio device id.
     * @returns {Promise} A Promise that resolves to `undefined` when there
     * are no errors.
     */

  }, {
    key: "setSinkId",
    value: function setSinkId(deviceId) {
      if (deviceId) {
        /**
         * The webaudio API doesn't currently support setting the device
         * output. Here we create an HTMLAudioElement, connect the
         * webaudio stream to that element and setSinkId there.
         */
        var audio = new window.Audio();

        if (!audio.setSinkId) {
          return Promise.reject(new Error('setSinkId is not supported in your browser'));
        }

        audio.autoplay = true;
        var dest = this.ac.createMediaStreamDestination();
        this.gainNode.disconnect();
        this.gainNode.connect(dest);
        audio.srcObject = dest.stream;
        return audio.setSinkId(deviceId);
      } else {
        return Promise.reject(new Error('Invalid deviceId: ' + deviceId));
      }
    }
    /**
     * Set the audio volume
     *
     * @param {number} value A floating point value between 0 and 1.
     */

  }, {
    key: "setVolume",
    value: function setVolume(value) {
      this.gainNode.gain.setValueAtTime(value, this.ac.currentTime);
    }
    /**
     * Get the current volume
     *
     * @return {number} value A floating point value between 0 and 1.
     */

  }, {
    key: "getVolume",
    value: function getVolume() {
      return this.gainNode.gain.value;
    }
    /**
     * Decode an array buffer and pass data to a callback
     *
     * @private
     * @param {ArrayBuffer} arraybuffer The array buffer to decode
     * @param {function} callback The function to call on complete.
     * @param {function} errback The function to call on error.
     */

  }, {
    key: "decodeArrayBuffer",
    value: function decodeArrayBuffer(arraybuffer, callback, errback) {
      if (!this.offlineAc) {
        this.offlineAc = this.getOfflineAudioContext(this.ac && this.ac.sampleRate ? this.ac.sampleRate : 44100);
      }

      this.offlineAc.decodeAudioData(arraybuffer, function (data) {
        return callback(data);
      }, errback);
    }
    /**
     * Set pre-decoded peaks
     *
     * @param {number[]|Number.<Array[]>} peaks Peaks data
     * @param {?number} duration Explicit duration
     */

  }, {
    key: "setPeaks",
    value: function setPeaks(peaks, duration) {
      if (duration != null) {
        this.explicitDuration = duration;
      }

      this.peaks = peaks;
    }
    /**
     * Set the rendered length (different from the length of the audio)
     *
     * @param {number} length The rendered length
     */

  }, {
    key: "setLength",
    value: function setLength(length) {
      // No resize, we can preserve the cached peaks.
      if (this.mergedPeaks && length == 2 * this.mergedPeaks.length - 1 + 2) {
        return;
      }

      this.splitPeaks = [];
      this.mergedPeaks = []; // Set the last element of the sparse array so the peak arrays are
      // appropriately sized for other calculations.

      var channels = this.buffer ? this.buffer.numberOfChannels : 1;
      var c;

      for (c = 0; c < channels; c++) {
        this.splitPeaks[c] = [];
        this.splitPeaks[c][2 * (length - 1)] = 0;
        this.splitPeaks[c][2 * (length - 1) + 1] = 0;
      }

      this.mergedPeaks[2 * (length - 1)] = 0;
      this.mergedPeaks[2 * (length - 1) + 1] = 0;
    }
    /**
     * Compute the max and min value of the waveform when broken into <length> subranges.
     *
     * @param {number} length How many subranges to break the waveform into.
     * @param {number} first First sample in the required range.
     * @param {number} last Last sample in the required range.
     * @return {number[]|Number.<Array[]>} Array of 2*<length> peaks or array of arrays of
     * peaks consisting of (max, min) values for each subrange.
     */

  }, {
    key: "getPeaks",
    value: function getPeaks(length, first, last) {
      if (this.peaks) {
        return this.peaks;
      }

      if (!this.buffer) {
        return [];
      }

      first = first || 0;
      last = last || length - 1;
      this.setLength(length);

      if (!this.buffer) {
        return this.params.splitChannels ? this.splitPeaks : this.mergedPeaks;
      }
      /**
       * The following snippet fixes a buffering data issue on the Safari
       * browser which returned undefined It creates the missing buffer based
       * on 1 channel, 4096 samples and the sampleRate from the current
       * webaudio context 4096 samples seemed to be the best fit for rendering
       * will review this code once a stable version of Safari TP is out
       */


      if (!this.buffer.length) {
        var newBuffer = this.createBuffer(1, 4096, this.sampleRate);
        this.buffer = newBuffer.buffer;
      }

      var sampleSize = this.buffer.length / length;
      var sampleStep = ~~(sampleSize / 10) || 1;
      var channels = this.buffer.numberOfChannels;
      var c;

      for (c = 0; c < channels; c++) {
        var peaks = this.splitPeaks[c];
        var chan = this.buffer.getChannelData(c);
        var i = void 0;

        for (i = first; i <= last; i++) {
          var start = ~~(i * sampleSize);
          var end = ~~(start + sampleSize);
          var min = 0;
          var max = 0;
          var j = void 0;

          for (j = start; j < end; j += sampleStep) {
            var value = chan[j];

            if (value > max) {
              max = value;
            }

            if (value < min) {
              min = value;
            }
          }

          peaks[2 * i] = max;
          peaks[2 * i + 1] = min;

          if (c == 0 || max > this.mergedPeaks[2 * i]) {
            this.mergedPeaks[2 * i] = max;
          }

          if (c == 0 || min < this.mergedPeaks[2 * i + 1]) {
            this.mergedPeaks[2 * i + 1] = min;
          }
        }
      }

      return this.params.splitChannels ? this.splitPeaks : this.mergedPeaks;
    }
    /**
     * Get the position from 0 to 1
     *
     * @return {number} Position
     */

  }, {
    key: "getPlayedPercents",
    value: function getPlayedPercents() {
      return this.state.getPlayedPercents.call(this);
    }
    /** @private */

  }, {
    key: "disconnectSource",
    value: function disconnectSource() {
      if (this.source) {
        this.source.disconnect();
      }
    }
    /**
     * This is called when wavesurfer is destroyed
     */

  }, {
    key: "destroy",
    value: function destroy() {
      if (!this.isPaused()) {
        this.pause();
      }

      this.unAll();
      this.buffer = null;
      this.destroyed = true;
      this.disconnectFilters();
      this.disconnectSource();
      this.gainNode.disconnect();
      this.scriptNode.disconnect();
      this.analyser.disconnect(); // close the audioContext if closeAudioContext option is set to true

      if (this.params.closeAudioContext) {
        // check if browser supports AudioContext.close()
        if (typeof this.ac.close === 'function' && this.ac.state != 'closed') {
          this.ac.close();
        } // clear the reference to the audiocontext


        this.ac = null; // clear the actual audiocontext, either passed as param or the
        // global singleton

        if (!this.params.audioContext) {
          window.WaveSurferAudioContext = null;
        } else {
          this.params.audioContext = null;
        } // clear the offlineAudioContext


        window.WaveSurferOfflineAudioContext = null;
      }
    }
    /**
     * Loaded a decoded audio buffer
     *
     * @param {Object} buffer Decoded audio buffer to load
     */

  }, {
    key: "load",
    value: function load(buffer) {
      this.startPosition = 0;
      this.lastPlay = this.ac.currentTime;
      this.buffer = buffer;
      this.createSource();
    }
    /** @private */

  }, {
    key: "createSource",
    value: function createSource() {
      this.disconnectSource();
      this.source = this.ac.createBufferSource(); // adjust for old browsers

      this.source.start = this.source.start || this.source.noteGrainOn;
      this.source.stop = this.source.stop || this.source.noteOff;
      this.source.playbackRate.setValueAtTime(this.playbackRate, this.ac.currentTime);
      this.source.buffer = this.buffer;
      this.source.connect(this.analyser);
    }
    /**
     * Used by `wavesurfer.isPlaying()` and `wavesurfer.playPause()`
     *
     * @return {boolean} Whether or not this backend is currently paused
     */

  }, {
    key: "isPaused",
    value: function isPaused() {
      return this.state !== this.states[PLAYING];
    }
    /**
     * Used by `wavesurfer.getDuration()`
     *
     * @return {number} Duration of loaded buffer
     */

  }, {
    key: "getDuration",
    value: function getDuration() {
      if (this.explicitDuration) {
        return this.explicitDuration;
      }

      if (!this.buffer) {
        return 0;
      }

      return this.buffer.duration;
    }
    /**
     * Used by `wavesurfer.seekTo()`
     *
     * @param {number} start Position to start at in seconds
     * @param {number} end Position to end at in seconds
     * @return {{start: number, end: number}} Object containing start and end
     * positions
     */

  }, {
    key: "seekTo",
    value: function seekTo(start, end) {
      if (!this.buffer) {
        return;
      }

      this.scheduledPause = null;

      if (start == null) {
        start = this.getCurrentTime();

        if (start >= this.getDuration()) {
          start = 0;
        }
      }

      if (end == null) {
        end = this.getDuration();
      }

      this.startPosition = start;
      this.lastPlay = this.ac.currentTime;

      if (this.state === this.states[FINISHED]) {
        this.setState(PAUSED);
      }

      return {
        start: start,
        end: end
      };
    }
    /**
     * Get the playback position in seconds
     *
     * @return {number} The playback position in seconds
     */

  }, {
    key: "getPlayedTime",
    value: function getPlayedTime() {
      return (this.ac.currentTime - this.lastPlay) * this.playbackRate;
    }
    /**
     * Plays the loaded audio region.
     *
     * @param {number} start Start offset in seconds, relative to the beginning
     * of a clip.
     * @param {number} end When to stop relative to the beginning of a clip.
     */

  }, {
    key: "play",
    value: function play(start, end) {
      if (!this.buffer) {
        return;
      } // need to re-create source on each playback


      this.createSource();
      var adjustedTime = this.seekTo(start, end);
      start = adjustedTime.start;
      end = adjustedTime.end;
      this.scheduledPause = end;
      this.source.start(0, start, end - start);

      if (this.ac.state == 'suspended') {
        this.ac.resume && this.ac.resume();
      }

      this.setState(PLAYING);
      this.fireEvent('play');
    }
    /**
     * Pauses the loaded audio.
     */

  }, {
    key: "pause",
    value: function pause() {
      this.scheduledPause = null;
      this.startPosition += this.getPlayedTime();
      this.source && this.source.stop(0);
      this.setState(PAUSED);
      this.fireEvent('pause');
    }
    /**
     * Returns the current time in seconds relative to the audio-clip's
     * duration.
     *
     * @return {number} The current time in seconds
     */

  }, {
    key: "getCurrentTime",
    value: function getCurrentTime() {
      return this.state.getCurrentTime.call(this);
    }
    /**
     * Returns the current playback rate. (0=no playback, 1=normal playback)
     *
     * @return {number} The current playback rate
     */

  }, {
    key: "getPlaybackRate",
    value: function getPlaybackRate() {
      return this.playbackRate;
    }
    /**
     * Set the audio source playback rate.
     *
     * @param {number} value The playback rate to use
     */

  }, {
    key: "setPlaybackRate",
    value: function setPlaybackRate(value) {
      value = value || 1;

      if (this.isPaused()) {
        this.playbackRate = value;
      } else {
        this.pause();
        this.playbackRate = value;
        this.play();
      }
    }
  }]);

  return WebAudio;
}(util.Observer);

exports.default = WebAudio;
WebAudio.scriptBufferSize = 256;
module.exports = exports.default;

/***/ })

/******/ });
});
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Recorder = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

module.exports = require("./recorder").Recorder;

},{"./recorder":2}],2:[function(require,module,exports){
'use strict';

var _createClass = (function () {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
        }
    }return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
})();

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Recorder = undefined;

var _inlineWorker = require('inline-worker');

var _inlineWorker2 = _interopRequireDefault(_inlineWorker);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

var Recorder = exports.Recorder = (function () {
    function Recorder(source, cfg) {
        var _this = this;

        _classCallCheck(this, Recorder);

        this.config = {
            bufferLen: 4096,
            numChannels: 2,
            mimeType: 'audio/wav'
        };
        this.recording = false;
        this.callbacks = {
            getBuffer: [],
            exportWAV: []
        };

        Object.assign(this.config, cfg);
        this.context = source.context;
        this.node = (this.context.createScriptProcessor || this.context.createJavaScriptNode).call(this.context, this.config.bufferLen, this.config.numChannels, this.config.numChannels);

        this.node.onaudioprocess = function (e) {
            if (!_this.recording) return;

            var buffer = [];
            for (var channel = 0; channel < _this.config.numChannels; channel++) {
                buffer.push(e.inputBuffer.getChannelData(channel));
            }
            _this.worker.postMessage({
                command: 'record',
                buffer: buffer
            });
        };

        source.connect(this.node);
        this.node.connect(this.context.destination); //this should not be necessary

        var self = {};
        this.worker = new _inlineWorker2.default(function () {
            var recLength = 0,
                recBuffers = [],
                sampleRate = undefined,
                numChannels = undefined;

            self.onmessage = function (e) {
                switch (e.data.command) {
                    case 'init':
                        init(e.data.config);
                        break;
                    case 'record':
                        record(e.data.buffer);
                        break;
                    case 'exportWAV':
                        exportWAV(e.data.type);
                        break;
                    case 'getBuffer':
                        getBuffer();
                        break;
                    case 'clear':
                        clear();
                        break;
                }
            };

            function init(config) {
                sampleRate = config.sampleRate;
                numChannels = config.numChannels;
                initBuffers();
            }

            function record(inputBuffer) {
                for (var channel = 0; channel < numChannels; channel++) {
                    recBuffers[channel].push(inputBuffer[channel]);
                }
                recLength += inputBuffer[0].length;
            }

            function exportWAV(type) {
                var buffers = [];
                for (var channel = 0; channel < numChannels; channel++) {
                    buffers.push(mergeBuffers(recBuffers[channel], recLength));
                }
                var interleaved = undefined;
                if (numChannels === 2) {
                    interleaved = interleave(buffers[0], buffers[1]);
                } else {
                    interleaved = buffers[0];
                }
                var dataview = encodeWAV(interleaved);
                var audioBlob = new Blob([dataview], { type: type });

                self.postMessage({ command: 'exportWAV', data: audioBlob });
            }

            function getBuffer() {
                var buffers = [];
                for (var channel = 0; channel < numChannels; channel++) {
                    buffers.push(mergeBuffers(recBuffers[channel], recLength));
                }
                self.postMessage({ command: 'getBuffer', data: buffers });
            }

            function clear() {
                recLength = 0;
                recBuffers = [];
                initBuffers();
            }

            function initBuffers() {
                for (var channel = 0; channel < numChannels; channel++) {
                    recBuffers[channel] = [];
                }
            }

            function mergeBuffers(recBuffers, recLength) {
                var result = new Float32Array(recLength);
                var offset = 0;
                for (var i = 0; i < recBuffers.length; i++) {
                    result.set(recBuffers[i], offset);
                    offset += recBuffers[i].length;
                }
                return result;
            }

            function interleave(inputL, inputR) {
                var length = inputL.length + inputR.length;
                var result = new Float32Array(length);

                var index = 0,
                    inputIndex = 0;

                while (index < length) {
                    result[index++] = inputL[inputIndex];
                    result[index++] = inputR[inputIndex];
                    inputIndex++;
                }
                return result;
            }

            function floatTo16BitPCM(output, offset, input) {
                for (var i = 0; i < input.length; i++, offset += 2) {
                    var s = Math.max(-1, Math.min(1, input[i]));
                    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
                }
            }

            function writeString(view, offset, string) {
                for (var i = 0; i < string.length; i++) {
                    view.setUint8(offset + i, string.charCodeAt(i));
                }
            }

            function encodeWAV(samples) {
                var buffer = new ArrayBuffer(44 + samples.length * 2);
                var view = new DataView(buffer);

                /* RIFF identifier */
                writeString(view, 0, 'RIFF');
                /* RIFF chunk length */
                view.setUint32(4, 36 + samples.length * 2, true);
                /* RIFF type */
                writeString(view, 8, 'WAVE');
                /* format chunk identifier */
                writeString(view, 12, 'fmt ');
                /* format chunk length */
                view.setUint32(16, 16, true);
                /* sample format (raw) */
                view.setUint16(20, 1, true);
                /* channel count */
                view.setUint16(22, numChannels, true);
                /* sample rate */
                view.setUint32(24, sampleRate, true);
                /* byte rate (sample rate * block align) */
                view.setUint32(28, sampleRate * 4, true);
                /* block align (channel count * bytes per sample) */
                view.setUint16(32, numChannels * 2, true);
                /* bits per sample */
                view.setUint16(34, 16, true);
                /* data chunk identifier */
                writeString(view, 36, 'data');
                /* data chunk length */
                view.setUint32(40, samples.length * 2, true);

                floatTo16BitPCM(view, 44, samples);

                return view;
            }
        }, self);

        this.worker.postMessage({
            command: 'init',
            config: {
                sampleRate: this.context.sampleRate,
                numChannels: this.config.numChannels
            }
        });

        this.worker.onmessage = function (e) {
            var cb = _this.callbacks[e.data.command].pop();
            if (typeof cb == 'function') {
                cb(e.data.data);
            }
        };
    }

    _createClass(Recorder, [{
        key: 'record',
        value: function record() {
            this.recording = true;
        }
    }, {
        key: 'stop',
        value: function stop() {
            this.recording = false;
        }
    }, {
        key: 'clear',
        value: function clear() {
            this.worker.postMessage({ command: 'clear' });
        }
    }, {
        key: 'getBuffer',
        value: function getBuffer(cb) {
            cb = cb || this.config.callback;
            if (!cb) throw new Error('Callback not set');

            this.callbacks.getBuffer.push(cb);

            this.worker.postMessage({ command: 'getBuffer' });
        }
    }, {
        key: 'exportWAV',
        value: function exportWAV(cb, mimeType) {
            mimeType = mimeType || this.config.mimeType;
            cb = cb || this.config.callback;
            if (!cb) throw new Error('Callback not set');

            this.callbacks.exportWAV.push(cb);

            this.worker.postMessage({
                command: 'exportWAV',
                type: mimeType
            });
        }
    }], [{
        key: 'forceDownload',
        value: function forceDownload(blob, filename) {
            var url = (window.URL || window.webkitURL).createObjectURL(blob);
            var link = window.document.createElement('a');
            link.href = url;
            link.download = filename || 'output.wav';
            var click = document.createEvent("Event");
            click.initEvent("click", true, true);
            link.dispatchEvent(click);
        }
    }]);

    return Recorder;
})();

exports.default = Recorder;

},{"inline-worker":3}],3:[function(require,module,exports){
"use strict";

module.exports = require("./inline-worker");
},{"./inline-worker":4}],4:[function(require,module,exports){
(function (global){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var WORKER_ENABLED = !!(global === global.window && global.URL && global.Blob && global.Worker);

var InlineWorker = (function () {
  function InlineWorker(func, self) {
    var _this = this;

    _classCallCheck(this, InlineWorker);

    if (WORKER_ENABLED) {
      var functionBody = func.toString().trim().match(/^function\s*\w*\s*\([\w\s,]*\)\s*{([\w\W]*?)}$/)[1];
      var url = global.URL.createObjectURL(new global.Blob([functionBody], { type: "text/javascript" }));

      return new global.Worker(url);
    }

    this.self = self;
    this.self.postMessage = function (data) {
      setTimeout(function () {
        _this.onmessage({ data: data });
      }, 0);
    };

    setTimeout(function () {
      func.call(self);
    }, 0);
  }

  _createClass(InlineWorker, {
    postMessage: {
      value: function postMessage(data) {
        var _this = this;

        setTimeout(function () {
          _this.self.onmessage({ data: data });
        }, 0);
      }
    }
  });

  return InlineWorker;
})();

module.exports = InlineWorker;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[1])(1)
});