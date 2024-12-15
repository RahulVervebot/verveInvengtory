import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';

const SimpleCategoryPicker = ({ categories }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);

  return (
    <View style={styles.container}>
      <Text>Select Category:</Text>
      <RNPickerSelect
        onValueChange={(value) => setSelectedCategory(value)}
        items={categories.map((category) => ({
          label: category,
          value: category,
        }))}
        placeholder={{
          label: 'Select a category',
          value: '',
        }}
        value={selectedCategory}
        style={{
          inputIOS: styles.pickerIOS,
          inputAndroid: styles.pickerAndroid,
          placeholder: {
            color: '#9EA0A4',
          },
        }}
        useNativeAndroidPickerStyle={false}
      />
      {selectedCategory && <Text>Selected: {selectedCategory}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  pickerIOS: {
    flex: 1,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    color: 'black',
    paddingRight: 30,
    marginTop: 10,
  },
  pickerAndroid: {
    flex: 1,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    color: 'black',
    paddingRight: 30,
    marginTop: 10,
  },
});

export default SimpleCategoryPicker;
