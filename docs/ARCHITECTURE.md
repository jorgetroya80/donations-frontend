# Architecture — Donations Frontend

A React 19 SPA for managing church donations, expenses, and financial reports. Built with TypeScript, Vite, and a feature-driven module structure.

---

## Tech Stack

| Concern       | Library               | Version |
| ------------- | --------------------- | ------- |
| UI Library    | React                 | 19.2.5  |
| Language      | TypeScript            | 5.x     |
| Build Tool    | Vite                  | 8.0.9   |
| Routing       | React Router          | 7.14.1  |
| Server State  | TanStack React Query  | 5.99.2  |
| Forms         | React Hook Form       | 7.73.1  |
| Schema valid  | Zod                   | 4.3.6   |
| HTTP Client   | ky                    | 2.0.1   |
| Styling       | Tailwind CSS          | 4.2.2   |
| UI Primitives | Base UI               | 1.4.1   |
| Charts        | Recharts              | 3.8.0   |
| Icons         | Lucide React          | 1.8.0   |
| i18n          | react-i18next         | 17.0.4  |
| Dates         | Day.js                | 1.11.20 |
| Linting       | Biome                 | 2.4.12  |
| Testing       | Vitest                | 4.1.5   |
|               | React Testing Library | 16.3.2  |
| API Mocking   | MSW                   | 2.13.4  |

---

## Project Structure

```
src/
├── App.tsx                  # Root: provider tree + route declarations
├── main.tsx                 # Entry point
│
├── features/                # Feature modules (self-contained slices)
│   ├── auth/                # Login, protected routes, role guards, auth context
│   ├── dashboard/           # Home page with role-conditional stats
│   ├── donations/           # CRUD + duplicate detection
│   ├── donors/              # CRUD for donor master data
│   ├── expenses/            # CRUD for expense records
│   ├── reports/             # Financial summaries and charts
│   ├── settings/            # Change password
│   ├── theme/               # Dark/light mode context
│   └── users/               # Admin user management
│
├── layouts/
│   ├── app-layout.tsx       # Sidebar + Header + <Outlet>
│   ├── header.tsx           # Top navigation bar
│   └── sidebar.tsx          # Left nav with role-filtered links
│
├── components/
│   ├── ui/                  # Base UI components (Button, Input, Table, etc.)
│   ├── date-range-picker.tsx
│   ├── empty-state.tsx
│   └── skeleton.tsx
│
├── lib/
│   ├── api.ts               # ky HTTP client instance
│   ├── api-types.ts         # TypeScript interfaces for all API contracts
│   ├── permissions.ts       # Role-check functions (RBAC)
│   ├── formatters.ts        # Currency, date helpers
│   ├── parse-api-field-errors.ts  # Maps API validation errors to form fields
│   ├── i18n.ts              # i18next configuration (Spanish)
│   └── utils.ts             # cn() — Tailwind class merging
│
├── locales/
│   └── es.json              # Spanish translations
│
└── test/
    ├── setup.ts             # Vitest global setup
    ├── msw-server.ts        # MSW server instance
    ├── msw-handlers.ts      # API mock handlers
    └── test-utils.tsx       # render() wrapper with providers
```

---

## Application Layers

```mermaid
graph TD
    Browser["Browser"]

    subgraph React["React Application"]
        Providers["Provider Tree\n(QueryClient · Theme · Auth · Tooltip)"]
        Router["React Router\n(BrowserRouter)"]
        Guards["Route Guards\n(ProtectedRoute · RoleRoute)"]
        Layout["AppLayout\n(Sidebar + Header + Outlet)"]
        Pages["Feature Pages\n(Dashboard · Donations · Donors…)"]
        Hooks["React Query Hooks\n(useQuery · useMutation)"]
        APIClient["API Client\nky — /api/v1"]
    end

    Backend["Backend REST API\n(/api/v1)"]

    Browser --> Providers
    Providers --> Router
    Router --> Guards
    Guards --> Layout
    Layout --> Pages
    Pages --> Hooks
    Hooks --> APIClient
    APIClient -->|"HTTP (credentials: include)"| Backend
```

---

## Component Hierarchy

```mermaid
graph TD
    App["App.tsx"]
    QCP["QueryClientProvider"]
    TP["ThemeProvider"]
    AP["AuthProvider"]
    TTP["TooltipProvider"]
    BR["BrowserRouter"]
    PR["ProtectedRoute"]
    AL["AppLayout"]
    SB["Sidebar"]
    HD["Header"]
    OUT["&lt;Outlet&gt;"]

    Pages["Feature Pages\n(DashboardPage · DonationsPage\nDonorCreatePage · ReportsPage…)"]
    Forms["Feature Forms\n(DonationForm · DonorForm\nExpenseForm · UserForm)"]
    Tables["Feature Tables\n(with pagination + filters)"]
    UIComp["UI Components\n(Button · Input · Card · Table\nDialog · Select · Badge…)"]

    App --> QCP --> TP --> AP --> TTP --> BR
    BR --> PR --> AL
    AL --> SB
    AL --> HD
    AL --> OUT
    OUT --> Pages
    Pages --> Forms
    Pages --> Tables
    Forms --> UIComp
    Tables --> UIComp
```

---

## Routing & Access Control

```mermaid
graph TD
    Root["/  (BrowserRouter)"]
    Login["/login  ·  LoginPage\n🔓 public"]
    PR["ProtectedRoute\n(checks AuthContext)"]
    AL["AppLayout"]

    D["/  ·  DashboardPage"]
    SP["/settings/password  ·  ChangePasswordPage"]

    RR1["RoleRoute\ncanRecordData()\nOPERATOR or TREASURER"]
    Don["/donations  ·  DonationsPage"]
    DonNew["/donations/new  ·  DonationCreatePage"]
    DonEdit["/donations/:id/edit  ·  DonationEditPage"]
    Donor["/donors  ·  DonorsPage"]
    DonorNew["/donors/new  ·  DonorCreatePage"]
    DonorEdit["/donors/:id/edit  ·  DonorEditPage"]
    Exp["/expenses  ·  ExpensesPage"]
    ExpNew["/expenses/new  ·  ExpenseCreatePage"]
    ExpEdit["/expenses/:id/edit  ·  ExpenseEditPage"]

    RR2["RoleRoute\ncanViewReports()\nTREASURER or PASTOR"]
    Rep["/reports  ·  ReportsPage"]

    RR3["RoleRoute\ncanManageUsers()\nADMIN only"]
    Usr["/users  ·  UsersPage"]
    UsrNew["/users/new  ·  UserCreatePage"]
    UsrEdit["/users/:id/edit  ·  UserEditPage"]

    Catch["/* → redirect /"]

    Root --> Login
    Root --> PR --> AL
    AL --> D
    AL --> SP
    AL --> RR1
    RR1 --> Don
    RR1 --> DonNew
    RR1 --> DonEdit
    RR1 --> Donor
    RR1 --> DonorNew
    RR1 --> DonorEdit
    RR1 --> Exp
    RR1 --> ExpNew
    RR1 --> ExpEdit
    AL --> RR2 --> Rep
    AL --> RR3
    RR3 --> Usr
    RR3 --> UsrNew
    RR3 --> UsrEdit
    Root --> Catch
```

---

## State Management

Three independent state layers, each with a distinct scope:

| Layer             | Tool                           | Persistence      | Scope            |
| ----------------- | ------------------------------ | ---------------- | ---------------- |
| Server state      | TanStack React Query           | Memory (cache)   | All API data     |
| Auth / Theme / UI | React Context + `localStorage` | localStorage     | Session lifetime |
| Form state        | React Hook Form                | Component memory | Form lifetime    |

### Server State (React Query)

- Each feature exposes query/mutation hooks (e.g., `useDonations`, `useCreateDonation`).
- `QueryClient` is configured globally with `retry: false` and `refetchOnWindowFocus: false`.
- Mutations invalidate the parent collection query on success, keeping the list in sync.

### Auth & Theme (Context + localStorage)

- `AuthProvider` (`src/features/auth/auth-context.tsx`) stores the current user and exposes `login` / `logout`.
- `ThemeProvider` (`src/features/theme/theme-context.tsx`) persists dark/light preference under key `theme`.
- The sidebar collapse state is persisted under key `sidebar_collapsed`.

### Form State (React Hook Form)

- Each form defines a Zod schema in `*-schema.ts`.
- `useForm` is initialized with `zodResolver(schema)`.
- On submit: Zod validates locally, then the mutation fires. If the backend returns field-level errors, `parseApiFieldErrors()` maps them back to form fields.

---

## Authentication Flow

```mermaid
sequenceDiagram
    actor User
    participant LoginPage
    participant AuthContext
    participant localStorage
    participant API as Backend /api/v1

    User->>LoginPage: Enter credentials
    LoginPage->>API: POST /login { username, password }
    alt success (200)
        API-->>LoginPage: UserResponse
        LoginPage->>AuthContext: login(user)
        AuthContext->>localStorage: set auth_user
        LoginPage->>User: redirect to /
    else failure (401)
        API-->>LoginPage: 401
        LoginPage->>User: show error message
    end

    note over AuthContext,API: Any subsequent 401 (non-login)
    API-->>AuthContext: 401 (via ky afterResponse hook)
    AuthContext->>localStorage: remove auth_user
    AuthContext->>User: redirect to /login
```

---

## Data Flow: Create Entity

Applies to donations, donors, expenses, and users.

```mermaid
sequenceDiagram
    actor User
    participant Form as Feature Form\n(React Hook Form + Zod)
    participant Mutation as useMutation\n(React Query)
    participant Client as api client (ky)
    participant API as Backend /api/v1
    participant Cache as Query Cache

    User->>Form: Fill fields and submit
    Form->>Form: Zod schema validation
    alt validation fails
        Form->>User: Show inline field errors
    else validation passes
        Form->>Mutation: mutateAsync(formData)
        Mutation->>Client: api.post(endpoint, { json: data })
        Client->>API: POST /entity
        alt success (201)
            API-->>Mutation: EntityResponse
            Mutation->>Cache: invalidateQueries(['entity'])
            Mutation->>User: navigate back to list
        else API field errors (400)
            API-->>Mutation: { fieldErrors: [...] }
            Mutation->>Form: parseApiFieldErrors() → setError()
            Form->>User: Show server-side field errors
        end
    end
```

---

## Data Flow: List with Filters & Pagination

```mermaid
sequenceDiagram
    actor User
    participant Page as Feature List Page
    participant State as Local useState\n(page, sort, filters)
    participant Query as useQuery\n(React Query)
    participant Client as api client (ky)
    participant API as Backend /api/v1

    Page->>Query: mount — useQuery(key, params)
    Query->>Client: api.get(endpoint, { searchParams, signal })
    Client->>API: GET /entity?page=0&size=10&...
    API-->>Client: PageResponse<EntityResponse>
    Client-->>Query: parsed response
    Query-->>Page: { data, isLoading, isError }
    Page->>User: Render table + pagination

    User->>Page: Change filter / page / sort
    Page->>State: setState(newParams)
    State->>Query: key changes → auto-refetch
    Query->>Client: api.get(...new params...)
    Client->>API: GET /entity?page=1&...
    API-->>Page: updated PageResponse
    Page->>User: Re-render table
```

---

## Feature Module Structure

Every feature follows the same file layout:

```
src/features/<name>/
├── <name>-schema.ts          # Zod validation schema + inferred form type
├── use-<name>.ts             # React Query hooks (useQuery + useMutation)
├── <name>s-page.tsx          # List page (table + filters + pagination)
├── <name>-create-page.tsx    # Create page (wraps form)
├── <name>-edit-page.tsx      # Edit page (loads entity, wraps form)
├── <name>-form.tsx           # Shared form component
└── *.test.tsx                # Vitest + RTL unit tests
```

Example — Donations:

| File                       | Responsibility                                                                            |
| -------------------------- | ----------------------------------------------------------------------------------------- |
| `donation-schema.ts`       | Zod schema for create/edit, inferred `CreateDonationFormData`                             |
| `use-donations.ts`         | `useDonations(params)`, `useDonation(id)`, `useCreateDonation()`, `useUpdateDonation(id)` |
| `donations-page.tsx`       | Paginated table with date-range filter and sort                                           |
| `donation-create-page.tsx` | Wraps form, handles duplicate-detection warning                                           |
| `donation-edit-page.tsx`   | Fetches existing donation, pre-fills form                                                 |
| `donation-form.tsx`        | Controlled form: amount, date, type, payment method, donor                                |

---

## API Client

**File:** `src/lib/api.ts`

```
ky instance
  prefix  →  window.location.origin + /api/v1
  credentials: 'include'   (session cookie forwarded on all requests)
  afterResponse hook:
    if status === 401 && url !== /login
      → localStorage.removeItem('auth_user')
      → window.location.href = '/login'
```

Usage pattern in hooks:

```ts
// Read
const data = await api
  .get('donations', { searchParams: { page: 0 }, signal })
  .json<PageResponse<DonationResponse>>();

// Write
const result = await api
  .post('donations', { json: payload })
  .json<DonationCreateResponse>();

// Update
await api.put(`donations/${id}`, { json: payload }).json<DonationResponse>();
```

---

## Type System

**File:** `src/lib/api-types.ts`

```mermaid
classDiagram
    class PageResponse~T~ {
        +T[] content
        +number totalElements
        +number totalPages
        +number size
        +number number
    }

    class DonationResponse {
        +number id
        +number amount
        +string donationDate
        +DonationType donationType
        +PaymentMethod paymentMethod
        +number|null donorId
        +string|null donorName
        +string|null notes
        +string createdAt
        +string updatedAt
    }

    class DonorResponse {
        +number id
        +string fullName
        +string nationalId
        +string|null email
        +string|null phone
        +string|null address
        +boolean active
        +string createdAt
        +string updatedAt
    }

    class ExpenseResponse {
        +number id
        +number amount
        +string expenseDate
        +ExpenseCategory category
        +string description
        +string|null vendor
        +PaymentMethod paymentMethod
        +string createdAt
        +string updatedAt
    }

    class UserResponse {
        +number id
        +string username
        +string fullName
        +string email
        +boolean active
        +string[] roles
    }

    class BalanceResponse {
        +string from
        +string to
        +number totalIncome
        +number totalExpenses
        +number netBalance
    }

    class DonationSummaryResponse {
        +string from
        +string to
        +TypeTotal[] totalsByType
        +number grandTotal
    }

    class ExpenseSummaryResponse {
        +string from
        +string to
        +CategoryTotal[] totalsByCategory
        +number grandTotal
    }

    class DonationCreateResponse {
        +DonationResponse donation
        +boolean duplicateWarning
        +boolean saved
    }

    PageResponse~T~ ..> DonationResponse : T
    PageResponse~T~ ..> DonorResponse : T
    PageResponse~T~ ..> ExpenseResponse : T
    PageResponse~T~ ..> UserResponse : T
    DonationCreateResponse --> DonationResponse
```

### Enums

| Type              | Values                                                                                |
| ----------------- | ------------------------------------------------------------------------------------- |
| `UserRole`        | `ADMIN` · `TREASURER` · `PASTOR` · `OPERATOR`                                         |
| `DonationType`    | `TITHE` · `OFFERING` · `SPECIAL_OFFERING` · `OTHER`                                   |
| `PaymentMethod`   | `CASH` · `BANK_TRANSFER`                                                              |
| `ExpenseCategory` | `RENT` · `UTILITIES` · `SALARIES` · `SUPPLIES` · `MISSIONS` · `MAINTENANCE` · `OTHER` |

---

## Testing Architecture

```mermaid
graph TD
    Test["*.test.tsx"]
    TU["test-utils.tsx\nrender() with providers"]
    MSW["MSW (Mock Service Worker)\nmsw-handlers.ts"]
    Server["msw-server.ts\nsetupServer()"]
    Vitest["Vitest + jsdom"]

    Test --> TU
    TU --> Vitest
    Test --> MSW
    MSW --> Server
    Server --> Vitest
```

- Tests use `render()` from `test-utils.tsx`, which wraps components in the full provider tree (QueryClient, Auth, Theme).
- MSW intercepts `fetch` at the network layer, returning fixtures defined in `msw-handlers.ts`.
- The server resets handlers after each test to prevent state leakage.
- No component mocks — tests exercise real hooks against real MSW responses.

Run tests: `pnpm run test`
