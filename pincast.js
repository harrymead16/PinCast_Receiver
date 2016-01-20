/*
	PinCast by Stanton Studios

	Coded by Steven Stanton
*/

window.onload = function() {

	//Variables

	var interval=10000;
	var queue = [];
	var heap = [];
	var slide_show_in_progress = false;
	var current_slide="slide_one";
	var cached_image = new Image();
	var slide_to_add;

	//Slick

	$('.slide_container').slick({
                fade:true,
				speed:2000,
                //autoplay:true,
                arrows:false,
				lazyLoad: 'ondemand',
    			initOnLoad: true,
				nextSlidesToPreload: 1
	});

	//Chromecast

	startChromecastReceiver();

	//------------------------------CHROMECAST API FUNCTIONS-------------------------------

	//Start Receiver

	function startChromecastReceiver(){

		cast.receiver.logger.setLevelValue(0);
    	window.castReceiverManager = cast.receiver.CastReceiverManager.getInstance();
    	console.log('Starting Receiver Manager');

		// Create a CastMessageBus to handle messages to and from sender

		window.messageBus = window.castReceiverManager.getCastMessageBus(
              'urn:x-cast:co.uk.stantonstudios.pincast'
		);

		// Start the CastReceiverManager

    	window.castReceiverManager.start({statusText: "Application is starting"});
    	console.log('Receiver Manager started');
	}

    // Receiver Ready

    castReceiverManager.onReady = function(event) {

    	console.log('Received Ready event: ' + JSON.stringify(event.data));
    	window.castReceiverManager.setApplicationState("Application status is ready...");
    };

    // Sender App Connected

    castReceiverManager.onSenderConnected = function(event) {

    	console.log('Received Sender Connected event: ' + event.data);
    	console.log(window.castReceiverManager.getSender(event.data).userAgent);
		document.getElementById("instruction").style.visibility="visible";
    };

    // Sender App Disconnected

    castReceiverManager.onSenderDisconnected = function(event) {

		console.log('Received Sender Disconnected event: ' + event.data);

		if (window.castReceiverManager.getSenders().length == 0) {

	    	window.close();
	    }
    };

	// Volume Changed

    castReceiverManager.onSystemVolumeChanged = function(event) {

		console.log('Received System Volume Changed event: ' + event.data['level'] + ' ' + event.data['muted']);
		//(Does nothing at present)
    };

    // Receive URL batch from Sender App

	window.messageBus.onMessage = function(event) {

    	console.log('Message [' + event.senderId + ']: ' + event.data);

		if (isPinCastCommand(event.data)) {
			processCommand(event.data);
		}

		else if (isURLBatch(event.data)){
			processURLs(event.data);
		}

		else {
			console.error("Can't read cast message");
		}

    	// Tell all senders on the CastMessageBus about the message event
    	// - a message listener will be alerted in the sender app
		window.messageBus.send(event.senderId, event.data);

		if(!slide_show_in_progress && queue.length>0){

				begin_show();
		}
    };

	// Receive URL batch, and add them as individual strings to the queue

	function isPinCastCommand(text){
		var prefix = text.substr(0,4);
		if  (prefix=="PCOM") return true;
		else return false;
	}

	function processCommand(text){
		if (text=="PCOM WIPE"){
			heap=[];
			queue=[];
		}
	}

	function isURLBatch(text){
		var prefix = text.substr(0,4);
		if  (prefix=="http") return true;
		else return false;
	}

	function processURLs(text) {

		var seperated_urls = text.split(',');

		for (var individual_url of seperated_urls) {

  			queue.push(individual_url);
		}

        window.castReceiverManager.setApplicationState("Receiving URLS");
    }

	//--------------------------------- SLIDE MANAGEMENT THROUGH SLICK ------------------------

	// Begin a new slideshow

	function begin_show(){

		console.log("Beginning Slide Show")
		window.castReceiverManager.setApplicationState("Showing slides");

		document.getElementById("instruction").style.visibility="hidden";
		document.getElementById("logo").style.display="none";

		document.getElementById("buffering").style.visibility="visible";
		document.getElementById("slide_one").style.backgroundColor="black";
		document.getElementById("slide_two").style.backgroundColor="black";

		slide_show_in_progress=true;

		setTimeout(display_next_pic,4000);
	}

	// Load next image into hidden slide

	function display_next_pic(){

		var url_text = queue.shift();

		//collect used URLs on heap
		heap.push(url_text);

		if(current_slide=="slide_two"){
			slide_to_add="slide_one";
		}else{
			slide_to_add="slide_two";
		}

		if(url_text!=undefined){

			cached_image.src=url_text;

			cached_image.onload=function (){
				console.log("image loaded");
				document.getElementById("buffering").style.visibility="hidden";
				document.getElementById("app_name").style.visibility="hidden";
				document.getElementById(slide_to_add).style.backgroundImage='url('+url_text+')';
				switch_slides();

			};

		}else{

			console.log("Have now shown all slides... repeating queue");

			for(var individual_url of heap){
				queue.push(individual_url);
			}

			heap=[];
		}

		setTimeout(display_next_pic, interval);
	}

	// Swap slides around

	function switch_slides(){

		$('.slide_container').slick('slickNext');

		if(current_slide=="slide_two"){
			current_slide="slide_one";
		}else{
			current_slide="slide_two";
		}
	}

	//--------------------------------TESTING & DEBUGGING

	function just_for_testing(){

		processURLs("http://www.tortoisecentre.co.uk/images/ProductImages/Web_wm20028.jpg");
		processURLs("http://www.canoefoundation.org.uk/cf/assets/Image/Yellow%20Duck.jpg");
		processURLs("https://tradiiosongs.s3-eu-west-1.amazonaws.com/6/6/7/6/0/66760/hip-hop-monster.jpg");
		processURLs("http://www.tortoisecentre.co.uk/images/ProductImages/Web_wm20028.jpg,http://www.canoefoundation.org.uk/cf/assets/Image/Yellow%20Duck.jpg,https://tradiiosongs.s3-eu-west-1.amazonaws.com/6/6/7/6/0/66760/hip-hop-monster.jpg")

		begin_show();

		setTimeout(processURLs("http://www.radiotimes.com/uploads/635779261564296187-doctor-who-wallpapers-3.jpg,http://images.radiotimes.com/namedimage/Exclusive_Doctor_Who_photoshoot_starring_Peter_Capaldi_and_Jenna_Coleman.jpg?quality=85&mode=crop&width=620&height=374&404=tv&url=/uploads/images/original/86081.jpg,http://i.telegraph.co.uk/multimedia/archive/01527/west_wing_1527547a.gif"),10000);
	}

	//setTimeout(just_for_testing,5000);

};



