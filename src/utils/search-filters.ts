import { UserRole } from '../services/auth.service';

/**
 * Filters doctors based on search query
 */
export function filterDoctors(doctors: any[], query: string): any[] {
  const lowerQuery = query.toLowerCase();
  return doctors.filter(doc =>
    doc.name.toLowerCase().includes(lowerQuery) ||
    doc.specialty.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Filters clients based on search query
 */
export function filterClients(clients: any[], query: string): any[] {
  const lowerQuery = query.toLowerCase();
  return clients.filter(client =>
    client.name.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Gets filtered results based on user role and selected filter
 */
export function getFilteredResults(
  userRole: UserRole,
  searchQuery: string,
  selectedFilter: string,
  doctors: any[],
  clients: any[]
): any[] {
  if (userRole === 'client') {
    // Clients search for doctors only
    return filterDoctors(doctors, searchQuery);
  } else {
    // Doctors can search for clients and other doctors
    if (selectedFilter === 'doctors') {
      return filterDoctors(doctors, searchQuery);
    } else if (selectedFilter === 'clients') {
      return filterClients(clients, searchQuery);
    } else {
      // 'all' - mix of both
      const docResults = filterDoctors(doctors, searchQuery);
      const clientResults = filterClients(clients, searchQuery);
      return [...docResults, ...clientResults];
    }
  }
}
