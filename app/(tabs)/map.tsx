import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Dimensions, Image, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { FIREBASE_APP, FIREBASE_AUTH, FIREBASE_DB } from '@/FirebaseConfig';

const LATITUDE_DELTA = 0.01; // Adjust this value to change zoom level
const LONGITUDE_DELTA = LATITUDE_DELTA * (Dimensions.get('window').width / Dimensions.get('window').height);

interface LocationObject {
  coords: {
    latitude: number;
    longitude: number;
  };
}

interface MarkerData {
  id: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
}

export default function MapScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const mapRef = useRef<MapView | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [markers, setMarkers] = useState<MarkerData[]>([]);

  useEffect(() => {
    const fetchMarkers = async () => {
      try {
        const querySnapshot = await getDocs(collection(FIREBASE_DB, 'kadoi'));
        const fetchedMarkers: MarkerData[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedMarkers.push({
            id: doc.id,
            coordinate: {
              latitude: data.latitude,
              longitude: data.longitude
            },
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
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching markers:", error);
        setIsLoading(false);
      }
    };

    fetchMarkers();

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

  const writeData = async (lat: number, long: number) => {
    try {
      const doRef = await addDoc(collection(FIREBASE_DB, 'kadoi'), {
        latitude: lat,
        longitude: long
      });
      console.log('writen');
    } catch (e) {
      console.error(e);
    }
  };


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

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        ref={mapRef}
        initialRegion={region}
        showsUserLocation={true}
        followsUserLocation={true}

        onUserLocationChange={(event) => {
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
            title={marker.title}
            description={marker.description}
          >
            <Image
              source={require('../../assets/images/icon-bin.png')}
              style={{ width: 40, height: 40 }}
              resizeMode="contain"
            />
          </Marker>
        ))}
      </MapView>
      <TouchableOpacity style={styles.addButton} onPress={getCurrentLocation}>
        <Text style={styles.addButtonText}></Text>
      </TouchableOpacity>
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
  addButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
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
});