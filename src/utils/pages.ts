export enum Pages {
  generatePriceList = '/generate-price-list',
  barcodesGenerator = '/barcodes-generator',
  invoiceConverter = '/invoice-converter',
  smSystem = '/sm-system',
  smSystemLogin = '/sm-system/login',
  smSystemTransfers = '/sm-system/transfers',
  smSystemImportProducts = '/sm-system/import-products',
  smSystemProductsDocuments = '/sm-system/products-documents',
  smSystemSuppliersOrders = '/sm-system/suppliers-orders',
  smSystemSuppliers = "/sm-system/suppliers-orders/suppliers",
  smSystemSuppliersDetails = "/sm-system/suppliers-orders/suppliers/:supplierId",
  smSystemProducts = "/sm-system/suppliers-orders/products",
  smSystemOrders = "/sm-system/suppliers-orders/orders",
  smSystemOrdersDetails = "/sm-system/suppliers-orders/orders/:orderId",
}
