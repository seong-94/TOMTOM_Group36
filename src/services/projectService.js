import axios from "axios";
import keys from "../config/keys";

//https://developer.tomtom.com/geofencing-api/documentation/projects-service/projects-service

const baseUrl = `https://api.tomtom.com/geofencing/1/projects`

const getProjects = () => {
    return axios.get(`${baseUrl}?key=${keys.apiKey}`)
    .then(response => response.data)
}

const addProject = (projectName) => {
    return axios.post(`${baseUrl}/project?key=${keys.apiKey}&adminKey=${keys.adminKey}`, projectName)
    .then(response => response.data)
}

const updateProject = (projectId, updatedProject) => {
    return axios.put(`${baseUrl}/${projectId}?key=${keys.apiKey}&adminKey=${keys.adminKey}`, updatedProject)
    .then(response => response.data)
}

const deleteProject = (projectId) => {
    return axios.delete(`${baseUrl}/${projectId}?key=${keys.apiKey}&adminKey=${keys.adminKey}`)
    .then(response => response.data)
}

export default { getProjects, addProject, updateProject, deleteProject }