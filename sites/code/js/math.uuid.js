//UUID
(function(){var e="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split("");Math.uuid=function(t,n){var r=e,i=[],s;n=n||r.length;if(t){for(s=0;s<t;s++)i[s]=r[0|Math.random()*n]}else{var o;i[8]=i[13]=i[18]=i[23]="-";i[14]="4";for(s=0;s<36;s++){if(!i[s]){o=0|Math.random()*16;i[s]=r[s==19?o&3|8:o]}}}return i.join("")};Math.uuidFast=function(){var t=e,n=new Array(36),r=0,i;for(var s=0;s<36;s++){if(s==8||s==13||s==18||s==23){n[s]="-"}else if(s==14){n[s]="4"}else{if(r<=2)r=33554432+Math.random()*16777216|0;i=r&15;r=r>>4;n[s]=t[s==19?i&3|8:i]}}return n.join("")};Math.uuidCompact=function(){return"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,function(e){var t=Math.random()*16|0,n=e=="x"?t:t&3|8;return n.toString(16)})}})();