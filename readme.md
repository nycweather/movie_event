# CS355 Final Project (Fall 2023)

### Project Requirements
Project will have at minimum four phases in code execution:

1. When a end user visits the home page, your server send them a form to fill out.
2. When a end user submits the form to your server, your server will then send the first API request out (using the captured data if necessary).
3. Upon receiving the response from the first API request, your server will parse the response and generate a request to the second API.
    - You have to be careful here: the user cannot be the driver of this secondary request, if they have to interact with the page at all, (for example clicking a button) this is considered two separate requests and not two synchronous requests. In the GitHub Jobs x Todoist mashup upon receiving a response from GitHub our application immediate contacts Todoist for the next phase.
    - The server must make all the requests to the API, if you are unsure please do not hesitate to contact me.
4. Upon receiving the response from the second API request, your server will parse the response and finally send results back to the end user.

### API's used in this project

-   [TMDB](https://www.themoviedb.org/documentation/api) : The Movie Database (TMDB) API. This is where you will find the definitive list of currently available methods for our movie, tv, actor and image API.
-   [Google Calendar API](https://developers.google.com/calendar) : The Google Calendar API lets you display, create and modify calendar events as well as work with many other calendar-related objects, such as calendars or access controls.

### Functionality

This webapp request movie data from the TMDB API and then uses the Google Calendar API to create a calendar event for the movie's release date. The user can then view their calendar to see when the movie is coming out.

## Links

-   [Node.js Official Documentation](https://nodejs.org/api/http.html)
-   [Calling Google APIs](https://developers.google.com/identity/protocols/oauth2/native-app#callinganapi)
-   [Authorization Troubleshoot](https://www.youtube.com/playlist?list=PL-a9eJ2NZlbTvRQiFHWPD9VEUVuyoBrJH)
-   [Generate Access Token](https://developers.google.com/identity/protocols/oauth2/web-server#httprest_1)
