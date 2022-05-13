import React, { useState, useEffect, useRef } from 'react';

//UI styling components
import { Heading, Tabs, TabList, Tab, TabPanels, TabPanel, Button, ButtonGroup, Spinner, Menu, MenuButton, MenuList, MenuItem, useToast, Divider, Tooltip } from '@chakra-ui/react'
import { ChevronDownIcon } from '@chakra-ui/icons';

import './App.css';
import keys from './config/keys'; //API and admin keys
import projectService from './services/projectService'; //axios requests for projects
import fenceService from './services/fenceService'; //axios requests for geofences
import objectService from './services/objectService'; //axios requests for objects

import "@tomtom-international/web-sdk-maps/dist/maps.css"; //default TT map stylesheet
import "@tomtom-international/web-sdk-plugin-drawingtools/dist/DrawingTools.css" //TT drawing tools stylesheet
import * as tt from "@tomtom-international/web-sdk-maps"; //TT map SDK
import DrawingTools from '@tomtom-international/web-sdk-plugin-drawingtools'; //TT map drawing tools plugin

import FenceListItem from './components/FenceListItem';
import ObjectListItem from './components/ObjectListItem';
import ConfirmationAlert from './components/ConfirmationAlert';

function App() {
  const mapElement = useRef()
  const [hasRendered, setHasRendered] = useState(false)
  const [drawingTools, setDrawingTools] = useState()

  const toast = useToast()
  const [isShowingConfirmationAlert, setIsShowingConfirmationAlert] = useState(false)
  const [confirmationAlertTitle, setConfirmationAlertTitle] = useState('')
  const [confirmationAlertDescription, setConfirmationAlertDescription] = useState('')
  const [confirmationAlertAction, setConfirmationAlertAction] = useState()

  //sydney
  const [mapLongitude, setMapLongitude] = useState(151.209900)
  const [mapLatitude, setMapLatitude] = useState(-33.865143)
  const [mapZoom, setMapZoom] = useState(11)
  const [map, setMap] = useState({})

  //project state variables
  const [projectList, setProjectList] = useState()
  const [currentProject, setCurrentProject] = useState()
  const [isAddingProject, setIsAddingProject] = useState(false)
  const [isRenamingProject, setIsRenamingProject] = useState(false)
  const [isDeletingProject, setIsDeletingProject] = useState(false)

  //fence state variables
  const [fenceList, setFenceList] = useState()
  const [isGettingFences, setIsGettingFences] = useState(false)
  const [hasGottenFences, setHasGottenFences] = useState(false)
  const [newFence, setNewFence] = useState()
  const [isAddingFence, setIsAddingFence] = useState(false)

  //object state variables
  const [objectList, setObjectList] = useState()
  const [isAddingObject, setIsAddingObject] = useState(false)
  const [isClearingLocationHistory, setIsClearingLocationHistory] = useState(false)

  //do this only once on first render
  useEffect(() => {
    //initialise map and bind to state variable
    var ttMap = tt.map({
      key: keys.apiKey,
      container: mapElement.current,
      center: [mapLongitude, mapLatitude],
      zoom: mapZoom
    })
    setMap(ttMap)
    ttMap.addControl(new tt.FullscreenControl())
    ttMap.addControl(new tt.NavigationControl())
    const ttDrawingTools = new DrawingTools({
      ttMapsSdk: tt
    })
    setDrawingTools(ttDrawingTools)
    setHasRendered(true)
    ttMap.addControl(ttDrawingTools, 'top-left');

    //fetch list of projects and objects associated with the apiKey defined in ./config/keys.js
    projectService.getProjects()
    .then(data => setProjectList(data.projects))
    .catch(error => {
      showToast(`${error}`, `${error.response.data.message}`, 'error')
    })

    objectService.getObjects()
    .then(data => setObjectList(data.objects))
    .catch(error => {
      showToast(`${error}`, `${error.response.data.message}`, 'error')
    })

    return () => ttMap.remove()
  }, [])

  //once the map has rendered, listen for events performed on the map
  if (map && hasRendered) {
    //handles map click functions
    //***bug: somehow this executes twice? e.g. draws two identical popups on top of each other */
    map.on('click', function(event) {
      var objectDropdown = ''
        if (objectList) {
          objectDropdown += '<select>'
          var currentObjects = [...objectList]
          for (let i = 0; i < currentObjects.length; i++) {
            objectDropdown += "<option value='" + currentObjects[i].id + "'>" + currentObjects[i].name + "</option>"
          }
          objectDropdown += "</select>"
        }
        
        var markerHeight = 50, markerRadius = 10, linearOffset = 25;
        var popupOffsets = {
          'top': [0, 0],
          'top-left': [0,0],
          'top-right': [0,0],
          'bottom': [0, -markerHeight],
          'bottom-left': [linearOffset, (markerHeight - markerRadius + linearOffset) * -1],
          'bottom-right': [-linearOffset, (markerHeight - markerRadius + linearOffset) * -1],
          'left': [markerRadius, (markerHeight - markerRadius) * -1],
          'right': [-markerRadius, (markerHeight - markerRadius) * -1]
          };
        var popup = new tt.Popup({offset: popupOffsets, className: 'my-class'})
        .setLngLat(event.lngLat)
        .setHTML(
          "[" + event.lngLat.lng + ", " + event.lngLat.lat + "]<br /><br />\
          Add location history to object:<br />"
          + 
          objectDropdown +
          `<button onclick="console.log('adding the point', '${event.lngLat}')">Add</button>`
        )
        .addTo(map);
    })

    drawingTools.on('tomtom.drawingtools.created', function(event) {
      setNewFence(event.data.features[0])
    })

    drawingTools.on('tomtom.drawingtools.dragged', function(event) {
      setNewFence(event.data.features[0])
    })

    drawingTools.on('tomtom.drawingtools.changed', function(event) {
      setNewFence(event.data.features[0])
    })

    drawingTools.on('tomtom.drawingtools.deleted', function(event) {
      setNewFence(null)
    })
  }
    
  const getProjectFences = (projectId) => {
    setIsGettingFences(true)
    setHasGottenFences(false)
    setFenceList(null) //remove any previously loaded fenceList so that only the loading indicator shows
    //first API call gets the name and ID of each fence
    fenceService.getProjectFences(projectId)
    .then(data => {
      let array = []
      let numFences = data.fences.length
      for (let i = 0; i < data.fences.length; i++) {
        //second API call gets detailed information for each fence
        fenceService.getFence(data.fences[i].id)
        .then(data => {
          array.push(data)
          if (array.length === numFences) {
            //because each GET request is asynchronous, only update the fence list when all requests have resolved
            setFenceList(array)
          }
        })
      }
      setIsGettingFences(false)
      setHasGottenFences(true)
    })
    .catch(error => {
      alert(`${error} (${error.response.data.message})`)
    })
  }

  const handleCurrentProject = (project) => {
    setCurrentProject(project)
    getProjectFences(project.id)
  }

  const addProject = () => {
    let projectName = window.prompt('Enter a name for the new project')
    if (projectName) {
      setIsAddingProject(true)
      projectService.addProject({
        name: projectName
      })
      .then(data => {
        let newProjectList = [...projectList]
        newProjectList.push(data)
        setProjectList(newProjectList)
        setIsAddingProject(false)
        setCurrentProject(data)

        showToast('Project added', `New project '${projectName}' successfully added`, 'success')
      })
      .catch(error => {
        showToast(`${error}`, `${error.response.data.message}`, 'error')
      })
    }
  }

  const renameProject = () => {
    let newName = window.prompt('Enter a new name for the project')
    if (newName && newName === currentProject.name) {
      showToast('Unable to rename project', 'Project already has the entered name', 'error')
    }
    else if (newName && newName !== currentProject.name) {
      setIsRenamingProject(true)
      let updatedProject = {
          ...currentProject,
          name: newName
      }
      projectService.updateProject(currentProject.id, updatedProject)
      .then((data) => {
          //update projectList state variable to reflect the change
          let projects = [...projectList]
          let index = projectList.indexOf(projectList.find(oldProject => oldProject.id === currentProject.id))
          projects[index] = updatedProject
          setProjectList(projects)
          setCurrentProject(data)
          setIsRenamingProject(false)

          showToast('Project renamed', `Project successfully renamed to '${newName}'`, 'success')
      })
      .catch(error => {
          showToast(`${error}`, `${error.response.data.message}`, 'error')
      })
  }
  }

  const handleDeleteProject = () => {
    showConfirmationAlert('Delete project', `Are you sure you want to delete the project '${currentProject.name}' and all associated fences? This cannot be undone.`, deleteProject)
  }

  const deleteProject = () => {
    setIsDeletingProject(true)
    projectService.deleteProject(currentProject.id)
    .then(() => {
      //also update state variable
      let projects = [...projectList]
      let index = projectList.indexOf(projectList.find(oldProject => oldProject.id === currentProject.id))
      projects.splice(index, 1)
      setProjectList(projects)
      setIsDeletingProject(false)
      setIsShowingConfirmationAlert(false)
      var name = currentProject.name
      setCurrentProject(null)

      showToast('Project deleted', `Project '${name}' successfully deleted`, 'success')
    })
    .catch(error => {
        showToast(`${error}`, `${error.response.data.message}`, 'error')
    })
  }

  const addFence = () => {
    if (newFence) {
      console.log('adding fence', newFence);
      let fenceName = window.prompt('Please enter a name for the fence')
      if (fenceName) {
        setIsAddingFence(true)
        let newFenceObject = {...newFence, name: fenceName}
        console.log('complete object:', newFenceObject);
        fenceService.addFence(currentProject.id, newFenceObject)
        .then(data => {
          let newFenceList = [...fenceList]
          newFenceList.push(data)
          setFenceList(newFenceList)
          setIsAddingFence(false)
          setNewFence(null)
  
          showToast('Fence added', `New fence '${fenceName}' successfully added`, 'success')
        })
        .catch(error => {
          showToast(`${error}`, `${error.response.data.message}`, 'error')
        })
      }
    } else {  
      showToast('Draw fence', 'Please use the drawing tools to draw a fence shape, then try again.', 'warning')
    }
  }

  const addObject = () => {
    let objectName = window.prompt('Enter a name for the object')
    if (objectName) {
      setIsAddingObject(true)
      let newObject = {
        name: objectName
      }
      objectService.addObject(newObject)
      .then(data => {
        let updatedObjects = [...objectList]
        updatedObjects.push(data)
        setObjectList(updatedObjects)
        setIsAddingObject(false)

        showToast('Object added', `New object '${objectName}' successfully added`, 'success')
      })
      .catch(error => {
        showToast(`${error}`, `${error.response.data.message}`, 'error')
      })
    }
  }

  const showLocationHistory = (objectId, timestamp) => {
    objectService.getLocationHistory(objectId, timestamp)
    .then(data => {
        console.log(data)
        if (data.positions.features.length > 0) {
          //some positions exist
          let positions = data.positions.features
          for (let i = 0; i < positions.length; i++) {
              var marker = new tt.Marker().setLngLat(positions[i].geometry.coordinates).addTo(map)
          }
        } else {
          //no positions from the given timeframe
          showToast('No locations found', 'No location points have been found for the specified object within the specified timeframe', 'info')
        }
    })
  }
  
  const handleClearLocationHistory = () => {
    showConfirmationAlert('Clear location history', `Are you sure you want to clear location history for ALL objects? This cannot be undone.`, clearLocationHistory)
  }

  const clearLocationHistory = () => {
    setIsClearingLocationHistory(true)
    objectService.deleteLocationHistory()
    .then(() => {
      showToast('History cleared', 'Location history for all objects successfully cleared', 'success')
    })
    .catch(error => {
      showToast(`${error}`, `${error.response.data.message}`, 'error')
    })
  }

  const showToast = (title, description, status) => {
    toast({
      title: title,
      description: description,
      status: status, //['success', 'error', 'warning', 'info']
      duration: 5000,
      isClosable: true,
    })
  }

  const showConfirmationAlert = (title, description, action) => {
    setConfirmationAlertTitle(title)
    setConfirmationAlertDescription(description)
    setIsShowingConfirmationAlert(true)
    setConfirmationAlertAction(() => action)
  }

  return (
    <>
    <div className="app">
      <div className="header">TomTom Geofencing Demo Tool</div>

      <div className="container">

        <div className="controls">
          <Heading as="h1" size="lg">Controls</Heading>

          <Tabs isFitted>
            <TabList>
              <Tab>Projects and Fences</Tab>
              <Tab>Objects</Tab>
            </TabList>

            <TabPanels>
              <TabPanel>
                <Heading as="h2" size="lg" mb="5">My Projects</Heading> 
                <Button onClick={() => console.log(projectList)}>Log projectList (testing)</Button> <br />

                <Menu>
                  <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
                    Select a project
                  </MenuButton>
                  <MenuList>
                    {projectList &&
                    <>
                    {projectList.map(project =>
                      <MenuItem key={project.id} onClick={() => handleCurrentProject(project)}>{project.name}</MenuItem>
                    )}
                    </>
                    }
                  </MenuList>
                </Menu>

                {!projectList && <>No projects have been added yet</>}

                <Button isLoading={isAddingProject} loadingText="Adding" onClick={() => addProject()}>Add project</Button>

                {currentProject &&
                  <>
                  <Divider p={5} />
                  <Heading as="h1" size="lg">{currentProject.name}</Heading>
                  <ButtonGroup size="sm" spacing="3" variant="outline" mt="5" mb="5">
                    <Button isLoading={isRenamingProject} loadingText="Renaming" onClick={() => renameProject()} >Rename</Button>
                    <Button isLoading={isDeletingProject} loadingText="Deleting" colorScheme="red" onClick={() => handleDeleteProject()}>Delete</Button>
                  </ButtonGroup>
                  

                  <Heading as="h2" size="md" mb="5">Project Fences</Heading>
                    <Button onClick={() => console.log(fenceList)}>Log fenceList (testing)</Button>
                    {/* buttons for handling drawing/adding a new fence here */}
                    <Tooltip hasArrow label="Adds the most recently drawn, dragged, or edited shape as a fence">
                      <Button isLoading={isAddingFence} loadingText={"Adding"} onClick={() => addFence()}>Add Fence</Button>
                    </Tooltip>
                    {/* can either add to a single project or multiple projects (two different endpoints) */}
                    {/* https://developer.tomtom.com/geofencing-api/documentation/fences-service/add-new-fence-to-a-project */}
                    {/* https://developer.tomtom.com/geofencing-api/documentation/fences-service/create-new-fence-assign-to-multiple-projects */}

                    <div>
                      {/* show a loading indicator only while the app is getting fences belonging to the project */}
                      {isGettingFences ? 
                      <Spinner />
                      :
                      <></>}

                      {/* show this block after getting all fences has completed */}
                      {hasGottenFences && 
                      <>

                      {fenceList && fenceList.length > 0 && hasGottenFences &&
                      <>
                      {fenceList.map(fence => <FenceListItem key={fence.id} fence={fence} fenceList={fenceList} currentProject={currentProject} setFenceList={setFenceList} map={map} showConfirmationAlert={showConfirmationAlert} setIsShowingConfirmationAlert={setIsShowingConfirmationAlert} /> )}
                      </>}
                      
                      {!fenceList && hasGottenFences &&
                      <>No fences have been added to this project yet</>}
                      
                      </>}
                    </div>
                  </>
                }
              </TabPanel>

              <TabPanel>
                <div>
                  <Heading as="h2" size="md" mb="5">My Objects</Heading>
                  <ButtonGroup variant="outline" spsacing="3">
                    <Button onClick={() => console.log(objectList)}>Log objectList (testing)</Button>
                    <Button isLoading={isAddingObject} loadingText="Adding" onClick={() => addObject()}>Add object</Button>
                    <Button isLoading={isClearingLocationHistory} loadingText="Clearing" colorScheme="red" onClick={() => handleClearLocationHistory()} >Clear all location history</Button>
                  </ButtonGroup>

                  {objectList && objectList.length > 0 ?
                  <>
                  {objectList.map(object => <ObjectListItem key={object.id} object={object} objectList={objectList} setObjectList={setObjectList} showLocationHistory={showLocationHistory} showConfirmationAlert={showConfirmationAlert} setIsShowingConfirmationAlert={setIsShowingConfirmationAlert} /> )}
                  </>
                  :
                  <>You have not created any objects yet</>
                  }
                </div>
              </TabPanel>
            </TabPanels>
          </Tabs>
        
        </div>

        <div className="map" ref={mapElement} id={'map'} />

      </div>
    </div>

    <ConfirmationAlert title={confirmationAlertTitle} description={confirmationAlertDescription} isOpen={isShowingConfirmationAlert} onClose={() => setIsShowingConfirmationAlert(false)} onConfirm={confirmationAlertAction} />
    </>
  );
}

export default App;