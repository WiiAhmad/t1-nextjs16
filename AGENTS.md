# Agent Guidelines

## Development guide folder structure

### Project Overview
This is a **Next.js 16 TypeScript application** with **shadcn/ui components** and **Drizzle ORM** for database management. The project follows modern React development patterns with server actions and the App Router.

### Technology Stack
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **shadcn/ui** - Modern React component library (40+ components)
- **Drizzle ORM** - Type-safe database ORM with SQLite
- **Tailwind CSS** - Utility-first CSS framework
- **Server Actions** - Next.js 13+ server-side functions
- **jose** - JWT authentication and token handling
- **bcryptjs** - Password hashing and validation
- **zod** - Schema validation and type safety

## 📁 Folder Structure & Development Guidelines

### 1. Root Configuration
```
/ (root)
├── package.json          # Dependencies and scripts
├── next.config.ts        # Next.js configuration
├── drizzle.config.ts     # Database configuration
├── tailwind.config.js    # CSS configuration
├── tsconfig.json         # TypeScript configuration
├── .env.local            # Environment variables (create this)
├── components.json       # shadcn/ui configuration
├── eslint.config.mjs     # Linting configuration
├── postcss.mjs          # PostCSS configuration
└── bun.lock             # Package manager lock file
```

**Development Notes:**
- Use `npm run dev` or `pnpm run dev` to start development server
- Use `npm run db:studio` to open Drizzle database studio
- Configure `DATABASE_FILE` in `.env.local` for SQLite database path
- **Dependencies:** jose (JWT), bcryptjs (password hashing), zod (validation)

### 2. App Directory Structure (`/app/`)
```
/app/
├── layout.tsx            # Root layout component
├── page.tsx              # Home page
├── globals.css           # Global styles
├── favicon.ico           # Website favicon
├── (auth)/               # Authentication routes
│   ├── signin/           # Sign in page
│   │   └── page.tsx      # Sign in form component
│   ├── signup/           # Sign up page
│   │   └── page.tsx      # Sign up form component
│   └── action.ts         # Auth server actions
└── (dashboard)/          # Protected routes
    ├── dashboard/        # Dashboard pages
    │   ├── layout.tsx    # Dashboard layout with auth guard
    │   └── page.tsx      # Main dashboard page
    └── action.ts         # Dashboard server actions
```

**Development Patterns:**
- Use **route groups** `(folder)` for organization
- Server actions go in `action.ts` files in each route group
- Use `use server` directive for server functions
- Direct client component to server component communication (no API calls)
- **Import conventions:** Use `@/` for simple paths, `../` for going back one folder
- **Authentication:** Integrated JWT session management with jose

### 2.1. Import Path Conventions

**Simple Paths (use @/):**
```typescript
// For files in lib/, components/, or other root-level directories
import { db } from '@/lib/db/drizzle'
import { Button } from '@/components/ui/button'
import { User } from '@/lib/db/schema'
```

**Relative Paths (use ../ for one folder back):**
```typescript
// When going back one folder level
import { userActions } from '../action'
import { authConfig } from '../page'
// If in nested route: app/(auth)/signin/page.tsx
// Can import from: app/(auth)/action.ts using '../action'
```

### 3. Components (`/components/ui/`)
```
/components/
└── ui/                   # shadcn/ui component library (40+ components)
    ├── button.tsx        # Button variants and states
    ├── input.tsx         # Form input components
    ├── card.tsx          # Card layout components
    ├── dialog.tsx        # Modal dialogs
    ├── form.tsx          # Form wrapper with validation
    ├── label.tsx         # Form labels
    ├── avatar.tsx        # User avatar components
    ├── badge.tsx         # Status badges
    ├── alert.tsx         # Alert notifications
    ├── table.tsx         # Data tables
    ├── calendar.tsx      # Date picker
    ├── chart.tsx         # Data visualization
    ├── navigation-menu.tsx # Navigation components
    ├── dropdown-menu.tsx # Dropdown menus
    ├── select.tsx        # Select components
    ├── checkbox.tsx      # Checkbox inputs
    ├── radio-group.tsx   # Radio button groups
    ├── switch.tsx        # Toggle switches
    ├── slider.tsx        # Range sliders
    ├── progress.tsx      # Progress indicators
    ├── skeleton.tsx      # Loading skeletons
    ├── toast.tsx         # Toast notifications
    ├── tabs.tsx          # Tab navigation
    ├── accordion.tsx     # Collapsible content
    ├── tooltip.tsx       # Tooltip overlays
    └── [20+ more components]
```

**Usage Guidelines:**
- Import components from `@/components/ui/component-name`
- All components are TypeScript compatible
- Use Tailwind classes for styling
- Components are fully accessible (ARIA compliant)
- Customize using CSS variables and Tailwind utilities
- **Validation:** Use zod schemas for form validation

### 4. Database Layer (`/lib/db/`)
```
/lib/db/
├── schema.ts             # Database table definitions
├── drizzle.ts            # Database connection
├── query.ts              # Query functions
├── setup.ts              # Database setup
└── seed.ts               # Sample data
```

**Database Development Pattern:**
```typescript
// Define tables in schema.ts
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(), // hashed with bcryptjs
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

// Use in queries
const db = drizzle(connection);
const result = await db.select().from(users);
```

**Authentication Integration:**
- **jose** for JWT token creation and validation
- **bcryptjs** for password hashing and verification
- **zod** for input validation and type safety

### 5. Authentication System (`/lib/auth/`)
```
/lib/auth/
├── session.ts            # JWT session management (jose)
└── middleware.ts         # Authentication middleware
```

**Authentication Patterns:**
```typescript
// JWT token handling with jose
import { SignJWT, jwtVerify } from 'jose';

// Password hashing with bcryptjs
import bcrypt from 'bcryptjs';

// Schema validation with zod
import { z } from 'zod';
```

### 6. Type Definitions (`/lib/types/`)
```
/lib/types/
└── type.ts               # TypeScript type definitions
```

### 7. Database Migrations (`/database/`)
```
/database/
└── migrations/
    ├── 0000_initial.sql
    └── meta/
        ├── _journal.json
        └── 0000_snapshot.json
```

**Migration Workflow:**
1. Update schema in `/lib/db/schema.ts`
2. Run `npm run db:gen` to generate migration
3. Run `npm run db:mig` to apply migration
4. Use `npm run db:studio` to inspect database

## 🚀 Development Workflow

### 1. Environment Setup
```bash
# Create .env.local
echo "DATABASE_FILE=file:./database/dev.db" > .env.local
echo "AUTH_SECRET=your-jwt-secret-here" >> .env.local

# Install dependencies
npm install

# Start development
npm run dev
```

### 2. Adding New Features
1. **Create database schema** in `lib/db/schema.ts`
2. **Add validation schemas** with zod in appropriate `action.ts` files
3. **Generate migration** with `npm run db:gen`
4. **Apply migration** with `npm run db:mig`
5. **Create server actions** in `action.ts` files (one per route group)
6. **Build UI components** using shadcn/ui library with direct server communication
7. **Add routes** in `/app/` directory
8. **Implement authentication** using jose and bcryptjs with server actions

### 3. Component Usage Pattern
```typescript
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

function MyComponent() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema)
  })
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Title</CardTitle>
        <CardDescription>Description</CardDescription>
      </CardHeader>
      <CardContent>
        <Button>Click me</Button>
      </CardContent>
    </Card>
  )
}
```

### 4. Server Actions Pattern

**action.ts File Organization:**
- Create `action.ts` files in each route group directory
- Include all server-side logic: types, schema validation, database queries
- Use direct client component to server component communication
- Organize functions by feature/functionality

```typescript
// app/(auth)/action.ts
'use server'

import { z } from 'zod';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';

// Zod validation schemas
const signUpSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

// Database query functions
const createUser = async (data: { name: string; email: string; password: string }) => {
  const hashedPassword = await bcrypt.hash(data.password, 10);
  return await db.insert(users).values({
    name: data.name,
    email: data.email,
    password: hashedPassword
  });
};

const getUserByEmail = async (email: string) => {
  return await db.select().from(users).where(eq(users.email, email));
};

// Server actions
export async function signUp(formData: FormData) {
  try {
    const rawData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string
    };

    // Validate input
    const validatedData = signUpSchema.parse(rawData);
    
    // Check if user already exists
    const existingUser = await getUserByEmail(validatedData.email);
    if (existingUser.length > 0) {
      return { success: false, error: 'User already exists' };
    }

    // Create user
    await createUser(validatedData);
    
    return { success: true, message: 'User created successfully' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: 'An error occurred during sign up' };
  }
}

export async function signIn(formData: FormData) {
  try {
    const rawData = {
      email: formData.get('email') as string,
      password: formData.get('password') as string
    };

    // Validate input
    const validatedData = signInSchema.parse(rawData);
    
    // Get user
    const userResult = await getUserByEmail(validatedData.email);
    const user = userResult[0];
    
    if (!user) {
      return { success: false, error: 'Invalid credentials' };
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(validatedData.password, user.password);
    if (!isValidPassword) {
      return { success: false, error: 'Invalid credentials' };
    }

    // Create JWT token
    const token = await new SignJWT({
      userId: user.id,
      email: user.email
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(new TextEncoder().encode(process.env.AUTH_SECRET))
    
    // Set authentication cookie
    cookies().set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24 hours
    });
    
    return { success: true, message: 'Signed in successfully' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: 'An error occurred during sign in' };
  }
}

// Example dashboard action.ts
// app/(dashboard)/action.ts
'use server'

import { db } from '@/lib/db/drizzle';
import { users, posts } from '@/lib/db/schema';
import { z } from 'zod';
import { eq } from 'drizzle-orm';

// Schema validation
const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  bio: z.string().max(500, 'Bio must be less than 500 characters')
});

// Query functions
const updateUserProfile = async (userId: number, data: { name: string; bio?: string }) => {
  return await db.update(users)
    .set({ name: data.name, bio: data.bio })
    .where(eq(users.id, userId));
};

const getUserPosts = async (userId: number) => {
  return await db.select()
    .from(posts)
    .where(eq(posts.userId, userId));
};

// Server actions
export async function updateProfile(formData: FormData, userId: number) {
  try {
    const rawData = {
      name: formData.get('name') as string,
      bio: formData.get('bio') as string || undefined
    };

    const validatedData = updateProfileSchema.parse(rawData);
    
    await updateUserProfile(userId, validatedData);
    
    return { success: true, message: 'Profile updated successfully' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: 'Failed to update profile' };
  }
}

export async function getUserDashboardData(userId: number) {
  try {
    const [userProfile, userPosts] = await Promise.all([
      db.select().from(users).where(eq(users.id, userId)),
      getUserPosts(userId)
    ]);

    return {
      success: true,
      data: {
        profile: userProfile[0],
        posts: userPosts
      }
    };
  } catch (error) {
    return { success: false, error: 'Failed to load dashboard data' };
  }
}
```

## 📋 Implementation Checklist

### Authentication System
- [ ] Implement sign in functionality (with jose JWT)
- [ ] Implement sign up functionality (with bcryptjs hashing)
- [ ] Add form validation with zod
- [ ] Implement session management (JWT with jose)
- [ ] Add password hashing (bcryptjs)
- [ ] Add role-based access control
- [ ] Implement password reset functionality

### Dashboard Features
- [ ] Create dashboard layout
- [ ] Add user profile management
- [ ] Implement data visualization
- [x] Add navigation and routing
- [x] Implement protected routes

### Database Operations
- [x] Define user schema
- [ ] Add user CRUD operations
- [ ] Implement database queries
- [ ] Add data validation (zod schemas)
- [ ] Set up database relationships

### UI/UX Implementation
- [x] Customize theme and styling
- [x] Add responsive design
- [x] Implement error boundaries
- [x] Add loading states
- [x] Optimize for accessibility

## 🎨 Styling Guidelines

### Tailwind CSS Patterns
```css
/* Custom colors */
text-primary, text-secondary, text-muted-foreground
bg-primary, bg-secondary, bg-muted
border-border, border-input

/* Component spacing */
space-y-2, space-y-4, space-y-6
gap-2, gap-4, gap-6
p-4, p-6, p-8

/* Responsive design */
sm:-, md:-, lg:-, xl: breakpoints
```

### Component Styling
- Use CSS variables for theming
- Leverage shadcn/ui's design tokens
- Maintain consistent spacing scale
- Ensure proper color contrast ratios

## 🔧 Development Tools

### Available Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:gen       # Generate database migration
npm run db:mig       # Apply database migration
npm run db:push      # Push schema changes
npm run db:studio    # Open database studio
```

### Recommended VS Code Extensions
- TypeScript and JavaScript Language Features
- Tailwind CSS IntelliSense
- Drizzle Kit
- ES7+ React/Redux/React-Native snippets

## 🏗️ Architecture Principles

### 1. Server-First Approach
- Use server actions for data mutations
- Minimize client-side JavaScript
- Leverage Next.js App Router benefits

### 2. Type Safety
- Strict TypeScript configuration
- Drizzle ORM type inference
- Form validation with zod
- JWT token validation with jose

### 3. Component Composition
- Build small, reusable components
- Use composition over inheritance
- Maintain single responsibility principle

### 4. Security Best Practices
- Password hashing with bcryptjs
- JWT token authentication with jose
- Input validation with zod
- Server-side data operations

### 5. Performance Optimization
- Implement proper loading states
- Use server components where possible
- Optimize images and assets
- Minimize bundle size

## 📖 Best Practices

### Code Organization
- Keep server actions in dedicated files
- Use consistent naming conventions
- Group related components together
- Maintain clear folder hierarchy

### Error Handling
- Implement proper error boundaries
- Use TypeScript error types
- Add comprehensive logging
- Handle edge cases gracefully

### Security Considerations
- Validate all user inputs with zod
- Use server actions for sensitive operations
- Implement proper authentication with jose
- Sanitize database queries with Drizzle ORM
- Hash passwords with bcryptjs

### Authentication Flow
1. **Registration**: Hash password with bcryptjs, create user record
2. **Login**: Verify password, create JWT with jose
3. **Session**: Validate JWT on protected routes
4. **Logout**: Clear auth cookie

### Validation Strategy
- Use zod schemas for form validation
- Validate on both client and server side
- Type inference for type safety
- Custom validation rules for business logic

This guide should be updated as the project evolves and new patterns emerge.