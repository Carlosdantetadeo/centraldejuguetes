import { getBotVisitStats } from "@/lib/catalog";

export default async function AdminBotsPage() {
  const stats = await getBotVisitStats();

  const weeks = [...new Set(stats.map((s) => s.week.toISOString()))].sort().reverse();
  const bots = [...new Set(stats.map((s) => s.botName))].sort();
  const countFor = (week: string, bot: string) =>
    stats.find((s) => s.week.toISOString() === week && s.botName === bot)?.count ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-steel-900">Visitas de bots de IA</h1>
        <p className="mt-1 text-steel-600">
          Últimos 90 días. Registra OAI-SearchBot, ChatGPT-User, Claude-SearchBot, Claude-User,
          PerplexityBot, Perplexity-User, Googlebot, Bingbot y los bots de entrenamiento permitidos
          en robots.txt. Se graba desde <code className="font-mono text-xs">src/proxy.ts</code>.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-steel-200 bg-white">
        {weeks.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-steel-500">
            Todavía no hay visitas de bots registradas.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-steel-100 bg-steel-50 text-left text-xs font-semibold text-steel-500">
                <th className="px-4 py-3">Semana</th>
                {bots.map((bot) => (
                  <th key={bot} className="px-4 py-3 font-mono">{bot}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weeks.map((week) => (
                <tr key={week} className="border-b border-steel-50">
                  <td className="px-4 py-3 font-medium text-steel-900">
                    {new Date(week).toLocaleDateString("es-PE")}
                  </td>
                  {bots.map((bot) => (
                    <td key={bot} className="px-4 py-3 font-mono text-steel-700">
                      {countFor(week, bot)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
