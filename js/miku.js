// miku.js
window.Miku = (function (window) {

var gapi;
var q = window.document.querySelectorAll.bind(window.document);
var l = Miku.logging ? window.console.log.bind(window.console) : function () {};

var Miku = {};
Miku.logging = true;

Miku.api_key = "AIzaSyDsImZ2h077_LxeDhwh3Q6fjHtd5uZ7aaM";
Miku.playlistId = "PL_ON6xeP4BD9pU8hGN5O_yDrrBckEVQrR";
Miku.playlistItems = [];
Miku.asyncActions = [];

var next = Miku.doNextAction = function () {
	if (Miku.asyncActions.length === 0)
		return;

	var nextAction = Miku.asyncActions.shift();
	window.setTimeout(nextAction, 0);
}

var acts = Miku.pushActions = function (actions) {
	Miku.asyncActions = Miku.asyncActions.concat(actions);
	Miku.doNextAction();
}

var act = Miku.pushAction = function (action) {
	Miku.pushActions([action]);
}

Miku.onLoad = function () {
	gapi = window.gapi;
	gapi.client.setApiKey(Miku.api_key);
	acts([
		function () { 
			l("Loading youtube");
			gapi.client.load("youtube", "v3", next);
		},
		Miku.loadPlaylist,
		Miku.dumpPl
	])
}

Miku.loadPlaylist = function () {
	var nextPageToken = "",
		playlistItems = [];

	function loadMore() {
		var req = gapi.client.youtube.playlistItems.list({
			playlistId: Miku.playlistId,
			maxItems: 50,
			part: "contentDetails",
			pageToken: nextPageToken});
		req.execute(function (res) {
			playlistItems = playlistItems.concat(res.items.map(function (item) {
				return {videoId: item.contentDetails.videoId};
			}));
			l("Loaded", req.items.length, "videos");
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

return Miku;
}(window));
