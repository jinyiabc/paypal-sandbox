const passport = require('passport');
const GitHubStrategy = require('passport-github').Strategy;
const User = require('../models/users');
const githubAuth = {
		clientID: process.env.GITHUB_KEY,
		clientSecret: process.env.GITHUB_SECRET,
		callbackURL: process.env.APP_URL+'auth/github/callback'
	};

	// APP_URL=http://localhost:3000/
console.log(process.env.GITHUB_KEY);
console.log(process.env.GITHUB_SECRET);
console.log(process.env.APP_URL);

passport.use(new GitHubStrategy(githubAuth,
	function (token, refreshToken, profile, done) {
		// console.log(profile);
		process.nextTick(function () {
			User.findOne({ 'github.id': profile.id }, function (err, user) {
				if (err) {
					return done(err);
				}

				if (user) {
					return done(null, user);
				} else {
					var newUser = new User();

					newUser.github.id = profile.id;
					newUser.github.username = profile.username;
					newUser.github.displayName = profile.displayName;
					newUser.github.publicRepos = profile._json.public_repos;

					newUser.save(function (err) {
						if (err) {
							throw err;
						}

						return done(null, newUser);
					});
				}
			});
		});
		// return done(null, profile);

	}));

// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  In a
// production-quality application, this would typically be as simple as
// supplying the user ID when serializing, and querying the user record by ID
// from the database when deserializing.  However, due to the fact that this
// example does not have a database, the complete Facebook profile is serialized
// and deserialized.

passport.serializeUser(function (user, done) {
	console.log(user);
	done(null, user.github);
});

passport.deserializeUser(function (id, done) {
	// User.findById(id, function (err, user) {
		done(null, id);
	// });
});

// The fetched object is attached to the request object as req.user ater desrialization.

module.exports  = passport;
