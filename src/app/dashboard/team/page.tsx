import { DashboardShell } from "@/components/dashboard-shell";
import { Pill, Surface } from "@/components/ui";
import {
  getCalendarIntegrations,
  getMemberships,
  getTeam,
  getUsers,
} from "@/lib/demo-data";

export default function TeamPage() {
  const team = getTeam();
  const users = getUsers();
  const memberships = getMemberships();
  const integrations = getCalendarIntegrations();

  return (
    <DashboardShell
      pathname="/dashboard/team"
      title="Team workspace"
      subtitle="Membership roles, routing behavior, integration status cards, and workspace-level settings."
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Surface className="p-6 sm:p-8">
          <div className="rounded-3xl bg-[color:var(--brand)] p-6 text-white">
            <p className="text-xs uppercase tracking-[0.24em] text-white/70">
              Workspace
            </p>
            <h3 className="mt-3 text-3xl font-semibold">{team.name}</h3>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/76">
              Routing is enabled with shared availability support, admin controls,
              and a custom booking domain.
            </p>
          </div>

          <div className="mt-6 space-y-4">
            {memberships.map((membership) => {
              const user = users.find((candidate) => candidate.id === membership.userId);
              return (
                <div
                  key={membership.id}
                  className="rounded-3xl border border-[color:var(--line)] bg-white/80 p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-lg font-semibold">{user?.name}</p>
                      <p className="mt-1 text-sm text-[color:var(--muted)]">
                        {user?.email} · {user?.timezone}
                      </p>
                    </div>
                    <Pill tone={membership.role === "owner" ? "brand" : "muted"}>
                      {membership.role}
                    </Pill>
                  </div>
                </div>
              );
            })}
          </div>
        </Surface>

        <div className="space-y-6">
          <Surface className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--brand)]">
              Team Settings
            </p>
            <div className="mt-5 space-y-3 text-sm">
              {[
                `Slug: ${team.slug}`,
                `Booking domain: ${team.bookingDomain}`,
                `Round robin: ${team.roundRobinEnabled ? "enabled" : "disabled"}`,
                `Brand color: ${team.brandingColor}`,
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-[color:var(--line)] bg-white/80 px-4 py-3"
                >
                  {item}
                </div>
              ))}
            </div>
          </Surface>

          <Surface className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--brand)]">
              Integration Cards
            </p>
            <div className="mt-5 space-y-3">
              {integrations.map((integration) => (
                <div
                  key={integration.id}
                  className="rounded-2xl border border-[color:var(--line)] bg-white/80 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{integration.provider}</p>
                    <Pill tone={integration.status === "connected" ? "brand" : "accent"}>
                      {integration.status}
                    </Pill>
                  </div>
                  <p className="mt-2 text-sm text-[color:var(--muted)]">
                    {integration.email}
                  </p>
                </div>
              ))}
            </div>
          </Surface>
        </div>
      </div>
    </DashboardShell>
  );
}
