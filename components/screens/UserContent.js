// components/CustomDrawerContent.js
import React, { useContext } from 'react';
import { DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons'; // Optional: For icons in the drawer
import { AuthContext } from '../../contexts/AuthContext'; // Adjust the path as needed

const UserContent = (props) => {

  const { logout } = useContext(AuthContext);

  const handleLogout = () => {
    logout();
  };
  return (
    <DrawerContentScrollView {...props}>
      {/* Optional Header */}
      <View style={styles.header}>
        <Icon name="person-circle-outline" size={80} color="#e91e63" />
        <Text style={styles.headerText}>Vervebot Team</Text>
      </View>
      
      {/* Drawer Items */}
      <DrawerItemList {...props} />

      {/* Optional Footer */}
      <DrawerItem
        label="Logout"
        icon={({ color, size }) => (
          <Icon name="log-out-outline" color={color} size={size} />
        )}
        onPress={handleLogout} 
      />
    </DrawerContentScrollView>
  );
};

export default UserContent;

const styles = StyleSheet.create({
  header: {
    height: 150,
    backgroundColor: '#f6f6f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  headerText: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
 