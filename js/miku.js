// miku.js
window.Miku = (function (window) {

var Miku = {};
Miku.logging = false;

var gapi;

function q(query) {
	var nodes = window.document.querySelectorAll(query),
		nodesArray = [];
	for (var i = 0; i < nodes.length; i++) {
		nodesArray.push(nodes[i]);
	}
	return nodesArray;
}

var l = Miku.logging ? window.console.log.bind(window.console) : function () {};

Miku.api_key = "AIzaSyDsImZ2h077_LxeDhwh3Q6fjHtd5uZ7aaM";
Miku.playlistId = "PL_ON6xeP4BD9pU8hGN5O_yDrrBckEVQrR";
Miku.playlistItems = [];
Miku.ytPlayers = [];
Miku.noSkip = false;

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
		actions = [pause].concat(actions);
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
		Miku.setupPlayers,
		Miku.setupInterface,
		Miku.prepNextVideo,
		Miku.playNextVideo
	]);
}

function makePlayer(id) {
	return {
		id: id,
		player: new window.YT.Player(id, {
	        height: '100%',
	        width: '100%',
	        playerVars: { 
	        	autoplay: 0,
	        	controls: 0,
	        	showinfo: 0
	        },
	        videoId: "",
	        events: {
	        	'onReady': next,
	            'onStateChange': Miku.onYtPlayerStateChange,
	        }
		})
	};
}

Miku.setupPlayers = function () {
	now([
		function () {
			Miku.ytPlayers[0] = makePlayer("mainVideo");
		},
		function () {
			Miku.ytPlayers[1] = makePlayer("mainVideo2");
		}]);
}

Miku.setupInterface = function () {
	l("YTP ready")
	q(".skip").forEach(function (node) {
		node.onclick = Miku.skipVideo;
	});
	q(".loading").forEach(function (node) {
		node.style.display = "none";
	});
	Miku.ytPlayers.forEach(function (p) {
		Miku.preventDoorStuck(p.player);
	});
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
			var items = res.items || [];
			l("Got", items.length, "videos");
			playlistItems = playlistItems.concat(items.map(function (item) {
				return {videoId: item.contentDetails.videoId};
			}));
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

Miku.randomVideoId = function () {
	return Miku.playlistItems[
		Math.floor(Math.random() * Miku.playlistItems.length)].videoId;
}

Miku.prepNextVideo = function () {
	l("Prepping video");
	Miku.noSkip = true;
	var player = Miku.ytPlayers[1].player;
	var aVideoId = Miku.randomVideoId();
	l("Prepping video", aVideoId);
	player.cueVideoById(aVideoId);
	player.mute();
	player.playVideo();
	window.setTimeout(function () { 
		player.pauseVideo();
		player.unMute();
		player.seekTo(0);
		Miku.noSkip = false;
		next();
	}, 1000);
}

Miku.playNextVideo = function () {
	l("Playing video");
	var oldPlayer = Miku.ytPlayers.shift(),
		newPlayer = Miku.ytPlayers[0];
	Miku.ytPlayers.push(oldPlayer);
	oldPlayer.player.stopVideo();
	newPlayer.player.playVideo();
	q("#" + oldPlayer.id).forEach(function (node) {
		node.style.display = "none";
	});
	q("#" + newPlayer.id).forEach(function (node) {
		node.style.display = "block";
	});
	after([Miku.prepNextVideo]);
}

Miku.skipVideo = function () {
	if (! Miku.noSkip)
		now([Miku.playNextVideo]);
	return false;
}

Miku.preventDoorStuck = function(ytPlayer) {
	// DOOR STUCK
	var stuckCount = -1;
	function unstickDoor() {
		if (ytPlayer.getPlayerState() === -1)
			stuckCount++;
		if (stuckCount > 3) {
			stuckCount = 0;
			now([Miku.playNextVideo]);
		}
		window.setTimeout(unstickDoor, 1000);
	}
	unstickDoor();
}

Miku.onYtPlayerStateChange = function (evt) {
	var state = evt.data;
	l("State change", state);
	// video ended:
	if (state === 0) {
		now([Miku.playNextVideo]);
	}
}

return Miku;
})(window);
