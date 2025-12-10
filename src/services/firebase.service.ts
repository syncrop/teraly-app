import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  getDoc,
  query, 
  where, 
  getDocs,
  Timestamp 
} from '@angular/fire/firestore';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, user } from '@angular/fire/auth';

// Definimos los Tipos de Datos (El esquema de tu DB)
export interface AppUserLegacy {
  uid: string;
  email: string;
  fullName: string;
  role: 'patient' | 'specialist' | 'admin';
  createdAt: any;
  // Campos opcionales para especialistas
  specialty?: string;
  licenseNumber?: string;
  isVerified?: boolean;
}

export interface Appointment {
  id?: string;
  patientId: string;
  specialistId: string;
  date: any;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  // --- AUTENTICACIÓN ---

  // Registro (Crea el usuario en Auth y guarda sus datos en Firestore)
  async registerUser(email: string, pass: string, userData: Omit<AppUserLegacy, 'uid' | 'createdAt'>) {
    // 1. Crear cuenta de seguridad (Email/Pass)
    const credential = await createUserWithEmailAndPassword(this.auth, email, pass);
    const uid = credential.user.uid;

    // 2. Guardar ficha de perfil en base de datos
    const userRef = doc(this.firestore, 'users', uid);
    await setDoc(userRef, {
      uid: uid,
      ...userData,
      createdAt: new Date(),
      isVerified: userData.role === 'specialist' ? false : true // Los médicos requieren verificación
    });

    return uid;
  }

  // --- BASE DE DATOS (CRUD) ---

  // Obtener perfil de un usuario
  async getUserProfile(uid: string): Promise<AppUserLegacy | undefined> {
    const userDoc = await getDoc(doc(this.firestore, 'users', uid));
    return userDoc.data() as AppUserLegacy;
  }

  // Crear una cita nueva
  async createAppointment(appointment: Omit<Appointment, 'id' | 'status'>) {
    const appointmentsRef = collection(this.firestore, 'appointments');
    return addDoc(appointmentsRef, {
      ...appointment,
      status: 'pending',
      createdAt: new Date()
    });
  }

  // Obtener mis citas (Si soy paciente busco por patientId, si soy médico por specialistId)
  async getMyAppointments(uid: string, role: 'patient' | 'specialist') {
    const appointmentsRef = collection(this.firestore, 'appointments');
    const fieldToSearch = role === 'patient' ? 'patientId' : 'specialistId';
    
    const q = query(appointmentsRef, where(fieldToSearch, '==', uid));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  // Obtener todos los especialistas verificados (Para el directorio)
  async getVerifiedSpecialists() {
    const usersRef = collection(this.firestore, 'users');
    const q = query(
      usersRef, 
      where('role', '==', 'specialist'), 
      where('isVerified', '==', true)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as AppUserLegacy);
  }
}