import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { OpportunityFilters } from "@/components/opportunities/OpportunityFilters";
import { OpportunityTable } from "@/components/opportunities/OpportunityTable";

interface PageProps {
  searchParams: {
    domain?: string;
    status?: string;
    source?: string;
    hub?: string;
    q?: string;
    page?: string;
  };
}

export default async function OpportunitiesPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const tenantId = (session.user as any).tenantId as string;
  const page  = Number(searchParams.page ?? 1);
  const limit = 25;

  const where: any = { tenantId };
  if (searchParams.domain) where.domain = searchParams.domain;
  if (searchParams.status) where.status = searchParams.status;
  if (searchParams.source) where.source = searchParams.source;
  if (searchParams.hub === "true") where.hubApplicable = true;
  if (searchParams.q) {
    where.OR = [
      { title: { contains: searchParams.q, mode: "insensitive" } },
      { issuingAgency: { contains: searchParams.q, mode: "insensitive" } },
      { solicitationNumber: { contains: searchParams.q, mode: "insensitive" } },
    ];
  }

  const [opportunities, total] = await Promise.all([
    prisma.opportunity.findMany({
      where,
      orderBy: [{ score: "desc" }, { responseDeadline: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.opportunity.count({ where }),
  ]);

  return (
    <DashboardShell user={session.user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Opportunities</h1>
            <p className="text-gray-500 text-sm mt-1">{total.toLocaleString()} total · sorted by score</p>
          </div>
        </div>

        <OpportunityFilters searchParams={searchParams} />
        <OpportunityTable
          opportunities={opportunities}
          total={total}
          page={page}
          limit={limit}
        />
      </div>
    </DashboardShell>
  );
}
