    # For Deliverable Increment 1 #

(see NOTES.md for optional parameters to include in API requests)

## Projects ##


## Fences ##

- Edit properties directly (click 'edit' button next to a property)
- Delete properties
- Fix toggleDrawFence() function (drawing currently only works with certain shapes, see each fence.geometry)
- Add/edit/remove assignments to projects (fences can be assigned to multiple projects)
- List objects inside the fence
    - Make that bit look nice
    - Seems to not be returning objects inside the fence atm?
- Generate reports
    - Click on map -> show a tooltip with coordinates and a button to show fences within X metres of that point
    - https://developer.tomtom.com/geofencing-api/documentation/report-service/report-request

## Objects and Location History ##

- Fix bug in delete object property function
- Show location history for an object (customisable, up to the last 24 hours)
- Click on map to add a location point (or some other method to add a location point to an object)

## Misc ##

- Nicer feedback messages, maybe alerts that appear/disappear after a short time
- Make things look nice
    - https://chakra-ui.com/docs/components/overview
    - Add input box + alert (e.g. for add project/object functions)
- Input checking? (e.g. when adding a property, make sure there's at least a letter or a number and not just a space " ")