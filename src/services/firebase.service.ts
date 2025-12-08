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
import { Observable, from } from 'rxjs';

/**
 * Interfaz que representa un usuario en la base de datos.
 * @interface AppUser
 * @property {string} uid - Identificador único del usuario
 * @property {string} email - Correo electrónico del usuario
 * @property {string} fullName - Nombre completo del usuario
 * @property {('patient' | 'specialist' | 'admin')} role - Rol del usuario
 * @property {any} createdAt - Fecha de creación de la cuenta
 * @property {string} [specialty] - Especialidad médica (solo para especialistas)
 * @property {string} [licenseNumber] - Número de licencia (solo para especialistas)
 * @property {boolean} [isVerified] - Indica si el especialista ha sido verificado
 */
export interface AppUser {
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

/**
 * Interfaz que representa una cita médica.
 * @interface Appointment
 * @property {string} [id] - Identificador único de la cita
 * @property {string} patientId - ID del paciente
 * @property {string} specialistId - ID del especialista
 * @property {any} date - Fecha y hora de la cita
 * @property {('pending' | 'confirmed' | 'completed' | 'cancelled')} status - Estado de la cita
 * @property {string} [notes] - Notas adicionales sobre la cita
 */
export interface Appointment {
  id?: string;
  patientId: string;
  specialistId: string;
  date: any;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
}

/**
 * Servicio para interactuar con Firestore y gestionar usuarios, citas y datos de la aplicación.
 * Proporciona operaciones CRUD para usuarios, citas y especialistas.
 * 
 * @example
 * ```typescript
 * // Inyectar el servicio
 * constructor(private firestoreService: FirestoreService) {}
 * 
 * // Registrar un usuario
 * const uid = await this.firestoreService.registerUser(
 *   'user@example.com',
 *   'password123',
 *   { email: 'user@example.com', fullName: 'John Doe', role: 'patient' }
 * );
 * 
 * // Crear una cita
 * await this.firestoreService.createAppointment({
 *   patientId: 'patient-uid',
 *   specialistId: 'specialist-uid',
 *   date: new Date()
 * });
 * 
 * // Obtener especialistas verificados
 * const specialists = await this.firestoreService.getVerifiedSpecialists();
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class FirestoreService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  // --- AUTENTICACIÓN ---

  /**
   * Registra un nuevo usuario en Firebase Authentication y guarda su perfil en Firestore.
   * Los especialistas quedan sin verificar por defecto.
   * 
   * @param {string} email - Correo electrónico del usuario
   * @param {string} pass - Contraseña del usuario
   * @param {Omit<AppUser, 'uid' | 'createdAt'>} userData - Datos del perfil del usuario
   * @returns {Promise<string>} UID del usuario creado
   * 
   * @example
   * ```typescript
   * const uid = await this.firestoreService.registerUser(
   *   'patient@example.com',
   *   'password123',
   *   {
   *     email: 'patient@example.com',
   *     fullName: 'Jane Doe',
   *     role: 'patient'
   *   }
   * );
   * console.log('Usuario registrado con uid:', uid);
   * ```
   */
  async registerUser(email: string, pass: string, userData: Omit<AppUser, 'uid' | 'createdAt'>) {
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

  /**
   * Obtiene el perfil completo de un usuario desde Firestore.
   * 
   * @param {string} uid - ID del usuario a buscar
   * @returns {Promise<AppUser | undefined>} Datos del usuario o undefined si no existe
   * 
   * @example
   * ```typescript
   * const user = await this.firestoreService.getUserProfile('user-uid-123');
   * if (user) {
   *   console.log('Usuario encontrado:', user.fullName);
   * }
   * ```
   */
  async getUserProfile(uid: string): Promise<AppUser | undefined> {
    const userDoc = await getDoc(doc(this.firestore, 'users', uid));
    return userDoc.data() as AppUser;
  }

  /**
   * Crea una nueva cita médica en Firestore con estado 'pending'.
   * 
   * @param {Omit<Appointment, 'id' | 'status'>} appointment - Datos de la cita (sin id ni status)
   * @returns {Promise<DocumentReference>} Referencia al documento creado
   * 
   * @example
   * ```typescript
   * const appointmentRef = await this.firestoreService.createAppointment({
   *   patientId: 'patient-123',
   *   specialistId: 'specialist-456',
   *   date: new Date('2024-12-15T10:00:00'),
   *   notes: 'Primera consulta'
   * });
   * console.log('Cita creada con ID:', appointmentRef.id);
   * ```
   */
  async createAppointment(appointment: Omit<Appointment, 'id' | 'status'>) {
    const appointmentsRef = collection(this.firestore, 'appointments');
    return addDoc(appointmentsRef, {
      ...appointment,
      status: 'pending',
      createdAt: new Date()
    });
  }

  /**
   * Obtiene todas las citas de un usuario (como paciente o como especialista).
   * 
   * @param {string} uid - ID del usuario
   * @param {('patient' | 'specialist')} role - Rol del usuario (determina el campo de búsqueda)
   * @returns {Promise<Array>} Lista de citas del usuario
   * 
   * @example
   * ```typescript
   * // Obtener citas como paciente
   * const appointments = await this.firestoreService.getMyAppointments('user-123', 'patient');
   * console.log('Citas del paciente:', appointments.length);
   * 
   * // Obtener citas como especialista
   * const myConsultations = await this.firestoreService.getMyAppointments('doctor-456', 'specialist');
   * ```
   */
  async getMyAppointments(uid: string, role: 'patient' | 'specialist') {
    const appointmentsRef = collection(this.firestore, 'appointments');
    const fieldToSearch = role === 'patient' ? 'patientId' : 'specialistId';
    
    const q = query(appointmentsRef, where(fieldToSearch, '==', uid));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  /**
   * Obtiene todos los especialistas que han sido verificados.
   * Útil para mostrar un directorio de especialistas disponibles.
   * 
   * @returns {Promise<AppUser[]>} Lista de especialistas verificados
   * 
   * @example
   * ```typescript
   * const specialists = await this.firestoreService.getVerifiedSpecialists();
   * console.log('Especialistas disponibles:', specialists.length);
   * specialists.forEach(spec => {
   *   console.log(`${spec.fullName} - ${spec.specialty}`);
   * });
   * ```
   */
  async getVerifiedSpecialists() {
    const usersRef = collection(this.firestore, 'users');
    const q = query(
      usersRef, 
      where('role', '==', 'specialist'), 
      where('isVerified', '==', true)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as AppUser);
  }
}