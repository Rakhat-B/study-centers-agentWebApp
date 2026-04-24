import AppShell from "@/components/AppShell";

const skeletonItems = [1, 2, 3, 4];

export default function LoadingClassesPage() {
  return (
    <AppShell>
      <div className="mb-8 animate-pulse">
        <div className="h-8 w-40 rounded-xl bg-black/10" />
        <div className="mt-2 h-4 w-64 rounded-xl bg-black/10" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {skeletonItems.map((item) => (
          <div key={item} className="glass-card animate-pulse p-5">
            <div className="h-5 w-44 rounded-xl bg-black/10" />
            <div className="mt-2 h-4 w-28 rounded-xl bg-black/10" />

            <div className="mt-4 space-y-3">
              {[1, 2].map((group) => (
                <div key={group} className="rounded-2xl border border-white/35 bg-white/25 p-4">
                  <div className="h-4 w-32 rounded-xl bg-black/10" />
                  <div className="mt-2 h-3 w-48 rounded-xl bg-black/10" />
                  <div className="mt-3 h-2 w-full rounded-full bg-black/10" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}