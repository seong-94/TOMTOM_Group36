# Development notes #

## Main documentation references ##

- https://developer.tomtom.com/map-display-api/documentation/product-information/introduction
- https://developer.tomtom.com/maps-sdk-web-js/functional-examples
- https://api.tomtom.com/maps-sdk-for-web/6.x/6.18.0/documentation/dist/modules/Maps.html

Super helpful tutorials, this is what helped me (Josh) finally understand this stuff:

- https://www.youtube.com/watch?v=Xwh5FyicePM
- https://www.youtube.com/watch?v=1IVCzFPi0q0
- https://www.youtube.com/watch?v=z6ejMgIdFc8

## How it works ##

To perform most calls to the TomTom API, you need:

- **API key** - given for free when you make a developer account
- **Admin key** - pass your API key to the API and it will return one (https://developer.tomtom.com/geofencing-api/documentation/configuration-service/register-admin-key)

These are defined in `/src/config/keys.js` and then imported into other files that need them, so you can just refer to them using `keys.apiKey` and `keys.adminKey`.

An API key can have multiple **projects**. The app's current behaviour is that it gets a list of all projects associated with the pre-defined API key, then the user can select which project they want to view details of. This sets the ID of that project to the variable `currentProject`, which the app can refer to when making other requests. There can be **fences** which are basically an array of coordinates. There are also **objects** which are mostly just a name/ID but can hold custom properties as well (e.g. driver name). You can send **position history** to objects (haven't gotten up to the notification part yet, will update this explanation later)

Functionality of everything is basically just a bunch of post/put/get/delete requests to the API. The app uses a package called `axios` to do these, all requests are separated by category (projects, fences, objects, and so on) in `/src/services/`, then imported for use in the main `App.js`.

For testing I used https://developer.tomtom.com/demos/geofences-creator/ to draw/add a single fence to this test project but will make it so fences can be added/edited via this map directly.

### Current (basic) functions ###

`App.js`

- `drawFence()` displays the fence with given ID on the map.

`projectService.js`

- `getProjects()` gets a list of all projects (name and ID) associated with the API key

`fenceService.js`

- `getProjectFences()` gets a list of all fences (name and ID) associated with the given project ID
- `getFence()` gets detailed info (e.g. coordinates, shape type) of the given fence ID
- `updateFence()` updates the fence with given ID. The info that is updated will be set in `App.js`, e.g. renaming the fence or editing custom properties
- `deleteFence()` deletes the fence with given ID. Note that the API has two delete endpoints, one to delete the fence completely and one to delete the fence only from a specific project (delete from specific project not yet implemented)

### List of optional parameters to include ###

James said we should demonstrate different options that the API supports, e.g.:

- Let the user choose the time interval (up to 24 hours ago) to view location history for an object
- `filters`, `maxResults` and `pageNumber` when getting list of objects inside a given fence - https://developer.tomtom.com/geofencing-api/documentation/fences-service/get-objects-count-in-the-fence
- Add/edit/remove custom `properties` to fences and objects - https://developer.tomtom.com/geofencing-api/documentation/fences-service/edit-fence and https://developer.tomtom.com/geofencing-api/documentation/objects-service/edit-object
- Deleting a fence has the optional parameter `dryRun = true/false` - https://developer.tomtom.com/geofencing-api/documentation/fences-service/delete-fence
- Maybe options to choose the colour/style of the fences drawn on the map

### External packages used ###

- `npm i @tomtom-international/web-sdk-maps --save`
- `npm i @tomtom-international/web-sdk-plugin-drawingtools`
- `npm i axios`