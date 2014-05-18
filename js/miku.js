// miku.js
window.Miku = (function (window) {

var Miku = {};
Miku.logging = true;

var gapi;
var q = window.document.querySelectorAll.bind(window.document);
var l = Miku.logging ? window.console.log.bind(window.console) : function () {};

Miku.api_key = "AIzaSyDsImZ2h077_LxeDhwh3Q6fjHtd5uZ7aaM";
Miku.playlistId = "PL_ON6xeP4BD9pU8hGN5O_yDrrBckEVQrR";
Miku.playlistItems = [];
Miku.ytPlayerReady = false;

Miku.asyncActions = [];

var next = Miku.doNextAction = function () {
	if (Miku.asyncActions.length === 0)
		return;

	var nextAction = Miku.asyncActions.shift();
	window.setTimeout(nextAction, 0);
}

var now = Miku.pushActions = function (actions) {
	Miku.asyncActions = actions.concat(Miku.asyncActions);
	Miku.doNextAction();
}

var after = Miku.laterActions = function (actions) {
	if (Miku.asyncActions.length === 0)
		actions = [Miku.pause].concat(actions);
	Miku.asyncActions = Miku.asyncActions.concat(actions);
	Miku.doNextAction();
}

var pause = Miku.pause = function () {
	window.setTimeout(next, 200);
}

window.onGapiLoaded = Miku.onGapiLoaded = function () {
	gapi = window.gapi;
	gapi.client.setApiKey(Miku.api_key);
	now([
		function () { 
			l("Loading youtube");
			gapi.client.load("youtube", "v3", next);
		},
		Miku.loadPlaylist,
		Miku.dumpPl,
		Miku.setupPlayer,
		Miku.playRandomVideo
	]);
}

Miku.setupPlayer = function () {
	Miku.ytPlayer = new window.YT.Player('mainVideo', {
        height: '100%',
        width: '100%',
        playerVars: { 'autoplay': 1, 'controls': 1,'autohide':1,'wmode':'opaque' },
        videoId: Miku.randomVideoId(),
        events: {
        	'onReady': Miku.onYtPlayerReady,
            'onStateChange': Miku.onYtPlayerStateChange,
      }
	});
}

Miku.onYtPlayerReady = function () {
	l("YTP ready")
	Miku.ytPlayerReady = true;
	next();
}

Miku.loadPlaylist = function () {
	var nextPageToken = "",
		playlistItems = [];

	function loadMore() {
		var req = gapi.client.youtube.playlistItems.list({
			playlistId: Miku.playlistId,
			maxResults: 50,
			part: "contentDetails",
			pageToken: nextPageToken});
		req.execute(function (res) {
			playlistItems = playlistItems.concat(res.items.map(function (item) {
				return {videoId: item.contentDetails.videoId};
			}));
			l("Loaded", res.items.length, "videos");
			nextPageToken = res.nextPageToken;
			if (nextPageToken !== undefined) {
				loadMore();
			}
			else {
				Miku.playlistItems = playlistItems;
				next();
			}
		});
	}
	loadMore();
}

Miku.dumpPl = function () {
	l("Loaded the playlist", Miku.playlistItems);
	next();
}

Miku.randomVideoId = function () {
	return Miku.playlistItems[
		Math.floor(Math.random() * Miku.playlistItems.length)].videoId;
}

Miku.playRandomVideo = function () {
	l("Asked to play a video");
	if (Miku.playlistItems.length === 0 || ! Miku.ytPlayerReady) {
		l("Wasn't ready to play", Miku.playlistItems.length, Miku.ytPlayer);
		return; //return after([Miku.playRandomVideo]);		
	}

	var aVideoId = Miku.randomVideoId();
	l("Playing video", aVideoId);
	Miku.ytPlayer.loadVideoById(aVideoId, 0);
	next();
}

Miku.onYtPlayerStateChange = function (evt) {
	var state = evt.data;
	l("State change", state);
	if (state === 0) {
		// video ended
		now([Miku.playRandomVideo]);
	}
}

return Miku;
})(window);
