import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';

// Products Collection
export const productsCollection = collection(db, 'products');

export const addProduct = async (productData, userId) => {
  try {
    console.log('Adding product to Firebase...', { userId, productData });
    const docRef = await addDoc(productsCollection, {
      ...productData,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log('Product added successfully:', docRef.id);
    return docRef;
  } catch (error) {
    console.error('Error adding product:', error);
    throw error;
  }
};

export const getUserProducts = async (userId) => {
  try {
    console.log('Fetching products for user:', userId);
    
    // Simple query without orderBy first to test
    const q = query(
      productsCollection, 
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const products = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log('Products fetched successfully:', products.length);
    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    throw error;
  }
};

export const updateProduct = async (productId, updates) => {
  try {
    console.log('Updating product:', productId);
    const productRef = doc(db, 'products', productId);
    await updateDoc(productRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    console.log('Product updated successfully');
    return { id: productId, ...updates };
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

export const deleteProduct = async (productId) => {
  try {
    console.log('Deleting product:', productId);
    await deleteDoc(doc(db, 'products', productId));
    console.log('Product deleted successfully');
    return productId;
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

// Competitor Tracking
export const competitorsCollection = collection(db, 'competitors');

export const addCompetitor = async (competitorData, userId) => {
  return await addDoc(competitorsCollection, {
    ...competitorData,
    userId,
    createdAt: serverTimestamp()
  });
};

export const getUserCompetitors = async (userId) => {
  const q = query(
    competitorsCollection, 
    where('userId', '==', userId)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

// Price History
export const priceHistoryCollection = collection(db, 'priceHistory');

export const addPricePoint = async (productId, priceData) => {
  return await addDoc(priceHistoryCollection, {
    productId,
    ...priceData,
    timestamp: serverTimestamp()
  });
};

export const getProductPriceHistory = async (productId) => {
  const q = query(
    priceHistoryCollection,
    where('productId', '==', productId),
    orderBy('timestamp', 'asc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

// User Settings
export const userSettingsCollection = collection(db, 'userSettings');

export const saveUserSettings = async (userId, settings) => {
  try {
    const settingsRef = doc(db, 'userSettings', userId);
    await setDoc(
      settingsRef,
      {
        ...settings,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
    return { id: userId, ...settings };
  } catch (error) {
    console.error('Error saving user settings:', error);
    throw new Error(error?.message || 'Failed to save user settings. Please try again.');
  }
};

export const getUserSettings = async (userId) => {
  const settingsRef = doc(db, 'userSettings', userId);
  const settingsSnap = await getDoc(settingsRef);
  
  if (settingsSnap.exists()) {
    return settingsSnap.data();
  } else {
    // Return default settings
    return {
      currency: 'USD',
      profitMarginTarget: 30,
      alertThreshold: 10
    };
  }
};