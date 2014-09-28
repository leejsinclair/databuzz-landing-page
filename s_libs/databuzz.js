
var config = {
	base_site: 'http://databuzz.io',
	base_url: 'http://databuzz.io:3000',
//	base_site: 'http://localhost',
//	base_url: 'http://localhost:3000',
	api_search: '/api/survey/search/',
	api_fetch: '/api/results/',
};

var chart;
var dps = []; 

$(document).ready(function() {
	'use strict';
	setup_chart();
	
	var survey_id = getSurveyIdFromUrl();
	
	if (survey_id.length>0) {
		fetch_by_id(survey_id);
	} 
	
	$('.search').on('keyup', check_search_input);
	
});

// URL could be databuzz.io/survey.html?THE_SURVEY_ID, or
// databuzz.io/survey/THE_SURVEY_ID
function getSurveyIdFromUrl() {
	'use strict';
	var url = document.URL;

	var sep_char;
	if (url.indexOf('?')>-1) {
		sep_char = '?';
	} else {
		sep_char = '/';
	}
	
	var n = url.lastIndexOf(sep_char);
	var result = url.substring(n + 1);
	
	return result;	
}


function fetch_by_id(id) {
	'use strict';
	$.ajax({ 
		url: config.base_url+config.api_fetch+encodeURIComponent(id), 
		success: function(result) {
			
			displayQuestion(result);
			displayAnswers(result);

		}
	});	
	
}


function setup_chart() {
	'use strict';
	var chart_label = 'The Results:';  // rec.caption.text
	
	chart = new CanvasJS.Chart('answer_chart',
	{
		'title':{
			text: 'The Results'
		},
		'exportFileName': 'Pie Chart',
		'exportEnabled': true,
		'legend':{
			'verticalAlign': 'bottom',
			'horizontalAlign': 'center'
		},
		'data': [
		{       
			'type': 'pie',
			'showInLegend': true,
			'toolTipContent': '{legendText}: <strong>{y}%</strong>',
			'indexLabel': '{label} {y}%',
			'dataPoints': dps
	}
	]
	});
}



function displayQuestion(rec) {
	'use strict';
console.log(rec);	
	
	$('.question_div').find('.profile_pic').attr('src', rec.survey.sourceTweet.user.profile_image_url);
	//$('.question_div').find('.survey_image').attr('src', rec.images.low_resolution.url);
	$('.question_div').find('.survey_summary_text').html(rec.question);
	
	$('.question_div').show();
	
}



function displayAnswers(rec) {
	'use strict';
	$('.answer_div').show();
	
	
	// remove previous answers
	var num_to_del = dps.length;
	for(var i=0;i<num_to_del;i++) {
		dps.shift();
	}
	
	// add in new ones
	for(var key in rec.answers){
		console.log({ label: key, y: rec.answers[key]});
		dps.push({ label: key, legendText: key.substr(0,12), y: rec.answers[key]});
	}

	chart.render();	
	
	
}








/*
The search box could contain a URL, in which case we jump to that record directly,
or some search text, in which case we show a suggestion list
*/
function check_search_input() {
	'use strict';
	var str = $('.search').val();
	if (str.length<4) {
		$('.search_results').slideUp();
		return; // need to be at least a few chars long before we search ...
	}
	
	// THIS WONT COME INTO PLAY :
	// check to see if it is an instagram URL
	if ($('.search').val().indexOf('instagram.com/')>-1) {
		// add http:// to start if it ain't already there
		if ($('.search').val().substr(0,7)!='http://') {
			$('.search').val('http://' + $('.search').val());
		}
	
		$('.search_results').slideUp();
		
		// fetch this specific entry
		fetch_by_url(encodeURIComponent(str));
		
	} else {
		
		// TODO: Local filtering in the case of deleted entries,
		// Only go to the server if we feel we must,
		// TODO: don't do another request if still awaiting one - but must
		//       rerequest when typing stops too !!  ??
		ajax_search(str);
	}
}



/*
<div class='search_div'>
	<input class='search' type='text' placeholder='Enter text to search for surveys ...' />
	<div class='search_results'>
		<!-- in here looks like this :
			<div class='search_result'>
				<img class='profile_pic'/>
				<span class='survey_summary_text'/>
			</div>
			...
		-->
	</div>
</div>
*/
function ajax_search(str) {
	'use strict';
		$.ajax({ 
			url: config.base_url+config.api_search+encodeURIComponent(str), 
			success: function(results) {
				$('.search_results').html('');
				results.forEach(function(item) {

					var profile_pic = item.sourceTweet.user.profile_image_url;
					var survey_summary_text = item.question;
					var url = config.base_site+'/survey/'+item._id;

					$('.search_results').append('<div class="search_result" onclick="window.location.href=\''+(url)+'\';">'+
												'<img class="profile_pic" src="'+profile_pic+'"/>'+
												'<span class="survey_summary_text">'+survey_summary_text+'</span>'+
												'</div>');				
				});
				$('.search_results').slideDown();
			}
		});
}


function fetch_by_url(uri_encoded_url) {
	'use strict';
	$('.search').val(decodeURIComponent(uri_encoded_url));
	$('.search_results').hide();
	
	$.ajax({ 
		url: config.base_url+config.api_fetch+uri_encoded_url, 
		success: function(results) {
			
			displayQuestion(results[0]);
			displayAnswers(results[0]);

		}
	});	
}

var service = (function(){
	'use strict';
	var baseURL = config.base_url;
	return {
		'recent': function( callback ) {
			var ep = '/api/results/recent';
			$.ajax({ 
				'url': baseURL + ep, 
				'success': function(results) {
					callback(null, results);
				},
				'error': function( request, status, err ) {
					callback( err );
				}
			});
		}
	};
})();


function recentPosts() {
	'use strict';
	var content = { 'items': [] };
	var source   = $('#question-template').html();
	var template = Handlebars.compile(source);

	service.recent( function( err, results ) {
		if(!err) {
			content.items = results;
			$('.search_results').html( template(content) );
		}
	});	
}