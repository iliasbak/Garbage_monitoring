import axios from "axios";
import pupa from "pupa";
import { ENDPOINTS } from ".";
import { Route, Waypoint } from "@/types";

export interface DirectionsRequest {
  coordinates: { longitude: number; latitude: number }[];
}

export interface DirectionsResponse {
  code: string;
  trips: Route[];
  waypoints: Waypoint[];
}

export default async function directions(args: DirectionsRequest) {
  const coordinates = args.coordinates
    .map((coordinate) => `${coordinate.longitude},${coordinate.latitude}`)
    .join(";");
  const response = await axios.get(
    pupa(ENDPOINTS.directions, {
      coordinates,
    })
  );
  console.log(JSON.stringify(response.data, null, 2));
  return response.data as DirectionsResponse;
}
