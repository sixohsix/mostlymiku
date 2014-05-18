// miku.js
window.Miku = (function (window, gapi) {

var q = window.document.querySelectorAll.bind(window.document);

var Miku = {};
Miku.api_key = "AIzaSyDsImZ2h077_LxeDhwh3Q6fjHtd5uZ7aaM";
Miku.playlistId = "ON6xeP4BD9pU8hGN5O_yDrrBckEVQrR";
Miku.playlistItems = [];

Miku.onLoad = function () {
	gapi.client.setApiKey(Miku.api_key);
	gapi.client.load("youtube", "v3", Miku.onYouTubeLoaded);
}

Miku.loadPlaylist = function () {
	var nextPageToken = "",
		playlistItems;
	while (nextPageToken !== undefined) {
		var res = gapi.client.youtube.playlistitems.list({
			playlistId: playlistId,
			maxItems: 50,
			part: "contentDetails",
			pageToken: nextPageToken});
		playlistItems = playlistItems.concat(res.items.map(function (item) {
			return {videoId: item.contentDetails.videoId};
		}));
		nextPageToken = res.nextPageToken;
	}
	return playlistItems;
}

Miku.onYouTubeLoaded = function () {
	Miku.playlistItems = Miku.loadPlaylist();
	console.log("loaded the pl", Miku.playlistItems);
}


return Miku;
}(window, window.gapi));
