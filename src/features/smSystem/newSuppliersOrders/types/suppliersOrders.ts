export interface SimpleSupplier {
  id: number;
  name: string;
  leadTimeDays?: number;
  reviewPeriodDays?: number;
  safetyDays?: number;
  autoDraftEnabled?: boolean;
}

export interface SimpleBranch {
  id: number;
  name: string;
}

interface SimpleUser {
  id: number;
  name: string;
}

export interface Order {
  id: number;
  supplier: SimpleSupplier;
  selectedBranches: SimpleBranch[];
  createdAt: string;
  updatedAt: string;
  comment?: string;
  isAutoDraft?: boolean;
}

export type OrdersList = Order[];

export interface Supplier {
  id: number;
  name: string;
  branches: SimpleBranch[];
  leadTimeDays?: number;
  reviewPeriodDays?: number;
  safetyDays?: number;
  autoDraftEnabled?: boolean;
}

export type SuppliersList = Supplier[];

export interface Branch {
  id: number;
  name: string;
  createdAt: string;
  createdBy: SimpleUser;
  updatedAt: string;
  updatedBy: SimpleUser;
}

export interface ProposalExplanation {
  source:
    | 'velocity'
    | 'velocity+trend'
    | 'velocity+stockout'
    | 'condition'
    | 'none';
  dailyRate: number;
  recentRate?: number | null;
  previousRate?: number | null;
  sold: number;
  recentSold?: number | null;
  previousSold?: number | null;
  windowDays: number;
  recentDays?: number | null;
  stock: number;
  daysOfStock: number | null;
  leadTimeDays: number;
  reviewPeriodDays: number;
  safetyDays: number;
  coverageDays: number;
  trendPct?: number | null;
  trend?: 'up' | 'down' | 'stable' | null;
  stockoutAdjusted?: boolean;
  note?: string | null;
  proposal: number;
}

export interface OrdersPerBranch {
  id: number;
  branch: SimpleBranch;
  toOrderProposalAmount: number;
  toOrderAmount: number;
  previousOrderAmount: number;
  stock: number;
  stockUpdatedAt: string;
  soldQuantity: number;
  dailyRate?: number;
  daysOfStock?: number | null;
  explanation?: ProposalExplanation | null;
}

interface NotSelectedBranches {
  branch: SimpleBranch;
  previousOrderAmount: number;
  stock: number;
  stockUpdatedAt: string;
  soldQuantity: number;
}

export interface ProductsToOrder {
  id: number;
  name: string;
  ordersPerBranch: OrdersPerBranch[];
  notSelectedBranches: NotSelectedBranches[];
}

export interface OrderDetails {
  id: number;
  supplier: Supplier;
  selectedBranches: SimpleBranch[];
  productsToOrder: ProductsToOrder[];
  createdAt: string;
  updatedAt: string;
  saleStartDate: string;
  saleEndDate: string;
  comment?: string;
  isAutoDraft?: boolean;
  detail?: string;
}

export interface CreateOrderInput {
  supplierId: number;
  selectedBranchesIds: number[];
  saleStartDate: string;
  saleEndDate: string;
}

export interface OrderCondition {
  id?: number;
  lowerBound: number;
  upperBound: number;
  toOrderAmount: number;
}

export interface OrderConditionsPerBranch {
  branch: SimpleBranch;
  orderConditions: OrderCondition[];
}

export interface ProductConditions {
  id: number;
  name: string;
  orderConditionsPerBranch: OrderConditionsPerBranch[];
}

export interface SupplierDetails {
  id: number;
  name: string;
  branches: SimpleBranch[];
  products: ProductConditions[];
  leadTimeDays?: number;
  reviewPeriodDays?: number;
  safetyDays?: number;
  autoDraftEnabled?: boolean;
  detail?: string;
}

export interface SupplierSettings {
  leadTimeDays: number;
  reviewPeriodDays: number;
  safetyDays: number;
  autoDraftEnabled: boolean;
}

export interface ConditionBandSuggestion {
  lowerBound: number;
  upperBound: number;
  toOrderAmount: number;
}

export interface ConditionSuggestionRow {
  productId: number;
  productName: string;
  branchId: number;
  branchName: string;
  hadExisting: boolean;
  sampleCount: number;
  source: 'orders' | 'orders+stock' | 'orders+velocity' | 'none';
  avgOrderAgeDays?: number | null;
  bands: ConditionBandSuggestion[];
}

export interface ConditionsFromOrdersResult {
  applied: boolean;
  productsUpdated: number;
  branchesSuggested: number;
  branchesSkippedExisting: number;
  branchesWithHistory: number;
  ordersUsed: number;
  suggestions: ConditionSuggestionRow[];
}

export interface ConditionsFromOrdersInput {
  productId?: number | null;
  overwrite?: boolean;
  apply?: boolean;
}
