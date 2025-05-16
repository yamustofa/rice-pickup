# Rice Pickup Tracking

A web application for tracking rice pickups, built with **Next.js**, **TypeScript**, **Supabase**, and **shadcn/ui**.  
This project demonstrates a full-stack approach to user authentication, data management, and a polished user interface.

---

## Features

- **User Authentication** (email/password & Google OAuth via Supabase)
- **Rice Pickup Management**: Add, edit, and delete pickup records
- **Avatar Selection**: Choose a custom avatar for your profile
- **Responsive UI**: Clean, modern design with shadcn/ui and Tailwind CSS
- **Role-based Access**: Secure update/delete operations with RLS policies
- **Database Migrations**: Version-controlled schema with SQL migrations
- **Error Handling**: Friendly error messages and robust validation

---

## Tech Stack

- [Next.js](https://nextjs.org/) (App Router, SSR)
- [TypeScript](https://www.typescriptlang.org/)
- [Supabase](https://supabase.com/) (Postgres, Auth, Storage)
- [shadcn/ui](https://ui.shadcn.com/) (UI components)
- [Tailwind CSS](https://tailwindcss.com/)
- [react-nice-avatar](https://github.com/daisyui/react-nice-avatar) (Avatar generator)

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/yamustofa/rice-pick.git
cd rice-pick
```

### 2. Install dependencies

```bash
bun install
```

### 3. Set up environment variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

### 4. Set up the database

- Create a new project on [Supabase](https://app.supabase.com/).
- Run the SQL schema in `supabase/schema.sql` using the Supabase SQL editor or CLI.
- Configure authentication providers as needed.

### 5. Run the development server

```bash
bun run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the app.

---

## Project Structure

```
supabase/         # Database schema & migrations
src/
  app/            # Next.js app directory
    login/        # Login page and components
  types/          # TypeScript types
  components/     # Shared UI components
public/           # Static assets (images, etc.)
```

---

## Security

- **Never commit secrets or credentials** to the repository.
- All sensitive configuration should be stored in `.env` (gitignored).
- Row Level Security (RLS) is enabled and configured in Supabase.

---

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

---

## License

[MIT](LICENSE)

---

## Acknowledgements

- [Supabase](https://supabase.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [react-nice-avatar](https://github.com/daisyui/react-nice-avatar)
- [Unsplash](https://unsplash.com/) for the rice field image

---

**Thats it!**
