import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Dimensions,
  Image,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Modal,
  Pressable,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import * as Location from "expo-location";
import {
  collection,
  updateDoc,
  doc,
  onSnapshot,
  where,
  query,
} from "firebase/firestore";
import { FIREBASE_DB } from "@/FirebaseConfig";
import { MarkerData, MarkerStatus } from "@/types";

const LATITUDE_DELTA = 0.01; // Adjust this value to change zoom level
const LONGITUDE_DELTA =
  LATITUDE_DELTA *
  (Dimensions.get("window").width / Dimensions.get("window").height);

export default function MapScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [region, setRegion] = useState<Region | undefined>();
  const mapRef = useRef<MapView | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [selectedBin, setSelectedBin] = useState<MarkerData | null>(null);

  const closePopup = () => {
    setSelectedBin(null);
  };

  useEffect(() => {
    try {
      setIsLoading(true);
      const fetchedMarkers: MarkerData[] = [];
      const q = query(
        collection(FIREBASE_DB, "kadoi"),
        where("isDeleted", "==", false)
      );
      //ts
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedMarkers.push({
            id: doc.id,
            status: data.status,
            coordinate: {
              latitude: data.latitude,
              longitude: data.longitude,
            },
            isDeleted: data.isDeleted,
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
      });
      return unsubscribe;
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  });

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }

      let initialLocation = await Location.getCurrentPositionAsync({});
      setLocation(initialLocation);
      updateRegion(
        initialLocation.coords.latitude,
        initialLocation.coords.longitude
      );

      const locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000,
          distanceInterval: 5,
        },
        (newLocation) => {
          setLocation(newLocation);
          updateRegion(
            newLocation.coords.latitude,
            newLocation.coords.longitude
          );
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

  const udpateStatus = async (markerStatus: MarkerStatus) => {
    try {
      if (!selectedBin) {
        return;
      }
      const docRef = doc(FIREBASE_DB, "kadoi", selectedBin.id);
      const doRef = await updateDoc(docRef, {
        status: markerStatus,
      });
      const index = markers.findIndex((marker) => marker.id === selectedBin.id);
      markers[index] = {
        ...markers[index],
        status: markerStatus,
      };
      setMarkers(markers);
      closePopup();
      console.log("updated");
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

  const getMarkerStatus = (status: MarkerStatus) => {
    switch (status) {
      case MarkerStatus.Empty:
        return require("../../assets/images/green-bin.png");
      case MarkerStatus.Mid:
        return require("../../assets/images/blue-bin.png");
      default:
        return require("../../assets/images/red-bin.png");
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
            return;
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
      </MapView>
      {selectedBin && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={!!selectedBin}
          onRequestClose={closePopup}
        >
          <View style={styles.popupOverlay}>
            <View style={styles.popupContainer}>
              <Text style={styles.popupTitle}>Επίλεξε τη στάθμη του κάδου</Text>
              <View style={styles.binOptions}>
                <TouchableOpacity
                  style={styles.binOption}
                  onPress={() => udpateStatus(MarkerStatus.Empty)}
                >
                  <Image
                    source={require("../../assets/images/green-bin.png")}
                    style={styles.binImage}
                    resizeMode="contain"
                  />
                  <Text>Άδειος</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.binOption}
                  onPress={() => udpateStatus(MarkerStatus.Mid)}
                >
                  <Image
                    source={require("../../assets/images/blue-bin.png")}
                    style={styles.binImage}
                    resizeMode="contain"
                  />
                  <Text>Μέση</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.binOption}
                  onPress={() => udpateStatus(MarkerStatus.Full)}
                >
                  <Image
                    source={require("../../assets/images/red-bin.png")}
                    style={styles.binImage}
                    resizeMode="contain"
                  />
                  <Text>Γεμάτος</Text>
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
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  map: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
  },
  addButton: {
    position: "absolute",
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  addButtonText: {
    fontSize: 30,
    color: "#FFFFFF",
  },
  option: {
    //   width: 120, // Adjust as needed
    //   height: 80, // Adjust as needed
    justifyContent: "center",
    alignItems: "center",
    //   borderWidth: 1, // Add this to see the boundaries
    //   borderColor: 'black',
  },
  optionImage: {
    width: 50,
    height: 50,
    marginBottom: 5, // Add some space between image and text
  },
  popupOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  popupContainer: {
    width: 300,
    padding: 20,
    backgroundColor: "white",
    borderRadius: 10,
    alignItems: "center",
  },
  popupTitle: {
    fontSize: 18,
    marginBottom: 10,
  },
  binOptions: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  binOption: {
    alignItems: "center",
    margin: 10,
  },
  binImage: {
    width: 50,
    height: 50,
  },
  closeButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "tomato",
    borderRadius: 5,
  },
  closeButtonText: {
    color: "white",
    fontSize: 12,
  },
});
