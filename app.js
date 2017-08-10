var restify = require('restify');
var builder = require('botbuilder');
var os = require('os').EOL;

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
	console.log('%s listening to %s', server.name, server.url);
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
	appId: process.env.MICROSOFT_APP_ID,
	appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

// Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
var bot = new builder.UniversalBot(connector, function (session) {

	session.send(nameToUrl(session.message.text));

	getJson("https://subz.now.sh/imdb/search?query=" + nameToUrl(session.message.text), function (body) {
		session.send("ready");
		if (undefined !== body.results.title_popular) {
			body.results.title_popular.forEach(function (value) {
				getJson("https://subz.now.sh/opensubtitles/search?imdbid=" + value.id, function (links) {
					getCard(value.title, links, session);
				});
			});
		}
		else
			session.send('No result :(');
	});

});

function nameToUrl(name) {
	var result = '';
	var nameArray = name.split("");
	nameArray.forEach(function (value) {
		if (value !== ' ')
			result += value;
		else
			result += '%20';
	});
	return result;
}

function getJson(address, callback) {

	var getJSON = require('get-json');

	getJSON(address, function (error, response) {
		callback(response);
	});

}

function getCard(title, links, session) {
	var item = links.results.en;
	var result = title + '\n\r';
	result += item.langcode + ': ' + item.url + '\n\r';
	session.send(result);
}