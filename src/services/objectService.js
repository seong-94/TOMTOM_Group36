import axios from "axios";
import keys from "../config/keys";

const baseUrl = `https://api.tomtom.com/geofencing/1`
const baseUrlLocationHistory = `https://api.tomtom.com/locationHistory/1/history`

const getObjects = () => {
    return axios.get(`${baseUrl}/objects?key=${keys.apiKey}`)
    .then(response => response.data)
}

const getObjectDetails = (objectId) => {
    return axios.get(`${baseUrl}/objects/${objectId}?key=${keys.apiKey}`)
    .then(response => response.data)
}

const updateObject = (objectId, updatedObject) => {
    return axios.put(`${baseUrl}/objects/${objectId}?key=${keys.apiKey}&adminKey=${keys.adminKey}`, updatedObject)
    .then(response => response.data)
  }

const addObject = (object) => {
    return axios.post(`${baseUrl}/objects/object?key=${keys.apiKey}&adminKey=${keys.adminKey}`, object)
    .then(response => response.data)
}

const deleteObject = (objectId) => {
    return axios.delete(`${baseUrl}/objects/${objectId}?key=${keys.apiKey}&adminKey=${keys.adminKey}`)
    .then(response => response.data)
}

const addLocationPoint = (position) => {
    return axios.post(`${baseUrlLocationHistory}/positions?key=${keys.apiKey}`, position)
    .then(response => response.data)
}

const getLocationHistory = (objectId, timestamp) => {
    return axios.get(`${baseUrlLocationHistory}/positions/${objectId}?key=${keys.apiKey}&from=${timestamp}`)
    .then(response => response.data)
}

const deleteLocationHistory = () => {
    return axios.delete(`${baseUrlLocationHistory}?key=${keys.apiKey}&adminKey=${keys.adminKey}`)
    .then(response => response.data)
}

export default { getObjects, getObjectDetails, updateObject, addObject, deleteObject, addLocationPoint, getLocationHistory, deleteLocationHistory }