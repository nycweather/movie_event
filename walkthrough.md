Steps 
Introduction
- Name, Id: 
- Demo
	- My program uses the movie database and google calander api
	- Launch program
	- Enter genre
	- enter date

- project breakdown
	- Show apis
		- movie api
			- discover endpoint > it returns a set of active movies
			- i give them api key and genre id which is in a list
			
		- google calender api
			- posting a new event https://www.googleapis.com/calendar/v3/calendars/primary/events
			- returns a confirm message
	- Postman
		- Show all postman requests 
		- one of them is missing
		- show the api documents
		
	- Diagram breakdown
		- user sends out a request to our server
		- server responses with a form
		- user fills out form and sends it back to the server
		- the server sends the request to the the movie database api asking for films in the genre
			- the movie database only requires an api key for us to use their serve and its in the url when we request
			- the api had a veriety of information that you can finter by but I choose to keep it simple
			- only used the genre filter
		- if everything is okay we will get a 200 response
		- the movie api will give us 20 movies and the server picks one random one 
		- after that once the server picks the movie, then it will start the next service
		
		google api
		- GCP client
			- used gpc client to setup user and redirect
			- got the client id, and secret from there
		- the server sends a redirect for us to log in, it requires alot of information which can be found in the docs
			- client id
			- response type
			- redirect url
			- scope 
		- now there will be another get request sent from the users behalf to fill in 
			- scope 
			- access type > what types of information are we allowed to
			- redirect url > /oauth2callback
			- response type
			- state > multiple purposes
		- user get a form to log into their google account
		- user logs in
		- asks if you would like to give the app permission
		- the user says yes 
		- the google api will send us a redirect link linking back to our redirect link
			- will alot of the previous information
		- then the server has all the information to request for an access id 
			- it sends a post request with all the information again its in the docs, all the parameters and whatnot
		
		
		- if everything is correct with the login and forms the srver will now send a post request to google api for 
		access token 
			- the token serves as a key to let google api know that we are who we are
		
		- then finally server is able to send the request which will create out calender event
			- the server sends movie data it picked and the timeslot we selected into a json payload 
			- the google calender api finally sends in a 201 message and it was able to successfully complete the task
			
		- then we show the user the success text
		

- code breakdown 

	- html first
		- basic form and infor gotten form tmdb api
		
	- imports
		- we have some default imports > handle http stuff
		- url and querystring > parting urls and the making / reading the queries
	- config / auth information
	
	- we create the server here
		- we put listeners on the server > request and listening
	- listen hadler > lets us know which port the server is on
	- request handler > handles pretty much all of our actions 
		- / serves as out home page
			- we pipe the html page to the user here
		- once the user submits the form it will come to the if condition
			- first we parse the inputs
			- start the process to call the movies api
		- there also /oauth2callback for when we get the redirect from google api
			- i will come back tot this later
		- finally we have an else block to catch any error and present a 404
			- all form errors should be caught here
			
	- fetchMoviesAndInitiateProcess () // first api call to get movies from TMDB
		- this will get all the movie data and pick a random one
		- we setup all the options using the docs then send out the request
			- after the request is done we parse the data
			- we check if there is atleast one movie otherwise we end right here since the app does not work without a movie
		- we also check for error here
	
	- redirectToGoogleForPermission () // we have the information to move on to the google task
		- this is the end point we are redirected to to and we use our global variables to make this url
		
	- once the user compeltes the forms wecome back to the requesthandler function
		- we endup in the redirect address provided when we made the app in gcp 
		
	- exchangeAuthCodeForToken() // here we pass the code we need to generate the access token
		- we also handle error incase something does wrong on the users end or servers end
		- inside the exchangeAuthCodeForToken function we first check if the token is expired or if it is non existent
		- if its not we move on
		- oncase the token is not valid 
			- we generate a query outlined by the docs and request for a new token
			- once we receive the token we write it to out file for current/later use
			- we also try to catch any errors here incase there is something wrong with the response
			- if everything is good we write the token data in the post request to generate the token
		- if the token is already valid then we just used the ones we stored previously 
		
	- now that we have the token and hopefully no errors we can move onto creating the event 
	- createCalendarEvent () // we pass all collected data and token
		- we add the information we want in our event 
		- add all the options we need to send the request including our token
		- send the request 
		- we check if it was sucessful or not, we are checking if we get an error if not we assume it worked correctly and so we give the message
		
	- isTokenValid() 
		- checks if token exists and isnt expired
		- token stays valid for 1 hour according to google
	