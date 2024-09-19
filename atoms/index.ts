import { ConfirmationResult, UserCredential } from 'firebase/auth'
import { atom } from 'jotai'
import { atomFamily, atomWithStorage, createJSONStorage, loadable } from 'jotai/utils'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Coordinate } from '@/types'
import directions from '@/api/directions'
import { decodePolyline } from '@/utilities'

const storage = createJSONStorage<UserCredential | null>(() => AsyncStorage)
const content = {}

// atom is a modular state which we can use in multiple screens
export const credentialAtom = atomWithStorage<UserCredential | null>('credential', null, storage)
export const confrimationResultAtom = atom<ConfirmationResult | null>(null)

export const fullBinsCoordinatesAtom = atom<Coordinate[]>([])
export const directionCoordinatesAtom = loadable(atom<Promise<{
    latitude: number;
    longitude: number;
}[]>>(async (get) => {
    const response = await directions({
        coordinates: get(fullBinsCoordinatesAtom)
    })
    return decodePolyline(response.routes[0].geometry)
}))