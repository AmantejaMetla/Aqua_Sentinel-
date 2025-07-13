// Firebase configuration with fallbacks for demo mode

// Mock functions for when Firebase is not available
const mockAuth = {
  currentUser: {
    uid: 'demo-user-123',
    email: 'admin@aquasentinel.com',
    displayName: 'Demo Admin'
  }
}

const mockDb = { connected: false }

const mockAuthFunctions = {
  signInWithEmailAndPassword: async (auth, email, password) => {
    if (email === 'admin@aquasentinel.com' && password === 'demo123456') {
      return { 
        user: { 
          uid: 'demo-user', 
          email: 'admin@aquasentinel.com', 
          displayName: 'Demo Admin' 
        } 
      }
    }
    throw new Error('Invalid credentials')
  },
  createUserWithEmailAndPassword: async (auth, email, password) => {
    return { 
      user: { 
        uid: 'new-user', 
        email, 
        displayName: 'New User' 
      } 
    }
  },
  signOut: async (auth) => Promise.resolve(),
  onAuthStateChanged: (auth, callback) => {
    setTimeout(() => {
      callback({ 
        uid: 'demo-user', 
        email: 'admin@aquasentinel.com', 
        displayName: 'Demo Admin' 
      })
    }, 100)
    return () => {} // Unsubscribe function
  },
  updateProfile: async (user, profile) => Promise.resolve()
}

const mockFirestoreFunctions = {
  collection: (db, name) => ({ name }),
  addDoc: async (collection, data) => ({ id: Date.now().toString() }),
  getDocs: async (query) => ({ forEach: (callback) => {} }),
  doc: (db, collection, id) => ({ id }),
  updateDoc: async (doc, data) => Promise.resolve(),
  deleteDoc: async (doc) => Promise.resolve(),
  query: (collection, ...conditions) => ({ collection, conditions }),
  where: (field, operator, value) => ({ field, operator, value }),
  orderBy: (field, direction) => ({ field, direction }),
  limit: (num) => ({ limit: num }),
  serverTimestamp: () => new Date(),
  onSnapshot: (query, callback) => {
    callback({ forEach: () => {} })
    return () => {} // Unsubscribe function
  }
}

// For demo mode, export mock functions
export const auth = mockAuth
export const db = mockDb

// Export all functions
export const {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} = mockAuthFunctions

export const {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot
} = mockFirestoreFunctions

export default {
  auth,
  db,
  ...mockAuthFunctions,
  ...mockFirestoreFunctions
} 