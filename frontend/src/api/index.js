import {get} from "./server"

export const queryCourse = function (params) {
    return get("/api/query", params)
}

export const searchCourse = function (params) {
    return get("/api/search", params)
}