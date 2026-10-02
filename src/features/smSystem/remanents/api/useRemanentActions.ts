import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  axiosInstance,
  throwAxiosErrorFromResponse,
} from '../../../../services';

import { remanentQueryKey } from './useGetRemanent';
import { remanentLinesQueryKey } from './useGetRemanentLines';
import { remanentsQueryKey } from './useGetRemanents';

const invalidate = (
  queryClient: ReturnType<typeof useQueryClient>,
  remanentId: number,
) => {
  queryClient.invalidateQueries({ queryKey: [remanentsQueryKey] });
  queryClient.invalidateQueries({ queryKey: [remanentQueryKey, remanentId] });
  queryClient.invalidateQueries({
    queryKey: [remanentLinesQueryKey, remanentId],
  });
  queryClient.invalidateQueries({
    queryKey: ['remanentDocuments', remanentId],
  });
  queryClient.invalidateQueries({
    queryKey: ['remanentAttachableDocuments', remanentId],
  });
};

const assertOk = (
  statusCode: number,
  response: Parameters<typeof throwAxiosErrorFromResponse>[0],
) => {
  if (statusCode < 200 || statusCode >= 300)
    throwAxiosErrorFromResponse(response);
};

export const useCreateRemanent = () => {
  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (payload: { name: string; branchId: number }) => {
      const response = await axiosInstance.post('/api/v1/remanents/', payload);
      assertOk(response.status, response);
      return response.data as { id: number };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [remanentsQueryKey] });
    },
  });
  return { createRemanent: mutateAsync, isPending };
};

export const useUpdateRemanent = (remanentId: number) => {
  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (payload: { name: string }) => {
      const response = await axiosInstance.patch(
        `/api/v1/remanents/${remanentId}/`,
        payload,
      );
      assertOk(response.status, response);
      return response.data;
    },
    onSuccess: () => invalidate(queryClient, remanentId),
  });
  return { updateRemanent: mutateAsync, isPending };
};

export const useAttachRemanentDocument = (remanentId: number) => {
  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (documentId: number) => {
      const response = await axiosInstance.post(
        `/api/v1/remanents/${remanentId}/documents/`,
        { documentId },
      );
      assertOk(response.status, response);
    },
    onSuccess: () => invalidate(queryClient, remanentId),
  });
  return { attachDocument: mutateAsync, isPending };
};

export const useDetachRemanentDocument = (remanentId: number) => {
  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (documentId: number) => {
      const response = await axiosInstance.delete(
        `/api/v1/remanents/${remanentId}/documents/${documentId}/`,
      );
      assertOk(response.status, response);
    },
    onSuccess: () => invalidate(queryClient, remanentId),
  });
  return { detachDocument: mutateAsync, isPending };
};

export const useResolveRemanentProduct = (remanentId: number) => {
  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (payload: {
      productId: number;
      mode: 'SUM' | 'PICK';
      documentId?: number;
    }) => {
      const response = await axiosInstance.put(
        `/api/v1/remanents/${remanentId}/resolutions/`,
        payload,
      );
      assertOk(response.status, response);
    },
    onSuccess: () => invalidate(queryClient, remanentId),
  });
  return { resolveProduct: mutateAsync, isPending };
};

export const useCloseRemanent = (remanentId: number) => {
  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = useMutation({
    mutationFn: async () => {
      const response = await axiosInstance.post(
        `/api/v1/remanents/${remanentId}/close/`,
      );
      assertOk(response.status, response);
    },
    onSuccess: () => invalidate(queryClient, remanentId),
  });
  return { closeRemanent: mutateAsync, isPending };
};

export const useExportRemanent = (remanentId: number) => {
  const { mutateAsync, isPending } = useMutation({
    mutationFn: async () => {
      const response = await axiosInstance.get(
        `/api/v1/remanents/${remanentId}/export/`,
        {
          responseType: 'blob',
        },
      );
      assertOk(response.status, response);
      const fileName =
        response.headers['contentDisposition']
          ?.split('=')[1]
          ?.replace(/"/g, '') || `SM-remanent-${remanentId}.txt`;
      const element = document.createElement('a');
      element.href = URL.createObjectURL(response.data);
      element.download = fileName;
      document.body.appendChild(element);
      element.click();
      element.remove();
    },
  });
  return { exportRemanent: mutateAsync, isPending };
};
