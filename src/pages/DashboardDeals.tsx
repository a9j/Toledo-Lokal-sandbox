import { Header } from "@/components/layout/Header";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Tag } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function DashboardDeals() {
  const navigate = useNavigate();

  return (
    <>
      <Header title="My Deals" />
      <PageContainer className="pb-32 space-y-4">
        <Button variant="ghost" size="sm" className="-ml-2" onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Button>

        <div className="card-elevated p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Tag className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-semibold">Deals</h1>
              <p className="text-sm text-muted-foreground">
                Deal management is coming next.
              </p>
            </div>
          </div>
        </div>
      </PageContainer>
    </>
  );
}
