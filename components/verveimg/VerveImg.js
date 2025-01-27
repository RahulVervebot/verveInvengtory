// MainFile.js
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Button,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  Dimensions,
  ActivityIndicator,
  TextInput,
} from "react-native";
import * as FileSystem from "expo-file-system";
import * as ImageManipulator from 'expo-image-manipulator';
import BarcodeScanner from './BarcodeScanner'; 
import AsyncStorage from '@react-native-async-storage/async-storage';  
import LogoutButton from "../Logout";
import ImageScanner from "./ImageScanner";
import { useNavigation } from '@react-navigation/native';

const MAX_SIZE_KB = 50;

const VerveImg = () => {
  const navigation = useNavigation();

  // Local data state for new entries
  const [data, setData] = useState([
    {
      barcode: '',
      frontImage: '',
      backImage: '',
      images: '',
    }
  ]);
  
  // State to keep track of existing items count from the API
  const [existingCount, setExistingCount] = useState(0);
  
  const [folderName, setFolderName] = useState(null);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState(null);
  const [loading, setLoading] = useState(false); 
  const [scanningIndex, setScanningIndex] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isImage, setIsImage] = useState(false);
  const [isBarcodeModalVisible, setIsBarcodeModalVisible] = useState(false);
  const [currentEditingIndex, setCurrentEditingIndex] = useState(null);
  const [newBarcodeValue, setNewBarcodeValue] = useState("");

  const deviceWidth = Dimensions.get("window").width;

  // Fetch folderName from AsyncStorage on component mount
  useEffect(() => {
    const getFolderName = async () => {
      try {
        const storedFolderName = await AsyncStorage.getItem('folderName');
        if (storedFolderName) {
          setFolderName(storedFolderName);
        } else {
          Alert.alert("Error", "Folder name not set.");
        }
      } catch (error) {
        console.error("Error retrieving folder name:", error);
        Alert.alert("Error", "Failed to retrieve folder name.");
      }
    };

    getFolderName();
  }, []);

  // Fetch data from API when folderName changes
  useEffect(() => {
    if (folderName) {
      fetchData();
    }
  }, [folderName]);

  // Function to fetch data from the API and set existingCount
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`https://b09f8zu7hj.execute-api.us-east-1.amazonaws.com/default/notfoundproductslist?folderName=${folderName}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const fetchedData = await response.json();
      console.log("Fetched Data:", fetchedData); // For debugging

      // Ensure the API response has 'data' as an array
      if (fetchedData && Array.isArray(fetchedData.data)) {
        setExistingCount(fetchedData.data.length);
        console.log(`Existing items count: ${fetchedData.data.length}`);
      } else {
        throw new Error("API response does not contain a 'data' array.");
      }

    } catch (error) {
      console.error("Error fetching data:", error);
      Alert.alert("Error", `Failed to fetch data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleScannedBarcode = (scannedData) => {
    if (scanningIndex !== null) {
      const updatedData = [...data];
      updatedData[scanningIndex].barcode = scannedData;
      setData(updatedData);
      setScanningIndex(null);
      setIsScanning(false);
    }
  };

  const compressImage = async (uri) => {
    try {
      let width = 2400;
      let quality = 0.5;
      let resizedImage = null;
      const maxAttempts = 10;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        resizedImage = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width } }],
          { compress: quality, format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );

        const base64 = resizedImage.base64;
        const base64Length = base64.length * (3/4) - (base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0);
        const sizeInKB = base64Length / 1024;
        
        if (sizeInKB <= MAX_SIZE_KB) {
          console.log(`Compressed under ${MAX_SIZE_KB}KB at width=${width}, quality=${quality}, size=${sizeInKB.toFixed(2)}KB`);
          return resizedImage;
        }

        width = Math.max(100, Math.floor(width / 2));
        quality = Math.max(0.1, quality - 0.1);
      }

      console.warn(`Could not get under ${MAX_SIZE_KB}KB after ${maxAttempts} attempts, returning smallest.`);
      return resizedImage;
    } catch (error) {
      console.error('Error compressing image:', error);
      throw error;
    }
  };

  const handleImagePress = (uri) => {
    setSelectedImageUri(uri);
    setIsImageModalVisible(true);
  };

  const handleCloseScanner = () => {
    setIsScanning(false);
    setScanningIndex(null);
  };
  
  const handleCloseImage = () => {
    setIsImage(false);
    setScanningIndex(null);
  };

  const handleBarCodeScanned = ({ type, data: barcodeData }) => {
    if (scanningIndex !== null) {
      const updatedData = [...data];
      updatedData[scanningIndex].barcode = barcodeData;
      setData(updatedData);
      setScanningIndex(null);
      setIsScanning(false);
      Alert.alert("Barcode scanned", `Data: ${barcodeData}`);
    }
  };

  const handlePictureTaken = async (pictureBase64, type) => {
    try {
      const tempUri = FileSystem.cacheDirectory + 'tempImage.jpg';
      await FileSystem.writeAsStringAsync(tempUri, pictureBase64, { encoding: FileSystem.EncodingType.Base64 });
      
      const compressedImage = await compressImage(tempUri);

      if (scanningIndex !== null) {
        const updatedData = [...data];
        if (type === 'front') {
          updatedData[scanningIndex].frontImage = `data:image/jpeg;base64,${compressedImage.base64}`;
        } else if (type === 'back') {
          updatedData[scanningIndex].backImage = `data:image/jpeg;base64,${compressedImage.base64}`;
        }
        setData(updatedData);
      }
    } catch (error) {
      console.error("Error compressing scanned picture:", error);
      Alert.alert("Error", "Failed to compress scanned image.");
    }
  };
  
  const handleStartScanning = (index) => {
    setScanningIndex(index);
    setIsScanning(true);
  };
  
  const handleStartImage = (index) => {
    setScanningIndex(index);
    setIsImage(true);
  };

  const handleViewURLImage = (base64Image) => {
    setSelectedImageUri(base64Image);
    setIsImageModalVisible(true);
  };

  const handleUpdate = async (item, index) => {
    if (!folderName) {
      Alert.alert("Error", "Folder name not set.");
      return;
    }

    try {
      let frontBase64Image = "";
      if (item.frontImage) {
        const frontParts = item.frontImage.split(',');
        frontBase64Image = frontParts.length > 1 ? frontParts[1] : frontParts[0];
      }
  
      let backBase64Image = "";
      if (item.backImage) {
        const backParts = item.backImage.split(',');
        backBase64Image = backParts.length > 1 ? backParts[1] : backParts[0];
      }

      // Handle indexing if barcode is empty
      let barcodeToPost = item.barcode;
      if (!barcodeToPost.trim()) {
        // Assign an index-based barcode starting from existingCount + 1
        barcodeToPost = `INDEX_${existingCount + index + 1}`; // Example: INDEX_1, INDEX_2, etc.
      }

      console.log('Updating row:', index+1, 'barcode:', barcodeToPost, 'frontImage size:', frontBase64Image.length, 'backImage size:', backBase64Image.length);
  
      const body = {
        folderName: folderName,
        row: (existingCount + index + 1).toString(), // Adjust row number based on existingCount
        barcode: barcodeToPost,
        frontImage: frontBase64Image || "",
        backImage: backBase64Image || "",
      };
  
      const response = await fetch(
        "https://b09f8zu7hj.execute-api.us-east-1.amazonaws.com/default/notfoundproductslist",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const responseData = await response.json();
      Alert.alert("Success", "Data updated successfully.");
      console.log("Update response:", responseData);

      // After successful post, add a new empty row
      const updatedData = [...data];
      updatedData.push({
        barcode: '',
        frontImage: '',
        backImage: '',
        images: ''
      });
      setData(updatedData);

    } catch (error) {
      console.error("Error updating data:", error);
      Alert.alert("Error", `Failed to update data: ${error.message}`);
    }
  };
  

  const handleEditBarcode = (index) => {
    setCurrentEditingIndex(index);
    setNewBarcodeValue(data[index].barcode || "");
    setIsBarcodeModalVisible(true);
  };

  const handleBarcodeUpdate = () => {
    if (currentEditingIndex === null) {
      Alert.alert("Error", "No barcode selected for updating.");
      return;
    }

    if (!newBarcodeValue.trim()) {
      Alert.alert("Validation Error", "Barcode cannot be empty.");
      return;
    }

    const updatedData = [...data];
    updatedData[currentEditingIndex].barcode = newBarcodeValue;
    setData(updatedData);
    setIsBarcodeModalVisible(false);
    handleUpdate(updatedData[currentEditingIndex], currentEditingIndex);
  };

  const handleRefresh = async () => {
    Alert.alert(
      "Confirm Refresh",
      "Are you sure you want to refresh? This will clear current data and fetch the latest data from the server.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "OK", 
          onPress: async () => {
            setLoading(true);
            try {
              // Clear current local data
              setData([{
                barcode: '',
                frontImage: '',
                backImage: '',
                images: '',
              }]);

              // Re-fetch data from the API to reset existingCount
              await fetchData();
            } catch (error) {
              console.error("Error during refresh:", error);
              Alert.alert("Error", `Failed to refresh data: ${error.message}`);
            } finally {
              setLoading(false);
            }
          } 
        }
      ]
    );
  };

  const apiHeaders = [
    "Barcode",
    "Image",
    "Update", 
    "Front Image",
    "Back Image",
  ];

  const renderHeader = () => (
    <View style={styles.row}>
      {apiHeaders.map((header) => (
        <Text style={[styles.cell, styles.headerCell]} key={header}>
          {header}
        </Text>
      ))}
    </View>
  );

  const renderItem = ({ item, index }) => (
    <View style={styles.row}>
      <View style={styles.cell}>
        {item.barcode ? (
          <TouchableOpacity onPress={() => handleEditBarcode(index)}>
            <Text>{item.barcode}</Text>
          </TouchableOpacity>
        ) : 
        <TouchableOpacity onPress={() => handleStartScanning(index)}>
          <Text style={styles.actionText}>Scan</Text>
        </TouchableOpacity>
        }
      </View>
      <View style={styles.cell}>
        <TouchableOpacity onPress={() => handleStartImage(index)}>
          <Text style={styles.actionText}>Scan Image</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.cell}>
        <TouchableOpacity onPress={() => handleUpdate(item, index)}>
          <Text style={styles.actionText}>Update</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.cell}>
        {item.frontImage ? (
          <TouchableOpacity onPress={() => handleImagePress(item.frontImage)}>
            <Text style={styles.actionText}>View Front Image</Text>
          </TouchableOpacity>
        ) : ''}
      </View>

      <View style={styles.cell}>
        {item.backImage ? (
          <TouchableOpacity onPress={() => handleImagePress(item.backImage)}>
            <Text style={styles.actionText}>View Back Image</Text>
          </TouchableOpacity>
        ) : ''}
      </View>

    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView horizontal>
        <FlatList
          data={data}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
        />
      </ScrollView>

      {/* Barcode Edit Modal */}
      <Modal
        visible={isBarcodeModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsBarcodeModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Edit Barcode</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter new barcode"
              value={newBarcodeValue}
              onChangeText={setNewBarcodeValue}
              keyboardType="default"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.updateButton}
                onPress={handleBarcodeUpdate}
              >
                <Text style={styles.buttonText}>Update</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsBarcodeModalVisible(false)}
              >
                <Text style={styles.closeModalText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Barcode Scanner Modal */}
      <Modal visible={isScanning} animationType="slide">
        <BarcodeScanner 
          onBarcodeScanned={handleScannedBarcode} 
          onClose={handleCloseScanner} 
          onPictureTaken={handlePictureTaken} 
        />

        <TouchableOpacity
          style={styles.closeScannerButton}
          onPress={() => {
            setIsScanning(false);
            setScanningIndex(null);
          }}
        >
          <Text style={styles.closeModalText}>Close Scanner</Text>
        </TouchableOpacity>
      </Modal>

      {/* Image Scanner Modal */}
      <Modal visible={isImage} animationType="slide">
        <ImageScanner 
          onClose={handleCloseImage} 
          onPictureTaken={handlePictureTaken} 
        />

        <TouchableOpacity
          style={styles.closeScannerButton}
          onPress={() => {
            setIsImage(false);
            setScanningIndex(null);
          }}
        >
          <Text style={styles.closeModalText}>Close Camera</Text>
        </TouchableOpacity>
      </Modal>

      {/* Loading Indicator */}
      {loading && <ActivityIndicator style={styles.loadingIndicator} />}

      {/* Refresh Button and Logout */}
      <Button title="Refresh" onPress={handleRefresh} disabled={loading} />

      {/* Image Modal */}
      <Modal
        visible={isImageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsImageModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            {selectedImageUri && (
              <Image source={{ uri: selectedImageUri }} style={styles.fullImage} />
            )}
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setIsImageModalVisible(false)}
            >
              <Text style={styles.closeModalText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Styles remain unchanged
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: "#fff",
  },
  row: {
    flexDirection: "row",
  },
  cell: {
    width: 120,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCell: {
    backgroundColor: "#f0f0f0",
    fontWeight: "bold",
  },
  actionText: {
    color: "blue",
    textDecorationLine: "underline",
    marginTop: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  fullImage: {
    width: "100%",
    height: 300,
    resizeMode: "contain",
    marginBottom: 20,
  },
  closeModalButton: {
    backgroundColor: "#2196F3",
    padding: 10,
    borderRadius: 5,
  },
  closeModalText: {
    color: "#fff",
    fontSize: 16,
  },
  heading: {
    fontSize: 24,
    alignSelf: "center",
    margin: 30,
    fontWeight: "bold",
  },
  loadingIndicator: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -25,
    marginTop: -25,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  textInput: {
    width: "100%",
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  updateButton: {
    backgroundColor: "#28a745",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 5,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#dc3545",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginLeft: 5,
    alignItems: "center",
  },
  closeScannerButton: {
    backgroundColor: "#ff6347",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    margin: 10,
  },
});

export default VerveImg;
