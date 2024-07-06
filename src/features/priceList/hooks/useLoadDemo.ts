import { useAppDispatch, useAppSelector } from '../../../hooks';
// eslint-disable-next-line import/no-unresolved
import demoCsv from '../exampleData/simpleExample.csv?raw';
import { setProducts } from '../store/priceListSlice';
import { readProductsFromCsv } from '../utils/readProductsFromCsv';

export const useLoadDemo = () => {
  const dispatch = useAppDispatch();
  const priceType = useAppSelector((state) => state.priceList.priceType);

  const loadDemoCsvFile = async () => {
    const file = new File([demoCsv], 'demo.csv', { type: 'text/csv' });

    dispatch(
      setProducts({
        fileName: 'demo.csv',
        products: await readProductsFromCsv(file, priceType),
      })
    );
  };

  return {
    loadDemoCsvFile,
  };
};
``;
