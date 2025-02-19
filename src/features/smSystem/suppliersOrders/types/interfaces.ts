interface Branch {
  id: number;
  name: string;
}

interface Supplier {
  id: number;
  name: string;
}

export interface Order {
  id: number;
  supplier: Supplier;
  branches: Branch[];
}

interface Stock {
  branch: Branch;
  amount: number;
}

interface Condition {
  id: number;
  lowerBound: number;
  upperBound: number;
  toOrder: number;
}

interface ConditionsPerBranch {
  id: number;
  branch: Branch;
  conditions: Condition[];
}

interface Product {
  id: number;
  name: string;
  price: number;
  stock: Stock[];
  conditionsPerBranch: ConditionsPerBranch[];
}

interface OrderPerBranch {
  branch: Branch;
  toOrder: number | null;
  originalToOrder: number | null;
  stockAmountAtOrderTime: number | null;
}

export interface ProductInOrder {
  id: number;
  product: Product;
  ordersPerBranch: OrderPerBranch[];
}

export interface OrderDetails {
  id: number;
  supplier: Supplier;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  branches: Branch[];
  productsInOrder: ProductInOrder[];
}

export interface EditableOrder {
  id: number;
  lp: number;
  product: {
    id: number;
    name: string;
  };
  ordersPerBranch: {
    branch: {
      id: number;
      name: string;
    };
    toOrder: number | null;
    originalToOrder: number| null;
    stockAmountAtOrderTime: number | null;
  }[];
  totalToOrder: number;
}

export interface ProductInOrderWithTotal extends ProductInOrder {
  lp: number;
  totalToOrder: number;
}

export interface MappedOrderDetails {
  id: number;
  supplier: Supplier;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  branches: Branch[];
  branchesNames: string;
  productsInOrder: ProductInOrderWithTotal[];
}