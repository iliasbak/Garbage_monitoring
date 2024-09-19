export enum MarkerStatus {
    Full = "FULL",
    Empty = "EMPTY",
    Mid = "MID"
}

export interface MarkerData {
    id: string;
    status: MarkerStatus;
    coordinate: Coordinate;
    isDeleted: boolean
}

export interface Coordinate {
    latitude: number;
    longitude: number;
}

export enum Roles {
    Admin = "ADMIN",
    User = "USER",
    Driver = "DRIVER",
}

export interface Route {
    geometry: string
    legs: Leg[]
    weight_name: string
    weight: number
    duration: number
    distance: number
}

export interface Leg {
    steps: any[]
    summary: string
    weight: number
    duration: number
    distance: number
}

export interface Waypoint {
    hint: string
    distance: number
    name: string
    location: number[]
}
