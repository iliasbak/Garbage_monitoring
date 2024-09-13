import React, { useRef, useState } from "react";
import { View, TextInput, Button, StyleSheet } from "react-native";
import TabPills from "@/components/TabPills";
import { Dropdown } from "react-native-element-dropdown";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, useForm } from "react-hook-form";
import PhoneInput from "react-native-phone-number-input";
import { useConfirmationResult } from "@/providers/ConfirmationResultProvider";
import { useRouter } from "expo-router";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  UserCredential,
} from "firebase/auth";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import { FIREBASE_APP, FIREBASE_AUTH, FIREBASE_DB } from "@/FirebaseConfig";
import { Roles } from "@/types";
import { useStorageState } from "@/hooks/useStorageState";
import { useSetAtom } from "jotai";
import { credentialAtom } from "@/atoms";
import { useSession } from "@/providers/SessionProvider";
import { addDoc, collection } from "firebase/firestore";

interface ISigninFormInput {
  email: string;
  phoneNumber: string;
  password: string;
  role: Roles;
}

interface ISignupFormInput {
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  role: Roles;
}

const signupSchema = yup.object().shape({
  email: yup
    .string()
    .email("Invalid email")
    .when("role", ([role], schema) => {
      if (role === Roles.Driver) {
        return schema.required("Email is required for drivers");
      }
      return schema.notRequired();
    })
    .required(),
  password: yup.string().required("Password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords must match")
    .required("Confirm password is required"),
  role: yup.string().oneOf(Object.values(Roles)).required("Role is required"),
  phoneNumber: yup.string().when("role", ([role], schema) => {
    if (role === Roles.User) {
      return schema.required("Phone number is required for users");
    }
    return schema.notRequired();
  }),
});

const signinSchema = yup.object().shape({
  email: yup
    .string()
    .email("Invalid email")
    .when("role", ([role], schema) => {
      if (role === Roles.Driver) {
        return schema.required("Email is required for drivers");
      }
      return schema.notRequired();
    })
    .required(),
  password: yup.string().required("Password is required"),
  role: yup.string().oneOf(Object.values(Roles)).required("Role is required"),
  phoneNumber: yup.string().when("role", ([role], schema) => {
    if (role === Roles.User) {
      return schema.required("Phone number is required for users");
    }
    return schema.notRequired();
  }),
});

interface SignupFormProps {
  onSignUp: (data: ISignupFormInput) => void;
}

const SignupForm = (props: SignupFormProps) => {
  const roleOptions = [
    {
      label: "User",
      value: Roles.User,
    },
    {
      label: "Driver",
      value: Roles.Driver,
    },
  ];

  const signupMethods = useForm<ISignupFormInput>({
    //@ts-expect-error IDK
    resolver: yupResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      role: Roles.User,
      phoneNumber: "",
    },
  });

  return (
    <View>
      <Controller
        control={signupMethods.control}
        name="role"
        render={({ field: { onChange, value } }) => (
          <Dropdown
            style={styles.dropdown}
            data={roleOptions}
            maxHeight={300}
            labelField="label"
            valueField="value"
            value={value}
            onChange={(option) => onChange(option.value)}
            selectedTextStyle={styles.roleSelectedTextStyle}
          />
        )}
      />
      {signupMethods.watch("role") === Roles.User && (
        <Controller
          control={signupMethods.control}
          name="phoneNumber"
          render={({ field: { onChange, value } }) => (
            <PhoneInput
              containerStyle={styles.phoneInputContainer}
              textInputStyle={styles.phoneInputTextInputStyle}
              codeTextStyle={styles.phoneInputCodeTextStyle}
              countryPickerButtonStyle={
                styles.phoneInpuCountryPickerButtonStyle
              }
              textContainerStyle={styles.phoneInputTextContainerStyle}
              defaultValue={value}
              defaultCode="GR"
              layout="first"
              onChangeFormattedText={(text) => onChange(text)}
            />
          )}
        />
      )}
      {signupMethods.watch("role") === Roles.Driver && (
        <Controller
          control={signupMethods.control}
          name="email"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={value}
              onChangeText={(text) => onChange(text)}
              keyboardType="email-address"
            />
          )}
        />
      )}
      <Controller
        control={signupMethods.control}
        name="password"
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={value}
            onChangeText={(text) => onChange(text)}
            secureTextEntry
          />
        )}
      />
      <Controller
        control={signupMethods.control}
        name="confirmPassword"
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            value={value}
            onChangeText={(text) => onChange(text)}
            secureTextEntry
          />
        )}
      />
      <Button
        title="Sign Up"
        onPress={signupMethods.handleSubmit(props.onSignUp)}
      />
    </View>
  );
};

interface SigninFormProps {
  onSignIn: (data: ISigninFormInput) => void;
}

const SigninForm = (props: SigninFormProps) => {
  const roleOptions = [
    {
      label: "User",
      value: Roles.User,
    },
    {
      label: "Driver",
      value: Roles.Driver,
    },
  ];

  const signinMethods = useForm<ISigninFormInput>({
    //@ts-expect-error IDK
    resolver: yupResolver(signinSchema),
    defaultValues: {
      email: "",
      password: "6986562496",
      role: Roles.User,
      phoneNumber: "+306986562496",
    },
  });

  return (
    <View>
      <Controller
        control={signinMethods.control}
        name="role"
        render={({ field: { onChange, value } }) => (
          <Dropdown
            style={styles.dropdown}
            data={roleOptions}
            maxHeight={300}
            labelField="label"
            valueField="value"
            value={value}
            onChange={(option) => onChange(option.value)}
            selectedTextStyle={styles.roleSelectedTextStyle}
          />
        )}
      />
      {signinMethods.watch("role") === Roles.User && (
        <Controller
          control={signinMethods.control}
          name="phoneNumber"
          render={({ field: { onChange, value } }) => (
            <PhoneInput
              containerStyle={styles.phoneInputContainer}
              textInputStyle={styles.phoneInputTextInputStyle}
              codeTextStyle={styles.phoneInputCodeTextStyle}
              countryPickerButtonStyle={
                styles.phoneInpuCountryPickerButtonStyle
              }
              textContainerStyle={styles.phoneInputTextContainerStyle}
              defaultValue={value}
              defaultCode="GR"
              layout="first"
              onChangeFormattedText={(text) => onChange(text)}
            />
          )}
        />
      )}
      {signinMethods.watch("role") === Roles.Driver && (
        <Controller
          control={signinMethods.control}
          name="email"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={value}
              onChangeText={(text) => onChange(text)}
              keyboardType="email-address"
            />
          )}
        />
      )}
      <Controller
        control={signinMethods.control}
        name="password"
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={value}
            onChangeText={(text) => onChange(text)}
            secureTextEntry
          />
        )}
      />
      <Button
        title="Sign In"
        onPress={signinMethods.handleSubmit(props.onSignIn)}
      />
    </View>
  );
};

const AuthScreen = () => {
  const setCredential = useSetAtom(credentialAtom)
  const [activeTab, setActiveTab] = useState(0);
  const router = useRouter();

  const recaptchaRef = useRef<FirebaseRecaptchaVerifierModal>(null);

  const tabs = ["Sign In", "Sign Up"];

  const handleSignUp = async (data: ISignupFormInput) => {
    try {
      let email = data.email
      let target = '/'
      if (data.role === Roles.User) {
        email = `${data.phoneNumber}@garbagecollector.com`
        target = '/user-map'
      }
      if (data.role === Roles.Driver) {
        target = '/driver-map'
      }
      const credential = await createUserWithEmailAndPassword(
        FIREBASE_AUTH,
        email,
        data.password
      );
      setCredential(credential);
      if (credential.user.email) {
        await createUser(credential.user.uid, credential.user.email, data.role)
      }
      router.push(target)
    } catch (error) {
      console.error(error);
    }
  };

  const handleSignIn = async (data: ISigninFormInput) => {
    try {
      let email = data.email
      let target = '/'
      if (data.role === Roles.User) {
        email = `${data.phoneNumber}@garbagecollector.com`
        target = '/user-map'
      }
      if (data.role === Roles.Driver) {
        target = '/driver-map'
      }
      const credential = await signInWithEmailAndPassword(FIREBASE_AUTH, email, data.password)
      setCredential(credential)
      router.push(target)
    } catch (error) {
      console.error(error)
    }
  }

  const createUser = async (uid: string, email: string, role: Roles) => {
    try {
      const doRef = await addDoc(collection(FIREBASE_DB, 'users'), {
        adminCode: 1,
        uid,
        email,
        role
      });
    } catch (e) {
      console.error(e);
    }
  };

  console.log('auth-screen')

  return (
    <View style={styles.container}>
      <TabPills tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
      <View style={styles.formContainer}>
        {activeTab === 0 && (
          <SigninForm onSignIn={handleSignIn} />
        )}
        {activeTab === 1 && <SignupForm onSignUp={handleSignUp} />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  formContainer: {
    marginTop: 40,
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
    fontSize: 16,
  },
  phoneInputContainer: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 20,
    width: "100%",
    backgroundColor: "#f5f5f5",
  },
  phoneInputTextInputStyle: {
    height: 38,
    backgroundColor: "#f5f5f5",
    fontSize: 16,
  },
  phoneInputCodeTextStyle: {
    height: 38,
    lineHeight: 38,
    backgroundColor: "#f5f5f5",
  },
  phoneInputTextContainerStyle: {
    backgroundColor: "#f5f5f5",
  },
  phoneInpuCountryPickerButtonStyle: {
    backgroundColor: "#f5f5f5",
  },
  picker: {},
  dropdown: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 20,
    fontSize: 16,
    color: "red",
  },
  roleSelectedTextStyle: {
    fontSize: 16,
  },
});

export default AuthScreen;
