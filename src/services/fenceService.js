import axios from "axios";
import keys from "../config/keys";

//https://developer.tomtom.com/geofencing-api/documentation/fences-service/fences-service

const baseUrl = `https://api.tomtom.com/geofencing/1`

const getProjectFences = (projectId) => {
  return axios.get(`${baseUrl}/projects/${projectId}/fences?key=${keys.apiKey}`)
  .then(response => response.data)
}

const getFence = (fenceId) => {
  return axios.get(`${baseUrl}/fences/${fenceId}?key=${keys.apiKey}`)
  .then(response => response.data)
}

const updateFence = (fenceId, updatedFence) => {
  return axios.put(`${baseUrl}/fences/${fenceId}?key=${keys.apiKey}&adminKey=${keys.adminKey}`, updatedFence)
  .then(response => response.data)
}

const deleteFence = (fenceId) => {
  const request = axios.delete(`${baseUrl}/fences/${fenceId}?key=${keys.apiKey}&adminKey=${keys.adminKey}`)
  return request.then(response => response.data)
}

const deleteFenceFromProject = (projectId, fenceId) => {
  const request = axios.delete(`${baseUrl}/projects/${projectId}/fences/${fenceId}?key=${keys.apiKey}&adminKey=${keys.adminKey}`)
  return request.then(response => response.data)
}

const addFence = (projectId, fence) => {
  const request = axios.post(`${baseUrl}/projects/${projectId}/fence?key=${keys.apiKey}&adminKey=${keys.adminKey}`, fence)
  return request.then(response => response.data)
}

const getObjectsInFence = (fenceId, property, value, maxResults) => {
  let requestString = `${baseUrl}/fences/${fenceId}/objects?key=${keys.apiKey}&maxResults=${maxResults}`
  if (property && value) {
    requestString += `&filters={${property}:${value}}`
  }
  return axios.get(requestString)
  .then(response => response.data)
}

export default { getProjectFences, getFence, updateFence, deleteFence, deleteFenceFromProject, addFence, getObjectsInFence }