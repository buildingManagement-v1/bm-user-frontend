export interface PlanFeatures {
  maxBuildings: number;
  maxUnits: number;
  maxManagers: number;
  premiumFeatures: string[];
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  /** Yearly price in ETB (decimal string from the API) */
  price: string | number;
  features: PlanFeatures;
  status: "active" | "inactive";
  type: "public" | "custom";
  /** From /available-plans */
  purchasable?: boolean;
  isCurrent?: boolean;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  totalAmount: string | number;
  billingCycleStart: string;
  billingCycleEnd: string;
  nextBillingDate: string;
  status: "active" | "cancelled" | "expired";
  plan: SubscriptionPlan;
  createdAt: string;
  updatedAt: string;
}

export type SubscriptionRequestStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface SubscriptionRequest {
  id: string;
  planId: string;
  amount: string | number;
  paymentReference: string | null;
  notes: string | null;
  status: SubscriptionRequestStatus;
  rejectionReason: string | null;
  reviewedAt: string | null;
  createdAt: string;
  plan: { id: string; name: string; price: string | number };
}

export interface UsageStats {
  buildingsUsed: number;
  unitsUsed: number;
  managersUsed: number;
}

export interface BillingState {
  trialUsed: boolean;
  isTrial: boolean;
  /** Latest (ended) subscription when there is no active one: account is read-only */
  expiredSubscription: Subscription | null;
  pendingRequest: SubscriptionRequest | null;
}

export interface MySubscriptionResponse {
  success: boolean;
  data: Subscription | null;
  usage: UsageStats;
  billing: BillingState;
  /** Platform support contacts (empty strings when not configured) */
  support: { email: string; phone: string };
}

export type PlanChangeKind = "new" | "renewal" | "upgrade" | "downgrade";

export interface PlanQuote {
  plan: { id: string; name: string; price: number; features: PlanFeatures };
  currentPlan: { id: string; name: string; billingCycleEnd: string } | null;
  kind: PlanChangeKind;
  amount: number;
  cycleStart: string;
  cycleEnd: string;
  note: string | null;
  violations: string[];
  paymentInstructions: string;
}
