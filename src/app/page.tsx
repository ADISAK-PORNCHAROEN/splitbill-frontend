export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-6 py-16 text-stone-950">
      <section className="w-full max-w-2xl rounded-3xl border border-stone-200 bg-white p-8 shadow-sm sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
          SplitBill
        </p>
        <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
          Shared expenses, made clear.
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-stone-600">
          The frontend scaffold is ready. Group selection, expense entry,
          split previews, and balances are still to be built.
        </p>
        <div className="mt-10 rounded-2xl bg-stone-100 p-5 text-sm leading-6 text-stone-700">
          <p className="font-medium text-stone-950">Project status</p>
          <p className="mt-1">
            This starter does not yet connect to the API or store expenses.
          </p>
        </div>
      </section>
      </main>
    </main>
  );
}
