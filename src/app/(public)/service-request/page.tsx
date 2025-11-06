import { LandingHero } from "./components/landing-hero";
import { WarrantyPolicyCard } from "./components/warranty-policy-card";

export default function ServiceRequestPage() {
  return (
    <div className="bg-muted/40">
      <div className="container mx-auto max-w-6xl space-y-12 px-4 py-12 sm:px-6 lg:px-8 lg:space-y-16">
        <LandingHero />
        <WarrantyPolicyCard />
      </div>
    </div>
  );
}
