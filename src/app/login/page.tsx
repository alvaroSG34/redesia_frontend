import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { LoginForm } from '@/components/screens/login-form';
import { AUTH_COOKIE_NAME } from '@/lib/auth';

export default async function LoginPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (token) {
    redirect('/dashboard');
  }

  return (
    <main className="min-h-screen w-full bg-[#f8f8fb] lg:grid lg:grid-cols-[62%_38%]">
      <section className="flex min-h-[40vh] items-center justify-center bg-gradient-to-br from-[#f6d1eb] to-[#b9d3ff] p-8 lg:min-h-screen">
        <div className="text-center">
          <div className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-white/88 shadow-[0_24px_35px_-30px_rgba(79,70,229,0.75)]">
            <SparklesIcon />
          </div>
          <h1 className="mt-6 text-5xl font-bold tracking-tight text-[#24245c] sm:text-6xl">IA Networks</h1>
          <p className="mt-4 text-xl text-[#3746d5]">Analítica inteligente para tus redes sociales.</p>
        </div>
      </section>

      <section className="flex items-center justify-center p-6 sm:p-10 lg:min-h-screen lg:px-14">
        <div className="w-full max-w-[540px]">
          <h2 className="text-4xl font-bold tracking-tight text-[#182033]">Bienvenido de nuevo</h2>
          <p className="mt-3 text-2xl text-slate-500">Inicia sesión en tu cuenta para continuar</p>
          <div className="mt-12">
            <LoginForm />
          </div>
        </div>
      </section>
    </main>
  );
}

function SparklesIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-10 w-10 text-[#7d5df5]" fill="none" aria-hidden>
      <path
        d="M12 2L13.8 8.2L20 10L13.8 11.8L12 18L10.2 11.8L4 10L10.2 8.2L12 2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M18 4V6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M17 5H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="6.2" cy="18.2" r="2.2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

