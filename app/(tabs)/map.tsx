import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Dimensions, Image } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

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
  title: string;
  description: string;
}

export default function MapScreen() {
  const [location, setLocation] = useState<LocationObject | null>(null);
  const [markers] = useState<MarkerData[]>([
    {
      id: '1',
      coordinate: { longitude: 26.698039, latitude: 37.7936164 },
      title: 'Marker 1',
      description: 'This is marker 1'
    },
    {
      id: '2',
      coordinate: { longitude: 26.6968783, latitude: 37.7944114 },
      title: 'Marker 2',
      description: 'This is marker 2'
    },
    {
      id: '3',
      coordinate: { longitude: 26.6960508, latitude: 37.7950238 },
      title: 'Marker 3',
      description: 'This is marker 3'
    },
    // Add more markers as needed
  ]);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        showsUserLocation={true}
        followsUserLocation={true}
        initialRegion={{
          latitude: markers[0].coordinate.latitude,
          longitude: markers[0].coordinate.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
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
});