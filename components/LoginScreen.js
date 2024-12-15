// screens/LoginScreen.js
import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, Button, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { AuthContext } from '../contexts/AuthContext'; // Adjust the path as needed
import { useNavigation } from '@react-navigation/native';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const navigation = useNavigation();
  const { login } = useContext(AuthContext); // Access the login function

  useEffect(() => {
    // Fetch the data from the API
    fetch('https://cms.vervebot.io/productlinkingcred.json')
      .then(response => response.json())
      .then(responseData => {
        setData(responseData);
        setIsLoading(false);
        console.log('Fetched Data:', responseData);
      })
      .catch(error => {
        setIsLoading(false);
        setError('Error fetching data');
        console.error('Error fetching data:', error);
      });
  }, []);

  // Handle login logic
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    // Extract the domain from the email (e.g., "info@vervebot.io" => "vervebot.io")
    const emailDomain = email.split('@')[1];
    if (!emailDomain) {
      Alert.alert('Error', 'Invalid email format');
      return;
    }

    // Check if the data is loaded
    if (!data || data.length === 0) {
      Alert.alert('Error', 'No login data available');
      return;
    }

    // Access the first element of the array, which contains the domains
    const domainData = data[0];
    const availableDomains = Object.keys(domainData);

    console.log('Available domains:', availableDomains);

    // Check if the domain exists in the API data
    if (!availableDomains.includes(emailDomain)) {
      Alert.alert('Error', `Domain ${emailDomain} not found`);
      return;
    }

    const domainDetails = domainData[emailDomain];
    console.log('Domain Data:', domainDetails);

    // Check if the email and password match
    let isValid = false;
    let folderName = '';

    domainDetails.forEach(item => {
      for (const key in item) {
        const [storedEmail, storedPassword, storedFolderName] = item[key].split(',');
        if (storedEmail === email && storedPassword === password) {
          isValid = true;
          folderName = storedFolderName;
        }
      }
    });

    if (isValid) {
      try {
        await login(folderName); // Use the login function from context
        Alert.alert('Success', 'Login successful');
        // No need to navigate manually; AppNavigator will re-render based on auth state
      } catch (error) {
        Alert.alert('Error', 'Failed to log in');
        console.error('Login error:', error);
      }
    } else {
      Alert.alert('Error', 'Invalid email or password');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Button title="Login" onPress={handleLogin} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    justifyContent: 'center',
  },
  centered: {
    padding: 20,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    marginBottom: 5,
    fontSize: 16,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 15,
    paddingLeft: 10,
    borderRadius: 5,
  },
});

export default LoginScreen;
