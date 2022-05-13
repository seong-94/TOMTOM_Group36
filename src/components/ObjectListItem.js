import React, { useState, useEffect } from 'react';

import { Button, ButtonGroup, useToast, Box, Heading, FormControl, FormLabel, Input, NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper, Spinner, UnorderedList, ListItem } from '@chakra-ui/react'

import objectService from '../services/objectService';

const ObjectListItem = ({object, objectList, setObjectList, showLocationHistory, showConfirmationAlert, setIsShowingConfirmationAlert}) => {
    const [isShowingProperties, setIsShowingProperties] = useState(false)
    const [isShowingAddProperties, setIsShowingAddProperties] = useState(false)
    const [newKey, setNewKey] = useState('')
    const [newValue, setNewValue] = useState('')
    const [properties, setProperties] = useState([])
    const [isGettingProperties, setIsGettingProperties] = useState(false)
    const [isRenamingObject, setIsRenamingObject] = useState(false)
    const [isDeletingObject, setIsDeletingObject] = useState(false)
    const [isAddingProperty, setIsAddingProperty] = useState(false)
    const [isUpdatingPropertyValue, setIsUpdatingPropertyValue] = useState(false)
    const [isDeletingProperty, setIsDeletingProperty] = useState(false)
    const [propertyToDelete, setPropertyToDelete] = useState()
    const [newLng, setNewLng] = useState()
    const [newLat, setNewLat] = useState()
    const [isAddingLocationPoint, setIsAddingLocationPoint] = useState(false)
    const [locationHistoryHours, setLocationHistoryHours] = useState(24)

    const toast = useToast()

    //fetch initial list of properties from the server
    useEffect(() => {
        setIsGettingProperties(true)
        objectService.getObjectDetails(object.id)
        .then(data => {
            let array = []
            if (data.properties) {
                for (const key in data.properties) {
                    switch (typeof(data.properties[key])) {
                        case 'string':
                            array.push({key: key, value: data.properties[key]})
                            break
                        case 'number':
                        case 'boolean':
                            array.push({key: key, value: data.properties[key].toString()})
                            break
                        case 'object':
                            array.push({key: key, value: data.properties[key] ? data.properties[key].toString() : 'none'})
                            break
                    }
                }
            }
            if (array.length > 0) {
                setProperties(array)
            }
            setIsGettingProperties(false)
        })
    }, [])

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
        } else{
            setIsShowingProperties(true)
        }
    }

    const toggleAddProperties = () => {
        if (isShowingAddProperties) {
            setIsShowingAddProperties(false)
        } else{
            setIsShowingAddProperties(true)
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
            if (window.confirm('The key you have entered already exists for this object. Would you like to update its value?')) {
                //perform update to server
                addProperty('updated')
            }
        } else {
            //property key is unique - createa a new key/value pair
            addProperty('added')
        }
    }

    const addProperty = (successAction) => {
        setIsAddingProperty(true)
        //create object
        let updatedProperties = {properties: {}}
        for (let i = 0; i < properties.length; i++) {
            updatedProperties.properties[properties[i].key] = properties[i].value
        }
        updatedProperties.properties[newKey] = newValue
        //perform PUT request
        objectService.updateObject(object.id, updatedProperties)
        .then(() => {
            let updatedProperties = [...properties]
            updatedProperties.push({key: newKey, value: newValue})
            setProperties(updatedProperties)

            setIsAddingProperty(false)
            setNewKey('')
            setNewValue('')
            showToast(`Property successfully ${successAction}`, `New ${newKey}: ${newValue}`, 'success') 
        })
        .catch(error => {
            showToast(`${error}`, `${error.response.data.message}`, 'error')
        })
    }

    const editPropertyValue = (key) => {
        let newValue = window.prompt(`Enter a new value for the key ${key}`)
        if (newValue) {
            setIsUpdatingPropertyValue(true)
            let updatedProperties = {properties: {}}
            for (let i = 0; i < properties.length; i++) {
                if (properties[i].key === key) {
                    updatedProperties.properties[properties[i].key] = newValue
                } else {
                    updatedProperties.properties[properties[i].key] = properties[i].value
                }
            }
            objectService.updateObject(object.id, updatedProperties)
            .then(() => {
                let updatedProperties = [...properties]
                let index = updatedProperties.findIndex(property => property.key === key)
                updatedProperties[index] = {
                    key: key,
                    value: newValue
                }
                setProperties(updatedProperties)
    
                setIsUpdatingPropertyValue(false)
                showToast(`Property successfully updated`, `New ${newKey}: ${newValue}`, 'success') 
            })
            .catch(error => {
                showToast(`${error}`, `${error.response.data.message}`, 'error')
            })
        }
    }

    // **** THIS IS BUGGY WITH THE STATE VARIABLE
    const handleDeleteProperty = (property) => {
        setPropertyToDelete(property)
        if (propertyToDelete) {
            showConfirmationAlert('Delete property', `Are you sure you want to delete the property '${property.key}'? This cannot be undone.`, deleteProperty)
        }
    }

    const deleteProperty = () => {
        console.log('delete property', propertyToDelete);
        setIsDeletingProperty(true)
        let updatedProperties = {properties: {}}
        for (let i = 0; i < properties.length; i++) {
            if (!(properties[i].key === propertyToDelete.key)) {
                updatedProperties.properties[properties[i].key] = properties[i].value
            }
        }
        objectService.updateObject(object.id, updatedProperties)
            .then(() => {
                let updatedProperties = [...properties]
                let index = updatedProperties.findIndex(property => property.key === propertyToDelete.key)
                updatedProperties.splice(index, 1)
                setProperties(updatedProperties)
    
                setIsDeletingProperty(false)
                setIsShowingConfirmationAlert(false)
                showToast(`Property successfully deleted`, `Property '${propertyToDelete.key}: ${propertyToDelete.value}' has beeen deleted`, 'success')
                setPropertyToDelete(null)
            })
            .catch(error => {
                showToast(`${error}`, `${error.response.data.message}`, 'error')
            })
    }

    const renameObject = () => {
        let newName = window.prompt('Enter a new name for the object')
        if (newName && newName === object.name) {
            showToast('Unable to rename object', 'Object already has the entered name', 'error')
        }
        else if (newName && newName !== object.name) {
            setIsRenamingObject(true)
            let updatedObject = {
                ...object,
                name: newName,
            }
            objectService.updateObject(object.id, updatedObject)
            .then(() => {
                //update objectList state variable to reflect the change
                let objects = [...objectList]
                let index = objectList.indexOf(objectList.find(oldObject => oldObject.id === object.id))
                objects[index] = updatedObject
                setObjectList(objects)
                setIsRenamingObject(false)

                showToast('Object renamed', `Object successfully renamed to '${newName}'`, 'success')
            })
            .catch(error => {
                showToast(`${error}`, `${error.response.data.message}`, 'error')
            })
        }
    }

    const handleDeleteObject = () => {
        showConfirmationAlert('Delete object', `Are you sure you want to delete the object '${object.name}'? This cannot be undone.`, deleteObject)
    }

    const deleteObject = () => {
        setIsDeletingObject(true)
        objectService.deleteObject(object.id)
        .then(() => {
            //also update state variable
            let objects = [...objectList]
            let index = objectList.indexOf(objectList.find(oldObject => oldObject.id === object.id))
            objects.splice(index, 1)
            setObjectList(objects)
            setIsDeletingObject(false)
            setIsShowingConfirmationAlert(false)

            showToast('Object deleted', `Object '${object.name}' successfully deleted`, 'success')
        })
        .catch(error => {
            showToast(`${error}`, `${error.response.data.message}`, 'error')
        })
    }

    const addLocationHistory = (event) => {
        event.preventDefault()
        setIsAddingLocationPoint(true)
        console.log(newLng, newLat)
        let requestObject = {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [parseFloat(newLng), parseFloat(newLat), 0]
            },
            object: object.id
        }
        objectService.addLocationPoint(requestObject)
        .then(data => {
            setIsAddingLocationPoint(false)
    
            showToast('Location point added', `Location history for object '${object.name}' successfully added at [${newLng}, ${newLat}]`, 'success')
          })
          .catch(error => {
            showToast(`${error}`, `${error.response.data.message}`, 'error')
          })
    }

    const handleShowLocationHistory = (event) => {
        event.preventDefault()
        let fromTime = new Date(Date.now() - 86370 * 500).toISOString()
        let timestamp = fromTime.substring(0, fromTime.length-5)
        showLocationHistory(object.id, timestamp)
    }

    return (
        <Box borderWidth="1px" borderRadius="lg" p="5" mt="5" mb="5">
            <Box mb="5">
                <Heading as="h3" size="sm" mb="5">{object.name}</Heading>
                <ButtonGroup size="sm" spacing="3" variant="outline">
                    <Button isLoading={isRenamingObject} loadingText="Renaming" onClick={() => renameObject()}>Rename</Button>
                    <Button isLoading={isDeletingObject} loadingText="Deleting" colorScheme="red" onClick={() => handleDeleteObject()}>Delete</Button>
                </ButtonGroup>
            </Box>

            <Box mb="5">
                <Heading as="h3" size="sm" mb="5">Properties</Heading>
                <ButtonGroup size="sm" spacing="3" variant="outline" mb="5">
                    <Button colorScheme="blue" onClick={() => toggleProperties()}>{isShowingProperties ? <>Hide</> : <>Show</>} properties</Button>
                    <Button onClick={() => toggleAddProperties()}>Add properties</Button>
                </ButtonGroup>

                {isShowingAddProperties &&
                <form onSubmit={handleAddProperty}>
                    <FormControl>
                        <FormLabel>Key</FormLabel>
                        <Input type="text" name="key" placeholder="key" value={newKey} onChange={(e) => setNewKey(e.target.value)} /> 
                        <FormLabel>Value</FormLabel>
                        <Input type="text" name="value" placeholder="value" value={newValue} onChange={(e) => setNewValue(e.target.value)} />
                        <Button isLoading={isAddingProperty} loadingText="Adding" type="submit" mt="3">Add</Button>
                    </FormControl>
                </form>
                }

                {/* if the object has properties, list them */}
                {isShowingProperties && 
                <>
                    {isGettingProperties ? <Spinner />
                    :
                    <>
                        {properties.length > 0 ? 
                        <UnorderedList spacing={3}>
                            {properties.map(property => 
                            <React.Fragment key={property.key}>
                            <ListItem>{
                                property.key}: {property.value}
                                <ButtonGroup size="sm" spacing="3" ml="3">
                                    <Button isLoading={isUpdatingPropertyValue} loadingText="Updating" onClick={() => editPropertyValue(property.key)}>Update value</Button>
                                    <Button isLoading={isDeletingProperty} loadingText="Deleting" onClick={() => handleDeleteProperty(property)} >Delete</Button>
                                </ButtonGroup>
                            </ListItem>
                            </React.Fragment>
                            )}
                        </UnorderedList>
                        :
                        <Box>This object has no properties</Box>
                        }
                    </>
                    }
                </>
                }

            </Box>

            <Box mb="5">
                <Heading as="h3" size="sm">Add location point</Heading>
                <form onSubmit={addLocationHistory}>
                    <FormControl>
                        <FormLabel htmlFor='lng'>Longitude</FormLabel>
                        <Input id='lng' maxW={200} value={newLng || ''} onChange={(e) => setNewLng(e.target.value)} />
                        <FormLabel htmlFor='lat'>Latitude</FormLabel>
                        <Input id='lat' maxW={200} value={newLat || ''} onChange={(e) => setNewLat(e.target.value)} />
                        <Button type="submit" isLoading={isAddingLocationPoint} loadingText="Adding">Add</Button>
                    </FormControl>
                </form>
            </Box>

           <Box>
               <form onSubmit={handleShowLocationHistory}>
                {/* update this to allow users to enter a FROM and TO time, but check if the range is within 24 hours */}
               View location history from the last:
                <NumberInput maxW={20} defaultValue={24} min={1} max={24} value={locationHistoryHours} onChange={(e) => setLocationHistoryHours(e)} >
                    <NumberInputField />
                    <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                    </NumberInputStepper>
                </NumberInput> hour(s)
                <Button type="submit">View</Button>
                </form>
           </Box>
        </Box>
    )

}

export default ObjectListItem