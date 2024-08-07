import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Dimensions, Image, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import MapView, { Marker, Region, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { FIREBASE_APP, FIREBASE_AUTH, FIREBASE_DB } from '@/FirebaseConfig';

const LATITUDE_DELTA = 0.01; // Adjust this value to change zoom level
const LONGITUDE_DELTA = LATITUDE_DELTA * (Dimensions.get('window').width / Dimensions.get('window').height);

enum MarkerStatus {
  Full = "FULL",
  Empty = "Empty",
  Mid = "MID"
}

interface MarkerData {
  id: string;
  status: MarkerStatus;
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
            status: MarkerStatus[data.status as keyof typeof MarkerStatus],
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
        status: MarkerStatus.Empty,
        latitude: lat,
        longitude: long
      });
      console.log('writen');
    } catch (e) {
      console.error(e);
    }
  };


  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const MarkerPopup = ({ onOptionSelect }) => (
    <View style={styles.popupContainer}>
      <TouchableOpacity onPress={() => onOptionSelect('GREEN')} style={styles.option}>
        <Image
          source={require('../../assets/images/green-bin.png')}
          style={styles.optionImage}
          resizeMode="contain"
          onError={(e) => console.log("Image load error for green bin:", e.nativeEvent.error)}
        />
        <Text>EMPTY</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onOptionSelect('MID')} style={styles.option}>
        <Image
          source={{ uri: 'https://e7.pngegg.com/pngimages/540/335/png-clipart-recycle-bin-logo-trash-recycling-bin-file-deletion-computer-file-recycle-bin-glass-recycling.png' }}
          style={styles.optionImage}
        />
        <Text>MID 3</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onOptionSelect('FULL')} style={styles.option}>
        <Image
          source={require('../../assets/images/red-bin.png')}
          style={styles.optionImage}
          resizeMode="contain"
        />
        <Text>FULL1</Text>
      </TouchableOpacity>
    </View>
  );

  //function to get the status of the bin and assign the accoring png
  const getMarkerStatus = (status: MarkerStatus) => {
    switch (status) {
      case MarkerStatus.Empty:
        return require('../../assets/images/red-bin.png');
      case MarkerStatus.Mid:
        return require('../../assets/images/blue-bin.png');
      default:
        return require('../../assets/images/green-bin.png');
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
              source={getMarkerStatus(marker.status)}
              style={{ width: 40, height: 40 }}
              resizeMode="contain"
            />
            <Callout tooltip>
              <MarkerPopup
                onOptionSelect={(option) => {
                  // Handle option selection here
                  console.log(`Selected option: ${option} for marker ${marker.id}`);
                  // You can add your logic here, e.g., updating marker status
                }}
              />
            </Callout>
          </Marker>
        ))}
      </MapView>
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
  popupContainer: {
    borderRadius: 15,
    padding: 15,
    width: 300, // Adjust as needed
    height: 150, // Adjust as needed
    backgroundColor: 'white', // Add this to see the container
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  option: {
    width: 80, // Adjust as needed
    height: 80, // Adjust as needed
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1, // Add this to see the boundaries
    borderColor: 'black',
  },
  optionImage: {
    width: 40,  // Set a reasonable width
    height: 40, // Set a reasonable height
    marginBottom: 5, // Add some space between image and text
  },
});