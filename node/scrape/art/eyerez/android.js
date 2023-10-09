var jq = document.createElement('script');
jq.src = "https://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js";
document.getElementsByTagName('head')[0].appendChild(jq);
// ... give time for script to load, then type.
jQuery.noConflict();
setTimeout(function(){
	function viewPost(posts,data,c){
		if(posts[c]){
			var i=$(posts[c])
			var o=i.offset();
			i.find('.overlay').click();
			$(window).scrollTop(o.top);
			setTimeout(function(){
				if(!$('.modal-content').find('.media-viewer').find('iframe').length){
					var post={
						img:$('.modal-content').find('.view-image').css('backgroundImage').replace('url(','').replace(')',''),
						name:$('.modal-content').find('h1.ng-binding').text().trim(),
						content:$('.modal-content').find('p.ng-scope').text().trim()
					};
					if($('.modal-content').find('.link.highlight-color').length){
						post.link=$('.modal-content').find('.link.highlight-color').find('a').attr('href');
					}
					$('.modal-controls').click();
					c++;
					data.push(post);
					viewPost(posts,data,c);
				}else{
					console.log('Its a video!')
					$('.modal-controls').click();
					c++;
					viewPost(posts,data,c);
				}
			},2000);
		}else{
			var p=$('.feed-item');
			if(posts.length==p.length) {
				console.log('Done');
				console.log(data)
			}
			else viewPost(p,data,c);
		}
	}
	var posts=$('.feed-item');
	viewPost(posts,[],0);
},2000);