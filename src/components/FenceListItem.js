import React, { useState, useEffect } from 'react';
import fenceService from '../services/fenceService';

import { Heading, UnorderedList, ListItem, Button, ButtonGroup, useToast, Box, NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper, FormControl, FormLabel, Input } from '@chakra-ui/react'

const FenceListItem = ({fence, fenceList, currentProject, setFenceList, map, showConfirmationAlert, setIsShowingConfirmationAlert }) => {
    const [isShowingProperties, setIsShowingProperties] = useState(false)
    const [properties, setProperties] = useState()
    const [isDrawnOnMap, setIsDrawnOnMap] = useState(false)
    const [isShowingAddProperties, setIsShowingAddProperties] = useState(false)
    const [newKey, setNewKey] = useState('')
    const [newValue, setNewValue] = useState('')
    const [isRenamingFence, setIsRenamingFence] = useState(false)
    const [isDeletingFence, setIsDeletingFence] = useState(false)
    const [isDeletingFenceFromProject, setIsDeletingFenceFromProject] = useState(false)
    const [reportKey, setReportKey] = useState('')
    const [reportValue, setReportValue] = useState('')
    const [reportNumResults, setReportNumResults] = useState(100)

    const toast = useToast()

    const showToast = (title, description, status) => {
        toast({
          title: title,
          description: description,
          status: status, //['success', 'error', 'warning', 'info']
          duration: 5000,
          isClosable: true,
        })
      }

    const toggleProperties = () => {
        if (isShowingProperties) {
            setIsShowingProperties(false)
        } else {
            setIsShowingProperties(true)
        }
    }

    //iterates over the fence's properties and puts them into an array of objects that can be rendered on the screen
    const formatProperties = (fence) => {
        let array = []
        if (fence.properties) {
            for (const key in fence.properties) {
                switch (typeof(fence.properties[key])) {
                    case 'string':
                        array.push({key: key, value: fence.properties[key]})
                        break
                    case 'number':
                    case 'boolean':
                        array.push({key: key, value: fence.properties[key].toString()})
                        break
                    case 'object':
                        array.push({key: key, value: fence.properties[key] ? fence.properties[key].toString() : 'none'})
                        break
                }
            }
        }
        if (array.length > 0) {
            setProperties(array)
        }
    }

    const toggleAddProperties = () => {
        if (isShowingAddProperties) {
            setIsShowingAddProperties(false)
        } else {
            setIsShowingAddProperties(true)
        }
    }

    useEffect(() => {
        formatProperties(fence)
    }, [fence])

    const toggleDrawFence = () => {
        if (isDrawnOnMap) {
            //remove fence from map
            map.removeLayer(fence.id)
            map.removeSource(fence.id)
            setIsDrawnOnMap(false)
        } else {
            //currently only works with some shapes - may need to first check fence.geometry and have different addLayer formats depending on the shape
            map.addLayer({
                'id': fence.id,
                'type': 'fill',
                'source': {
                    'type': 'geojson',
                    'data': fence
                },
                'paint': {
                    'fill-color': '#0000ff',
                    'fill-opacity': 0.25
                }
            })
            setIsDrawnOnMap(true)
        }
    }
    
    const renameFence = () => {
        let fenceName = window.prompt('Enter a new name for the fence')
        if (fenceName && fenceName === fence.name) {
            showToast('Unable to rename fence', 'Fence already has the name provided', 'error')
        } 
        else if (fenceName && fenceName !== fence.name) {
            //after user inputs a new name, create a new fence object identical to the current fence, but with the updated name
            setIsRenamingFence(true)
            let updatedFence = {
                ...fence,
                'name': fenceName
            }
            //send a PUT request with the new fence object
            fenceService.updateFence(fence.id, updatedFence)
            .then(() => {
                //update fenceList state variable to reflect the change
                let fences = [...fenceList]
                let index = fenceList.indexOf(fenceList.find(oldFence => oldFence.id === fence.id))
                fences[index] = updatedFence
                setFenceList(fences)
                setIsRenamingFence(false)

                showToast('Fence renamed', `Fence successfully renamed to '${fenceName}'`, 'success')
            })
            .catch(error => {
                showToast(`${error}`, `${error.response.data.message}`, 'error')
            })
        }
    }

    const handleDeleteFence = () => {
        showConfirmationAlert('Delete fence', `Are you sure you want to delete the fence '${fence.name}'? This cannot be undone.`, deleteFence)
    }

    const deleteFence = () => {
        setIsDeletingFence(true)
        fenceService.deleteFence(fence.id)
        .then(() => {
            //also update state variable
            updateFenceListAfterDeletion()
            setIsDeletingFence(false)
            showToast('Fence deleted', 'Fence successfully deleted', 'success')
        })
        .catch(error => {
            showToast(`${error}`, `${error.response.data.message}`, 'error')
        })
    }

    const handleDeleteFenceFromProject = () => {
        showConfirmationAlert('Delete fence', `Are you sure you want to delete the fence '${fence.name}' from the current project? This cannot be undone.`, deleteFenceFromProject)
    }

    const deleteFenceFromProject = () => {
        setIsDeletingFenceFromProject(true)
        fenceService.deleteFenceFromProject(currentProject.id, fence.id)
        .then(() => {
            //also update state variable
            updateFenceListAfterDeletion()
            setIsDeletingFenceFromProject(false)
            showToast('Fence deleted', `Fence successfully deleted from project ${currentProject.name}`, 'success')
        })
        .catch(error => {
            showToast(`${error}`, `${error.response.data.message}`, 'error')
        })
    }

    const updateFenceListAfterDeletion = () => {
        let fences = [...fenceList]
        let index = fenceList.indexOf(fenceList.find(oldFence => oldFence.id === fence.id))
        fences.splice(index, 1)
        setFenceList(fences)

        //remove the fence display from map if applicable
        if (map.getLayer(fence.id)) {
            map.removeLayer(fence.id)
            map.removeSource(fence.id)
        }
    }

    const handleAddProperty = (event) => {
        event.preventDefault()
        //make sure something has been entered for both newKey and newValue
        if (!newKey.length > 0) {
            alert('Please enter a key.')
        } else if (!newValue.length > 0) {
            alert('Please enter a value.')
        }

        //check if the key already exists
        else if (properties.find(property => property.key === newKey)) {
            if (window.confirm('The key you have entered already exists for this fence. Would you like to update its value?')) {
                //perform update to server
                addProperty('updated')
            }
        } else {
            //property key is unique - createa a new key/value pair
            addProperty('added')
        }
    }

    //sends a PUT request to the API consisting of an object of all properties to be associated with the fence (both updated and unchanged properties)
    const addProperty = (successAction) => {
        //create object
        let updatedProperties = {
            properties: {
                ...fence.properties,
                [newKey]: newValue
            }
        }
        //perform PUT request
        fenceService.updateFence(fence.id, updatedProperties)
        .then(() => {
            //update client-side information
            let updatedFence = {...fence}
            updatedFence.properties[newKey] = newValue
            let fences = [...fenceList]
            let index = fenceList.indexOf(fenceList.find(oldFence => oldFence.id === fence.id))
            fences[index] = updatedFence
            setFenceList(fences)

            showToast(`Property successfully ${successAction}`, `New ${newKey}: ${newValue}`, 'success') 
        })
        .catch(error => {
            showToast(`${error}`, `${error.response.data.message}`, 'error')
          })
    }

    const handleGetObjectsInFence = (event) => {
        event.preventDefault()
        //if (reportKey && !reportValue)
        //if (!reportKey && reportValue)
        //else
            //if (reportKey && reportValue)
            //if (!reportKey && !reportValue)
        console.log('get objects in fence with optional parameters', reportKey, reportValue, reportNumResults);
        fenceService.getObjectsInFence(fence.id, reportKey, reportValue, reportNumResults)
        .then(data => console.log('list of objects inside this fence', data))
    }

    return (
        <Box borderWidth="1px" borderRadius="lg" p="5" mt="5" mb="5">
            <Heading as="h3" size="sm" mb="5">{fence.name}</Heading>
            <Box mb="5">
                <Button onClick={() => console.log({fence})}>Log fence (testing)</Button> <br />
                <ButtonGroup size="sm" spacing="3" variant="outline">
                    <Button colorScheme="blue" onClick={() => toggleDrawFence()}>{isDrawnOnMap ? <>Hide from</> : <>Show on</>} map</Button>
                    <Button isLoading={isRenamingFence} loadingText="Renaming" onClick={() => renameFence()}>Rename</Button>

                    {/* add an option to select optional API parameter `dryRun` = true/false */}
                    <Button colorScheme="red" isLoading={isDeletingFenceFromProject} loadingText="Deleting" onClick={() => handleDeleteFenceFromProject()}>Delete from project</Button>
                    <Button colorScheme="red" isLoading={isDeletingFence} loadingText="Deleting" onClick={() => handleDeleteFence()}>Delete entirely</Button> 
                </ButtonGroup>
            </Box>

            <Box mb="5">
                <Heading as="h3" size="sm">Custom properties</Heading>
                <ButtonGroup size="sm" spacing="3" variant="outline">
                    <Button colorScheme="blue" onClick={() => toggleProperties()}>{isShowingProperties ? <>Hide</> : <>Show</>} properties</Button>
                    <Button onClick={() => toggleAddProperties()}>Add properties</Button>
                </ButtonGroup><br />

                {isShowingAddProperties &&
                <form onSubmit={handleAddProperty}>
                    <FormControl>
                        <FormLabel>Key</FormLabel>
                        <Input type="text" name="key" placeholder="key" value={newKey} onChange={(e) => setNewKey(e.target.value)} /> 
                        <FormLabel>Value</FormLabel>
                        <Input type="text" name="value" placeholder="value" value={newValue} onChange={(e) => setNewValue(e.target.value)} />
                        <Button type="submit" mt="3">Add</Button>
                    </FormControl>
                </form>
                }

                {/* if the fence has custom properties, list them */}
                {isShowingProperties && 
                <>
                {properties ? 
                <UnorderedList spacing={3}>
                    {properties.map(property => <ListItem key={property.key}>{property.key}: {property.value}</ListItem>)}
                </UnorderedList>
                :
                <>This fence has no properties</>
                }
                </>
                }
            </Box>

            <Box mb="5">
                <Heading as="h3" size="sm">Objects inside this fence</Heading>
                Filter by key/value:<br />
                <form onSubmit={handleGetObjectsInFence}>
                    <FormControl>
                        <FormLabel>Key:</FormLabel>
                        <Input type="text" name="key" placeholder="key" value={reportKey} onChange={(e) => setReportKey(e.target.value)} /> 
                        <FormLabel>Value:</FormLabel>
                        <Input type="text" name="value" placeholder="value" value={reportValue} onChange={(e) => setReportValue(e.target.value)} /> <br />
                        <FormLabel>Number of max results to show (1-100):</FormLabel>
                        <NumberInput maxW={20} defaultValue={100} min={1} max={100} value={reportNumResults} onChange={(e) => setReportNumResults(e)}>
                            <NumberInputField />
                            <NumberInputStepper>
                                <NumberIncrementStepper />
                                <NumberDecrementStepper />
                            </NumberInputStepper>
                        </NumberInput>
                        <Button type="submit" mt="3">Get list</Button>
                    </FormControl>
                </form>
            </Box>
          </Box>
    )
}

export default FenceListItem