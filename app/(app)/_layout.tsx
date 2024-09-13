import { View, StyleSheet, Button } from 'react-native'
import { Redirect, Slot } from "expo-router"
import { FIREBASE_AUTH } from '@/FirebaseConfig'
import { useAtom, useSetAtom } from 'jotai'
import { credentialAtom } from '@/atoms'

export default function Layout() {
    const [credential, setCredential] = useAtom(credentialAtom)

    function handleSignOut() {
        setCredential(null)
        return FIREBASE_AUTH.signOut()
    }

    if(!credential){
        return <Redirect href='/auth-screen' />
    }

    return <View style={styles.container}>
        <View style={styles.signOutButton}>
            <Button onPress={handleSignOut} title='Sign Out'></Button>
        </View>
        <Slot />
    </View>
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    signOutButton: {
        position: 'absolute',
        top: 90,
        left: 30,
        zIndex: 10
    }
})