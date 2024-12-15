// navigation/DrawerNavigator.js
import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import MainFile from './MainFile';
import VerveImg from './verveimg/VerveImg';
import SettingsScreen from './screens/SettingsScreen'; // Add other screens as needed
import UserContent from './screens/UserContent'; // Optional: For custom drawer content

const Drawer = createDrawerNavigator();

const DrawerNavigator = () => {
  return (
    <Drawer.Navigator
      initialRouteName="Main"
      drawerContent={props => <UserContent {...props} />} // Optional
      screenOptions={{
        headerShown: true, // Show header if needed
        // Customize drawer styles here
      }}
    >
      <Drawer.Screen name="Main" component={MainFile} options={{ 
          title: 'Red Products', 
          drawerLabel: 'Red Products' 
        }}  />
      <Drawer.Screen name="VerveImg" component={VerveImg}
      
      options={{ 
        title: 'New Products', 
        drawerLabel: 'New Products' 
      }} 
      />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
      {/* Add more screens as needed */}
    </Drawer.Navigator>
  );
};

export default DrawerNavigator;
