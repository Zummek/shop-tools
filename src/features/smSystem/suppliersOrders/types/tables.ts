import {MappedOrderDetails} from "./index";

export interface ProductsInOrder {
  lp: number;
  name: string;
  totalToOrder: number;
}

export interface ProductsInOrderTableProps {
  products: ProductsInOrder[];
  selectedProductLp: number ;
  setSelectedProductLp: React.Dispatch<React.SetStateAction<number>>;
}

export interface ProductDetailsInOrderTableProps {
  editableOrderDetails: MappedOrderDetails;
  setEditableOrderDetails: React.Dispatch<React.SetStateAction<MappedOrderDetails | null>>;
  selectedProductLp: number;
  setSelectedProductLp: React.Dispatch<React.SetStateAction<number>>;
}