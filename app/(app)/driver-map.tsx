import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Dimensions, Image, TouchableOpacity, Text, ActivityIndicator, Modal } from 'react-native';
import MapView, { Marker, Polyline, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { collection, addDoc, onSnapshot, updateDoc, doc, where, query } from 'firebase/firestore';
import { FIREBASE_DB } from '@/FirebaseConfig';
import { MarkerData, MarkerStatus } from '@/types'
import { areAllPointsInOtherList, getDistanceFromLatLonInKm } from '@/utilities';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { directionCoordinatesAtom, fullBinsCoordinatesAtom } from '@/atoms';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';

const LATITUDE_DELTA = 0.01; // Adjust this value to change zoom level
const LONGITUDE_DELTA = LATITUDE_DELTA * (Dimensions.get('window').width / Dimensions.get('window').height);

export default function MapScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [region, setRegion] = useState<Region | undefined>();
  const mapRef = useRef<MapView | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBin, setSelectedBin] = useState<MarkerData | null>(null)
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [isShowingRoutes, setIsShowingRoutes] = useState(false)

  const setFullBinsCoordinates = useSetAtom(fullBinsCoordinatesAtom)
  const directionCoordinates = useAtomValue(directionCoordinatesAtom)

  const fullBinsRef = useRef<MarkerData[]>([])

  const canShowDirections = isShowingRoutes && directionCoordinates.state === 'hasData' && directionCoordinates.data.length > 0

  useEffect(() => {
    try {
      setIsLoading(true)
      const fetchedMarkers: MarkerData[] = [];
      const q = query(collection(FIREBASE_DB, 'kadoi'), where("isDeleted", "==", false))
      //ts
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedMarkers.push({
            id: doc.id,
            status: data.status,
            coordinate: {
              latitude: data.latitude,
              longitude: data.longitude
            },
            isDeleted: false
          });
        });
        setMarkers(fetchedMarkers);
        if (fetchedMarkers.length > 0) {
          setRegion({
            latitude: fetchedMarkers[0].coordinate.latitude,
            longitude: fetchedMarkers[0].coordinate.longitude,
            latitudeDelta: LATITUDE_DELTA,
            longitudeDelta: LONGITUDE_DELTA,
          });
        }
        const fullBins: MarkerData[] = fetchedMarkers.filter(marker => marker.status === MarkerStatus.Full)
        if(fullBinsRef.current){
          if(!areAllPointsInOtherList(fullBins,fullBinsRef.current)){
            fullBinsRef.current = fullBins
            if(location){
              setFullBinsCoordinates([...fullBins.map((marker) => marker.coordinate),{
                longitude: location.coords.longitude,
                latitude: location.coords.latitude
              }])
            }
          }
        }
      })
      return unsubscribe
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  })

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let initialLocation = await Location.getCurrentPositionAsync({});
      setLocation(initialLocation);
      updateRegion(initialLocation.coords.latitude, initialLocation.coords.longitude);

      const locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000,
          distanceInterval: 5,
        },
        (newLocation) => {
          setLocation(newLocation);
          updateRegion(newLocation.coords.latitude, newLocation.coords.longitude);
        }
      );

      return () => {
        if (locationSubscription) {
          locationSubscription.remove();
        }
      };
    })();
  }, []);

  const closePopup = () => {
    setSelectedBin(null); // Close the popup by clearing the selected bin
  };

  const updateRegion = (latitude: number, longitude: number) => {
    const newRegion: Region = {
      latitude,
      longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    };
    setRegion(newRegion);
    mapRef.current?.animateToRegion(newRegion, 1000);
  };

  const deleteBin = async () => {
    try {
      if (!selectedBin) {
        return
      }
      const docRef = doc(FIREBASE_DB, 'kadoi', selectedBin.id)
      await updateDoc(docRef, {
        isDeleted: true,
      });
      const index = markers.findIndex(marker => marker.id === selectedBin.id)
      markers.splice(index, 1)
      setMarkers(markers)
      closePopup()
      console.log('updated');
    } catch (e) {
      console.error(e);
    }
  }

  const writeData = async (lat: number, long: number) => {
    try {
      const doRef = await addDoc(collection(FIREBASE_DB, 'kadoi'), {
        status: MarkerStatus.Empty,
        latitude: lat,
        longitude: long,
        isDeleted: false
      });
      markers.push({
        id: doRef.id,
        status: MarkerStatus.Empty,
        coordinate: {
          longitude: long,
          latitude: lat
        },
        isDeleted: false
      })
      setMarkers(markers)
    } catch (e) {
      console.error(e);
    }
  };

  const cleanBin = async () => {
    let closestBin: MarkerData | null = null
    let shortestDistance = Infinity

    if (!location) return

    markers.forEach(mark => {
      const distance = getDistanceFromLatLonInKm(location.coords.latitude, location.coords.longitude, mark.coordinate.latitude, mark.coordinate.longitude);
      if (distance < shortestDistance) {
        shortestDistance = distance;
        if (distance < 0.010) {
          closestBin = mark;
        }
      }
    });

    if (!closestBin) return

    const docRef = doc(FIREBASE_DB, 'kadoi', (closestBin as MarkerData).id)
    await updateDoc(docRef, {
      status: MarkerStatus.Empty,
    });
    const index = markers.findIndex(marker => marker.id === (closestBin as MarkerData).id)
    markers[index] = {
      ...markers[index],
      status: MarkerStatus.Empty
    }
    setMarkers(markers)
  }

  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
      updateRegion(location.coords.latitude, location.coords.longitude);

      // Print the current location to VSCode console
      console.log('Current Location:', {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        altitude: location.coords.altitude,
        accuracy: location.coords.accuracy,
        altitudeAccuracy: location.coords.altitudeAccuracy,
        heading: location.coords.heading,
        speed: location.coords.speed,
      });

      writeData(location.coords.latitude, location.coords.longitude);



    } catch (error) {
      console.error('Error getting current location:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const getMarkerStatus = (status: MarkerStatus) => {
    switch (status) {
      case MarkerStatus.Empty:
        return require('../../assets/images/green-bin.png');
      case MarkerStatus.Mid:
        return require('../../assets/images/blue-bin.png');
      default:
        return require('../../assets/images/red-bin.png');
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        ref={mapRef}
        initialRegion={region}
        showsUserLocation={true}
        followsUserLocation={true}

        onUserLocationChange={(event) => {
          if (!event.nativeEvent.coordinate) {
            return
          }
          setRegion({
            latitude: event.nativeEvent.coordinate.latitude,
            longitude: event.nativeEvent.coordinate.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          });
        }}
      >
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={marker.coordinate}
            onPress={() => setSelectedBin(marker)}
          >
            <Image
              source={getMarkerStatus(marker.status)}
              style={{ width: 40, height: 40 }}
              resizeMode="contain"
            />
          </Marker>
        ))}
        {
          canShowDirections && <Polyline coordinates={directionCoordinates.data} strokeColor='blue' strokeWidth={2} />
        }
      </MapView>
      <TouchableOpacity style={styles.showRoutesButton} onPress={() => setIsShowingRoutes(isShowingRoute => !isShowingRoute)}>
        <FontAwesome5 name="directions" size={28} color="white" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.cleanBinButton} onPress={cleanBin}>
        <MaterialIcons name="cleaning-services" size={28} color="white" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.addButton} onPress={getCurrentLocation}>
      <FontAwesome6 name="trash-arrow-up" size={28} color="white" />
      </TouchableOpacity>
      {selectedBin && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={!!selectedBin}
          onRequestClose={closePopup}
        >
          <View style={styles.popupOverlay}>
            <View style={styles.popupContainer}>
              <Text style={styles.popupTitle}>Διαγραφή κάδου</Text>
              <View style={styles.binOptions}>
                <Text style={styles.deletePromptText}>θέλεις να διαγράψεις σίγουρα τον κάδο;</Text>
                <TouchableOpacity onPress={deleteBin} style={styles.deleteButton}>
                  <Text style={styles.deleteButtonText}>διαγραφή</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={closePopup} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>Κλείσιμο</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  cleanBinButton: {
    position: 'absolute',
    bottom: 90,
    left: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#34bf00',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cleanBinButtonText: {
    fontSize: 30,
    color: '#FFFFFF',
  },
  showRoutesButton: {
    position: 'absolute',
    top: 90,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'blue',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  showRoutesText: {
    fontSize: 30,
    color: '#FFFFFF',
  },
  addButton: {
    position: 'absolute',
    bottom: 90,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'indigo',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  addButtonText: {
    fontSize: 30,
    color: '#FFFFFF',
  },
  popupOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  popupContainer: {
    width: 300,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  popupTitle: {
    fontSize: 18,
    marginBottom: 10,
  },
  binOptions: {
    flexDirection: 'column',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
  },
  binOption: {
    alignItems: 'center',
    margin: 10,
  },
  binImage: {
    width: 50,
    height: 50,
  },
  closeButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: 'tomato',
    borderRadius: 5,
  },
  deleteButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: 'red',
    borderRadius: 5,
    marginLeft: 'auto'
  },
  closeButtonText: {
    color: 'white',
    fontSize: 12,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    textTransform: 'capitalize'
  },
  deletePromptText: {
  }
});