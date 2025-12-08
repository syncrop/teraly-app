# Architecture Overview

## Before Refactoring

```
┌─────────────────────────────────────────────────────────────┐
│                    MONOLITHIC STRUCTURE                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  auth.service.ts (220 lines)                                │
│  ├─ Authentication logic                                     │
│  ├─ Token management (sessionStorage)                       │
│  ├─ Error handling (switch statements)                      │
│  └─ User data management                                     │
│                                                              │
│  moods.component.ts (168 lines)                             │
│  ├─ UI logic                                                 │
│  ├─ Mood data definitions                                    │
│  ├─ Question configurations                                  │
│  └─ State management                                         │
│                                                              │
│  register.component.ts (120 lines)                          │
│  ├─ Form management                                          │
│  ├─ Custom validators                                        │
│  └─ UI state                                                 │
│                                                              │
│  search.component.ts (115 lines)                            │
│  ├─ UI logic                                                 │
│  ├─ Mock data arrays                                         │
│  ├─ Filtering algorithms                                     │
│  └─ State management                                         │
│                                                              │
│  firebase.service.ts (106 lines)                            │
│  ├─ Authentication (duplicate)                               │
│  ├─ User operations                                          │
│  └─ Appointment operations                                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## After Refactoring

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         MODULAR ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │                        SERVICES LAYER                         │     │
│  ├──────────────────────────────────────────────────────────────┤     │
│  │  auth.service.ts (205 lines)                                  │     │
│  │  └─ Core authentication logic only                            │     │
│  │                                                               │     │
│  │  token-storage.service.ts (64 lines) ◄──┐                   │     │
│  │  └─ Centralized token operations          │                  │     │
│  │                                            │                  │     │
│  │  user.service.ts (45 lines)                │                  │     │
│  │  └─ User profile operations                │                  │     │
│  │                                            │                  │     │
│  │  appointment.service.ts (48 lines)         │                  │     │
│  │  └─ Appointment CRUD                       │                  │     │
│  └────────────────────────────────────────────┼──────────────────┘     │
│                                                │                         │
│  ┌────────────────────────────────────────────┼──────────────────┐     │
│  │                      MODELS LAYER           │                  │     │
│  ├────────────────────────────────────────────┼──────────────────┤     │
│  │  mood.model.ts (31 lines)                  │                  │     │
│  │  └─ Mood, MoodQuestion, MoodEntry          │                  │     │
│  │                                             │                  │     │
│  │  appointment.model.ts (11 lines)           │                  │     │
│  │  └─ Appointment interface                  │                  │     │
│  │                                             │                  │     │
│  │  doctor.model.ts (11 lines)                │                  │     │
│  │  └─ Doctor interface                       │                  │     │
│  │                                             │                  │     │
│  │  client.model.ts (9 lines)                 │                  │     │
│  │  └─ Client interface                       │                  │     │
│  └────────────────────────────────────────────┼──────────────────┘     │
│                                                │                         │
│  ┌────────────────────────────────────────────┼──────────────────┐     │
│  │                    UTILITIES LAYER          │                  │     │
│  ├────────────────────────────────────────────┼──────────────────┤     │
│  │  auth-error-handler.ts (51 lines)          │                  │     │
│  │  └─ Firebase error code mapping            │                  │     │
│  │                                             │                  │     │
│  │  search-filters.ts (54 lines)              │                  │     │
│  │  └─ Filtering algorithms                   │                  │     │
│  └────────────────────────────────────────────┼──────────────────┘     │
│                                                │                         │
│  ┌────────────────────────────────────────────┼──────────────────┐     │
│  │                   VALIDATORS LAYER          │                  │     │
│  ├────────────────────────────────────────────┼──────────────────┤     │
│  │  password-validators.ts (26 lines)         │                  │     │
│  │  └─ Form validation functions              │                  │     │
│  └────────────────────────────────────────────┼──────────────────┘     │
│                                                │                         │
│  ┌────────────────────────────────────────────┼──────────────────┐     │
│  │                 CONFIGURATION LAYER         │                  │     │
│  ├────────────────────────────────────────────┼──────────────────┤     │
│  │  mood.config.ts (59 lines)                 │                  │     │
│  │  └─ Mood options & questions config        │                  │     │
│  └────────────────────────────────────────────┼──────────────────┘     │
│                                                │                         │
│  ┌────────────────────────────────────────────┼──────────────────┐     │
│  │                      DATA LAYER             │                  │     │
│  ├────────────────────────────────────────────┼──────────────────┤     │
│  │  mock-data.ts (62 lines)                   │                  │     │
│  │  └─ Mock doctors & clients                 │                  │     │
│  └────────────────────────────────────────────┼──────────────────┘     │
│                                                │                         │
│  ┌────────────────────────────────────────────▼──────────────────┐     │
│  │                    COMPONENTS LAYER                            │     │
│  ├───────────────────────────────────────────────────────────────┤     │
│  │  moods.component.ts (57 lines)                                │     │
│  │  └─ UI logic only ◄─────┬─ mood.model.ts                    │     │
│  │                          └─ mood.config.ts                    │     │
│  │                                                               │     │
│  │  search.component.ts (42 lines)                              │     │
│  │  └─ UI logic only ◄─────┬─ mock-data.ts                     │     │
│  │                          ├─ search-filters.ts                │     │
│  │                          ├─ doctor.model.ts                  │     │
│  │                          └─ client.model.ts                  │     │
│  │                                                               │     │
│  │  register.component.ts (104 lines)                           │     │
│  │  └─ Form & UI ◄─────────┬─ password-validators.ts           │     │
│  │                          └─ auth.service.ts                  │     │
│  └───────────────────────────────────────────────────────────────┘     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Dependency Flow

```
┌─────────────┐
│ Components  │
└──────┬──────┘
       │ depends on
       ▼
┌─────────────┐      ┌──────────────┐
│  Services   │◄─────┤  Validators  │
└──────┬──────┘      └──────────────┘
       │ depends on
       ▼
┌─────────────┐      ┌──────────────┐      ┌──────────────┐
│   Models    │◄─────┤    Config    │◄─────┤     Data     │
└─────────────┘      └──────────────┘      └──────────────┘
       ▲
       │ used by
       │
┌──────┴──────┐
│  Utilities  │
└─────────────┘
```

## Module Interactions

### Authentication Flow
```
┌──────────────┐
│  Component   │
└──────┬───────┘
       │ 1. Login request
       ▼
┌──────────────────┐
│  AuthService     │
└──────┬───────────┘
       │ 2. On success
       ▼
┌──────────────────────┐      ┌────────────────────┐
│ TokenStorageService  │◄─────┤ AuthErrorHandler   │
└──────────────────────┘      └────────────────────┘
       │                       ▲
       │ 3. Store tokens       │ 2b. On error
       ▼                       │
┌──────────────────────┐      │
│   sessionStorage     │      │
└──────────────────────┘      │
                               └─────┐
                                     │
                              ┌──────▼───────┐
                              │  Component   │
                              └──────────────┘
```

### Mood Tracking Flow
```
┌──────────────────┐
│  MoodsComponent  │
└────────┬─────────┘
         │ imports
         ├─────────────────┐
         │                 │
         ▼                 ▼
┌─────────────┐   ┌────────────────┐
│ mood.model  │   │ mood.config    │
│ - Mood      │   │ - MOOD_OPTIONS │
│ - MoodEntry │   │ - QUESTIONS    │
└─────────────┘   └────────────────┘
```

### Search Flow
```
┌────────────────────┐
│  SearchComponent   │
└─────────┬──────────┘
          │ imports
          ├──────────────────┬─────────────┐
          │                  │             │
          ▼                  ▼             ▼
┌──────────────┐   ┌────────────────┐   ┌─────────────────┐
│  mock-data   │   │ search-filters │   │ doctor.model    │
│ - DOCTORS    │   │ - filterDoctors│   │ client.model    │
│ - CLIENTS    │   │ - filterClients│   │                 │
└──────────────┘   └────────────────┘   └─────────────────┘
```

## Benefits of New Architecture

### 1. Separation of Concerns
```
Before: Component + Data + Logic + Config (168 lines)
After:  Component (57) + Models (31) + Config (59) = 147 lines
Result: Same functionality, better organization, easier to maintain
```

### 2. Reusability
```
TokenStorageService
├─ Used by: AuthService
├─ Can be used by: Any service needing token management
└─ Testable: Independently without Angular

AuthErrorHandler
├─ Used by: AuthService
├─ Can be used by: Any component handling Firebase errors
└─ Testable: Pure static methods, no dependencies
```

### 3. Testability
```
# Before
test(AuthService)
  ├─ Mock: Firestore ✓
  ├─ Mock: Auth ✓
  ├─ Mock: Router ✓
  └─ Test: Token management + Error handling + Auth logic ✗ (too complex)

# After
test(AuthService)
  ├─ Mock: Firestore ✓
  ├─ Mock: Auth ✓
  ├─ Mock: Router ✓
  ├─ Mock: TokenStorageService ✓
  └─ Test: Auth logic only ✓ (focused)

test(TokenStorageService)
  └─ Test: Token operations ✓ (no Angular dependencies)

test(AuthErrorHandler)
  └─ Test: Error mapping ✓ (pure functions)
```

### 4. Type Safety
```
# Before
doctors: any[] = [...];
clients: any[] = [...];

# After
doctors: Doctor[] = [...];
clients: Client[] = [...];

interface Doctor {
  id: number;
  name: string;
  specialty: string;
  // ... fully typed
}
```

## Directory Structure

```
src/
├── components/              # UI Components (focused on view logic)
│   ├── auth/
│   │   ├── login/
│   │   ├── register/       ← Uses validators/
│   │   └── forgot-password/
│   ├── page/
│   │   ├── search/         ← Uses data/, utils/, models/
│   │   ├── profile/
│   │   └── ...
│   └── shared/
│       ├── moods/          ← Uses models/, config/
│       ├── footer/
│       └── logo/
│
├── services/               # Business Logic & API Integration
│   ├── auth.service.ts     ← Uses token-storage, utils/
│   ├── token-storage.service.ts
│   ├── user.service.ts
│   ├── appointment.service.ts
│   └── firebase.service.ts (deprecated)
│
├── models/                 # Type Definitions & Interfaces
│   ├── mood.model.ts
│   ├── appointment.model.ts
│   ├── doctor.model.ts
│   └── client.model.ts
│
├── config/                 # Application Configuration
│   └── mood.config.ts
│
├── utils/                  # Pure Utility Functions
│   ├── auth-error-handler.ts
│   └── search-filters.ts
│
├── validators/             # Form Validators
│   └── password-validators.ts
│
├── data/                   # Mock Data & Constants
│   └── mock-data.ts
│
└── guards/                 # Route Guards
    └── access.guard.ts
```

## Design Principles Applied

1. **Single Responsibility Principle (SRP)**
   - Each module has one reason to change
   - TokenStorageService: Only token management
   - AuthErrorHandler: Only error mapping
   - MoodsComponent: Only UI rendering

2. **Open/Closed Principle (OCP)**
   - Easy to extend without modifying existing code
   - Add new validators without changing existing ones
   - Add new error codes without changing handler structure

3. **Dependency Inversion Principle (DIP)**
   - Components depend on abstractions (services)
   - Services depend on interfaces (models)
   - Utilities are pure functions (no dependencies)

4. **DRY (Don't Repeat Yourself)**
   - Token management extracted (used to be duplicated)
   - Error handling centralized (was copied in multiple places)
   - Validators reusable across forms

5. **KISS (Keep It Simple, Stupid)**
   - Small, focused modules
   - Clear naming conventions
   - Minimal dependencies

## Conclusion

The new architecture provides a solid foundation for:
- ✅ Easy maintenance
- ✅ Comprehensive testing
- ✅ Code reusability
- ✅ Type safety
- ✅ Future scalability
