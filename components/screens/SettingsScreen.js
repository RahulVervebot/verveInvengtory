// screens/SettingsScreen.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const SettingsScreen = () => {
  const navigation = useNavigation();

  const openDrawer = () => {
    navigation.openDrawer();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={openDrawer} style={styles.hamburger}>
        <Icon name="menu" size={30} color="#000" />
      </TouchableOpacity>
      <Text style={styles.title}>Settings Screen</Text>
    </View>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  hamburger: {
    position: 'absolute',
    top: 40, // Adjust based on your status bar
    left: 20,
  },
  title: {
    fontSize: 24,
  },
});
