// default imports
const http = require("http");
const url = require("url");
const fs = require("fs");
const https = require("https");
const path = require("path");
const querystring = require("querystring"); // Using due to having issues with path in Windows

// Movie Database (TMDB) configs
const tmdbAuth = require("./auth/auth.json");
const tmdbApiKey = tmdbAuth.tmdb_api_key;
const tmdbEndpoint = "api.themoviedb.org";
const tmdbPath = "/3/discover/movie";

// google configs
const googleAuth = require("./auth/google_auth.json");
const googleClientId = googleAuth.web.client_id;
const googleClientSecret = googleAuth.web.client_secret;
const googleRedirectUri = "http://localhost:3000/oauth2callback";

// port
const port = 3000;

// Create server
const server = http.createServer();

// Attach the handlers to the server
server.on("request", requestHandler);
server.on("listening", listenHandler);

// global variables
let movie, date;

function listenHandler() {
    console.log(`Server listening on http://localhost:${port}`);
}

function requestHandler(req, res) {
    if (req.method === "GET") {
        const { pathname, query } = url.parse(req.url, true);

        if (pathname === "/") {
            // form for user to fill out
            const form = fs.createReadStream(
                path.join(__dirname, "/index.html")
            );
            res.writeHead(200, { "Content-Type": "text/html" });
            form.pipe(res);
        } else if (pathname === "/create_movie_event") {
            const genre = query.genre;
            const time = query.time; // Assuming this is a valid ISO string
            date = new Date(time).toISOString();

            // get movies
            fetchMoviesAndInitiateProcess(genre, date, res);
        } else if (pathname === "/oauth2callback") {
            const authCode = query.code;
            // exchange auth code for token
            exchangeAuthCodeForToken(authCode, (error, token) => {
                // if error happened while getting token check gcp console?
                // https://developers.google.com/workspace/guides/create-credentials
                if (error) {
                    res.writeHead(500);
                    res.end("Error exchanging auth code for token.");
                } else {
                    // if token is obtained create calendar event
                    createCalendarEvent(token, movie, date, (err, result) => {
                        if (err) {
                            res.writeHead(500);
                            res.end("Error creating calendar event.");
                        } else {
                            res.writeHead(200, { "Content-Type": "text/html" });
                            res.end("Calendar event created successfully!");
                        }
                    });
                }
            });
        } else {
            res.writeHead(404);
            res.end("404 not found!");
        }
    }
}

// first api call to get movies from TMDB
function fetchMoviesAndInitiateProcess(genre, time, res) {
    const options = {
        hostname: tmdbEndpoint,
        port: 443,
        path: `${tmdbPath}?api_key=${tmdbApiKey}&with_genres=${genre}&sort_by=popularity.desc`,
        method: "GET",
    };

    const req = https.request(options, (tmdbRes) => {
        let data = "";
        tmdbRes.on("data", (chunk) => {
            data += chunk;
        });

        tmdbRes.on("end", () => {
            // Making it a synchronous process by waiting for the TMDB response
            // only if there are movies found can we move onto redirecting to google
            const discoveredMovies = JSON.parse(data).results; // parsing the movies
            if (discoveredMovies.length > 0) {
                movie =
                    discoveredMovies[
                        Math.floor(Math.random() * discoveredMovies.length)
                    ];
                console.log(
                    "Movie selected:\n\t",
                    movie.title + " " + movie.release_date.substring(0, 4)
                );
                // Redirect to Google after successful TMDB response, then google will redirect back to /oauth2callback
                redirectToGoogleForPermission(res);
            } else {
                res.writeHead(404);
                res.end("No movies found.");
            }
        });
    });

    // error handling just in case something goes wrong
    req.on("error", (error) => {
        console.error(error);
        res.writeHead(500);
        res.end("Error while fetching movies.");
    });
    req.end();
}

// Function to redirect the user to Google for permission this will redirect to /oauth2callback
function redirectToGoogleForPermission(res) {
    const googleAuthEndpoint = `https://accounts.google.com/o/oauth2/auth?response_type=code&client_id=${googleClientId}&redirect_uri=${googleRedirectUri}&scope=https://www.googleapis.com/auth/calendar`;
    res.writeHead(302, { Location: googleAuthEndpoint });
    res.end();
}

// Function to exchange auth code for an access token
function exchangeAuthCodeForToken(authCode, callback) {
    // if access token is not valid get a new one
    if (!isTokenValid()) {
        const postData = querystring.stringify({
            code: authCode,
            client_id: googleClientId,
            client_secret: googleClientSecret,
            redirect_uri: googleRedirectUri,
            grant_type: "authorization_code",
        });

        const reqOptions = {
            hostname: "oauth2.googleapis.com",
            path: "/token",
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        };

        const tokenReq = https.request(reqOptions, (tokenRes) => {
            let data = "";
            tokenRes.on("data", (chunk) => {
                data += chunk;
            });

            tokenRes.on("end", () => {
                const response = JSON.parse(data);
                if (response.access_token) {
                    console.log(
                        "New access token obtained:\n\t",
                        response.access_token
                    );
                    const expiryTime =
                        new Date().getTime() + response.expires_in * 1000;
                    const token = {
                        accessToken: response.access_token,
                        expiryTime: expiryTime,
                    };
                    fs.writeFileSync(
                        "./auth/token.json",
                        JSON.stringify(token)
                    ); // save token to file
                    callback(null, response.access_token);
                } else {
                    callback(new Error("Failed to obtain access token"));
                }
            });
        });

        tokenReq.on("error", (e) => {
            callback(e);
        });
        // write the post data and end the request
        tokenReq.write(postData);
        tokenReq.end();
    } else {
        // if token is valid use the stored token
        const tokenData = JSON.parse(fs.readFileSync("./auth/token.json"));
        console.log("Using cached access token:\n\t", tokenData.accessToken);
        callback(null, tokenData.accessToken);
    }
}

// function to create a calendar event
// https://developers.google.com/calendar/api/v3/reference/events
function createCalendarEvent(token, movie, userDate, callback) {
    const event = {
        summary: movie.title + " " + movie.release_date.substring(0, 4),
        description: movie.overview,
        start: {
            dateTime: userDate,
            timeZone: "America/New_York",
        },
        end: {
            dateTime: new Date(
                new Date(userDate).getTime() + 2 * 60 * 60000
            ).toISOString(),
            timeZone: "America/New_York",
        },
    };

    const calendarRequestOptions = {
        method: "POST",
        hostname: "www.googleapis.com",
        path: "/calendar/v3/calendars/primary/events",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    };

    const calendarReq = https.request(calendarRequestOptions, (calendarRes) => {
        let data = "";
        calendarRes.on("data", (chunk) => {
            data += chunk;
        });

        calendarRes.on("end", () => {
            callback(null, data); // Call callback function with the result
        });
    });

    calendarReq.on("error", (error) => {
        callback(error);
    });

    calendarReq.write(JSON.stringify(event));
    calendarReq.end();
}

// function to check if the stored token is still valid
function isTokenValid() {
    try {
        const tokenData = JSON.parse(fs.readFileSync("./auth/token.json"));
        return new Date().getTime() < tokenData.expiryTime;
    } catch (error) {
        return false;
    }
}

// Start the server
server.listen(port);
