module.exports = function(app, connection, htmlspecialchars, crypto, moment, nodemailer) {

	app.get('/', function(request, response) {
		response.redirect('/home');
	});
}