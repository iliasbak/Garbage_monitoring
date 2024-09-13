import React from "react";
import { View, Text, TextInput, Button, StyleSheet } from "react-native";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useConfirmationResult } from "@/providers/ConfirmationResultProvider";
import { useStorageState } from "@/hooks/useStorageState";
import { UserCredential } from "firebase/auth";
import { useAtom, useSetAtom } from "jotai";
import { credentialAtom } from "@/atoms";
import { useRouter } from "expo-router";

// Define the form input interface
interface IOTPFormInput {
  otp: string;
}

// Define the validation schema for OTP
const otpSchema = yup.object().shape({
  otp: yup
    .string()
    .length(6, "OTP must be exactly 6 digits")
    .required("OTP is required"),
});

export default function OTPVerification({ navigation }) {
  const [, setUserCredential] =
    useStorageState<UserCredential>("userCredentials");
  const { control, handleSubmit } = useForm<IOTPFormInput>({
    resolver: yupResolver(otpSchema),
  });
  const {confirmationResult} = useConfirmationResult()
  const  setCredential = useSetAtom(credentialAtom)
  const router = useRouter()

  const onSubmit = async (data: IOTPFormInput) => {
    try {
      console.log('0')
      if(confirmationResult){
        console.log('1')
        const credential = await confirmationResult.confirm(data.otp)
        setCredential(credential)
        router.push('/')
      }
    } catch (error) {
      console.error(error)
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>OTP Verification</Text>

      <View style={styles.formContainer}>
        <Text style={styles.label}>Enter OTP</Text>
        <Controller
          control={control}
          name="otp"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={styles.input}
              placeholder="Enter the 6-digit OTP"
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
              keyboardType="number-pad"
              maxLength={6}
            />
          )}
        />

        <Button title="Verify OTP" onPress={handleSubmit(onSubmit)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  formContainer: {
    width: "100%",
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
  },
  input: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
});
