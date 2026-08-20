import type { PropsWithChildren } from "react";

export default function HomeLayout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <main className="container mx-auto flex min-h-screen flex-col items-center justify-center gap-12 p-6 text-center sm:p-10">
        {children}
      </main>
    </div>
  );
}
