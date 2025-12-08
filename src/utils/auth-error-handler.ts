/**
 * Handles Firebase authentication errors and returns user-friendly messages
 */
export class AuthErrorHandler {
  
  /**
   * Maps Firebase error codes to user-friendly messages for login operations
   */
  static getLoginErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'Usuario no encontrado';
      case 'auth/wrong-password':
        return 'Contraseña incorrecta';
      case 'auth/invalid-email':
        return 'Email inválido';
      default:
        return 'Error al iniciar sesión';
    }
  }

  /**
   * Maps Firebase error codes to user-friendly messages for registration operations
   */
  static getRegisterErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'El email ya está registrado';
      case 'auth/weak-password':
        return 'La contraseña es muy débil';
      case 'auth/invalid-email':
        return 'Email inválido';
      default:
        return 'Error al registrar';
    }
  }

  /**
   * Maps Firebase error codes to user-friendly messages for password reset operations
   */
  static getPasswordResetErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'Usuario no encontrado';
      case 'auth/invalid-email':
        return 'Email inválido';
      default:
        return 'Error al enviar email de recuperación';
    }
  }
}
