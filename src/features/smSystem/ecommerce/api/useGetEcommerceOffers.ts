import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';

import { axiosInstance } from '../../../../services';
import { ListResponse } from '../../app/types';
import { ChannelProductLink } from '../types/channelLinks';

const endpoint = '/api/v1/ecommerce/offers/';
export const ecommerceOffersQueryKeyBase = 'ecommerce-offers';

export type StockPublishFilter = 'off' | 'on' | 'all';
export type OfferStatusFilter = 'active' | 'paused' | 'ended' | 'all';

type Response = ListResponse<ChannelProductLink>;

export const useGetEcommerceOffers = () => {
  const [page, setPage] = useState(0);
  const [query, setQueryState] = useState('');
  const [channel, setChannelState] = useState('');
  const [stockPublish, setStockPublishState] =
    useState<StockPublishFilter>('off');
  const [offerStatus, setOfferStatusState] =
    useState<OfferStatusFilter>('active');
  const pageSize = 25;
  const offerStatusRef = useRef(offerStatus);
  const queryRef = useRef(query);
  const channelRef = useRef(channel);
  const stockPublishRef = useRef(stockPublish);

  const setQuery = useCallback((value: string) => {
    if (queryRef.current === value) return;
    queryRef.current = value;
    setQueryState(value);
    setPage(0);
  }, []);
  const setChannel = useCallback((value: string) => {
    if (channelRef.current === value) return;
    channelRef.current = value;
    setChannelState(value);
    setPage(0);
  }, []);
  const setStockPublish = useCallback((value: StockPublishFilter) => {
    if (stockPublishRef.current === value) return;
    stockPublishRef.current = value;
    setStockPublishState(value);
    setPage(0);
  }, []);
  const setOfferStatus = useCallback((value: OfferStatusFilter) => {
    if (offerStatusRef.current === value) return;
    offerStatusRef.current = value;
    setOfferStatusState(value);
    setPage(0);
  }, []);

  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: [
      ecommerceOffersQueryKeyBase,
      query,
      page,
      channel,
      stockPublish,
      offerStatus,
    ],
    queryFn: async () => {
      const response = await axiosInstance.get<Response>(endpoint, {
        params: {
          query: query || undefined,
          page: page + 1,
          pageSize,
          channel: channel || undefined,
          stockPublish: stockPublish === 'all' ? undefined : stockPublish,
          offerStatus,
        },
      });
      return response.data;
    },
    placeholderData: keepPreviousData,
  });

  return {
    offers: data?.results ?? [],
    totalCount: data?.count ?? 0,
    isLoading: isLoading || isFetching,
    isError,
    page,
    setPage,
    query,
    setQuery,
    channel,
    setChannel,
    stockPublish,
    setStockPublish,
    offerStatus,
    setOfferStatus,
    pageSize,
  };
};
