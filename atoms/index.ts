import { ConfirmationResult, UserCredential } from "firebase/auth";
import { atom } from "jotai";
import {
  atomFamily,
  atomWithStorage,
  createJSONStorage,
  loadable,
} from "jotai/utils";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Coordinate } from "@/types";
import directions, { DirectionsResponse } from "@/api/directions";
import { decodePolyline } from "@/utilities";

const storage = createJSONStorage<UserCredential | null>(() => AsyncStorage);
const content = {};

// atom is a modular state which we can use in multiple screens
export const credentialAtom = atomWithStorage<UserCredential | null>(
  "credential",
  null,
  storage
);
export const confrimationResultAtom = atom<ConfirmationResult | null>(null);

export const fullBinsCoordinatesAtom = atom<Coordinate[]>([]);
export const directionCoordinatesAtom = loadable(
  atom<Promise<DirectionsResponse>>(async (get) => {
    const response = await directions({
      coordinates: get(fullBinsCoordinatesAtom),
    });
    return response;
  })
);
export const directionPolylineAtom = atom<
  {
    latitude: number;
    longitude: number;
  }[]
>((get) => {
  const directionCoordinates = get(directionCoordinatesAtom);
  if (directionCoordinates.state === "hasData") {
    return decodePolyline(directionCoordinates.data.trips[0].geometry);
  }
  return [];
});
